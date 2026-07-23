import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { rechercherClientes } from "@/app/(app)/clientes/actions";
import { ListeClientes } from "@/components/clientes/ListeClientes";

export const metadata = { title: "Clientes" };

export default async function PageClientes() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const [initiales, config] = await Promise.all([
    rechercherClientes("", 0),
    getConfigurationEtablissement(ctx.etablissementId),
  ]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <ListeClientes
        initiales={initiales}
        motClient={config.vocabulaire.client + "s"}
      />
    </main>
  );
}
