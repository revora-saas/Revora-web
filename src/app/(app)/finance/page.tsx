import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Euro, UserPlus, Wallet, type LucideIcon } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { getFinance } from "@/app/(app)/finance/actions";
import { FinanceActions } from "@/components/finance/FinanceClient";

export const metadata = { title: "Statistiques" };

function Delta({ actuel, precedent }: { actuel: number; precedent: number }) {
  if (precedent === 0) return null;
  const pct = Math.round(((actuel - precedent) / precedent) * 100);
  const positif = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        positif ? "bg-sauge/12 text-sauge" : "bg-terracotta/10 text-terracotta"
      }`}
    >
      {positif ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {positif ? "+" : ""}
      {pct}%
    </span>
  );
}

/** Petit graphique en aire (CA des 7 derniers jours, données réelles). */
function MiniChart({ valeurs }: { valeurs: number[] }) {
  const w = 300;
  const h = 84;
  const pad = 6;
  const max = Math.max(1, ...valeurs);
  const n = valeurs.length;
  const pts = valeurs.map((v, i) => {
    const x = n > 1 ? pad + (i * (w - 2 * pad)) / (n - 1) : w / 2;
    const y = h - pad - (v / max) * (h - 2 * pad);
    return [x, y] as const;
  });
  const ligne = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const aire = `${pad},${h - pad} ${ligne} ${w - pad},${h - pad}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="ca-aire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={aire} fill="url(#ca-aire)" />
      <polyline
        points={ligne}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="var(--color-primary)" />
      ))}
    </svg>
  );
}

function StatMini({
  titre,
  valeur,
  icone: Icone,
  delta,
}: {
  titre: string;
  valeur: string;
  icone: LucideIcon;
  delta?: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-perle bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink/55">{titre}</p>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-50 text-primary">
          <Icone size={15} />
        </span>
      </div>
      <p className="mt-2 font-heading text-xl font-bold text-ink">{valeur}</p>
      {delta && <div className="mt-1.5">{delta}</div>}
    </div>
  );
}

export default async function PageFinance() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");
  const f = await getFinance();

  const benefice = f.caMois - f.depensesMois;
  const totalTop = f.topPrestations.reduce((s, p) => s + p.nb, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink">Statistiques</h1>
        <FinanceActions />
      </div>

      {/* Chiffre d'affaires + graphique 7 jours */}
      <div className="rounded-[20px] border border-perle bg-white p-5 shadow-[0_1px_2px_rgb(11_16_32_/_0.04),0_16px_32px_-26px_rgb(11_16_32_/_0.3)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-ink/55">Chiffre d&apos;affaires · 7 jours</p>
            <p className="mt-1 font-heading text-[34px] font-bold leading-none text-ink">
              {f.caSemaine.toFixed(0)} €
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Delta actuel={f.caSemaine} precedent={f.caSemainePrec} />
              <span className="text-xs text-ink/45">vs semaine précédente</span>
            </div>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-50 text-primary">
            <Euro size={18} />
          </span>
        </div>
        {f.serie7j.length > 0 && (
          <div className="mt-4">
            <MiniChart valeurs={f.serie7j.map((s) => s.valeur)} />
            <div className="mt-1 flex justify-between px-1 text-[10px] font-medium text-ink/40">
              {f.serie7j.map((s, i) => (
                <span key={i}>{s.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cartes de statistiques */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatMini
          titre="Aujourd'hui"
          valeur={`${f.caJour.toFixed(0)} €`}
          icone={Euro}
          delta={<Delta actuel={f.caJour} precedent={f.caJourPrec} />}
        />
        <StatMini
          titre="Ce mois"
          valeur={`${f.caMois.toFixed(0)} €`}
          icone={Euro}
          delta={<Delta actuel={f.caMois} precedent={f.caMoisPrec} />}
        />
        <StatMini titre="Nouvelles clientes" valeur={String(f.nouvellesClientes)} icone={UserPlus} />
        <StatMini titre="Bénéfice (mois)" valeur={`${benefice.toFixed(0)} €`} icone={Wallet} />
      </div>

      {/* Prestations les plus demandées */}
      {f.topPrestations.length > 0 && (
        <div className="mt-4 rounded-[18px] border border-perle bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-ink">
            Prestations les plus demandées (mois)
          </p>
          <ul className="flex flex-col gap-3">
            {f.topPrestations.map((p) => {
              const pct = totalTop > 0 ? Math.round((p.nb / totalTop) * 100) : 0;
              return (
                <li key={p.libelle}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-ink">{p.libelle}</span>
                    <span className="font-semibold text-ink/70">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-primary-50">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
