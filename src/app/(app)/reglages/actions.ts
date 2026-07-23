"use server";

import { contexteEtablissement } from "@/lib/auth";
import type { Json, TablesUpdate } from "@/lib/database.types";

type Resultat = { ok: boolean; erreur?: string };

/** Mise à jour des réglages scalaires et JSONB (R16). Aucune valeur en dur. */
export async function majReglages(patch: {
  battement_defaut?: number;
  granularite_creneaux?: number;
  delai_min_reservation?: number;
  horizon_max_jours?: number;
  validation_auto?: boolean;
  delai_annulation_h?: number;
  strategie_planning?: "optimiser" | "libre" | "concentrer";
  seuil_acompte_obligatoire?: number;
  rappels?: { heures: number; canal: string }[];
  zones_deplacement?: { nom: string; codes_postaux: string[]; frais: number; minutes: number }[];
}): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  const maj: TablesUpdate<"reglages"> = {};
  if (patch.battement_defaut !== undefined) maj.battement_defaut = patch.battement_defaut;
  if (patch.granularite_creneaux !== undefined) maj.granularite_creneaux = patch.granularite_creneaux;
  if (patch.delai_min_reservation !== undefined) maj.delai_min_reservation = patch.delai_min_reservation;
  if (patch.horizon_max_jours !== undefined) maj.horizon_max_jours = patch.horizon_max_jours;
  if (patch.validation_auto !== undefined) maj.validation_auto = patch.validation_auto;
  if (patch.delai_annulation_h !== undefined) maj.delai_annulation_h = patch.delai_annulation_h;
  if (patch.strategie_planning !== undefined) maj.strategie_planning = patch.strategie_planning;
  if (patch.seuil_acompte_obligatoire !== undefined) maj.seuil_acompte_obligatoire = patch.seuil_acompte_obligatoire;
  if (patch.rappels !== undefined) maj.rappels = patch.rappels as unknown as Json;
  if (patch.zones_deplacement !== undefined) maj.zones_deplacement = patch.zones_deplacement as unknown as Json;

  const { error } = await ctx.supabase
    .from("reglages")
    .update(maj)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Enregistrement impossible." } : { ok: true };
}

/** Remplace les horaires d'ouverture de l'établissement. */
export async function majHoraires(
  horaires: { jour: number; debut: string; fin: string }[],
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  await ctx.supabase
    .from("horaires")
    .delete()
    .eq("etablissement_id", ctx.etablissementId)
    .is("membre_id", null);
  if (horaires.length > 0) {
    const { error } = await ctx.supabase.from("horaires").insert(
      horaires.map((h) => ({
        etablissement_id: ctx.etablissementId,
        membre_id: null,
        jour_semaine: h.jour,
        heure_debut: h.debut,
        heure_fin: h.fin,
      })),
    );
    if (error) return { ok: false, erreur: "Enregistrement des horaires impossible." };
  }
  return { ok: true };
}

/** Change le profil métier sans perte de données (M6.6). */
export async function majMetiers(
  principal: string,
  complementaires: string[],
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const codes = Array.from(new Set([principal, ...complementaires]));

  // On remplace les liens métier ; le catalogue et les fiches restent intacts.
  await ctx.supabase
    .from("etablissement_metiers")
    .delete()
    .eq("etablissement_id", ctx.etablissementId);
  const { error } = await ctx.supabase.from("etablissement_metiers").insert(
    codes.map((code) => ({
      etablissement_id: ctx.etablissementId,
      metier_code: code,
      principal: code === principal,
    })),
  );
  return error ? { ok: false, erreur: "Changement de métier impossible." } : { ok: true };
}

/** Attestation d'hygiène & salubrité (validité 5 ans). */
export async function majAttestation(dateObtention: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { data: reg } = await ctx.supabase
    .from("reglages")
    .select("autres")
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  const autres = (reg?.autres as Record<string, unknown>) ?? {};
  const { error } = await ctx.supabase
    .from("reglages")
    .update({ autres: { ...autres, attestation_hygiene: { date_obtention: dateObtention } } })
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Enregistrement impossible." } : { ok: true };
}
