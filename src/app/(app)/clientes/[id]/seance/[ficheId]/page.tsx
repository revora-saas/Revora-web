import { notFound, redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { getPigmentsEtLots, getPhotosSignees } from "@/app/(app)/clientes/seance-actions";
import { EditeurSeance } from "@/components/seance/EditeurSeance";

export const metadata = { title: "Séance" };

export default async function PageSeance({
  params,
}: {
  params: Promise<{ id: string; ficheId: string }>;
}) {
  const { id, ficheId } = await params;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const [{ data: fiche }, { data: client }, config, pigments] = await Promise.all([
    ctx.supabase
      .from("fiches_techniques")
      .select("id, donnees, lot_id, materiel, zone, numero_seance, cloturee_le")
      .eq("id", ficheId)
      .eq("etablissement_id", ctx.etablissementId)
      .maybeSingle(),
    ctx.supabase
      .from("clients")
      .select("nom, prenom")
      .eq("id", id)
      .eq("etablissement_id", ctx.etablissementId)
      .maybeSingle(),
    getConfigurationEtablissement(ctx.etablissementId),
    getPigmentsEtLots(),
  ]);
  if (!fiche || !client) notFound();

  // Statut des consentements.
  const { data: consents } = await ctx.supabase
    .from("consentements")
    .select("type, accorde, date_consentement")
    .eq("client_id", id)
    .eq("etablissement_id", ctx.etablissementId)
    .order("date_consentement", { ascending: false });
  const dernier = (t: string) => (consents ?? []).find((c) => c.type === t);
  const consentements = {
    soin: Boolean(dernier("soin_pmu")?.accorde),
    image: Boolean(dernier("image")?.accorde),
  };

  const photos = await getPhotosSignees(ficheId);

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <EditeurSeance
        clientId={id}
        clientNom={client.prenom ? `${client.prenom} ${client.nom}` : client.nom}
        fiche={{
          id: fiche.id,
          donnees: (fiche.donnees ?? {}) as Record<string, unknown>,
          lotId: fiche.lot_id,
          materiel: fiche.materiel,
          zone: fiche.zone,
          numeroSeance: fiche.numero_seance,
          clotureeLe: fiche.cloturee_le,
        }}
        schema={config.ficheTechnique}
        estPmu={Boolean(config.modules.tracabilite_pigments)}
        pigments={pigments}
        consentements={consentements}
        photos={photos}
      />
    </main>
  );
}
