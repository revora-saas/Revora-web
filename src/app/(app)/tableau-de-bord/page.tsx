import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui";
import { getEtatProfil } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { creerClientServeur } from "@/lib/supabase/server";
import { ChecklistDemarrage } from "@/components/app/ChecklistDemarrage";
import { PartagerLien } from "@/components/app/PartagerLien";

export const metadata = { title: "Tableau de bord" };

// Libellés des widgets d'accueil (bibliothèque commune, ordre pondéré par le métier — M5).
const LABELS_WIDGETS: Record<string, string> = {
  rdv_jour: "Rendez-vous du jour",
  recette_jour: "Recette du jour",
  taux_remplissage: "Taux de remplissage",
  nouvelles_clientes: "Nouvelles clientes",
  stock_faible: "Stock faible",
  relances_faire: "Relances à faire",
  remplissages_relancer: "Remplissages à relancer",
  remplissages_avenir: "Remplissages à venir",
  premieres_poses_sans_patch: "Premières poses sans patch test",
  retouches_planifier: "Retouches à planifier",
  consentements_manquants: "Consentements manquants",
  pigments_perimes: "Pigments périmés",
  file_attente: "File d'attente",
  cures_en_cours: "Cures en cours",
  occupation_cabines: "Occupation des cabines",
  temps_pose_exploitables: "Temps de pose exploitables",
  evenements_avenir: "Événements à venir",
  devis_attente: "Devis en attente",
  essais_programmer: "Essais à programmer",
};

export default async function TableauDeBord() {
  const etat = await getEtatProfil();
  const etabId = etat.etablissementId!;
  const config = await getConfigurationEtablissement(etabId);

  const supabase = await creerClientServeur();
  const [{ data: etablissement }, { count: nbClients }, { data: reglages }] =
    await Promise.all([
      supabase.from("etablissements").select("nom, slug").eq("id", etabId).maybeSingle(),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("etablissement_id", etabId)
        .is("archive_le", null),
      supabase.from("reglages").select("autres").eq("etablissement_id", etabId).maybeSingle(),
    ]);

  // Lien public de réservation (absolu, pour le partage).
  const h = await headers();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const lienReservation = `${base}/${etablissement?.slug ?? ""}`;

  // État de la checklist : « clientes » se coche automatiquement dès qu'il y en a.
  const stockee =
    ((reglages?.autres as Record<string, unknown>)?.checklist as
      | Record<string, boolean>
      | undefined) ?? {};
  const checklist = {
    catalogue: Boolean(stockee.catalogue),
    clientes: Boolean(stockee.clientes) || (nbClients ?? 0) > 0,
    lien: Boolean(stockee.lien),
  };

  const motClient = config.vocabulaire.client + "s"; // clientes / clients

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

      <ChecklistDemarrage
        etatInitial={checklist}
        lienReservation={lienReservation}
        motClient={motClient}
      />

      <PartagerLien lien={lienReservation} />

      {/* Widgets d'accueil, dans l'ordre défini par le profil métier (M5.1). */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.widgets.map((cle) => (
          <Card key={cle}>
            <CardHeader>
              <CardTitle>{LABELS_WIDGETS[cle] ?? cle}</CardTitle>
              <CardDescription>Bientôt disponible</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
