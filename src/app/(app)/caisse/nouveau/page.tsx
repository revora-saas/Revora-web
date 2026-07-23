import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import {
  chargerRdvPourEncaissement,
  listerProduitsRevente,
  type LigneEncaissement,
} from "@/app/(app)/caisse/actions";
import { Encaissement } from "@/components/caisse/Encaissement";

export const metadata = { title: "Encaissement" };

export default async function PageNouvelEncaissement({
  searchParams,
}: {
  searchParams: Promise<{ rdv?: string; client?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  let clientId: string | null = sp.client ?? null;
  let clientNom = "Client au comptoir";
  let lignes: LigneEncaissement[] = [];
  let acompteDeduit = 0;

  if (sp.rdv) {
    const data = await chargerRdvPourEncaissement(sp.rdv);
    if (data) {
      clientId = data.clientId;
      clientNom = data.clientNom;
      lignes = data.lignes;
      acompteDeduit = data.acomptePaye;
    }
  } else if (sp.client) {
    const { data: c } = await ctx.supabase
      .from("clients")
      .select("nom, prenom")
      .eq("id", sp.client)
      .maybeSingle();
    if (c) clientNom = c.prenom ? `${c.prenom} ${c.nom}` : c.nom;
  }

  const produits = await listerProduitsRevente();

  return (
    <main className="mx-auto max-w-lg px-5 py-6">
      <Encaissement
        clientId={clientId}
        clientNom={clientNom}
        rdvId={sp.rdv ?? null}
        lignesInitiales={lignes}
        acompteDeduit={acompteDeduit}
        produits={produits}
      />
    </main>
  );
}
