"use server";

import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { creerClientService } from "@/lib/supabase/service";
import { respecterFenetreSilence } from "@/lib/messagerie/quiet";
import { remplirGabarit } from "@/lib/messagerie/gabarit";
import type { Json, TablesUpdate } from "@/lib/database.types";

type Resultat = { ok: true; id?: string } | { ok: false; erreur: string; bloquant?: boolean };

const BUCKET = "photos-clientes";

// ---------------------------------------------------------------------
// Création / mise à jour d'une séance (fiche technique historisée M4.2)
// ---------------------------------------------------------------------
export async function creerSeance(
  clientId: string,
  rdvId?: string,
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const config = await getConfigurationEtablissement(ctx.etablissementId);

  // Numéro de séance = nombre de fiches existantes + 1.
  const { count } = await ctx.supabase
    .from("fiches_techniques")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  const { data, error } = await ctx.supabase
    .from("fiches_techniques")
    .insert({
      etablissement_id: ctx.etablissementId,
      client_id: clientId,
      rendez_vous_id: rdvId ?? null,
      metier_code: config.metierPrincipal,
      donnees: {},
      numero_seance: (count ?? 0) + 1,
    })
    .select("id")
    .single();
  return error || !data ? { ok: false, erreur: "Création impossible." } : { ok: true, id: data.id };
}

export async function majSeance(
  ficheId: string,
  champs: { donnees?: Record<string, unknown>; lotId?: string | null; materiel?: string | null; zone?: string | null },
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // Interdit de modifier une fiche clôturée (R11.6).
  const { data: fiche } = await ctx.supabase
    .from("fiches_techniques")
    .select("cloturee_le")
    .eq("id", ficheId)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!fiche) return { ok: false, erreur: "Fiche introuvable." };
  if (fiche.cloturee_le) return { ok: false, erreur: "Fiche clôturée, non modifiable." };

  const maj: TablesUpdate<"fiches_techniques"> = {};
  if (champs.donnees !== undefined) maj.donnees = champs.donnees as Json;
  if (champs.lotId !== undefined) maj.lot_id = champs.lotId;
  if (champs.materiel !== undefined) maj.materiel = champs.materiel;
  if (champs.zone !== undefined) maj.zone = champs.zone;

  const { error } = await ctx.supabase
    .from("fiches_techniques")
    .update(maj)
    .eq("id", ficheId)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Enregistrement impossible." } : { ok: true };
}

// ---------------------------------------------------------------------
// Pigments et lots (traçabilité)
// ---------------------------------------------------------------------
export async function getPigmentsEtLots(): Promise<
  { id: string; nom: string; marque: string | null; lots: { id: string; numero: string; peremption: string | null; reach: boolean | null; perime: boolean }[] }[]
> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data: produits } = await ctx.supabase
    .from("produits")
    .select("id, nom, marque")
    .eq("etablissement_id", ctx.etablissementId)
    .eq("type", "pigment")
    .eq("actif", true);
  const ids = (produits ?? []).map((p) => p.id);
  const { data: lots } = ids.length
    ? await ctx.supabase
        .from("lots")
        .select("id, produit_id, numero_lot, date_peremption, conforme_reach")
        .in("produit_id", ids)
    : { data: [] };

  const aujourdhui = new Date().toISOString().slice(0, 10);
  return (produits ?? []).map((p) => ({
    id: p.id,
    nom: p.nom,
    marque: p.marque,
    lots: (lots ?? [])
      .filter((l) => l.produit_id === p.id)
      .map((l) => ({
        id: l.id,
        numero: l.numero_lot,
        peremption: l.date_peremption,
        reach: l.conforme_reach,
        perime: Boolean(l.date_peremption && l.date_peremption < aujourdhui),
      })),
  }));
}

// ---------------------------------------------------------------------
// Consentements (soin + image distinct R11.5), signés sur écran
// ---------------------------------------------------------------------
export async function enregistrerConsentement(
  clientId: string,
  type: "soin_pmu" | "image" | "donnees_sante",
  accorde: boolean,
  signatureDataUrl?: string,
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  const { error } = await ctx.supabase.from("consentements").insert({
    etablissement_id: ctx.etablissementId,
    client_id: clientId,
    type,
    accorde,
    document_version: "v1",
    signature_url: signatureDataUrl ?? null,
  });
  if (error) return { ok: false, erreur: "Enregistrement du consentement impossible." };

  // Sans consentement image, les photos existantes deviennent non utilisables (R11.5).
  if (type === "image") {
    await ctx.supabase
      .from("photos")
      .update({ utilisable_communication: accorde })
      .eq("client_id", clientId)
      .eq("etablissement_id", ctx.etablissementId);
  }
  return { ok: true };
}

// ---------------------------------------------------------------------
// Clôture — impossible sans traçabilité complète pour le PMU (R11.2)
// ---------------------------------------------------------------------
export async function cloturerSeance(ficheId: string): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const config = await getConfigurationEtablissement(ctx.etablissementId);
  const estPmu = Boolean(config.modules.tracabilite_pigments);

  const { data: fiche } = await ctx.supabase
    .from("fiches_techniques")
    .select("id, client_id, donnees, lot_id, rendez_vous_id, cloturee_le")
    .eq("id", ficheId)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!fiche) return { ok: false, erreur: "Fiche introuvable." };
  if (fiche.cloturee_le) return { ok: false, erreur: "Fiche déjà clôturée." };

  if (estPmu) {
    // 1. Champs obligatoires du schéma remplis.
    const donnees = (fiche.donnees ?? {}) as Record<string, unknown>;
    for (const champ of config.ficheTechnique) {
      if (!champ.obligatoire) continue;
      const v = donnees[champ.cle];
      const vide = v == null || v === "" || (Array.isArray(v) && v.length === 0);
      if (vide) return { ok: false, erreur: `Champ obligatoire manquant : ${champ.libelle}.`, bloquant: true };
    }

    // 2. Lot de pigment présent et non périmé (R11.3 — alerte bloquante).
    if (!fiche.lot_id) {
      return { ok: false, erreur: "Le lot de pigment est obligatoire pour clôturer.", bloquant: true };
    }
    const { data: lot } = await ctx.supabase
      .from("lots")
      .select("date_peremption")
      .eq("id", fiche.lot_id)
      .maybeSingle();
    if (lot?.date_peremption && lot.date_peremption < new Date().toISOString().slice(0, 10)) {
      return { ok: false, erreur: "Pigment périmé : clôture impossible.", bloquant: true };
    }

    // 3. Consentement aux soins signé.
    const { data: consent } = await ctx.supabase
      .from("consentements")
      .select("id")
      .eq("client_id", fiche.client_id)
      .eq("type", "soin_pmu")
      .eq("accorde", true)
      .limit(1)
      .maybeSingle();
    if (!consent) {
      return { ok: false, erreur: "Consentement aux soins manquant.", bloquant: true };
    }
  }

  const { error } = await ctx.supabase
    .from("fiches_techniques")
    .update({ cloturee_le: new Date().toISOString() })
    .eq("id", ficheId)
    .eq("etablissement_id", ctx.etablissementId);
  if (error) return { ok: false, erreur: "Clôture impossible." };

  // Planification automatique de la retouche (R11.4).
  await planifierRetouche(ctx, fiche.rendez_vous_id, fiche.client_id);

  return { ok: true };
}

/** Planifie un rappel de retouche dans la fenêtre recommandée (R11.4). */
async function planifierRetouche(
  ctx: NonNullable<Awaited<ReturnType<typeof contexteEtablissement>>>,
  rdvId: string | null,
  clientId: string,
) {
  if (!rdvId) return;
  const { data: rp } = await ctx.supabase
    .from("rdv_prestations")
    .select("prestation_id")
    .eq("rendez_vous_id", rdvId);
  const ids = (rp ?? []).map((r) => r.prestation_id).filter(Boolean) as string[];
  if (ids.length === 0) return;
  const { data: prestas } = await ctx.supabase
    .from("prestations")
    .select("cycle_rappel_jours")
    .in("id", ids);
  const cycle = Math.max(0, ...(prestas ?? []).map((p) => p.cycle_rappel_jours ?? 0));
  if (cycle <= 0) return;

  const { data: rdv } = await ctx.supabase
    .from("rendez_vous")
    .select("debut_execution")
    .eq("id", rdvId)
    .maybeSingle();
  const { data: etab } = await ctx.supabase
    .from("etablissements")
    .select("nom, slug, fuseau")
    .eq("id", ctx.etablissementId)
    .maybeSingle();
  const { data: cl } = await ctx.supabase
    .from("clients")
    .select("telephone_mobile, prenom")
    .eq("id", clientId)
    .maybeSingle();
  if (!rdv || !cl?.telephone_mobile) return;

  const fenetre = new Date(new Date(rdv.debut_execution).getTime() + cycle * 24 * 3600 * 1000);
  const { data: modele } = await ctx.supabase
    .from("modeles_messages")
    .select("contenu")
    .eq("code", "retouche")
    .eq("canal", "sms")
    .is("etablissement_id", null)
    .maybeSingle();
  const lien = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora.fr"}/${etab?.slug ?? ""}`;
  const contenu = remplirGabarit(modele?.contenu ?? "Il est temps de planifier votre retouche : {lien}", {
    prenom: cl.prenom,
    salon: etab?.nom,
    lien,
  });

  await ctx.supabase.from("messages").insert({
    etablissement_id: ctx.etablissementId,
    client_id: clientId,
    rendez_vous_id: rdvId,
    canal: "sms",
    categorie: "transactionnel",
    destinataire: cl.telephone_mobile,
    contenu,
    code: "retouche",
    statut: "en_file",
    planifie_le: respecterFenetreSilence(fenetre, etab?.fuseau ?? "Europe/Paris").toISOString(),
  });
}

// ---------------------------------------------------------------------
// Photos (Supabase Storage, URL signée — C10.2)
// ⚠️ Nécessite un bucket privé "photos-clientes".
// ---------------------------------------------------------------------
export async function demanderUploadPhoto(
  clientId: string,
  ficheId: string,
  type: "avant" | "apres" | "inspiration",
): Promise<{ ok: true; path: string; token: string } | { ok: false; erreur: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const svc = creerClientService();
  const path = `${ctx.etablissementId}/${clientId}/${ficheId}/${type}-${Date.now()}.jpg`;
  const { data, error } = await svc.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, erreur: "Envoi de photo indisponible (bucket manquant ?)." };
  return { ok: true, path: data.path, token: data.token };
}

export async function confirmerPhoto(
  clientId: string,
  ficheId: string,
  type: "avant" | "apres" | "inspiration",
  path: string,
): Promise<Resultat> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // Utilisable en communication uniquement si le consentement image est donné (R11.5).
  const { data: consent } = await ctx.supabase
    .from("consentements")
    .select("accorde")
    .eq("client_id", clientId)
    .eq("type", "image")
    .order("date_consentement", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await ctx.supabase.from("photos").insert({
    etablissement_id: ctx.etablissementId,
    client_id: clientId,
    fiche_technique_id: ficheId,
    type,
    url: path,
    utilisable_communication: Boolean(consent?.accorde),
  });
  return error ? { ok: false, erreur: "Enregistrement de la photo impossible." } : { ok: true };
}

/** URLs signées (durée limitée) des photos d'une fiche — jamais de lien public. */
export async function getPhotosSignees(
  ficheId: string,
): Promise<{ id: string; type: string; url: string; utilisable: boolean }[]> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data: photos } = await ctx.supabase
    .from("photos")
    .select("id, type, url, utilisable_communication")
    .eq("fiche_technique_id", ficheId)
    .eq("etablissement_id", ctx.etablissementId);
  if (!photos || photos.length === 0) return [];

  const svc = creerClientService();
  const resultat = [];
  for (const p of photos) {
    const { data } = await svc.storage.from(BUCKET).createSignedUrl(p.url, 3600);
    resultat.push({
      id: p.id,
      type: p.type,
      url: data?.signedUrl ?? "",
      utilisable: p.utilisable_communication,
    });
  }
  return resultat;
}
