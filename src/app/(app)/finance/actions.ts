"use server";

import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { contexteEtablissement } from "@/lib/auth";

const FUSEAU = "Europe/Paris";

function jourLocal(offset = 0): string {
  const l = toZonedTime(new Date(), FUSEAU);
  l.setDate(l.getDate() + offset);
  return l.toISOString().slice(0, 10);
}
function bornesUtc(debutJour: string, finJourExclu: string): [string, string] {
  return [
    fromZonedTime(`${debutJour}T00:00:00`, FUSEAU).toISOString(),
    fromZonedTime(`${finJourExclu}T00:00:00`, FUSEAU).toISOString(),
  ];
}

export interface Finance {
  caJour: number;
  caJourPrec: number;
  caSemaine: number;
  caSemainePrec: number;
  caMois: number;
  caMoisPrec: number;
  nouvellesClientes: number;
  topPrestations: { libelle: string; nb: number }[];
  depensesMois: number;
}

/** Somme des encaissements (hors annulés) sur une période UTC. */
async function ca(
  supabase: NonNullable<Awaited<ReturnType<typeof contexteEtablissement>>>["supabase"],
  etabId: string,
  debutUtc: string,
  finUtc: string,
): Promise<number> {
  const { data } = await supabase
    .from("encaissements")
    .select("total_ttc, statut")
    .eq("etablissement_id", etabId)
    .neq("statut", "annule")
    .gte("cree_le", debutUtc)
    .lt("cree_le", finUtc);
  return (data ?? []).reduce((s, e) => s + Number(e.total_ttc), 0);
}

export async function getFinance(): Promise<Finance> {
  const ctx = await contexteEtablissement();
  const vide: Finance = {
    caJour: 0, caJourPrec: 0, caSemaine: 0, caSemainePrec: 0, caMois: 0, caMoisPrec: 0,
    nouvellesClientes: 0, topPrestations: [], depensesMois: 0,
  };
  if (!ctx) return vide;
  const { supabase, etablissementId: etab } = ctx;

  const auj = jourLocal(0);
  const demain = jourLocal(1);
  const hier = jourLocal(-1);
  const il7 = jourLocal(-7);
  const il14 = jourLocal(-14);

  // Bornes du mois courant et précédent.
  const [a, m] = auj.split("-").map(Number);
  const moisDebut = `${a}-${String(m).padStart(2, "0")}-01`;
  const moisFin = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  const moisPrecDebut = m === 1 ? `${a - 1}-12-01` : `${a}-${String(m - 1).padStart(2, "0")}-01`;

  const [caJour, caJourPrec, caSemaine, caSemainePrec, caMois, caMoisPrec] = await Promise.all([
    ca(supabase, etab, ...bornesUtc(auj, demain)),
    ca(supabase, etab, ...bornesUtc(hier, auj)),
    ca(supabase, etab, ...bornesUtc(il7, demain)),
    ca(supabase, etab, ...bornesUtc(il14, il7)),
    ca(supabase, etab, ...bornesUtc(moisDebut, moisFin)),
    ca(supabase, etab, ...bornesUtc(moisPrecDebut, moisDebut)),
  ]);

  // Nouvelles clientes ce mois.
  const [debutMoisUtc] = bornesUtc(moisDebut, moisFin);
  const { count: nouvellesClientes } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("etablissement_id", etab)
    .gte("cree_le", debutMoisUtc);

  // Top prestations ce mois (depuis les RDV honorés).
  const { data: rdvMois } = await supabase
    .from("rendez_vous")
    .select("id")
    .eq("etablissement_id", etab)
    .eq("statut", "honore")
    .gte("debut_execution", debutMoisUtc);
  const rdvIds = (rdvMois ?? []).map((r) => r.id);
  const { data: rp } = rdvIds.length
    ? await supabase.from("rdv_prestations").select("libelle").in("rendez_vous_id", rdvIds)
    : { data: [] };
  const compte = new Map<string, number>();
  for (const p of rp ?? []) compte.set(p.libelle, (compte.get(p.libelle) ?? 0) + 1);
  const topPrestations = [...compte.entries()]
    .map(([libelle, nb]) => ({ libelle, nb }))
    .sort((x, y) => y.nb - x.nb)
    .slice(0, 3);

  // Dépenses du mois.
  const { data: dep } = await supabase
    .from("depenses")
    .select("montant")
    .eq("etablissement_id", etab)
    .gte("date_depense", moisDebut)
    .lt("date_depense", moisFin);
  const depensesMois = (dep ?? []).reduce((s, d) => s + Number(d.montant), 0);

  return {
    caJour, caJourPrec, caSemaine, caSemainePrec, caMois, caMoisPrec,
    nouvellesClientes: nouvellesClientes ?? 0, topPrestations, depensesMois,
  };
}

export async function ajouterDepense(entree: {
  libelle: string;
  categorie?: string;
  montant: number;
  date?: string;
}): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (!entree.libelle.trim() || entree.montant <= 0)
    return { ok: false, erreur: "Libellé et montant obligatoires." };
  const { error } = await ctx.supabase.from("depenses").insert({
    etablissement_id: ctx.etablissementId,
    libelle: entree.libelle.trim(),
    categorie: entree.categorie || null,
    montant: entree.montant,
    date_depense: entree.date || jourLocal(0),
  });
  return error ? { ok: false, erreur: "Enregistrement impossible." } : { ok: true };
}

/** Export comptable CSV des encaissements du mois (préparation e-reporting B2C). */
export async function exportComptableCsv(): Promise<string> {
  const ctx = await contexteEtablissement();
  if (!ctx) return "";
  const auj = jourLocal(0);
  const [a, m] = auj.split("-").map(Number);
  const moisDebut = `${a}-${String(m).padStart(2, "0")}-01`;
  const moisFin = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, "0")}-01`;
  const [d1, d2] = bornesUtc(moisDebut, moisFin);

  const { data } = await ctx.supabase
    .from("encaissements")
    .select("numero, cree_le, total_ttc, statut")
    .eq("etablissement_id", ctx.etablissementId)
    .gte("cree_le", d1)
    .lt("cree_le", d2)
    .order("numero");

  const lignes = ["numero,date,total_ttc,statut"];
  for (const e of data ?? []) {
    lignes.push(
      `${e.numero},${new Date(e.cree_le).toISOString().slice(0, 10)},${Number(e.total_ttc).toFixed(2)},${e.statut}`,
    );
  }
  return lignes.join("\n");
}
