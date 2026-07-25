import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CarrouselBannieres } from "@/components/vitrine/CarrouselBannieres";
import { OffresRevora } from "@/components/vitrine/OffresRevora";

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

      {/* Titre pour le référencement / lecteurs d'écran (non affiché) */}
      <h1 className="sr-only">
        Revora — le logiciel des professionnelles de la beauté
      </h1>

      {/* Bandeau promotionnel — une seule ligne, cliquable */}
      <Link
        href="/inscription"
        className="block border-b border-perle bg-primary-50 transition-colors hover:bg-primary-100"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap px-3 py-2 text-[13px] font-medium sm:text-sm">
          <span aria-hidden>🎁</span>
          <span className="font-semibold text-ink">30 jours gratuits</span>
          <span className="text-ink/55">· sans carte bancaire</span>
          <ArrowRight size={14} className="shrink-0 text-primary" />
        </div>
      </Link>

      {/* Grand carrousel de bannières — pleine largeur */}
      <section className="w-full pt-3 sm:pt-4">
        <CarrouselBannieres />
      </section>

      {/* Offres */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <OffresRevora voirToutes />
      </section>
    </>
  );
}
