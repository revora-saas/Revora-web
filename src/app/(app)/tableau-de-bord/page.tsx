import { headers } from "next/headers";
import { getEtatProfil } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { creerClientServeur } from "@/lib/supabase/server";
import { chargerWidgets } from "@/lib/widgets";
import { ChecklistDemarrage } from "@/components/app/ChecklistDemarrage";
import { PartagerLien } from "@/components/app/PartagerLien";
import { WidgetsDashboard } from "@/components/app/WidgetsDashboard";
import { ProchainRdv } from "@/components/app/ProchainRdv";

export const metadata = { title: "Tableau de bord" };

export default async function TableauDeBord() {
  const etat = await getEtatProfil();
  const etabId = etat.etablissementId!;
  const config = await getConfigurationEtablissement(etabId);

  const supabase = await creerClientServeur();
  const [{ data: etablissement }, { count: nbClients }, { data: reglages }, { data: echecs }] =
    await Promise.all([
      supabase.from("etablissements").select("nom, slug, fuseau").eq("id", etabId).maybeSingle(),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", etabId)
        .is("archive_le", null),
      supabase.from("reglages").select("autres").eq("etablissement_id", etabId).maybeSingle(),
      supabase
        .from("messages")
        .select("id, destinataire, erreur, cree_le")
        .eq("etablissement_id", etabId)
        .eq("statut", "echec")
        .order("cree_le", { ascending: false })
        .limit(5),
    ]);

  const fuseau = etablissement?.fuseau ?? "Europe/Paris";

  // Lien public de réservation (absolu, pour le partage).
  const h = await headers();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const lienReservation = `${base}/${etablissement?.slug ?? ""}`;

  const autres = (reglages?.autres as Record<string, unknown>) ?? {};

  // Checklist de démarrage.
  const stockee = (autres.checklist as Record<string, boolean> | undefined) ?? {};
  const checklist = {
    catalogue: Boolean(stockee.catalogue),
    clientes: Boolean(stockee.clientes) || (nbClients ?? 0) > 0,
    lien: Boolean(stockee.lien),
  };

  // Ordre des widgets : préférence de la pro, sinon ordre du profil métier (M5).
  const stockWidgets = autres.widgets as { ordre?: string[]; masques?: string[] } | undefined;
  const baseOrdre = config.widgets.length > 0 ? config.widgets : ["rdv_jour", "recette_jour"];
  const ordre = stockWidgets?.ordre?.length
    ? [...stockWidgets.ordre, ...baseOrdre.filter((c) => !stockWidgets.ordre!.includes(c))]
    : baseOrdre;
  const masques = stockWidgets?.masques ?? [];

  const donnees = await chargerWidgets(supabase, etabId, fuseau);

  const motClient = config.vocabulaire.client + "s";
  const prenom = (etat.nomAffiche ?? "").split(" ")[0];

  // Prochain rendez-vous (carte d'accueil).
  const { data: prochain } = await supabase
    .from("rendez_vous")
    .select("id, debut_execution, statut, client_id")
    .eq("etablissement_id", etabId)
    .neq("statut", "annule")
    .gte("debut_execution", new Date().toISOString())
    .order("debut_execution", { ascending: true })
    .limit(1)
    .maybeSingle();

  let prochainRdv: {
    heure: string;
    jourLabel?: string;
    nom: string;
    prestation?: string;
    statut: string;
    href: string;
  } | null = null;

  if (prochain) {
    let nomCli = "Cliente";
    if (prochain.client_id) {
      const { data: cli } = await supabase
        .from("clients")
        .select("prenom, nom")
        .eq("id", prochain.client_id)
        .maybeSingle();
      if (cli) nomCli = [cli.prenom, cli.nom].filter(Boolean).join(" ") || "Cliente";
    }
    const { data: presta } = await supabase
      .from("rdv_prestations")
      .select("libelle")
      .eq("rendez_vous_id", prochain.id)
      .order("ordre")
      .limit(1)
      .maybeSingle();

    const dt = new Date(prochain.debut_execution);
    const fmtJour = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", { timeZone: fuseau }).format(d);
    const jourLabel =
      fmtJour(dt) === fmtJour(new Date())
        ? "Aujourd'hui"
        : new Intl.DateTimeFormat("fr-FR", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: fuseau,
          }).format(dt);

    prochainRdv = {
      heure: new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: fuseau,
      }).format(dt),
      jourLabel,
      nom: nomCli,
      prestation: presta?.libelle,
      statut: prochain.statut,
      href: "/agenda",
    };
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 sm:px-5 sm:py-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          Bonjour {prenom || (etablissement?.nom ?? "")} 👋
        </h1>
        <p className="mt-1 text-sm text-ink/55">Voici un résumé de votre activité.</p>
      </div>

      {prochainRdv && <ProchainRdv {...prochainRdv} />}

      {echecs && echecs.length > 0 && (
        <div className="rounded-[18px] border border-terracotta/30 bg-terracotta/5 p-4">
          <p className="font-heading font-semibold text-terracotta">
            {echecs.length} message{echecs.length > 1 ? "s" : ""} n&apos;{echecs.length > 1 ? "ont" : "a"} pas pu être envoyé
          </p>
          <ul className="mt-1 text-sm text-ink/70">
            {echecs.map((e) => (
              <li key={e.id}>
                {e.destinataire} — {e.erreur ?? "échec"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <WidgetsDashboard ordreInitial={ordre} masquesInitial={masques} donnees={donnees} />

      <ChecklistDemarrage etatInitial={checklist} lienReservation={lienReservation} motClient={motClient} />

      <PartagerLien lien={lienReservation} />
    </main>
  );
}
