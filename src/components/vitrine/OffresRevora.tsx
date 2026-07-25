import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export interface Offre {
  id: string;
  emoji: string;
  nom: string;
  prix: string; // ex. "24,90"
  tagline: string | null;
  heritage: string | null;
  populaire: boolean;
  features: string[];
}

export const OFFRES: Offre[] = [
  {
    id: "start",
    emoji: "",
    nom: "Revora Start",
    prix: "9,99",
    tagline: "Pour les indépendantes qui démarrent.",
    heritage: null,
    populaire: false,
    features: [
      "Agenda",
      "Prise de rendez-vous",
      "Fiche cliente",
      "Facturation",
      "Rappels automatiques limités (100/mois)",
      "Réservation en ligne",
    ],
  },
  {
    id: "pro",
    emoji: "⭐",
    nom: "Revora Pro",
    prix: "24,90",
    tagline: null,
    heritage: "Tout le Start, plus :",
    populaire: true,
    features: [
      "SMS illimités",
      "Anti no-show complet",
      "Acomptes",
      "Stock",
      "Statistiques",
      "Automatisations",
    ],
  },
  {
    id: "elite",
    emoji: "🚀",
    nom: "Revora Elite",
    prix: "49,99",
    tagline: null,
    heritage: "Tout le Pro, plus :",
    populaire: false,
    features: [
      "WhatsApp Business",
      "Assistant IA",
      "Gestion d'équipe",
      "PMU avancé",
      "Marketing",
      "Multi-salon",
    ],
  },
];

/** Cartes d'offres Revora. Carrousel horizontal sur mobile, grille sur desktop. */
export function OffresRevora({ voirToutes = false }: { voirToutes?: boolean }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-medium text-prune sm:text-3xl">Nos offres</h2>
          <p className="mt-1 text-sm text-taupe">Un tarif clair pour chaque étape de votre activité.</p>
        </div>
        {voirToutes && (
          <Link
            href="/tarifs"
            className="inline-flex items-center gap-1.5 rounded-full border border-bordure bg-white px-4 py-2 text-sm font-semibold text-prune transition-colors hover:border-violet/40"
          >
            Voir toutes nos offres <ArrowRight size={15} />
          </Link>
        )}
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {OFFRES.map((o) => (
          <CarteOffre key={o.id} offre={o} />
        ))}
      </div>
    </div>
  );
}

function CarteOffre({ offre }: { offre: Offre }) {
  const pop = offre.populaire;
  return (
    <article
      className={`flex min-w-[82%] shrink-0 snap-center flex-col rounded-[22px] bg-white p-6 md:min-w-0 ${
        pop
          ? "border-2 border-violet shadow-[0_10px_30px_-14px_rgb(118_86_201_/_0.5)]"
          : "border border-bordure"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-prune">
          {offre.emoji && <span className="mr-1">{offre.emoji}</span>}
          {offre.nom}
        </p>
        {pop && (
          <span className="rounded-full bg-violet px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Populaire
          </span>
        )}
      </div>
      {offre.tagline && <p className="mt-1 text-sm text-taupe">{offre.tagline}</p>}

      <p className="mt-4">
        <span className="font-serif text-[32px] font-medium leading-none text-prune">
          {offre.prix} €
        </span>
        <span className="text-sm text-taupe"> /mois</span>
      </p>

      {offre.heritage && (
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-violet">
          {offre.heritage}
        </p>
      )}

      <ul className="mt-3 flex flex-1 flex-col gap-2.5">
        {offre.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lavande-clair text-violet">
              <Check size={12} />
            </span>
            <span className="text-sm text-prune">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/inscription"
        className={`mt-6 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
          pop
            ? "bg-violet text-white hover:bg-violet-600"
            : "border border-bordure text-prune hover:border-violet/40"
        }`}
      >
        Commencer
      </Link>
    </article>
  );
}
