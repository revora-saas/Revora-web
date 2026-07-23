import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { listerStock } from "@/app/(app)/stock/actions";
import { StockClient } from "@/components/stock/StockClient";

export const metadata = { title: "Stock" };

export default async function PageStock() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");
  const produits = await listerStock();
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <StockClient produits={produits} />
    </main>
  );
}
