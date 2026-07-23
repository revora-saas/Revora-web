// =====================================================================
// Données réelles des widgets d'accueil (M5). Bibliothèque commune + widgets
// spécifiques activés par profil. Calculé côté serveur.
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { Database } from "@/lib/database.types";
import {
  construireOuvertures,
  dureeMinutes,
  fusionner,
  type HoraireRecurrent,
  type Intervalle,
} from "@/lib/agenda";

type Client = SupabaseClient<Database>;

export interface DonneeWidget {
  valeur: string;
  detail?: string;
  href?: string;
  alerte?: boolean;
}

function parseRange(brut: string | null): Intervalle | null {
  if (!brut) return null;
  const m = brut.match(/^[[(]"?([^",]+)"?,"?([^",)]+)"?[)\]]$/);
  if (!m) return null;
  return { debut: new Date(m[1]), fin: new Date(m[2]) };
}

/** Calcule les données de tous les widgets pour un établissement. */
export async function chargerWidgets(
  supabase: Client,
  etabId: string,
  fuseau: string,
): Promise<Record<string, DonneeWidget>> {
  const jourStr = toZonedTime(new Date(), fuseau).toISOString().slice(0, 10);
  const debutJour = fromZonedTime(`${jourStr}T00:00:00`, fuseau);
  const finJour = new Date(debutJour.getTime() + 24 * 3600 * 1000);
  const maintenant = new Date();

  const [a, m] = jourStr.split("-").map(Number);
  const debutMois = fromZonedTime(`${a}-${String(m).padStart(2, "0")}-01T00:00:00`, fuseau);

  const [
    { data: rdvJour },
    { data: enc },
    { count: nouvelles },
    { data: produits },
    { data: lots },
    { data: mouvements },
    { data: clients },
    { count: retouches },
    { count: echecs },
    { count: demandes },
    { data: occ },
    { data: horairesData },
  ] = await Promise.all([
    supabase
      .from("rendez_vous")
      .select("id, statut")
      .eq("etablissement_id", etabId)
      .neq("statut", "annule")
      .gte("debut_execution", debutJour.toISOString())
      .lt("debut_execution", finJour.toISOString()),
    supabase
      .from("encaissements")
      .select("total_ttc, statut")
      .eq("etablissement_id", etabId)
      .neq("statut", "annule")
      .gte("cree_le", debutJour.toISOString())
      .lt("cree_le", finJour.toISOString()),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etabId)
      .gte("cree_le", debutMois.toISOString()),
    supabase.from("produits").select("id, type, seuil_alerte").eq("etablissement_id", etabId).eq("actif", true),
    supabase.from("lots").select("produit_id, quantite, date_peremption").eq("etablissement_id", etabId),
    supabase.from("mouvements_stock").select("produit_id, quantite").eq("etablissement_id", etabId),
    supabase
      .from("clients")
      .select("derniere_visite, frequence_moyenne_j")
      .eq("etablissement_id", etabId)
      .is("archive_le", null)
      .not("derniere_visite", "is", null),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etabId)
      .eq("code", "retouche")
      .eq("statut", "en_file"),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etabId)
      .eq("statut", "echec"),
    supabase
      .from("rendez_vous")
      .select("id", { count: "exact", head: true })
      .eq("etablissement_id", etabId)
      .eq("statut", "demande")
      .gt("debut_execution", maintenant.toISOString()),
    supabase
      .from("occupations")
      .select("periode, membre_id")
      .eq("etablissement_id", etabId)
      .not("membre_id", "is", null)
      .overlaps("periode", `[${debutJour.toISOString()},${finJour.toISOString()})`),
    supabase
      .from("horaires")
      .select("jour_semaine, heure_debut, heure_fin")
      .eq("etablissement_id", etabId)
      .is("membre_id", null),
  ]);

  // Recette du jour.
  const recette = (enc ?? []).reduce((s, e) => s + Number(e.total_ttc), 0);

  // Stock faible + péremption.
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dans30 = iso(new Date(maintenant.getTime() + 30 * 24 * 3600 * 1000));
  const sommeMouv = new Map<string, number>();
  for (const mv of mouvements ?? []) sommeMouv.set(mv.produit_id, (sommeMouv.get(mv.produit_id) ?? 0) + Number(mv.quantite));
  const sommeLot = new Map<string, number>();
  let perimes = 0;
  for (const l of lots ?? []) {
    sommeLot.set(l.produit_id, (sommeLot.get(l.produit_id) ?? 0) + Number(l.quantite));
    if (l.date_peremption && l.date_peremption <= dans30) perimes++;
  }
  let stockFaible = 0;
  for (const p of produits ?? []) {
    if (Number(p.seuil_alerte) <= 0) continue;
    const q = p.type === "pigment" ? sommeLot.get(p.id) ?? 0 : sommeMouv.get(p.id) ?? 0;
    if (q <= Number(p.seuil_alerte)) stockFaible++;
  }

  // Relances : prochaine visite estimée dépassée (C2.3).
  let relances = 0;
  for (const c of clients ?? []) {
    if (!c.derniere_visite || !c.frequence_moyenne_j) continue;
    const prochaine = new Date(c.derniere_visite).getTime() + c.frequence_moyenne_j * 24 * 3600 * 1000;
    if (prochaine < maintenant.getTime()) relances++;
  }

  // Taux de remplissage du jour.
  const horaires: HoraireRecurrent[] = (horairesData ?? []).map((h) => ({
    jourSemaine: h.jour_semaine,
    debut: h.heure_debut.slice(0, 5),
    fin: h.heure_fin.slice(0, 5),
  }));
  const ouvertures = construireOuvertures(fuseau, { debut: debutJour, fin: finJour }, horaires);
  const minutesOuvert = ouvertures.reduce((s, o) => s + dureeMinutes(o), 0);
  const occInts = fusionner(
    (occ ?? []).map((o) => parseRange(o.periode as string | null)).filter(Boolean) as Intervalle[],
  );
  const minutesOccupe = occInts.reduce((s, o) => s + dureeMinutes(o), 0);
  const taux = minutesOuvert > 0 ? Math.round((minutesOccupe / minutesOuvert) * 100) : 0;

  return {
    rdv_jour: {
      valeur: String((rdvJour ?? []).length),
      detail: "rendez-vous",
      href: "/agenda",
    },
    recette_jour: { valeur: `${recette.toFixed(0)} €`, detail: "encaissé", href: "/caisse" },
    taux_remplissage: { valeur: `${taux} %`, detail: "du planning" },
    nouvelles_clientes: { valeur: String(nouvelles ?? 0), detail: "ce mois", href: "/clientes" },
    stock_faible: {
      valeur: String(stockFaible),
      detail: perimes > 0 ? `${perimes} péremption(s)` : "sous le seuil",
      href: "/stock",
      alerte: stockFaible > 0 || perimes > 0,
    },
    relances_faire: {
      valeur: String(relances),
      detail: "clientes à relancer",
      href: "/relances",
      alerte: relances > 0,
    },
    remplissages_relancer: { valeur: String(relances), detail: "à relancer", href: "/relances" },
    remplissages_avenir: { valeur: String(relances), detail: "à venir", href: "/relances" },
    retouches_planifier: {
      valeur: String(retouches ?? 0),
      detail: "retouches PMU",
      href: "/clientes",
    },
    notifications: {
      valeur: String((echecs ?? 0) + (demandes ?? 0)),
      detail: "à traiter",
      alerte: (echecs ?? 0) > 0,
    },
  };
}
