import { redirect } from "next/navigation";
import { TrendingUp, TrendingDown } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { Card } from "@/components/ui";
import { getFinance } from "@/app/(app)/finance/actions";
import { FinanceActions } from "@/components/finance/FinanceClient";

export const metadata = { title: "Finance" };

function Evolution({ actuel, precedent }: { actuel: number; precedent: number }) {
  if (precedent === 0) return null;
  const pct = Math.round(((actuel - precedent) / precedent) * 100);
  const positif = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${positif ? "text-green-600" : "text-red-600"}`}>
      {positif ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positif ? "+" : ""}
      {pct}%
    </span>
  );
}

function CarteCa({ titre, actuel, precedent }: { titre: string; actuel: number; precedent: number }) {
  return (
    <Card>
      <p className="text-sm text-ink/60">{titre}</p>
      <p className="font-heading text-2xl font-bold text-ink">{actuel.toFixed(0)} €</p>
      <Evolution actuel={actuel} precedent={precedent} />
    </Card>
  );
}

export default async function PageFinance() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");
  const f = await getFinance();

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Finance</h1>
        <FinanceActions />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CarteCa titre="Aujourd'hui" actuel={f.caJour} precedent={f.caJourPrec} />
        <CarteCa titre="7 jours" actuel={f.caSemaine} precedent={f.caSemainePrec} />
        <CarteCa titre="Ce mois" actuel={f.caMois} precedent={f.caMoisPrec} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-ink/60">Bénéfice estimé (mois)</p>
          <p className="font-heading text-xl font-bold text-ink">
            {(f.caMois - f.depensesMois).toFixed(0)} €
          </p>
          <p className="text-xs text-ink/50">
            CA {f.caMois.toFixed(0)} € − dépenses {f.depensesMois.toFixed(0)} €
          </p>
        </Card>
        <Card>
          <p className="text-sm text-ink/60">Nouvelles clientes (mois)</p>
          <p className="font-heading text-xl font-bold text-ink">{f.nouvellesClientes}</p>
        </Card>
      </div>

      {f.topPrestations.length > 0 && (
        <Card className="mt-4">
          <p className="mb-2 text-sm font-medium text-ink">Prestations les plus demandées (mois)</p>
          <ul className="flex flex-col gap-1">
            {f.topPrestations.map((p) => (
              <li key={p.libelle} className="flex justify-between text-sm">
                <span className="text-ink">{p.libelle}</span>
                <span className="text-ink/50">{p.nb}×</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
