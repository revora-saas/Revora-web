import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";
import { Reveal } from "@/components/vitrine/Reveal";

export const metadata: Metadata = {
  title: "Métiers — un logiciel adapté à chaque activité beauté",
  description:
    "Ongles, cils, PMU, coiffure, barbier, esthétique, maquillage, spa : Revora se configure selon votre métier.",
};

export default function PageMetiers() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-serif text-4xl font-medium text-prune sm:text-5xl">Un logiciel adapté à votre métier</h1>
      <p className="mt-3 max-w-xl text-taupe">
        Le même socle solide, une configuration par activité. Choisissez la vôtre.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {METIERS_VITRINE.map((m, i) => (
          <Reveal key={m.slug} delay={i * 40} as="article">
            <Link
              href={`/metiers/${m.slug}`}
              className="group block h-full rounded-[22px] border border-bordure bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <h2 className="font-heading text-xl font-semibold text-prune">{m.nom}</h2>
              <p className="mt-1 text-sm text-taupe">{m.accroche}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet">
                En savoir plus <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
