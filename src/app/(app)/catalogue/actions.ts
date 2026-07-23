"use server";

import { z } from "zod";
import { contexteEtablissement } from "@/lib/auth";
import { dureeBloquee } from "@/lib/agenda";

type Resultat = { ok: true; id?: string } | { ok: false; erreur: string };

const schemaSegment = z.object({
  libelle: z.string().optional().default(""),
  duree: z.number().int().min(1),
  praticienne_occupee: z.boolean(),
});
const schemaOption = z.object({
  nom: z.string().min(1),
  prix: z.number().min(0),
  duree_sup: z.number().int().min(0),
});

const schemaPrestation = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  categorie_id: z.string().uuid().nullable(),
  description: z.string().nullable(),
  photo_url: z.string().nullable(),
  prix: z.number().min(0),
  duree_preparation: z.number().int().min(0),
  duree_execution: z.number().int().min(1),
  duree_nettoyage: z.number().int().min(0),
  battement: z.number().int().min(0),
  lieu: z.enum(["salon", "domicile", "les_deux"]),
  reservable_en_ligne: z.boolean(),
  acompte_type: z.enum(["aucun", "fixe", "pourcentage"]),
  acompte_valeur: z.number().min(0),
  pmu: z.boolean(),
  patch_test_requis: z.boolean(),
  cycle_rappel_jours: z.number().int().min(0).nullable(),
  segments: z.array(schemaSegment),
  options: z.array(schemaOption),
  ressource_ids: z.array(z.string().uuid()),
});

export type DonneesPrestation = z.infer<typeof schemaPrestation>;

/** Convertit "HH:MM" en minutes depuis minuit. */
function versMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

async function enregistrer(
  donnees: DonneesPrestation,
  id: string | null,
): Promise<Resultat> {
  const v = schemaPrestation.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };
  const d = v.data;

  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // Si des segments sont définis, l'exécution vaut la somme des segments (R1.5).
  const execution =
    d.segments.length > 0
      ? d.segments.reduce((s, seg) => s + seg.duree, 0)
      : d.duree_execution;

  // R15.1 : refus si la durée bloquée dépasse l'amplitude d'ouverture.
  const bloquee = dureeBloquee({
    preparation: d.duree_preparation,
    execution,
    nettoyage: d.duree_nettoyage,
    battement: d.battement,
  });
  const { data: horaires } = await ctx.supabase
    .from("horaires")
    .select("heure_debut, heure_fin")
    .eq("etablissement_id", ctx.etablissementId)
    .is("membre_id", null);
  const amplitude =
    horaires && horaires.length > 0
      ? Math.max(...horaires.map((h) => versMinutes(h.heure_fin) - versMinutes(h.heure_debut)))
      : null; // aucun horaire → pas de contrainte
  if (amplitude !== null && bloquee > amplitude) {
    return {
      ok: false,
      erreur: `Cette prestation bloque ${bloquee} min, au-delà de votre amplitude d'ouverture (${amplitude} min).`,
    };
  }

  const champs = {
    etablissement_id: ctx.etablissementId,
    categorie_id: d.categorie_id,
    nom: d.nom.trim(),
    description: d.description,
    photo_url: d.photo_url,
    prix: d.prix,
    duree_preparation: d.duree_preparation,
    duree_execution: execution,
    duree_nettoyage: d.duree_nettoyage,
    battement: d.battement,
    lieu: d.lieu,
    reservable_en_ligne: d.reservable_en_ligne,
    acompte_type: d.acompte_type,
    acompte_valeur: d.acompte_valeur,
    pmu: d.pmu,
    patch_test_requis: d.patch_test_requis,
    cycle_rappel_jours: d.cycle_rappel_jours,
  };

  let prestationId = id;
  if (id) {
    const { error } = await ctx.supabase
      .from("prestations")
      .update(champs)
      .eq("id", id)
      .eq("etablissement_id", ctx.etablissementId);
    if (error) return { ok: false, erreur: "Enregistrement impossible." };
  } else {
    const { data: cree, error } = await ctx.supabase
      .from("prestations")
      .insert(champs)
      .select("id")
      .single();
    if (error || !cree) return { ok: false, erreur: "Création impossible." };
    prestationId = cree.id;
  }
  if (!prestationId) return { ok: false, erreur: "Erreur inattendue." };

  // Remplace segments, options et ressources (simples et fiables).
  await ctx.supabase.from("prestation_segments").delete().eq("prestation_id", prestationId);
  if (d.segments.length > 0) {
    await ctx.supabase.from("prestation_segments").insert(
      d.segments.map((s, i) => ({
        prestation_id: prestationId!,
        ordre: i,
        libelle: s.libelle || null,
        duree: s.duree,
        praticienne_occupee: s.praticienne_occupee,
      })),
    );
  }

  await ctx.supabase.from("options_prestation").delete().eq("prestation_id", prestationId);
  if (d.options.length > 0) {
    await ctx.supabase.from("options_prestation").insert(
      d.options.map((o) => ({
        prestation_id: prestationId!,
        nom: o.nom,
        prix: o.prix,
        duree_sup: o.duree_sup,
      })),
    );
  }

  await ctx.supabase.from("prestation_ressources").delete().eq("prestation_id", prestationId);
  if (d.ressource_ids.length > 0) {
    await ctx.supabase.from("prestation_ressources").insert(
      d.ressource_ids.map((rid) => ({ prestation_id: prestationId!, ressource_id: rid })),
    );
  }

  return { ok: true, id: prestationId };
}

export async function creerPrestation(donnees: DonneesPrestation): Promise<Resultat> {
  return enregistrer(donnees, null);
}
export async function majPrestation(
  id: string,
  donnees: DonneesPrestation,
): Promise<Resultat> {
  return enregistrer(donnees, id);
}

/** Archivage (jamais de suppression — R15.3). */
export async function archiverPrestation(id: string, archiver: boolean): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("prestations")
    .update({ actif: !archiver })
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Action impossible." } : { ok: true };
}

// ---------------------------------------------------------------------
// Catégories
// ---------------------------------------------------------------------
export async function creerCategorie(nom: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (!nom.trim()) return { ok: false, erreur: "Nom obligatoire." };
  const { count } = await ctx.supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", ctx.etablissementId);
  const { data, error } = await ctx.supabase
    .from("categories")
    .insert({ etablissement_id: ctx.etablissementId, nom: nom.trim(), ordre: count ?? 0 })
    .select("id")
    .single();
  return error || !data
    ? { ok: false, erreur: "Création impossible." }
    : { ok: true, id: data.id };
}

export async function renommerCategorie(id: string, nom: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("categories")
    .update({ nom: nom.trim() })
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Action impossible." } : { ok: true };
}

/** Supprime une catégorie (les prestations passent « sans catégorie »). */
export async function supprimerCategorie(id: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Action impossible." } : { ok: true };
}

/** Réordonne les catégories (ordre = position dans le tableau). */
export async function reordonnerCategories(ids: string[]): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  await Promise.all(
    ids.map((id, i) =>
      ctx.supabase
        .from("categories")
        .update({ ordre: i })
        .eq("id", id)
        .eq("etablissement_id", ctx.etablissementId),
    ),
  );
  return { ok: true };
}
