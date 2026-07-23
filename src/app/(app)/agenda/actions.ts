"use server";

import { contexteEtablissement } from "@/lib/auth";
import {
  calculerFenetres,
  composer,
  type PrestationComposable,
} from "@/lib/agenda";
import type { TablesUpdate } from "@/lib/database.types";

type Resultat =
  | { ok: true; id?: string }
  | { ok: false; erreur: string; creneauPris?: boolean };

/** Le membre propriétaire (compte solo en V1). */
async function membreCourant(
  supabase: NonNullable<Awaited<ReturnType<typeof contexteEtablissement>>>["supabase"],
  etablissementId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("membres")
    .select("id")
    .eq("etablissement_id", etablissementId)
    .eq("actif", true)
    .order("role")
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** Charge les prestations et le battement par défaut pour composer un RDV. */
async function chargerPrestations(
  supabase: NonNullable<Awaited<ReturnType<typeof contexteEtablissement>>>["supabase"],
  etablissementId: string,
  prestationIds: string[],
) {
  const { data: prestas } = await supabase
    .from("prestations")
    .select(
      "id, nom, prix, duree_preparation, duree_execution, duree_nettoyage, battement, acompte_type, acompte_valeur",
    )
    .in("id", prestationIds)
    .eq("etablissement_id", etablissementId);

  const { data: segs } = await supabase
    .from("prestation_segments")
    .select("prestation_id, duree, praticienne_occupee, ordre")
    .in("prestation_id", prestationIds)
    .order("ordre");

  const { data: liens } = await supabase
    .from("prestation_ressources")
    .select("prestation_id, ressource_id")
    .in("prestation_id", prestationIds);

  const { data: reglages } = await supabase
    .from("reglages")
    .select("battement_defaut")
    .eq("etablissement_id", etablissementId)
    .maybeSingle();

  // Réordonne selon l'ordre demandé.
  const parId = new Map((prestas ?? []).map((p) => [p.id, p]));
  const ordonnees = prestationIds.map((id) => parId.get(id)).filter(Boolean) as NonNullable<
    typeof prestas
  >;

  return { prestations: ordonnees, segments: segs ?? [], liens: liens ?? [], battementDefaut: reglages?.battement_defaut ?? 0 };
}

function composerDepuisDb(
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

/** Prestations actives, pour le sélecteur de création de RDV. */
export async function listerPrestationsPourRdv(): Promise<
  { id: string; nom: string; prix: number; duree_execution: number }[]
> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data } = await ctx.supabase
    .from("prestations")
    .select("id, nom, prix, duree_execution")
    .eq("etablissement_id", ctx.etablissementId)
    .eq("actif", true)
    .order("ordre");
  return (data ?? []).map((p) => ({ ...p, prix: Number(p.prix) }));
}

// ---------------------------------------------------------------------
// Création d'un rendez-vous par la pro (elle choisit le créneau)
// ---------------------------------------------------------------------
export async function creerRdvPro(entree: {
  clientId: string | null;
  prestationIds: string[];
  debutExecutionIso: string;
  aDomicile?: boolean;
  adresse?: string | null;
  notes?: string | null;
}): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (entree.prestationIds.length === 0)
    return { ok: false, erreur: "Choisissez au moins une prestation." };

  const membreId = await membreCourant(ctx.supabase, ctx.etablissementId);
  if (!membreId) return { ok: false, erreur: "Aucune praticienne." };

  const { prestations, segments, liens, battementDefaut } = await chargerPrestations(
    ctx.supabase,
    ctx.etablissementId,
    entree.prestationIds,
  );
  if (prestations.length === 0) return { ok: false, erreur: "Prestation introuvable." };

  const compo = composerDepuisDb(prestations, segments, liens, battementDefaut);
  const debutExecution = new Date(entree.debutExecutionIso);
  const f = calculerFenetres(debutExecution, compo.temps, compo.segments);

  const montant = prestations.reduce((s, p) => s + Number(p.prix), 0);
  const acompte = prestations.reduce((s, p) => {
    if (p.acompte_type === "fixe") return s + Number(p.acompte_valeur ?? 0);
    if (p.acompte_type === "pourcentage")
      return s + (Number(p.prix) * Number(p.acompte_valeur ?? 0)) / 100;
    return s;
  }, 0);

  const { data: rdvId, error } = await ctx.supabase.rpc("creer_rendez_vous", {
    p_etablissement: ctx.etablissementId,
    p_client_id: entree.clientId,
    p_membre_id: membreId,
    p_debut_execution: f.visible.debut.toISOString(),
    p_fin_execution: f.visible.fin.toISOString(),
    p_debut_bloque: f.bloque.debut.toISOString(),
    p_fin_bloque: f.bloque.fin.toISOString(),
    p_occupations: f.occupations.map((o) => ({
      debut: o.debut.toISOString(),
      fin: o.fin.toISOString(),
    })),
    p_ressource_ids: compo.ressourceIds,
    p_origine: "pro",
    p_montant_total: montant,
    p_acompte_du: acompte,
    p_a_domicile: entree.aDomicile ?? false,
    p_adresse: entree.adresse ?? null,
    p_notes: entree.notes ?? null,
    p_prestations: prestations.map((p, i) => ({
      prestation_id: p.id,
      libelle: p.nom,
      prix: Number(p.prix),
      duree_execution: p.duree_execution,
      ordre: i,
    })),
  });

  if (error) {
    if (error.message.includes("CRENEAU_PRIS"))
      return { ok: false, erreur: "Ce créneau vient d'être pris.", creneauPris: true };
    return { ok: false, erreur: "Création du rendez-vous impossible." };
  }
  return { ok: true, id: rdvId as string };
}

// ---------------------------------------------------------------------
// Déplacement d'un rendez-vous
// ---------------------------------------------------------------------
export async function deplacerRdv(
  rdvId: string,
  nouveauDebutExecutionIso: string,
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // On recompose depuis les prestations réelles du RDV.
  const { data: rp } = await ctx.supabase
    .from("rdv_prestations")
    .select("prestation_id")
    .eq("rendez_vous_id", rdvId);
  const ids = (rp ?? []).map((r) => r.prestation_id).filter(Boolean) as string[];

  const { prestations, segments, liens, battementDefaut } = await chargerPrestations(
    ctx.supabase,
    ctx.etablissementId,
    ids,
  );
  const compo = composerDepuisDb(prestations, segments, liens, battementDefaut);
  const debutExecution = new Date(nouveauDebutExecutionIso);
  const f = calculerFenetres(debutExecution, compo.temps, compo.segments);

  const { error } = await ctx.supabase.rpc("deplacer_rendez_vous", {
    p_rdv: rdvId,
    p_debut_execution: f.visible.debut.toISOString(),
    p_fin_execution: f.visible.fin.toISOString(),
    p_debut_bloque: f.bloque.debut.toISOString(),
    p_fin_bloque: f.bloque.fin.toISOString(),
    p_occupations: f.occupations.map((o) => ({
      debut: o.debut.toISOString(),
      fin: o.fin.toISOString(),
    })),
    p_ressource_ids: compo.ressourceIds,
  });

  if (error) {
    if (error.message.includes("CRENEAU_PRIS"))
      return { ok: false, erreur: "Ce créneau est déjà occupé.", creneauPris: true };
    return { ok: false, erreur: "Déplacement impossible." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------
// Statuts, pointage (R8.6) et annulation
// ---------------------------------------------------------------------
const IMPACTS: Record<string, { type: string; impact: number }> = {
  honore: { type: "honore", impact: 3 },
  absent: { type: "absence", impact: -25 },
  annule: { type: "annulation_delai", impact: 0 },
};

/** Pointage d'un RDV passé : honoré / annulé / absent → alimente la fiabilité. */
export async function qualifierRdv(
  rdvId: string,
  resultat: "honore" | "annule" | "absent",
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  const { data: rdv } = await ctx.supabase
    .from("rendez_vous")
    .select("client_id")
    .eq("id", rdvId)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();

  const statut = resultat === "honore" ? "honore" : resultat === "absent" ? "absent" : "annule";
  const maj: TablesUpdate<"rendez_vous"> = { statut };
  if (resultat === "annule") maj.annule_le = new Date().toISOString();

  const { error } = await ctx.supabase
    .from("rendez_vous")
    .update(maj)
    .eq("id", rdvId)
    .eq("etablissement_id", ctx.etablissementId);
  if (error) return { ok: false, erreur: "Pointage impossible." };

  // Événement de fiabilité (R9.2). Le déclencheur ajuste le score.
  if (rdv?.client_id) {
    const e = IMPACTS[resultat];
    await ctx.supabase.from("evenements_fiabilite").insert({
      etablissement_id: ctx.etablissementId,
      client_id: rdv.client_id,
      rendez_vous_id: rdvId,
      type: e.type,
      impact: e.impact,
    });
  }

  // Un RDV annulé ou absent libère le créneau.
  if (resultat !== "honore") {
    await ctx.supabase.from("occupations").delete().eq("rendez_vous_id", rdvId);
  }
  return { ok: true };
}

export async function changerStatut(
  rdvId: string,
  statut: "confirme" | "demande",
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("rendez_vous")
    .update({ statut })
    .eq("id", rdvId)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Action impossible." } : { ok: true };
}

export async function annulerRdv(rdvId: string, motif?: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("rendez_vous")
    .update({ statut: "annule", annule_le: new Date().toISOString(), motif_annulation: motif ?? null })
    .eq("id", rdvId)
    .eq("etablissement_id", ctx.etablissementId);
  if (error) return { ok: false, erreur: "Annulation impossible." };
  // Libère le créneau.
  await ctx.supabase.from("occupations").delete().eq("rendez_vous_id", rdvId);
  return { ok: true };
}

// ---------------------------------------------------------------------
// Blocage manuel (pause, absence, formation, congé) — R4.1
// ---------------------------------------------------------------------
export async function bloquerCreneau(entree: {
  debutIso: string;
  finIso: string;
  motif: string;
  type: "conge" | "absence" | "pause" | "blocage";
}): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const membreId = await membreCourant(ctx.supabase, ctx.etablissementId);

  const { data: indispo, error: e1 } = await ctx.supabase
    .from("indisponibilites")
    .insert({
      etablissement_id: ctx.etablissementId,
      membre_id: membreId,
      motif: entree.motif,
      type: entree.type,
      periode: `[${entree.debutIso},${entree.finIso})`,
    })
    .select("id")
    .single();
  if (e1 || !indispo) return { ok: false, erreur: "Blocage impossible." };

  // Occupation praticienne : rend le créneau indisponible (peut lever EXCLUDE).
  const { error: e2 } = await ctx.supabase.from("occupations").insert({
    etablissement_id: ctx.etablissementId,
    indisponibilite_id: indispo.id,
    membre_id: membreId,
    periode: `[${entree.debutIso},${entree.finIso})`,
  });
  if (e2) {
    // Rollback manuel : on retire l'indisponibilité orpheline.
    await ctx.supabase.from("indisponibilites").delete().eq("id", indispo.id);
    return { ok: false, erreur: "Ce créneau chevauche un rendez-vous existant." };
  }
  return { ok: true, id: indispo.id };
}

export async function supprimerBlocage(indisponibiliteId: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("indisponibilites")
    .delete()
    .eq("id", indisponibiliteId)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Action impossible." } : { ok: true };
}
