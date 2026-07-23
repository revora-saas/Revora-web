import { redirect } from "next/navigation";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import {
  construireOuvertures,
  soustraire,
  estFerie,
  type HoraireRecurrent,
  type Intervalle,
} from "@/lib/agenda";
import { AgendaClient } from "@/components/agenda/AgendaClient";

export const metadata = { title: "Agenda" };
const FUSEAU = "Europe/Paris";

function isoJour(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function PageAgenda({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; vue?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const config = await getConfigurationEtablissement(ctx.etablissementId);
  const vue = sp.vue === "semaine" ? "semaine" : "jour";

  // Date courante (par défaut : aujourd'hui en heure de Paris).
  const maintenantParis = toZonedTime(new Date(), FUSEAU);
  const dateStr =
    sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : isoJour(maintenantParis);

  // Bornes de la fenêtre à charger (jour ou semaine, lundi→dimanche).
  const [an, mo, jo] = dateStr.split("-").map(Number);
  const jourSemaine = new Date(Date.UTC(an, mo - 1, jo)).getUTCDay(); // 0=dim
  const decalLundi = (jourSemaine + 6) % 7; // jours depuis lundi
  const debutFenetreStr = vue === "semaine" ? decalerJour(dateStr, -decalLundi) : dateStr;
  const finFenetreStr = vue === "semaine" ? decalerJour(debutFenetreStr, 7) : decalerJour(dateStr, 1);

  const debutUtc = fromZonedTime(`${debutFenetreStr}T00:00:00`, FUSEAU);
  const finUtc = fromZonedTime(`${finFenetreStr}T00:00:00`, FUSEAU);

  // Horaires de l'établissement.
  const { data: horairesData } = await ctx.supabase
    .from("horaires")
    .select("jour_semaine, heure_debut, heure_fin")
    .eq("etablissement_id", ctx.etablissementId)
    .is("membre_id", null);
  const horaires: HoraireRecurrent[] = (horairesData ?? []).map((h) => ({
    jourSemaine: h.jour_semaine,
    debut: h.heure_debut.slice(0, 5),
    fin: h.heure_fin.slice(0, 5),
  }));

  // Rendez-vous chevauchant la fenêtre (hors annulés).
  const { data: rdvData } = await ctx.supabase
    .from("rendez_vous")
    .select(
      "id, client_id, statut, debut_execution, fin_execution, debut_bloque, fin_bloque",
    )
    .eq("etablissement_id", ctx.etablissementId)
    .neq("statut", "annule")
    .lt("debut_bloque", finUtc.toISOString())
    .gt("fin_bloque", debutUtc.toISOString())
    .order("debut_execution");
  const rdvs = rdvData ?? [];
  const rdvIds = rdvs.map((r) => r.id);
  const clientIds = [...new Set(rdvs.map((r) => r.client_id).filter(Boolean))] as string[];

  // Occupations (praticienne) → pour dessiner les temps de pose.
  const { data: occData } = rdvIds.length
    ? await ctx.supabase
        .from("occupations")
        .select("rendez_vous_id, periode")
        .in("rendez_vous_id", rdvIds)
        .not("membre_id", "is", null)
    : { data: [] };

  // Prestations figées de chaque RDV.
  const { data: rpData } = rdvIds.length
    ? await ctx.supabase
        .from("rdv_prestations")
        .select("rendez_vous_id, libelle")
        .in("rendez_vous_id", rdvIds)
    : { data: [] };

  // Noms des clientes.
  const { data: clientsData } = clientIds.length
    ? await ctx.supabase
        .from("clients")
        .select("id, nom, prenom, telephone_mobile, score_fiabilite")
        .in("id", clientIds)
    : { data: [] };
  const clientsMap = new Map((clientsData ?? []).map((c) => [c.id, c]));

  // Blocages (indisponibilités hors fériés générés à la volée).
  const { data: indispoData } = await ctx.supabase
    .from("indisponibilites")
    .select("id, motif, type, periode")
    .eq("etablissement_id", ctx.etablissementId)
    .neq("type", "ferie");

  // Occupations groupées par RDV pour calculer les poses.
  const occParRdv = new Map<string, Intervalle[]>();
  for (const o of occData ?? []) {
    if (!o.rendez_vous_id) continue;
    const [d, f] = bornesTstzrange(o.periode);
    if (!d || !f) continue;
    const l = occParRdv.get(o.rendez_vous_id) ?? [];
    l.push({ debut: d, fin: f });
    occParRdv.set(o.rendez_vous_id, l);
  }
  const prestasParRdv = new Map<string, string[]>();
  for (const p of rpData ?? []) {
    const l = prestasParRdv.get(p.rendez_vous_id) ?? [];
    l.push(p.libelle);
    prestasParRdv.set(p.rendez_vous_id, l);
  }

  // Ouvertures sur la fenêtre (pour repérer les RDV hors plage — R15.2).
  const ouvertures = construireOuvertures(
    FUSEAU,
    { debut: debutUtc, fin: finUtc },
    horaires,
  );

  const rdvVues = rdvs.map((r) => {
    const exec: Intervalle = {
      debut: new Date(r.debut_execution),
      fin: new Date(r.fin_execution),
    };
    const occ = occParRdv.get(r.id) ?? [];
    // Temps de pose = exécution − occupations praticienne.
    const poses = soustraire([exec], occ).filter(
      (p) => p.debut > exec.debut || p.fin < exec.fin,
    );
    const c = r.client_id ? clientsMap.get(r.client_id) : null;
    const horsPlage = !ouvertures.some(
      (o) =>
        o.debut <= new Date(r.debut_bloque) && o.fin >= new Date(r.fin_bloque),
    );
    return {
      id: r.id,
      clientId: r.client_id,
      clientNom: c ? (c.prenom ? `${c.prenom} ${c.nom}` : c.nom) : "Sans cliente",
      clientTel: c?.telephone_mobile ?? null,
      clientFiabilite: c?.score_fiabilite ?? null,
      prestations: prestasParRdv.get(r.id) ?? [],
      statut: r.statut,
      debutExecution: r.debut_execution,
      finExecution: r.fin_execution,
      debutBloque: r.debut_bloque,
      finBloque: r.fin_bloque,
      poses: poses.map((p) => ({ debut: p.debut.toISOString(), fin: p.fin.toISOString() })),
      horsPlage,
    };
  });

  const blocs = (indispoData ?? [])
    .map((b) => {
      const [d, f] = bornesTstzrange(b.periode);
      return d && f && f > debutUtc && d < finUtc
        ? { id: b.id, motif: b.motif, type: b.type, debut: d.toISOString(), fin: f.toISOString() }
        : null;
    })
    .filter(Boolean);

  // Ouvertures par jour (ISO) pour le rendu.
  const ouverturesVue = ouvertures.map((o) => ({
    debut: o.debut.toISOString(),
    fin: o.fin.toISOString(),
  }));

  return (
    <AgendaClient
      dateStr={dateStr}
      vue={vue}
      motPrestation={config.vocabulaire.prestation}
      ferie={estFerie(dateStr)}
      ouvertures={ouverturesVue}
      rdvs={rdvVues}
      blocs={blocs as { id: string; motif: string | null; type: string; debut: string; fin: string }[]}
      fuseau={FUSEAU}
    />
  );
}

// --- Utilitaires ---

function decalerJour(dateStr: string, delta: number): string {
  const [a, m, j] = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + delta));
  return d.toISOString().slice(0, 10);
}

/** Parse un tstzrange PostgreSQL "[début,fin)" en deux Dates. */
function bornesTstzrange(brut: string | null): [Date | null, Date | null] {
  if (!brut) return [null, null];
  const m = brut.match(/^[[(]"?([^",]+)"?,"?([^",)]+)"?[)\]]$/);
  if (!m) return [null, null];
  return [new Date(m[1]), new Date(m[2])];
}
