"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";

/**
 * Sélecteur de métier compact : des pastilles au lieu d'une longue succession
 * de grandes cartes. Le métier choisi affiche une seule carte détaillée
 * (fonctions adaptées + aperçu d'interface). Transition douce, navigation clavier.
 */
export function MetiersTabs() {
  const [actif, setActif] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const m = METIERS_VITRINE[actif];

  function auClavier(e: React.KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const total = METIERS_VITRINE.length;
    const suivant = e.key === "ArrowRight" ? (index + 1) % total : (index - 1 + total) % total;
    setActif(suivant);
    refs.current[suivant]?.focus();
  }

  return (
    <div>
      {/* Pastilles métiers */}
      <div
        role="tablist"
        aria-label="Choisir un métier"
        className="flex flex-wrap justify-center gap-2"
      >
        {METIERS_VITRINE.map((metier, i) => {
          const selectionne = i === actif;
          return (
            <button
              key={metier.slug}
              ref={(el) => {
                refs.current[i] = el;
              }}
              role="tab"
              type="button"
              aria-selected={selectionne}
              tabIndex={selectionne ? 0 : -1}
              onClick={() => setActif(i)}
              onKeyDown={(e) => auClavier(e, i)}
              className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-all ${
                selectionne
                  ? "border-violet bg-violet text-white shadow-[0_6px_18px_-8px_rgb(118_86_201_/_0.7)]"
                  : "border-bordure bg-white text-taupe hover:border-violet/40 hover:text-prune"
              }`}
            >
              {metier.nom}
            </button>
          );
        })}
      </div>

      {/* Carte détaillée du métier sélectionné */}
      <div
        key={m.slug}
        role="tabpanel"
        className="v-pop mt-8 grid gap-6 rounded-[26px] border border-bordure bg-white p-6 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_24px_50px_-30px_rgb(60_45_74_/_0.18)] sm:p-8 lg:grid-cols-2 lg:items-center"
      >
        {/* Colonne texte */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet">Métier</p>
          <h3 className="mt-2 font-serif text-2xl font-medium text-prune sm:text-3xl">{m.nom}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-taupe">{m.intro}</p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {m.fonctions.map((f) => (
              <li key={f.titre} className="flex items-start gap-2">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lavande-clair text-violet">
                  <Check size={12} />
                </span>
                <span className="text-sm font-medium text-prune">{f.titre}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/metiers/${m.slug}`}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-violet transition-colors hover:text-violet-600"
          >
            Voir la page {m.nom.toLowerCase()}
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Aperçu d'interface spécifique au métier */}
        <div className="rounded-[20px] border border-bordure bg-ivoire p-4">
          <div className="flex items-center justify-between">
            <p className="font-heading text-sm font-semibold text-prune">Espace {m.nom}</p>
            <span className="rounded-full bg-lavande-clair px-2.5 py-0.5 text-[11px] font-medium text-violet">
              Configuré
            </span>
          </div>
          <p className="mt-1 text-[11px] text-taupe">Modules activés pour votre activité</p>
          <ul className="mt-3 flex flex-col gap-2">
            {m.fonctions.map((f, i) => (
              <li
                key={f.titre}
                className="flex items-center gap-2.5 rounded-[14px] border border-bordure bg-white px-3 py-2.5"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    i === 0 ? "bg-peche/20 text-peche" : "bg-lavande-clair text-violet"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="truncate text-[13px] font-medium text-prune">{f.titre}</span>
                <span className="ml-auto h-4 w-7 shrink-0 rounded-full bg-sauge/25 p-0.5">
                  <span className="block h-3 w-3 translate-x-3 rounded-full bg-sauge" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
