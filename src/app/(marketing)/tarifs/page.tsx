import Link from "next/link";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Tarifs — offre Indépendante, essai gratuit 30 jours",
  description:
    "Une offre unique et transparente. Essai gratuit 30 jours, mensuel ou annuel (2 mois offerts), quota de messages inclus.",
};

const INCLUS = [
  "Agenda et réservation en ligne illimités",
  "Système anti no-show complet",
  "Base clientes, import et export",
  "Caisse, acomptes et suivi financier",
  "Stock, lots et péremption",
  "Conformité PMU (traçabilité, consentements, dossier)",
  "Quota de messages SMS inclus",
  "Mises à jour et support",
];

const FAQ = [
  { q: "L'essai est-il vraiment gratuit ?", r: "Oui, 30 jours sans carte bancaire. Vous ne payez qu'à la fin si vous continuez." },
  { q: "Puis-je récupérer mes données ?", r: "À tout moment. Vos fichiers clientes vous appartiennent : export libre et complet, même après résiliation." },
  { q: "Que se passe-t-il si je dépasse mon quota de SMS ?", r: "Vous êtes alertée et les rappels basculent en e-mail. Vous pouvez acheter des crédits supplémentaires." },
  { q: "Puis-je résilier à tout moment ?", r: "Oui, sans engagement. La formule annuelle est simplement plus avantageuse." },
];

export default function PageTarifs() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16 text-center">
        <h1 className="font-heading text-4xl font-bold sm:text-5xl">Un tarif simple et transparent</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
          Une offre unique, tout compris. Essai gratuit de 30 jours.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <div className="rounded-[var(--radius-xl)] border border-lavande/30 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-lavande">Indépendante</p>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="font-heading text-4xl font-bold">Mensuel</p>
              <p className="text-sm text-white/50">sans engagement</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <p className="font-heading text-4xl font-bold">Annuel</p>
              <p className="text-sm text-lavande">2 mois offerts</p>
            </div>
          </div>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {INCLUS.map((i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                <Check size={16} className="mt-0.5 shrink-0 text-lavande" /> {i}
              </li>
            ))}
          </ul>
          <Link
            href="/inscription"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
          >
            Commencer l&apos;essai gratuit <ArrowRight size={18} />
          </Link>
          <p className="mt-3 text-center text-xs text-white/40">30 jours · sans carte bancaire</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="font-heading text-2xl font-bold">Questions fréquentes</h2>
        <div className="mt-6 flex flex-col gap-4">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
              <h3 className="font-heading font-semibold">{f.q}</h3>
              <p className="mt-1 text-sm text-white/60">{f.r}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
