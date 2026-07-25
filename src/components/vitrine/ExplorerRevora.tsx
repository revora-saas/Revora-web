"use client";

import { useRef, useState } from "react";
import {
  BellRing,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ListeAttenteDemo } from "./ListeAttenteDemo";
import { MetiersTabs } from "./MetiersTabs";

type SectionId = "agenda" | "anti" | "dossier" | "gestion" | "metier";

const SECTIONS: {
  id: SectionId;
  icone: typeof CalendarDays;
  label: string;
  titre: string;
  texte: string;
  points: string[];
}[] = [
  {
    id: "agenda",
    icone: CalendarDays,
    label: "Agenda intelligent",
    titre: "Un agenda qui pense à votre place",
    texte:
      "Horaires, prestations, pauses et disponibilités de chaque professionnelle, avec les temps de pose réutilisables et zéro double-booking.",
    points: ["Vues jour et semaine", "Création en 30 secondes", "Jamais de double réservation"],
  },
  {
    id: "anti",
    icone: BellRing,
    label: "Anti-désistement",
    titre: "Un créneau se libère. Revora cherche la bonne cliente.",
    texte:
      "Rappels, acompte, confirmations et liste d'attente : lorsqu'un rendez-vous est annulé, Revora identifie les clientes compatibles et réattribue le créneau.",
    points: ["Rappels et confirmations", "Acompte au bon moment", "Liste d'attente automatique"],
  },
  {
    id: "dossier",
    icone: ClipboardList,
    label: "Dossier client",
    titre: "Tout le suivi cliente au même endroit",
    texte:
      "Historique, photos, notes, consentements et préférences réunis sur une fiche claire — les alertes santé toujours en évidence.",
    points: ["Historique et préférences", "Photos et consentements", "Alertes santé visibles"],
  },
  {
    id: "gestion",
    icone: Wallet,
    label: "Caisse & gestion",
    titre: "La gestion quotidienne, sans multiplier les outils",
    texte:
      "Caisse, paiements, acomptes déduits, stock et suivi de l'activité — tout est relié, sans ressaisie.",
    points: ["Encaissement et acomptes", "Stock et péremptions", "Chiffre d'affaires suivi"],
  },
  {
    id: "metier",
    icone: Sparkles,
    label: "Votre métier",
    titre: "Un logiciel qui s'adapte à votre métier",
    texte:
      "Le même socle fiable, une configuration par activité : vocabulaire, modules et suivi propres à votre métier.",
    points: [],
  },
];

/**
 * Explorateur à colonne latérale (façon application) : une liste de « tiroirs »
 * à gauche, le contenu de la section choisie à droite. Sur mobile, la colonne
 * devient un accordéon (le contenu s'ouvre sous chaque tiroir).
 */
export function ExplorerRevora() {
  const [actif, setActif] = useState<SectionId>("agenda");
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function auClavier(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const total = SECTIONS.length;
    const j = e.key === "ArrowDown" ? (i + 1) % total : (i - 1 + total) % total;
    setActif(SECTIONS[j].id);
    refs.current[j]?.focus();
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[300px_1fr] lg:gap-6">
      {/* Colonne latérale de tiroirs */}
      <div className="flex flex-col gap-2">
        {SECTIONS.map((s, i) => {
          const ouvert = actif === s.id;
          return (
            <div key={s.id}>
              <button
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                aria-expanded={ouvert}
                aria-controls={`panneau-${s.id}`}
                onClick={() => setActif(s.id)}
                onKeyDown={(e) => auClavier(e, i)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-[16px] border px-4 text-left transition-all ${
                  ouvert
                    ? "border-violet/30 bg-white shadow-[0_2px_8px_rgb(60_45_74_/_0.05),0_18px_36px_-24px_rgb(118_86_201_/_0.5)]"
                    : "border-bordure bg-white/60 hover:border-violet/30 hover:bg-white"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] transition-colors ${
                    ouvert ? "bg-violet text-white" : "bg-lavande-clair text-violet"
                  }`}
                >
                  <s.icone size={18} />
                </span>
                <span className="flex-1 font-heading text-sm font-semibold text-prune">
                  {s.label}
                </span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-taupe transition-transform lg:hidden ${
                    ouvert ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Contenu accordéon sur mobile */}
              {ouvert && (
                <div id={`panneau-${s.id}`} className="v-pop mt-2 lg:hidden">
                  <Panneau section={s} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panneau de contenu sur ordinateur */}
      <div className="hidden lg:block">
        {SECTIONS.filter((s) => s.id === actif).map((s) => (
          <div key={s.id} id={`panneau-${s.id}`} role="region" className="v-pop">
            <Panneau section={s} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Panneau({ section }: { section: (typeof SECTIONS)[number] }) {
  return (
    <div className="rounded-[24px] border border-bordure bg-white p-5 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_24px_50px_-30px_rgb(60_45_74_/_0.18)] sm:p-7">
      {section.id === "metier" ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet">Votre métier</p>
          <h3 className="mt-2 font-serif text-2xl font-medium text-prune">{section.titre}</h3>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-taupe">{section.texte}</p>
          <div className="mt-6">
            <MetiersTabs />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
          <div>
            <h3 className="font-serif text-2xl font-medium leading-tight text-prune">
              {section.titre}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-taupe">{section.texte}</p>
            <ul className="mt-5 flex flex-col gap-2.5">
              {section.points.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lavande-clair text-violet">
                    <Check size={12} />
                  </span>
                  <span className="text-sm font-medium text-prune">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <VisuelSection id={section.id} />
        </div>
      )}
    </div>
  );
}

function VisuelSection({ id }: { id: SectionId }) {
  if (id === "agenda") return <SemaineMock />;
  if (id === "anti") return <ListeAttenteDemo />;
  if (id === "dossier") return <FicheMock />;
  return <CaisseMock />;
}

/** Mini-aperçu « vue semaine » (illustration d'interface, distinct du hero). */
function SemaineMock() {
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  const blocs: { c: string; h: string }[][] = [
    [{ c: "bg-violet/80", h: "h-8" }, { c: "bg-lavande-clair", h: "h-5" }],
    [{ c: "bg-peche/70", h: "h-6" }],
    [{ c: "bg-violet/80", h: "h-11" }],
    [{ c: "bg-lavande-clair", h: "h-5" }, { c: "bg-violet/80", h: "h-8" }],
    [{ c: "bg-violet/80", h: "h-6" }],
    [{ c: "bg-peche/70", h: "h-12" }],
    [],
  ];
  return (
    <div className="rounded-[22px] border border-bordure bg-white p-4 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_24px_50px_-32px_rgb(60_45_74_/_0.2)]">
      <div className="flex items-center justify-between">
        <p className="font-heading text-sm font-semibold text-prune">Votre semaine</p>
        <span className="text-[11px] text-taupe">Vue d&apos;ensemble</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {jours.map((j, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-taupe">{j}</span>
            <div className="flex min-h-[68px] w-full flex-col gap-1 rounded-[9px] bg-ivoire p-1">
              {blocs[i].map((b, k) => (
                <span key={k} className={`w-full rounded-[5px] ${b.c} ${b.h}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini-aperçu « fiche cliente » (illustration d'interface). */
function FicheMock() {
  return (
    <div className="rounded-[22px] border border-bordure bg-white p-4 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_24px_50px_-32px_rgb(60_45_74_/_0.2)]">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-lavande-clair font-heading text-sm font-semibold text-violet">
          CR
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-prune">Camille R.</p>
          <p className="truncate text-[11px] text-taupe">Fiche complète</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[12px] bg-terracotta/10 px-3 py-2 text-[12px] font-medium text-terracotta">
        <BellRing size={13} /> Allergie signalée : résine
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Profil", "Historique", "Photos", "Notes"].map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              i === 0 ? "bg-violet text-white" : "bg-lavande-clair text-taupe"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {["Dernière visite · pose gel", "Préférence · couleur nude", "Consentement image · signé"].map(
          (l) => (
            <li
              key={l}
              className="flex items-center gap-2 rounded-[12px] border border-bordure px-3 py-2 text-[12px] text-prune"
            >
              <Check size={12} className="shrink-0 text-sauge" /> {l}
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

/** Mini-aperçu « encaissement » (illustration d'interface). */
function CaisseMock() {
  return (
    <div className="rounded-[22px] border border-bordure bg-white p-4 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_24px_50px_-32px_rgb(60_45_74_/_0.2)]">
      <p className="font-heading text-sm font-semibold text-prune">Encaissement</p>
      <ul className="mt-3 flex flex-col gap-2">
        {[
          { l: "Pose gel", p: "45 €" },
          { l: "Dépose", p: "10 €" },
        ].map((r) => (
          <li
            key={r.l}
            className="flex items-center justify-between rounded-[12px] border border-bordure px-3 py-2.5 text-[13px]"
          >
            <span className="text-prune">{r.l}</span>
            <span className="font-semibold text-prune">{r.p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between rounded-[12px] bg-lavande-clair px-3 py-2.5">
        <span className="text-[13px] font-medium text-prune">Total</span>
        <span className="font-heading text-base font-bold text-violet">55 €</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Carte", "Espèces", "Lien", "Acompte déduit"].map((t, i) => (
          <span
            key={t}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              i === 0 ? "bg-violet text-white" : "border border-bordure text-taupe"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <span className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-violet px-3 py-2 text-xs font-semibold text-white">
        Encaisser
      </span>
    </div>
  );
}
