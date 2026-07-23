"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { majOrdreWidgets } from "@/app/(app)/actions";
import type { DonneeWidget } from "@/lib/widgets";

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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((cle) => (
            <WidgetCarte key={cle} cle={cle} donnee={donnees[cle]} />
          ))}
        </div>
      )}
    </div>
  );
}

function WidgetCarte({ cle, donnee }: { cle: string; donnee?: DonneeWidget }) {
  const contenu = (
    <Card className={cn("h-full", donnee?.alerte && "border-amber-300 bg-amber-50/50")}>
      <p className="text-sm text-ink/60">{LABELS[cle] ?? cle}</p>
      {donnee ? (
        <>
          <p className="font-heading text-2xl font-bold text-ink">{donnee.valeur}</p>
          {donnee.detail && <p className="text-xs text-ink/50">{donnee.detail}</p>}
        </>
      ) : (
        <p className="text-sm text-ink/40">À venir</p>
      )}
    </Card>
  );
  return donnee?.href ? <Link href={donnee.href}>{contenu}</Link> : contenu;
}
