import { headers } from "next/headers";
import { getEtatProfil } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { creerClientServeur } from "@/lib/supabase/server";
import { chargerWidgets } from "@/lib/widgets";
import { ChecklistDemarrage } from "@/components/app/ChecklistDemarrage";
import { PartagerLien } from "@/components/app/PartagerLien";
import { WidgetsDashboard } from "@/components/app/WidgetsDashboard";

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

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">
          {etablissement?.nom ?? "Tableau de bord"}
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Bonjour {etat.nomAffiche ?? ""}, voici votre activité.
        </p>
      </div>

      {echecs && echecs.length > 0 && (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-4">
          <p className="font-heading font-semibold text-red-800">
            {echecs.length} message{echecs.length > 1 ? "s" : ""} n&apos;{echecs.length > 1 ? "ont" : "a"} pas pu être envoyé
          </p>
          <ul className="mt-1 text-sm text-red-700">
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
