"use server";

import { contexteEtablissement } from "@/lib/auth";
import type { Json } from "@/lib/database.types";

export interface LigneEncaissement {
  type: "prestation" | "produit" | "option" | "remise";
  libelle: string;
  quantite: number;
  prix_unitaire: number;
  produit_id?: string | null;
  prestation_id?: string | null;
}
export interface PaiementEntree {
  montant: number;
  moyen: "especes" | "carte" | "virement" | "lien" | "cheque" | "avoir";
  type?: "acompte" | "solde" | "remboursement";
}

/** Pré-remplit un encaissement depuis un rendez-vous (R13.1). */
export async function chargerRdvPourEncaissement(rdvId: string): Promise<{
  clientId: string | null;
  clientNom: string;
  acomptePaye: number;
  lignes: LigneEncaissement[];
} | null> {
  const ctx = await contexteEtablissement();
  if (!ctx) return null;

  const { data: rdv } = await ctx.supabase
    .from("rendez_vous")
    .select("client_id, acompte_paye")
    .eq("id", rdvId)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!rdv) return null;

  const { data: rp } = await ctx.supabase
    .from("rdv_prestations")
    .select("libelle, prix, prestation_id")
    .eq("rendez_vous_id", rdvId)
    .order("ordre");

  let clientNom = "Client au comptoir";
  if (rdv.client_id) {
    const { data: c } = await ctx.supabase
      .from("clients")
      .select("nom, prenom")
      .eq("id", rdv.client_id)
      .maybeSingle();
    if (c) clientNom = c.prenom ? `${c.prenom} ${c.nom}` : c.nom;
  }

  return {
    clientId: rdv.client_id,
    clientNom,
    acomptePaye: Number(rdv.acompte_paye ?? 0),
    lignes: (rp ?? []).map((p) => ({
      type: "prestation" as const,
      libelle: p.libelle,
      quantite: 1,
      prix_unitaire: Number(p.prix),
      prestation_id: p.prestation_id,
    })),
  };
}

/** Produits de revente, pour l'ajout au panier. */
export async function listerProduitsRevente(): Promise<
  { id: string; nom: string; prix: number }[]
> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data } = await ctx.supabase
    .from("produits")
    .select("id, nom, prix_vente")
    .eq("etablissement_id", ctx.etablissementId)
    .eq("type", "revente")
    .eq("actif", true);
  return (data ?? []).map((p) => ({ id: p.id, nom: p.nom, prix: Number(p.prix_vente ?? 0) }));
}

export async function encaisser(entree: {
  clientId: string | null;
  rdvId: string | null;
  lignes: LigneEncaissement[];
  paiements: PaiementEntree[];
  acompteDeduit: number;
}): Promise<{ ok: true; numero: string } | { ok: false; erreur: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (entree.lignes.length === 0) return { ok: false, erreur: "Aucune ligne à encaisser." };

  const { data, error } = await ctx.supabase.rpc("creer_encaissement", {
    p_etablissement: ctx.etablissementId,
    p_client_id: entree.clientId,
    p_rendez_vous_id: entree.rdvId,
    p_lignes: entree.lignes as unknown as Json,
    p_paiements: entree.paiements as unknown as Json,
    p_acompte_deduit: entree.acompteDeduit,
  });
  if (error) return { ok: false, erreur: "Encaissement impossible." };
  const res = data as { numero: string };
  return { ok: true, numero: res.numero };
}

/** Remboursement total ou partiel, tracé (R13.6). */
export async function rembourser(
  encaissementId: string,
  montant: number,
  moyen: PaiementEntree["moyen"],
): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (montant <= 0) return { ok: false, erreur: "Montant invalide." };

  const { data: enc } = await ctx.supabase
    .from("encaissements")
    .select("total_ttc")
    .eq("id", encaissementId)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!enc) return { ok: false, erreur: "Encaissement introuvable." };

  const { error } = await ctx.supabase.from("paiements").insert({
    etablissement_id: ctx.etablissementId,
    encaissement_id: encaissementId,
    montant: -Math.abs(montant),
    moyen,
    type: "remboursement",
  });
  if (error) return { ok: false, erreur: "Remboursement impossible." };

  const statut = montant >= Number(enc.total_ttc) ? "rembourse" : "partiel";
  await ctx.supabase.from("encaissements").update({ statut }).eq("id", encaissementId);
  return { ok: true };
}

/** Journal des encaissements d'un jour (R13.7). */
export async function listerEncaissementsJour(
  dateStr: string,
): Promise<{ id: string; numero: string; total: number; statut: string; heure: string }[]> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const debut = `${dateStr}T00:00:00Z`;
  const fin = `${dateStr}T23:59:59Z`;
  const { data } = await ctx.supabase
    .from("encaissements")
    .select("id, numero, total_ttc, statut, cree_le")
    .eq("etablissement_id", ctx.etablissementId)
    .gte("cree_le", debut)
    .lte("cree_le", fin)
    .order("cree_le", { ascending: false });
  return (data ?? []).map((e) => ({
    id: e.id,
    numero: e.numero,
    total: Number(e.total_ttc),
    statut: e.statut,
    heure: new Date(e.cree_le).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  }));
}
