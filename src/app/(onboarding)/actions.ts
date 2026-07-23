"use server";

import { z } from "zod";
import { creerClientServeur } from "@/lib/supabase/server";
import type { ConfigurationMetier, PrestationDefaut } from "@/lib/metier-types";

type Resultat = { ok: true } | { ok: false; erreur: string };

const schemaHoraire = z.object({
  jour: z.number().int().min(0).max(6),
  debut: z.string().regex(/^\d{2}:\d{2}$/),
  fin: z.string().regex(/^\d{2}:\d{2}$/),
});

const schema = z.object({
  principal: z.string().min(1),
  complementaires: z.array(z.string()).default([]),
  solo: z.boolean(),
  lieu: z.enum(["salon", "domicile", "les_deux"]),
  horaires: z.array(schemaHoraire).default([]),
});

export type DonneesOnboarding = z.infer<typeof schema>;

/**
 * Applique l'onboarding : métiers, mode (solo/domicile), catalogue pré-rempli,
 * horaires, réglages par défaut et checklist de démarrage.
 *
 * Tout est piloté par la configuration des profils métier (M7.1) : aucune
 * règle métier n'est écrite en dur ici.
 */
export async function finaliserOnboarding(donnees: DonneesOnboarding): Promise<Resultat> {
  const v = schema.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: "Données d'onboarding invalides." };
  const d = v.data;

  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée." };

  const { data: membre } = await supabase
    .from("membres")
    .select("etablissement_id")
    .eq("user_id", user.id)
    .eq("actif", true)
    .maybeSingle();
  if (!membre) return { ok: false, erreur: "Aucun établissement trouvé." };
  const etabId = membre.etablissement_id;

  // Codes de métiers : principal + complémentaires, dédupliqués, principal exclu des compl.
  const codes = Array.from(new Set([d.principal, ...d.complementaires]));

  // 1. Charge les configurations des métiers choisis.
  const { data: metiersData } = await supabase
    .from("metiers")
    .select("code, libelle, configuration")
    .in("code", codes);
  const metiers = (metiersData ?? []) as unknown as Array<{
    code: string;
    libelle: string;
    configuration: ConfigurationMetier;
  }>;
  if (metiers.length === 0)
    return { ok: false, erreur: "Métier introuvable." };

  // 2. Enregistre les métiers de l'établissement (principal + complémentaires).
  const lignesMetiers = codes.map((code) => ({
    etablissement_id: etabId,
    metier_code: code,
    principal: code === d.principal,
  }));
  const { error: errMetiers } = await supabase
    .from("etablissement_metiers")
    .upsert(lignesMetiers, { onConflict: "etablissement_id,metier_code" });
  if (errMetiers) return { ok: false, erreur: "Enregistrement des métiers impossible." };

  // 3. Mode de travail : solo (masque l'équipe) et domicile (active déplacement).
  const { error: errEtab } = await supabase
    .from("etablissements")
    .update({ solo: d.solo, domicile: d.lieu !== "salon" })
    .eq("id", etabId);
  if (errEtab) return { ok: false, erreur: "Mise à jour de l'établissement impossible." };

  // 4. Pré-remplissage du catalogue (une catégorie par métier contributeur).
  //    On ne recrée pas une prestation dont le nom existe déjà (idempotence).
  const { data: prestasExistantes } = await supabase
    .from("prestations")
    .select("nom")
    .eq("etablissement_id", etabId);
  const nomsExistants = new Set(
    (prestasExistantes ?? []).map((p) => p.nom.toLowerCase()),
  );

  // Ordonne : principal d'abord.
  const metiersOrdonnes = [
    ...metiers.filter((m) => m.code === d.principal),
    ...metiers.filter((m) => m.code !== d.principal),
  ];

  let ordreCat = 0;
  for (const metier of metiersOrdonnes) {
    const catalogue = metier.configuration.catalogue_defaut ?? [];
    const aCreer = catalogue.filter(
      (p) => !nomsExistants.has(p.nom.toLowerCase()),
    );
    if (aCreer.length === 0) continue;

    const { data: categorie, error: errCat } = await supabase
      .from("categories")
      .insert({ etablissement_id: etabId, nom: metier.libelle, ordre: ordreCat })
      .select("id")
      .single();
    if (errCat || !categorie)
      return { ok: false, erreur: "Création des catégories impossible." };
    ordreCat += 1;

    const lignes = aCreer.map((p: PrestationDefaut, i) => ({
      etablissement_id: etabId,
      categorie_id: categorie.id,
      nom: p.nom,
      prix: p.prix ?? 0,
      duree_preparation: p.duree_preparation ?? 0,
      duree_execution: p.duree_execution,
      duree_nettoyage: p.duree_nettoyage ?? 0,
      lieu: d.lieu,
      pmu: p.pmu ?? false,
      patch_test_requis: p.patch_test ?? false,
      cycle_rappel_jours: p.cycle_rappel_jours ?? null,
      ordre: i,
    }));
    const { error: errPresta } = await supabase.from("prestations").insert(lignes);
    if (errPresta) return { ok: false, erreur: "Pré-remplissage du catalogue impossible." };

    aCreer.forEach((p) => nomsExistants.add(p.nom.toLowerCase()));
  }

  // 5. Horaires d'ouverture (niveau établissement : membre_id null).
  if (d.horaires.length > 0) {
    await supabase
      .from("horaires")
      .delete()
      .eq("etablissement_id", etabId)
      .is("membre_id", null);
    const lignesH = d.horaires.map((h) => ({
      etablissement_id: etabId,
      membre_id: null,
      jour_semaine: h.jour,
      heure_debut: h.debut,
      heure_fin: h.fin,
    }));
    const { error: errH } = await supabase.from("horaires").insert(lignesH);
    if (errH) return { ok: false, erreur: "Enregistrement des horaires impossible." };
  }

  // 6. Réglages par défaut du profil principal + marqueur d'onboarding + checklist.
  const principalCfg = metiersOrdonnes[0]?.configuration;
  const battement = Number(principalCfg?.reglages_defaut?.battement_defaut ?? 0);

  const { data: reglagesActuels } = await supabase
    .from("reglages")
    .select("autres")
    .eq("etablissement_id", etabId)
    .maybeSingle();
  const autres = {
    ...((reglagesActuels?.autres as Record<string, unknown>) ?? {}),
    onboarding_termine: true,
    checklist: { catalogue: false, clientes: false, lien: false },
  };

  const { error: errReg } = await supabase
    .from("reglages")
    .update({ battement_defaut: battement, autres })
    .eq("etablissement_id", etabId);
  if (errReg) return { ok: false, erreur: "Enregistrement des réglages impossible." };

  return { ok: true };
}
