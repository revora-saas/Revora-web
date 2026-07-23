import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { getConfigurationEtablissement } from "@/lib/metier";
import { CatalogueClient } from "@/components/catalogue/CatalogueClient";

export const metadata = { title: "Catalogue" };

export default async function PageCatalogue() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const [{ data: categories }, { data: prestations }, config] = await Promise.all([
    ctx.supabase
      .from("categories")
      .select("id, nom")
      .eq("etablissement_id", ctx.etablissementId)
      .order("ordre"),
    ctx.supabase
      .from("prestations")
      .select("id, nom, prix, duree_execution, categorie_id, actif, pmu")
      .eq("etablissement_id", ctx.etablissementId)
      .order("ordre"),
    getConfigurationEtablissement(ctx.etablissementId),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <CatalogueClient
        categories={categories ?? []}
        prestations={(prestations ?? []).map((p) => ({ ...p, prix: Number(p.prix) }))}
        motPrestation={config.vocabulaire.prestation}
      />
    </main>
  );
}
