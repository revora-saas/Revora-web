import Link from "next/link";
import type { Metadata } from "next";
import { BellRing, CalendarCheck, ShieldCheck, ArrowRight, Star } from "lucide-react";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";

export const metadata: Metadata = {
  title: "Revora — Le logiciel adapté à tous les professionnels de la beauté",
  description:
    "Rendez-vous, clientes, caisse, stock et traçabilité. Un système anti no-show complet : rappels, acompte, score de fiabilité, liste d'attente. Essai gratuit 30 jours.",
  openGraph: {
    title: "Revora — Le logiciel adapté à tous les professionnels de la beauté",
    description:
      "Un système anti no-show complet et la profondeur métier que les généralistes n'ont pas.",
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
    "Logiciel de gestion pour professionnels de la beauté en France : agenda, clientes, caisse, stock, traçabilité PMU et anti no-show.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "Essai gratuit 30 jours" },
  areaServed: "FR",
};

export default function Accueil() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />

      {/* Héro */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-lavande">
          Le logiciel adapté à tous les professionnels de la beauté
        </p>
        <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-6xl">
          Vos rendez-vous, vos clientes, votre caisse —{" "}
          <span className="bg-gradient-to-r from-lavande to-primary bg-clip-text text-transparent">
            sans les lapins.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/70">
          Un système anti no-show complet — rappels, acompte, score de fiabilité, liste
          d&apos;attente auto-remplissante — et la profondeur métier que les généralistes
          n&apos;ont pas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/inscription"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
          >
            Essayer gratuitement <ArrowRight size={18} />
          </Link>
          <Link
            href="/fonctionnalites"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-white/20 px-6 py-3 font-medium text-white/90 hover:bg-white/5"
          >
            Découvrir les fonctionnalités
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/40">30 jours d&apos;essai · sans carte bancaire · résiliable à tout moment.</p>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Atout icone={<BellRing className="text-lavande" />} titre="Anti no-show" texte="Rappels bidirectionnels, acompte et score de fiabilité. Fini les créneaux perdus." />
          <Atout icone={<CalendarCheck className="text-lavande" />} titre="Adapté à votre métier" texte="Votre espace se configure selon votre activité : vocabulaire, modules, catalogue." />
          <Atout icone={<ShieldCheck className="text-lavande" />} titre="Conforme" texte="Traçabilité pigments, consentements signés, dossier prêt contrôle pour le PMU." />
        </div>
      </section>

      {/* Anti no-show en avant */}
      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-lavande">L&apos;argument qui fait signer</p>
          <h2 className="mt-2 max-w-2xl font-heading text-3xl font-bold">
            En finir avec les rendez-vous non honorés
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Etape n="1" titre="Rappels bidirectionnels" texte="La cliente confirme, annule ou décale en répondant OUI / NON." />
            <Etape n="2" titre="Acompte" texte="Exigé automatiquement au-delà d'un certain risque, garanti par Stripe." />
            <Etape n="3" titre="Score de fiabilité" texte="Chaque cliente a un score, visible de vous seule." />
            <Etape n="4" titre="Liste d'attente" texte="Un créneau libéré est reproposé automatiquement." />
          </div>
        </div>
      </section>

      {/* Métiers */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-heading text-3xl font-bold">Un logiciel, votre métier</h2>
        <p className="mt-2 max-w-xl text-white/60">
          Revora se configure selon votre activité. Choisissez la vôtre :
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METIERS_VITRINE.map((m) => (
            <Link
              key={m.slug}
              href={`/metiers/${m.slug}`}
              className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-4 transition-colors hover:border-lavande/50"
            >
              <p className="font-heading font-semibold">{m.nom}</p>
              <p className="mt-1 text-sm text-white/50">{m.accroche}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Témoignages */}
      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid gap-4 sm:grid-cols-3">
            <Temoignage texte="Je ne cours plus après les confirmations. Les rappels font le travail." auteur="Léa, prothésiste ongulaire" />
            <Temoignage texte="Le dossier prêt contrôle justifie l'abonnement à lui seul." auteur="Nadia, dermographe" />
            <Temoignage texte="L'historique des formules couleur, enfin. Un gain de temps énorme." auteur="Camille, coiffeuse" />
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-heading text-3xl font-bold sm:text-4xl">Prête à remplir votre agenda ?</h2>
        <p className="mx-auto mt-3 max-w-lg text-white/60">
          Essai gratuit de 30 jours. Configurez votre espace en moins de 10 minutes.
        </p>
        <Link
          href="/inscription"
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
        >
          Commencer maintenant <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}

function Atout({ icone, titre, texte }: { icone: React.ReactNode; titre: string; texte: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
      <div className="mb-3">{icone}</div>
      <h3 className="font-heading font-semibold">{titre}</h3>
      <p className="mt-1 text-sm text-white/60">{texte}</p>
    </div>
  );
}

function Etape({ n, titre, texte }: { n: string; titre: string; texte: string }) {
  return (
    <div>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold">{n}</div>
      <h3 className="mt-3 font-heading font-semibold">{titre}</h3>
      <p className="mt-1 text-sm text-white/60">{texte}</p>
    </div>
  );
}

function Temoignage({ texte, auteur }: { texte: string; auteur: string }) {
  return (
    <figure className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
      <div className="mb-2 flex gap-0.5 text-lavande">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={14} fill="currentColor" />
        ))}
      </div>
      <blockquote className="text-sm text-white/80">« {texte} »</blockquote>
      <figcaption className="mt-3 text-xs text-white/40">{auteur}</figcaption>
    </figure>
  );
}
