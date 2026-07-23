import Link from "next/link";
import { CalendarCheck, BellRing, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Page d'accueil du site vitrine (groupe de routes "marketing").
 * Placeholder d'initialisation : la vitrine complète est construite au prompt 13.
 */
export default function AccueilMarketing() {
  return (
    <main className="min-h-dvh bg-ink text-white">
      {/* En-tête */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-heading text-xl font-bold tracking-tight">
          Revora
        </span>
        <Link
          href="/connexion"
          className="text-sm font-medium text-white/80 hover:text-white"
        >
          Connexion
        </Link>
      </header>

      {/* Section héro */}
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:pt-20">
        <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-lavande">
          Le logiciel adapté à tous les professionnels de la beauté
        </p>
        <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
          Vos rendez-vous, vos clientes, votre caisse —{" "}
          <span className="bg-gradient-to-r from-lavande to-primary bg-clip-text text-transparent">
            sans les lapins.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/70">
          Rendez-vous, fiches clientes, encaissement, stock et traçabilité
          technique. Avec un système anti no-show complet : rappels, acompte,
          score de fiabilité et liste d&apos;attente qui se remplit toute seule.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/inscription">
            <Button taille="lg" pleineLargeur>
              Essayer gratuitement
            </Button>
          </Link>
          <Link href="/fonctionnalites">
            <Button taille="lg" variante="secondaire" pleineLargeur>
              Découvrir les fonctionnalités
            </Button>
          </Link>
        </div>

        {/* Trois différenciateurs */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          <Atout
            icone={<BellRing className="text-lavande" />}
            titre="Anti no-show"
            texte="Rappels bidirectionnels, acompte et score de fiabilité."
          />
          <Atout
            icone={<CalendarCheck className="text-lavande" />}
            titre="Adapté à votre métier"
            texte="Ongles, cils, PMU, coiffure… l'espace se configure tout seul."
          />
          <Atout
            icone={<ShieldCheck className="text-lavande" />}
            titre="Conforme"
            texte="Traçabilité pigments, consentements, dossier prêt contrôle."
          />
        </div>
      </section>
    </main>
  );
}

function Atout({
  icone,
  titre,
  texte,
}: {
  icone: React.ReactNode;
  titre: string;
  texte: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
      <div className="mb-3">{icone}</div>
      <h3 className="font-heading font-semibold">{titre}</h3>
      <p className="mt-1 text-sm text-white/60">{texte}</p>
    </div>
  );
}
