import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { ImportClientes } from "@/components/clientes/ImportClientes";

export const metadata = { title: "Importer des clientes" };

export default async function PageImport() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");
  const config = await getConfigurationEtablissement(ctx.etablissementId);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <ImportClientes motClient={config.vocabulaire.client + "s"} />
    </main>
  );
}
