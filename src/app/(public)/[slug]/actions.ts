"use server";

import { z } from "zod";
import { creerClientService } from "@/lib/supabase/service";
import { normaliserTelephoneFr } from "@/lib/utils";
import {
  calculerFenetres,
  composer,
  rechercherCreneaux,
  joursFeries,
  type HoraireRecurrent,
  type Intervalle,
  type Membre,
  type PrestationComposable,
  type Ressource,
} from "@/lib/agenda";
import { fromZonedTime } from "date-fns-tz";

const FUSEAU_DEFAUT = "Europe/Paris";

/** Parse un tstzrange "[début,fin)" en intervalle. */
function parseRange(brut: string | null): Intervalle | null {
  if (!brut) return null;
  const m = brut.match(/^[[(]"?([^",]+)"?,"?([^",)]+)"?[)\]]$/);
  if (!m) return null;
  return { debut: new Date(m[1]), fin: new Date(m[2]) };
}

/** Résout l'établissement (id, réglages, fuseau) à partir du slug. */
async function resoudreEtablissement(slug: string) {
  const svc = creerClientService();
  const { data: etab } = await svc
    .from("etablissements")
    .select("id, fuseau, solo")
    .eq("slug", slug)
    .is("archive_le", null)
    .maybeSingle();
  if (!etab) return null;
  const { data: reglages } = await svc
    .from("reglages")
    .select(
      "granularite_creneaux, delai_min_reservation, horizon_max_jours, strategie_planning, validation_auto, seuil_acompte_obligatoire, battement_defaut, zones_deplacement",
    )
    .eq("etablissement_id", etab.id)
    .maybeSingle();
  return { svc, etab, reglages };
}

async function chargerPrestations(
  svc: ReturnType<typeof creerClientService>,
  etabId: string,
  prestationIds: string[],
) {
  const { data: prestas } = await svc
    .from("prestations")
    .select(
      "id, nom, prix, duree_preparation, duree_execution, duree_nettoyage, battement, lieu, pmu, patch_test_requis, acompte_type, acompte_valeur",
    )
    .in("id", prestationIds)
    .eq("etablissement_id", etabId)
    .eq("actif", true);
  const { data: segs } = await svc
    .from("prestation_segments")
    .select("prestation_id, duree, praticienne_occupee, ordre")
    .in("prestation_id", prestationIds)
    .order("ordre");
  const { data: liens } = await svc
    .from("prestation_ressources")
    .select("prestation_id, ressource_id")
    .in("prestation_id", prestationIds);

  const parId = new Map((prestas ?? []).map((p) => [p.id, p]));
  const ordonnees = prestationIds
    .map((id) => parId.get(id))
    .filter(Boolean) as NonNullable<typeof prestas>;
  return { prestations: ordonnees, segments: segs ?? [], liens: liens ?? [] };
}

function composerDb(
  prestations: { id: string; duree_preparation: number; duree_execution: number; duree_nettoyage: number; battement: number }[],
  segments: { prestation_id: string; duree: number; praticienne_occupee: boolean }[],
  liens: { prestation_id: string; ressource_id: string }[],
  battementDefaut: number,
) {
  const composables: PrestationComposable[] = prestations.map((p) => ({
    duree_preparation: p.duree_preparation,
    duree_execution: p.duree_execution,
    duree_nettoyage: p.duree_nettoyage,
    battement: p.battement,
    segments: segments
      .filter((s) => s.prestation_id === p.id)
      .map((s) => ({ duree: s.duree, praticienneOccupee: s.praticienne_occupee })),
    ressource_ids: liens.filter((l) => l.prestation_id === p.id).map((l) => l.ressource_id),
  }));
  return composer(composables, battementDefaut);
}

// ---------------------------------------------------------------------
// Créneaux disponibles pour un jour donné (calculés à la demande)
// ---------------------------------------------------------------------
export async function creneauxDisponibles(
  slug: string,
  prestationIds: string[],
  dateStr: string,
): Promise<string[]> {
  const ctx = await resoudreEtablissement(slug);
  if (!ctx || !ctx.reglages || prestationIds.length === 0) return [];
  const { svc, etab, reglages } = ctx;
  const fuseau = etab.fuseau ?? FUSEAU_DEFAUT;

  // Jour férié → fermé (R4.2).
  if (joursFeries(Number(dateStr.slice(0, 4))).has(dateStr)) return [];

  // Libère les verrous expirés avant le calcul.
  await svc.rpc("nettoyer_verrous", { p_etablissement: etab.id });

  const { prestations, segments, liens } = await chargerPrestations(svc, etab.id, prestationIds);
  if (prestations.length === 0) return [];
  const compo = composerDb(prestations, segments, liens, reglages.battement_defaut);

  const debutUtc = fromZonedTime(`${dateStr}T00:00:00`, fuseau);
  const finUtc = new Date(debutUtc.getTime() + 24 * 3600 * 1000);

  // Membre solo (V1).
  const { data: membreRow } = await svc
    .from("membres")
    .select("id")
    .eq("etablissement_id", etab.id)
    .eq("actif", true)
    .order("role")
    .limit(1)
    .maybeSingle();
  if (!membreRow) return [];

  const { data: horairesData } = await svc
    .from("horaires")
    .select("jour_semaine, heure_debut, heure_fin, membre_id")
    .eq("etablissement_id", etab.id)
    .is("membre_id", null);
  const horaires: HoraireRecurrent[] = (horairesData ?? []).map((h) => ({
    jourSemaine: h.jour_semaine,
    debut: h.heure_debut.slice(0, 5),
    fin: h.heure_fin.slice(0, 5),
  }));

  // Occupations et indisponibilités chevauchant le jour.
  const { data: occData } = await svc
    .from("occupations")
    .select("membre_id, ressource_id, periode")
    .eq("etablissement_id", etab.id)
    .overlaps("periode", `[${debutUtc.toISOString()},${finUtc.toISOString()})`);

  const occMembre: Intervalle[] = [];
  const occRessource = new Map<string, Intervalle[]>();
  for (const o of occData ?? []) {
    const iv = parseRange(o.periode as string | null);
    if (!iv) continue;
    if (o.membre_id) occMembre.push(iv);
    if (o.ressource_id) {
      const l = occRessource.get(o.ressource_id) ?? [];
      l.push(iv);
      occRessource.set(o.ressource_id, l);
    }
  }

  const { data: indispoData } = await svc
    .from("indisponibilites")
    .select("periode, membre_id")
    .eq("etablissement_id", etab.id)
    .overlaps("periode", `[${debutUtc.toISOString()},${finUtc.toISOString()})`);
  const indispos: Intervalle[] = (indispoData ?? [])
    .map((i) => parseRange(i.periode as string | null))
    .filter(Boolean) as Intervalle[];

  const membre: Membre = {
    id: membreRow.id,
    horaires: [],
    indisponibilites: [],
    occupations: occMembre,
  };
  const ressources: Ressource[] = [...occRessource.entries()].map(([id, occ]) => ({
    id,
    occupations: occ,
  }));

  const creneaux = rechercherCreneaux({
    prestation: { temps: compo.temps, segments: compo.segments, ressourceIds: compo.ressourceIds },
    periode: { debut: debutUtc, fin: finUtc },
    maintenant: new Date(),
    fuseau,
    reglages: {
      granularite: reglages.granularite_creneaux,
      delaiMin: reglages.delai_min_reservation,
      horizonJours: reglages.horizon_max_jours,
      strategiePlanning: reglages.strategie_planning as "optimiser" | "libre" | "concentrer",
    },
    horairesEtablissement: horaires,
    indisponibilitesEtablissement: indispos,
    membres: [membre],
    ressources,
    prestationLaPlusCourteMinutes: 15,
  });

  // Créneaux dédupliqués par heure de début (la cliente ne choisit pas la praticienne en V1).
  const vus = new Set<string>();
  const resultat: string[] = [];
  for (const c of creneaux) {
    const iso = c.debutExecution.toISOString();
    if (!vus.has(iso)) {
      vus.add(iso);
      resultat.push(iso);
    }
  }
  resultat.sort();
  return resultat;
}

// ---------------------------------------------------------------------
// Verrou anti-collision (R7.3) : réserve le créneau 10 minutes
// ---------------------------------------------------------------------
export async function verrouillerCreneau(
  slug: string,
  prestationIds: string[],
  debutExecutionIso: string,
): Promise<
  { ok: true; rdvId: string; expireLe: string } | { ok: false; erreur: string }
> {
  const ctx = await resoudreEtablissement(slug);
  if (!ctx || !ctx.reglages) return { ok: false, erreur: "Établissement introuvable." };
  const { svc, etab, reglages } = ctx;

  const { data: membreRow } = await svc
    .from("membres")
    .select("id")
    .eq("etablissement_id", etab.id)
    .eq("actif", true)
    .order("role")
    .limit(1)
    .maybeSingle();
  if (!membreRow) return { ok: false, erreur: "Aucune praticienne." };

  const { prestations, segments, liens } = await chargerPrestations(svc, etab.id, prestationIds);
  if (prestations.length === 0) return { ok: false, erreur: "Prestation introuvable." };
  const compo = composerDb(prestations, segments, liens, reglages.battement_defaut);
  const f = calculerFenetres(new Date(debutExecutionIso), compo.temps, compo.segments);

  const { data: rdvId, error } = await svc.rpc("verrouiller_creneau", {
    p_etablissement: etab.id,
    p_membre_id: membreRow.id,
    p_debut_execution: f.visible.debut.toISOString(),
    p_fin_execution: f.visible.fin.toISOString(),
    p_debut_bloque: f.bloque.debut.toISOString(),
    p_fin_bloque: f.bloque.fin.toISOString(),
    p_occupations: f.occupations.map((o) => ({
      debut: o.debut.toISOString(),
      fin: o.fin.toISOString(),
    })),
    p_ressource_ids: compo.ressourceIds,
    p_verrou_minutes: 10,
  });

  if (error) {
    if (error.message.includes("CRENEAU_PRIS"))
      return { ok: false, erreur: "Ce créneau vient d'être pris. Choisissez-en un autre." };
    return { ok: false, erreur: "Réservation impossible." };
  }
  const expireLe = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return { ok: true, rdvId: rdvId as string, expireLe };
}

// ---------------------------------------------------------------------
// Finalisation de la réservation
// ---------------------------------------------------------------------
const schemaFinal = z.object({
  rdvId: z.string().uuid(),
  prestationIds: z.array(z.string().uuid()).min(1),
  nom: z.string().min(1),
  telephone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  questionnaire: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
});

export async function finaliserReservation(
  slug: string,
  donnees: z.infer<typeof schemaFinal>,
): Promise<
  { ok: true; statut: string; acompteDu: number } | { ok: false; erreur: string }
> {
  const v = schemaFinal.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: "Informations incomplètes." };
  const d = v.data;

  const ctx = await resoudreEtablissement(slug);
  if (!ctx || !ctx.reglages) return { ok: false, erreur: "Établissement introuvable." };
  const { svc, etab, reglages } = ctx;

  const e164 = normaliserTelephoneFr(d.telephone);
  if (!e164) return { ok: false, erreur: "Numéro de mobile invalide." };

  // Le verrou doit être valide (R7.3).
  const { data: rdv } = await svc
    .from("rendez_vous")
    .select("id, verrou_expire_le, client_id, etablissement_id")
    .eq("id", d.rdvId)
    .eq("etablissement_id", etab.id)
    .maybeSingle();
  if (!rdv) return { ok: false, erreur: "Réservation introuvable." };
  if (rdv.verrou_expire_le && new Date(rdv.verrou_expire_le) < new Date()) {
    return { ok: false, erreur: "Le temps de réservation a expiré, recommencez." };
  }

  // Identification par téléphone (R7.2) : rattacher à la fiche existante.
  const { data: existante } = await svc
    .from("clients")
    .select("id, score_fiabilite")
    .eq("etablissement_id", etab.id)
    .eq("telephone_mobile", e164)
    .is("archive_le", null)
    .limit(1)
    .maybeSingle();

  let clientId = existante?.id ?? null;
  let score = existante?.score_fiabilite ?? 80;
  if (!clientId) {
    const { data: cree } = await svc
      .from("clients")
      .insert({
        etablissement_id: etab.id,
        nom: d.nom.trim(),
        telephone_mobile: e164,
        email: d.email ? d.email.toLowerCase() : null,
        adresse: d.adresse || null,
        code_postal: d.codePostal || null,
        ville: d.ville || null,
        source: "reservation_en_ligne",
      })
      .select("id, score_fiabilite")
      .single();
    clientId = cree?.id ?? null;
    score = cree?.score_fiabilite ?? 80;
  }
  if (!clientId) return { ok: false, erreur: "Enregistrement impossible." };

  // Montant, acompte, frais de déplacement.
  const { prestations } = await chargerPrestations(svc, etab.id, d.prestationIds);
  let montant = prestations.reduce((s, p) => s + Number(p.prix), 0);
  const aDomicile = prestations.some((p) => p.lieu === "domicile" || p.lieu === "les_deux");
  if (aDomicile && d.codePostal) {
    montant += fraisDeplacement(reglages.zones_deplacement, d.codePostal);
  }
  let acompteDu = prestations.reduce((s, p) => {
    if (p.acompte_type === "fixe") return s + Number(p.acompte_valeur ?? 0);
    if (p.acompte_type === "pourcentage")
      return s + (Number(p.prix) * Number(p.acompte_valeur ?? 0)) / 100;
    return s;
  }, 0);
  // Acompte obligatoire si fiabilité faible (R9.3).
  const acompteObligatoire = score < reglages.seuil_acompte_obligatoire;
  if (acompteObligatoire && acompteDu === 0) acompteDu = Math.round(montant * 0.3 * 100) / 100;

  // Statut : PMU avec contre-indication ou validation manuelle → « demande ».
  const pmu = prestations.some((p) => p.pmu);
  const questionnaireProbleme = pmu && Boolean(d.questionnaire && d.questionnaire.trim().length > 0);
  const statut =
    reglages.validation_auto && !questionnaireProbleme ? "confirme" : "demande";

  const { error: errMaj } = await svc
    .from("rendez_vous")
    .update({
      client_id: clientId,
      statut,
      montant_total: montant,
      acompte_du: acompteDu,
      a_domicile: aDomicile,
      adresse_intervention: aDomicile ? [d.adresse, d.codePostal, d.ville].filter(Boolean).join(" ") : null,
      notes: d.questionnaire || null,
      verrou_expire_le: null,
    })
    .eq("id", d.rdvId)
    .eq("etablissement_id", etab.id);
  if (errMaj) return { ok: false, erreur: "Finalisation impossible." };

  // Prestations figées.
  await svc.from("rdv_prestations").insert(
    prestations.map((p, i) => ({
      rendez_vous_id: d.rdvId,
      prestation_id: p.id,
      libelle: p.nom,
      prix: Number(p.prix),
      duree_execution: p.duree_execution,
      ordre: i,
    })),
  );

  // Confirmation immédiate (R14) : messages mis en file (envoi par le cron).
  const messages: {
    etablissement_id: string;
    client_id: string;
    rendez_vous_id: string;
    canal: string;
    categorie: string;
    destinataire: string;
    contenu: string;
    statut: string;
    planifie_le: string;
  }[] = [];
  const maintenant = new Date().toISOString();
  messages.push({
    etablissement_id: etab.id,
    client_id: clientId,
    rendez_vous_id: d.rdvId,
    canal: "sms",
    categorie: "transactionnel",
    destinataire: e164,
    contenu:
      statut === "confirme"
        ? "Votre rendez-vous est confirmé. À bientôt !"
        : "Votre demande de rendez-vous a bien été reçue. Vous serez recontactée pour la confirmation.",
    statut: "en_file",
    planifie_le: maintenant,
  });
  if (d.email) {
    messages.push({
      etablissement_id: etab.id,
      client_id: clientId,
      rendez_vous_id: d.rdvId,
      canal: "email",
      categorie: "transactionnel",
      destinataire: d.email.toLowerCase(),
      contenu: "Confirmation de votre rendez-vous.",
      statut: "en_file",
      planifie_le: maintenant,
    });
  }
  await svc.from("messages").insert(messages);

  return { ok: true, statut, acompteDu };
}

/** Frais de déplacement selon la zone (code postal) — R6.4. */
function fraisDeplacement(zones: unknown, codePostal: string): number {
  if (!Array.isArray(zones)) return 0;
  for (const z of zones as { codes_postaux?: string[]; frais?: number }[]) {
    if (z.codes_postaux?.includes(codePostal)) return Number(z.frais ?? 0);
  }
  return 0;
}
