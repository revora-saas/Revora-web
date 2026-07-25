import Link from "next/link";
import { redirect } from "next/navigation";
import { toZonedTime } from "date-fns-tz";
import { Plus } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { Badge } from "@/components/ui";
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
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Caisse</h1>
        <Link
          href="/caisse/nouveau"
          className="inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgb(109_76_255_/_0.7)] transition-colors hover:bg-primary-600"
        >
          <Plus size={17} /> Encaisser
        </Link>
      </div>

      {/* Recette du jour */}
      <div className="mb-4 rounded-[20px] border border-perle bg-white p-5 shadow-[0_1px_2px_rgb(11_16_32_/_0.04),0_16px_32px_-26px_rgb(11_16_32_/_0.3)]">
        <p className="text-sm font-medium text-ink/55">Recette du jour</p>
        <p className="mt-1 font-heading text-[34px] font-bold leading-none text-ink">
          {total.toFixed(2)} €
        </p>
        <p className="mt-1.5 text-sm text-ink/50">{encaissements.length} encaissement(s)</p>
      </div>

      {encaissements.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Aucun encaissement aujourd&apos;hui.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[18px] border border-perle bg-white">
          {encaissements.map((e) => {
            const st = STATUTS[e.statut] ?? STATUTS.paye;
            return (
              <li key={e.id} className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="font-medium text-ink">{e.numero}</p>
                  <p className="text-sm text-ink/50">{e.heure}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-heading font-semibold text-ink">{e.total.toFixed(2)} €</span>
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
