import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ClipboardList,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Reveal } from "@/components/vitrine/Reveal";
import { ApercuProduit } from "@/components/vitrine/ApercuProduit";
import { ListeAttenteDemo } from "@/components/vitrine/ListeAttenteDemo";
import { MetiersTabs } from "@/components/vitrine/MetiersTabs";

export const metadata: Metadata = {
  title: "Revora — Votre activité beauté, enfin simple à gérer",
  description:
    "Agenda intelligent, dossiers clients, acomptes et suivi métier réunis dans un seul espace. Pensé pour les professionnelles de la beauté. Essai gratuit 30 jours.",
  openGraph: {
    title: "Revora — Votre activité beauté, enfin simple à gérer",
    description:
      "Agenda intelligent, dossiers clients, acomptes et suivi métier réunis dans un seul espace.",
    type: "website",
    locale: "fr_FR",
  },
};

const JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Revora",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android (PWA)",
  description:
    "Logiciel de gestion pour professionnels de la beauté en France : agenda, dossiers clients, acomptes, liste d'attente intelligente et suivi métier.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Essai gratuit 30 jours",
  },
  areaServed: "FR",
};

const FONCTIONS = [
  {
    icone: CalendarDays,
    titre: "Agenda intelligent",
    texte: "Gérez les horaires, prestations, pauses et disponibilités de chaque professionnelle.",
  },
  {
    icone: BellRing,
    titre: "Anti-désistement",
    texte: "Rappels, acompte, confirmations et liste d'attente pour limiter les créneaux perdus.",
  },
  {
    icone: ClipboardList,
    titre: "Dossier client",
    texte: "Historique, photos, notes, consentements et préférences réunis au même endroit.",
  },
  {
    icone: Wallet,
    titre: "Gestion quotidienne",
    texte: "Caisse, paiements, stocks et suivi de l'activité sans multiplier les outils.",
  },
];

const ETAPES = [
  { n: "1", titre: "Un rendez-vous est annulé", texte: "Le créneau se libère dans votre agenda." },
  { n: "2", titre: "Revora sélectionne", texte: "Les clientes compatibles selon prestation, disponibilité et délai de déplacement." },
  { n: "3", titre: "Le créneau est réattribué", texte: "Il est proposé, puis attribué après confirmation." },
];

export default function Accueil() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }}
      />

      {/* ---------- HERO ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-bordure bg-white px-3 py-1.5 text-xs font-medium text-violet">
              <Sparkles size={13} /> Pensé pour les professionnelles de la beauté
            </span>
            <h1 className="mt-5 font-serif text-4xl font-medium leading-[1.1] text-prune sm:text-5xl lg:text-[3.4rem]">
              Votre activité beauté, enfin simple à gérer.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-taupe">
              Agenda intelligent, dossiers clients, acomptes et suivi métier réunis dans un
              seul espace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet px-6 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
              >
                Démarrer gratuitement <ArrowRight size={18} />
              </Link>
              <Link
                href="#apercu"
                className="inline-flex h-12 items-center justify-center rounded-full border border-bordure bg-white px-6 font-semibold text-prune transition-colors hover:border-violet/40"
              >
                Découvrir l&apos;interface
              </Link>
            </div>
            <p className="mt-4 text-sm text-taupe">
              30 jours gratuits · Sans carte bancaire · Configuration rapide
            </p>
          </div>

          {/* Aperçu produit */}
          <div id="apercu" className="relative scroll-mt-24">
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-[36px] bg-lavande-clair/70 sm:-inset-6"
            />
            <Reveal delay={80}>
              <ApercuProduit />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- FONCTIONNALITÉS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-medium text-prune sm:text-4xl">
            Tout ce qu&apos;il faut, sans complexité.
          </h2>
          <p className="mt-3 text-taupe">
            Revora rassemble les outils essentiels de votre activité dans une interface claire.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {FONCTIONS.map((f, i) => (
            <Reveal key={f.titre} delay={i * 70} as="article">
              <div className="group h-full rounded-[22px] border border-bordure bg-white p-5 transition-transform duration-300 hover:-translate-y-1 sm:p-6">
                <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-lavande-clair text-violet transition-colors group-hover:bg-violet group-hover:text-white">
                  <f.icone size={20} />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold text-prune">
                  {f.titre}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-taupe">{f.texte}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- LISTE D'ATTENTE INTELLIGENTE ---------- */}
      <section className="border-y border-bordure bg-lavande-clair/40">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-violet">
                <Sparkles size={13} /> Liste d&apos;attente intelligente
              </span>
              <h2 className="mt-5 font-serif text-3xl font-medium leading-tight text-prune sm:text-4xl">
                Un créneau se libère. Revora cherche la bonne cliente.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-taupe">
                Lorsqu&apos;un rendez-vous est annulé, Revora identifie les clientes compatibles
                selon la prestation, leurs disponibilités et leur délai de déplacement.
              </p>
              <ol className="mt-8 flex flex-col gap-5">
                {ETAPES.map((e) => (
                  <li key={e.n} className="flex gap-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet text-sm font-bold text-white">
                      {e.n}
                    </span>
                    <div>
                      <p className="font-heading text-sm font-semibold text-prune">{e.titre}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-taupe">{e.texte}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            <Reveal delay={100}>
              <ListeAttenteDemo />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ---------- MÉTIERS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-medium text-prune sm:text-4xl">
            Un logiciel qui s&apos;adapte à votre métier.
          </h2>
          <p className="mt-3 text-taupe">
            Le même socle fiable, une configuration par activité. Choisissez la vôtre.
          </p>
        </Reveal>
        <div className="mt-12">
          <MetiersTabs />
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="rounded-[28px] bg-peche-clair px-6 py-14 text-center sm:px-10 sm:py-16">
            <h2 className="mx-auto max-w-lg font-serif text-3xl font-medium text-prune sm:text-4xl">
              Prête à simplifier votre quotidien ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-taupe">
              Configurez votre espace Revora en quelques minutes.
            </p>
            <Link
              href="/inscription"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet px-7 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
            >
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <p className="mt-4 text-sm text-taupe">30 jours gratuits · Sans carte bancaire</p>
          </div>
        </Reveal>
      </section>
    </>
  );
}
