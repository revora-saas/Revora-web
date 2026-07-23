import Link from "next/link";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { Plus } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { Button, Card, Badge } from "@/components/ui";
import { listerEncaissementsJour } from "@/app/(app)/caisse/actions";

export const metadata = { title: "Caisse" };

const STATUTS: Record<string, { label: string; ton: "succes" | "alerte" | "danger" | "neutre" }> = {
  paye: { label: "Payé", ton: "succes" },
  partiel: { label: "Partiel", ton: "alerte" },
  rembourse: { label: "Remboursé", ton: "danger" },
  annule: { label: "Annulé", ton: "neutre" },
};

export default async function PageCaisse() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const aujourdhui = toZonedTime(new Date(), "Europe/Paris").toISOString().slice(0, 10);
  const encaissements = await listerEncaissementsJour(aujourdhui);
  const total = encaissements
    .filter((e) => e.statut !== "annule")
    .reduce((s, e) => s + e.total, 0);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Caisse</h1>
        <Link href="/caisse/nouveau">
          <Button taille="sm">
            <Plus size={16} /> Encaisser
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <p className="text-sm text-ink/60">Recette du jour</p>
        <p className="font-heading text-3xl font-bold text-ink">{total.toFixed(2)} €</p>
        <p className="text-sm text-ink/50">{encaissements.length} encaissement(s)</p>
      </Card>

      {encaissements.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Aucun encaissement aujourd&apos;hui.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {encaissements.map((e) => {
            const st = STATUTS[e.statut] ?? STATUTS.paye;
            return (
              <li key={e.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-ink">{e.numero}</p>
                  <p className="text-sm text-ink/50">{e.heure}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{e.total.toFixed(2)} €</span>
                  <Badge ton={st.ton}>{st.label}</Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
