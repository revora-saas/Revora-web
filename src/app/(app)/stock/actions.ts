"use server";

import { contexteEtablissement } from "@/lib/auth";

export interface LotVue {
  id: string;
  numero: string;
  peremption: string | null;
  quantite: number;
  reach: boolean | null;
  perime: boolean;
  perimeBientot: boolean;
}
export interface ProduitVue {
  id: string;
  nom: string;
  marque: string | null;
  type: string;
  unite: string | null;
  seuil: number;
  prixVente: number | null;
  quantite: number;
  sousSeuil: boolean;
  lots: LotVue[];
}

/** État du stock avec quantités calculées et alertes (R12). */
export async function listerStock(): Promise<ProduitVue[]> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];

  const [{ data: produits }, { data: lots }, { data: mouvements }] = await Promise.all([
    ctx.supabase
      .from("produits")
      .select("id, nom, marque, type, unite, seuil_alerte, prix_vente")
      .eq("etablissement_id", ctx.etablissementId)
      .eq("actif", true)
      .order("nom"),
    ctx.supabase
      .from("lots")
      .select("id, produit_id, numero_lot, date_peremption, conforme_reach, quantite")
      .eq("etablissement_id", ctx.etablissementId),
    ctx.supabase
      .from("mouvements_stock")
      .select("produit_id, quantite")
      .eq("etablissement_id", ctx.etablissementId),
  ]);

  const aujourdhui = new Date();
  const dans30j = new Date(aujourdhui.getTime() + 30 * 24 * 3600 * 1000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Somme des mouvements par produit (pour les non-pigments).
  const sommeMouv = new Map<string, number>();
  for (const m of mouvements ?? []) {
    sommeMouv.set(m.produit_id, (sommeMouv.get(m.produit_id) ?? 0) + Number(m.quantite));
  }

  return (produits ?? []).map((p) => {
    const sesLots = (lots ?? [])
      .filter((l) => l.produit_id === p.id)
      .map((l) => ({
        id: l.id,
        numero: l.numero_lot,
        peremption: l.date_peremption,
        quantite: Number(l.quantite),
        reach: l.conforme_reach,
        perime: Boolean(l.date_peremption && l.date_peremption < iso(aujourdhui)),
        perimeBientot: Boolean(
          l.date_peremption && l.date_peremption >= iso(aujourdhui) && l.date_peremption <= iso(dans30j),
        ),
      }));
    const quantite =
      p.type === "pigment"
        ? sesLots.reduce((s, l) => s + l.quantite, 0)
        : sommeMouv.get(p.id) ?? 0;
    return {
      id: p.id,
      nom: p.nom,
      marque: p.marque,
      type: p.type,
      unite: p.unite,
      seuil: Number(p.seuil_alerte),
      prixVente: p.prix_vente != null ? Number(p.prix_vente) : null,
      quantite,
      sousSeuil: Number(p.seuil_alerte) > 0 && quantite <= Number(p.seuil_alerte),
      lots: sesLots,
    };
  });
}

export async function creerProduit(entree: {
  nom: string;
  type: "consommable" | "pigment" | "revente";
  marque?: string;
  unite?: string;
  seuil?: number;
  prixVente?: number;
}): Promise<{ ok: boolean; id?: string; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (!entree.nom.trim()) return { ok: false, erreur: "Nom obligatoire." };
  const { data, error } = await ctx.supabase
    .from("produits")
    .insert({
      etablissement_id: ctx.etablissementId,
      nom: entree.nom.trim(),
      type: entree.type,
      marque: entree.marque || null,
      unite: entree.unite || "unité",
      seuil_alerte: entree.seuil ?? 0,
      prix_vente: entree.prixVente ?? null,
    })
    .select("id")
    .single();
  return error || !data ? { ok: false, erreur: "Création impossible." } : { ok: true, id: data.id };
}

export async function ajouterLot(entree: {
  produitId: string;
  numero: string;
  peremption?: string;
  reach?: boolean;
  quantite: number;
}): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (!entree.numero.trim()) return { ok: false, erreur: "Numéro de lot obligatoire." };

  const { error } = await ctx.supabase.from("lots").insert({
    etablissement_id: ctx.etablissementId,
    produit_id: entree.produitId,
    numero_lot: entree.numero.trim(),
    date_peremption: entree.peremption || null,
    conforme_reach: entree.reach ?? null,
    quantite: entree.quantite,
  });
  if (error) return { ok: false, erreur: "Ajout du lot impossible." };
  // Trace l'entrée en mouvement.
  await ctx.supabase.from("mouvements_stock").insert({
    etablissement_id: ctx.etablissementId,
    produit_id: entree.produitId,
    quantite: entree.quantite,
    motif: "entree",
  });
  return { ok: true };
}

/** Mouvement de stock avec motif obligatoire (R12) : entrée, sortie, perte, inventaire. */
export async function mouvementStock(entree: {
  produitId: string;
  lotId?: string | null;
  quantite: number; // signé (négatif = sortie)
  motif: "entree" | "sortie" | "perte" | "peremption" | "inventaire";
}): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (entree.quantite === 0) return { ok: false, erreur: "Quantité nulle." };

  const { error } = await ctx.supabase.from("mouvements_stock").insert({
    etablissement_id: ctx.etablissementId,
    produit_id: entree.produitId,
    lot_id: entree.lotId ?? null,
    quantite: entree.quantite,
    motif: entree.motif,
  });
  if (error) return { ok: false, erreur: "Mouvement impossible." };

  // Ajuste la quantité du lot le cas échéant.
  if (entree.lotId) {
    const { data: lot } = await ctx.supabase
      .from("lots")
      .select("quantite")
      .eq("id", entree.lotId)
      .maybeSingle();
    if (lot) {
      await ctx.supabase
        .from("lots")
        .update({ quantite: Math.max(0, Number(lot.quantite) + entree.quantite) })
        .eq("id", entree.lotId);
    }
  }
  return { ok: true };
}

export async function archiverProduit(id: string): Promise<{ ok: boolean }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false };
  const { error } = await ctx.supabase
    .from("produits")
    .update({ actif: false })
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId);
  return { ok: !error };
}
