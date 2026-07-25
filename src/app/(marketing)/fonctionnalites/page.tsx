import Link from "next/link";
import type { Metadata } from "next";
import {
  BellRing, Calendar, Users, CreditCard, Package, ShieldCheck, Share2, LineChart, ArrowRight,
} from "lucide-react";
import { Reveal } from "@/components/vitrine/Reveal";

export const metadata: Metadata = {
  title: "Fonctionnalités — agenda, anti-désistement, caisse, PMU",
  description:
    "Tout Revora : agenda intelligent, système anti-désistement complet, base clientes, caisse, stock, traçabilité PMU et réservation en ligne.",
};

const MODULES = [
  { icone: Calendar, titre: "Agenda intelligent", texte: "Vues jour et semaine, création en 30 secondes, temps de pose réutilisables, jamais de double-booking (garanti par la base)." },
  { icone: Users, titre: "Base clientes", texte: "Recherche instantanée, fiches complètes, allergies en évidence, import CSV, export et anonymisation RGPD." },
  { icone: Share2, titre: "Réservation en ligne", texte: "Page publique à votre nom, créneaux en temps réel, verrou anti-collision, QR code partageable." },
  { icone: CreditCard, titre: "Caisse et acomptes", texte: "Encaissement fractionné, acompte déduit, reçu numéroté sans trou, remboursements tracés." },
  { icone: Package, titre: "Stock et lots", texte: "Consommables, pigments, revente, alertes de seuil et de péremption." },
  { icone: ShieldCheck, titre: "Conformité PMU", texte: "Traçabilité pigments, consentements signés, dossier prêt contrôle, retouches planifiées." },
  { icone: LineChart, titre: "Pilotage", texte: "Chiffre d'affaires, dépenses, statistiques et export comptable." },
];

export default function PageFonctionnalites() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-16">
        <h1 className="max-w-3xl font-serif text-4xl font-medium text-prune sm:text-5xl">
          Tout ce qu&apos;il faut pour gérer votre activité
        </h1>
        <p className="mt-4 max-w-xl text-lg text-taupe">
          Un socle solide et fiable, adapté à votre métier. Sans surcharge, sans gadget.
        </p>
      </section>

      {/* Anti-désistement mis en avant */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <Reveal>
          <div className="rounded-[26px] border border-bordure bg-lavande-clair/60 p-8">
            <div className="flex items-center gap-2 text-violet">
              <BellRing size={20} />
              <span className="text-sm font-semibold uppercase tracking-wide">Le cœur du produit</span>
            </div>
            <h2 className="mt-3 max-w-2xl font-serif text-2xl font-medium text-prune sm:text-3xl">
              Le système anti-désistement le plus complet
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-taupe">
              Rappels bidirectionnels (la cliente confirme ou annule en répondant), acompte
              sous un seuil de fiabilité, score de fiabilité par cliente, et une liste
              d&apos;attente qui remplit automatiquement les créneaux libérés.
            </p>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {MODULES.map((m, i) => (
            <Reveal key={m.titre} delay={i * 50} as="article">
              <div className="h-full rounded-[22px] border border-bordure bg-white p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6">
                <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-lavande-clair text-violet">
                  <m.icone size={20} />
                </span>
                <h3 className="mt-4 font-heading font-semibold text-prune">{m.titre}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-taupe">{m.texte}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <Link
          href="/inscription"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-violet px-6 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
        >
          Essayer gratuitement <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
