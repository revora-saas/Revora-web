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

      {/* Bandeau promotionnel */}
      <div className="border-b border-bordure bg-peche-clair">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-5 py-2.5 text-center text-sm">
          <span className="font-semibold text-prune">🎁 30 jours gratuits</span>
          <span className="text-taupe">· Sans carte bancaire</span>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-1 font-semibold text-violet transition-colors hover:text-violet-600"
          >
            Démarrer <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Grand carrousel de bannières */}
      <section className="px-3 pt-6 sm:px-6 sm:pt-10">
        <div className="mx-auto max-w-[1500px]">
          <CarrouselBannieres />
        </div>
      </section>

      {/* Offres */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        <OffresRevora voirToutes />
      </section>
    </>
  );
}
