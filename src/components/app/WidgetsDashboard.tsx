"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronUp, ChevronDown, Eye, EyeOff, SlidersHorizontal,
  Calendar, Euro, UserPlus, Package, Bell, Sparkles, ClipboardList,
  AlertTriangle, Gauge, Users, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { majOrdreWidgets } from "@/app/(app)/actions";
import type { DonneeWidget } from "@/lib/widgets";

const ICONES: Record<string, LucideIcon> = {
  rdv_jour: Calendar,
  recette_jour: Euro,
  taux_remplissage: Gauge,
  nouvelles_clientes: UserPlus,
  stock_faible: Package,
  relances_faire: Bell,
  remplissages_relancer: Bell,
  remplissages_avenir: Calendar,
  premieres_poses_sans_patch: AlertTriangle,
  retouches_planifier: Sparkles,
  consentements_manquants: ClipboardList,
  pigments_perimes: AlertTriangle,
  file_attente: Users,
  cures_en_cours: ClipboardList,
  notifications: Bell,
};

/** Jauge circulaire (taux de remplissage). */
function JaugeCirculaire({ pourcent }: { pourcent: number }) {
  const p = Math.max(0, Math.min(100, pourcent));
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-perle)" strokeWidth="7" />
      <circle
        cx="32" cy="32" r={r} fill="none"
        stroke="var(--color-primary)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * p) / 100}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" className="fill-ink font-heading text-[15px] font-bold">
        {p}%
      </text>
    </svg>
  );
}

const LABELS: Record<string, string> = {
  rdv_jour: "Rendez-vous du jour",
  recette_jour: "Recette du jour",
  taux_remplissage: "Taux de remplissage",
  nouvelles_clientes: "Nouvelles clientes",
  stock_faible: "Stock faible",
  relances_faire: "Relances à faire",
  remplissages_relancer: "Remplissages à relancer",
  remplissages_avenir: "Remplissages à venir",
  premieres_poses_sans_patch: "Premières poses sans patch test",
  retouches_planifier: "Retouches à planifier",
  consentements_manquants: "Consentements manquants",
  pigments_perimes: "Pigments périmés",
  file_attente: "File d'attente",
  cures_en_cours: "Cures en cours",
  occupation_cabines: "Occupation des cabines",
  temps_pose_exploitables: "Temps de pose exploitables",
  evenements_avenir: "Événements à venir",
  devis_attente: "Devis en attente",
  essais_programmer: "Essais à programmer",
  notifications: "Notifications",
};

export function WidgetsDashboard({
  ordreInitial,
  masquesInitial,
  donnees,
}: {
  ordreInitial: string[];
  masquesInitial: string[];
  donnees: Record<string, DonneeWidget>;
}) {
  const [ordre, setOrdre] = useState(ordreInitial);
  const [masques, setMasques] = useState<string[]>(masquesInitial);
  const [personnalise, setPersonnalise] = useState(false);

  async function persister(nouvelOrdre: string[], nouveauxMasques: string[]) {
    setOrdre(nouvelOrdre);
    setMasques(nouveauxMasques);
    await majOrdreWidgets(nouvelOrdre, nouveauxMasques);
  }

  function deplacer(i: number, sens: -1 | 1) {
    const cible = i + sens;
    if (cible < 0 || cible >= ordre.length) return;
    const suivant = [...ordre];
    [suivant[i], suivant[cible]] = [suivant[cible], suivant[i]];
    persister(suivant, masques);
  }
  function basculerMasque(cle: string) {
    const suivant = masques.includes(cle) ? masques.filter((x) => x !== cle) : [...masques, cle];
    persister(ordre, suivant);
  }

  const visibles = ordre.filter((cle) => !masques.includes(cle));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-ink">Aperçu</h2>
        <button
          onClick={() => setPersonnalise((v) => !v)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <SlidersHorizontal size={15} /> {personnalise ? "Terminer" : "Personnaliser"}
        </button>
      </div>

      {personnalise ? (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {ordre.map((cle, i) => (
            <li key={cle} className="flex items-center gap-2 px-3 py-2">
              <div className="flex flex-col">
                <button onClick={() => deplacer(i, -1)} disabled={i === 0} className="text-ink/30 hover:text-ink disabled:opacity-30">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => deplacer(i, 1)} disabled={i === ordre.length - 1} className="text-ink/30 hover:text-ink disabled:opacity-30">
                  <ChevronDown size={16} />
                </button>
              </div>
              <span className={cn("flex-1 text-sm", masques.includes(cle) ? "text-ink/40" : "text-ink")}>
                {LABELS[cle] ?? cle}
              </span>
              <button onClick={() => basculerMasque(cle)} className="text-ink/50 hover:text-ink">
                {masques.includes(cle) ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {visibles.map((cle) => (
            <WidgetCarte key={cle} cle={cle} donnee={donnees[cle]} />
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetCarte({ cle, donnee }: { cle: string; donnee?: DonneeWidget }) {
  const Icone = ICONES[cle] ?? Sparkles;
  const alerte = donnee?.alerte;
  const jauge = cle === "taux_remplissage" && donnee;
  const pourcent = jauge ? parseInt(donnee!.valeur, 10) || 0 : 0;

  const contenu = (
    <div
      className={cn(
        "flex h-full flex-col rounded-[18px] border bg-white p-4 shadow-[0_1px_2px_rgb(11_16_32_/_0.04)] transition-shadow hover:shadow-[0_1px_2px_rgb(11_16_32_/_0.05),0_16px_32px_-26px_rgb(11_16_32_/_0.3)]",
        alerte ? "border-terracotta/30" : "border-perle",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-ink/55">{LABELS[cle] ?? cle}</p>
        <span
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full",
            alerte ? "bg-terracotta/10 text-terracotta" : "bg-primary-50 text-primary",
          )}
        >
          <Icone size={16} />
        </span>
      </div>

      {jauge ? (
        <div className="mt-2 flex items-center gap-3">
          <JaugeCirculaire pourcent={pourcent} />
          {donnee?.detail && <span className="text-xs text-ink/50">{donnee.detail}</span>}
        </div>
      ) : donnee ? (
        <div className="mt-2">
          <p className="font-heading text-[26px] font-bold leading-none text-ink">{donnee.valeur}</p>
          {donnee.detail && <p className="mt-1.5 text-xs text-ink/50">{donnee.detail}</p>}
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/40">À venir</p>
      )}
    </div>
  );
  return donnee?.href ? (
    <Link href={donnee.href} className="block">
      {contenu}
    </Link>
  ) : (
    contenu
  );
}
