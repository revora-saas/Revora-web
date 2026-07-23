import Link from "next/link";
import type { Metadata } from "next";
import {
  BellRing, Calendar, Users, CreditCard, Package, ShieldCheck, Share2, LineChart, ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Fonctionnalités — agenda, anti no-show, caisse, PMU",
  description:
    "Tout Revora : agenda intelligent, système anti no-show complet, base clientes, caisse, stock, traçabilité PMU et réservation en ligne.",
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
        <h1 className="max-w-3xl font-heading text-4xl font-bold sm:text-5xl">
          Tout ce qu&apos;il faut pour gérer votre activité
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/70">
          Un noyau solide et fiable, adapté à votre métier. Sans surcharge, sans gadget.
        </p>
      </section>

      {/* Anti no-show mis en avant */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="rounded-[var(--radius-xl)] border border-lavande/30 bg-gradient-to-br from-primary/20 to-transparent p-8">
          <div className="flex items-center gap-2 text-lavande">
            <BellRing size={20} />
            <span className="text-sm font-semibold uppercase tracking-wide">Le cœur du produit</span>
          </div>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-bold">Le système anti no-show le plus complet</h2>
          <p className="mt-3 max-w-2xl text-white/70">
            Rappels bidirectionnels (la cliente confirme ou annule en répondant), acompte
            obligatoire sous un seuil de fiabilité, score de fiabilité par cliente, et une
            liste d&apos;attente qui remplit automatiquement les créneaux libérés. C&apos;est
            l&apos;argument qui fait signer.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.titre} className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
              <m.icone className="text-lavande" size={22} />
              <h3 className="mt-3 font-heading font-semibold">{m.titre}</h3>
              <p className="mt-1 text-sm text-white/60">{m.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <Link
          href="/inscription"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
        >
          Essayer gratuitement <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
