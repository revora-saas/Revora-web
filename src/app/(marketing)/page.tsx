import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/vitrine/Reveal";
import { ApercuProduit } from "@/components/vitrine/ApercuProduit";
import { ExplorerRevora } from "@/components/vitrine/ExplorerRevora";

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
              Un seul espace clair pour piloter tout votre quotidien de professionnelle.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/inscription"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-violet px-6 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
              >
                Démarrer gratuitement <ArrowRight size={18} />
              </Link>
              <Link
                href="#explorer"
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
          <div className="relative">
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

      {/* ---------- EXPLORER (colonne latérale à tiroirs) ---------- */}
      <section
        id="explorer"
        className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:py-20"
      >
        <Reveal className="max-w-2xl">
          <h2 className="font-serif text-3xl font-medium text-prune sm:text-4xl">
            Tout ce qu&apos;il faut, sans complexité.
          </h2>
          <p className="mt-3 text-taupe">
            Choisissez un tiroir pour découvrir ce que Revora fait, sans surcharge.
          </p>
        </Reveal>

        <div className="mt-10">
          <ExplorerRevora />
        </div>
      </section>
    </>
  );
}
