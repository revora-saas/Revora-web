import { notFound, redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { FicheCliente } from "@/components/clientes/FicheCliente";

export const metadata = { title: "Fiche cliente" };

export default async function PageFicheCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const { data: cliente } = await ctx.supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!cliente) notFound();

  // Historique des rendez-vous + libellés de prestations associés.
  const { data: rdv } = await ctx.supabase
    .from("rendez_vous")
    .select("id, debut_execution, statut, montant_total")
    .eq("client_id", id)
    .order("debut_execution", { ascending: false });

  const rdvIds = (rdv ?? []).map((r) => r.id);
  const { data: rdvPresta } = rdvIds.length
    ? await ctx.supabase
        .from("rdv_prestations")
        .select("rendez_vous_id, libelle")
        .in("rendez_vous_id", rdvIds)
    : { data: [] };

  const { data: fiches } = await ctx.supabase
    .from("fiches_techniques")
    .select("id, cree_le, donnees, zone, materiel, numero_seance, cloturee_le")
    .eq("client_id", id)
    .order("cree_le", { ascending: false });

  const { data: photos } = await ctx.supabase
    .from("photos")
    .select("id, url, type, prise_le")
    .eq("client_id", id)
    .order("prise_le", { ascending: false });

  // Regroupe les libellés de prestations par rendez-vous.
  const prestasParRdv = new Map<string, string[]>();
  for (const p of rdvPresta ?? []) {
    const l = prestasParRdv.get(p.rendez_vous_id) ?? [];
    l.push(p.libelle);
    prestasParRdv.set(p.rendez_vous_id, l);
  }
  const historique = (rdv ?? []).map((r) => ({
    ...r,
    prestations: prestasParRdv.get(r.id) ?? [],
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <FicheCliente
        cliente={cliente}
        historique={historique}
        fiches={fiches ?? []}
        photos={photos ?? []}
      />
    </main>
  );
}
