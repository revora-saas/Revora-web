import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";

export const metadata: Metadata = {
  title: "Métiers — un logiciel adapté à chaque activité beauté",
  description:
    "Ongles, cils, PMU, coiffure, barbier, esthétique, maquillage, spa : Revora se configure selon votre métier.",
};

export default function PageMetiers() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="font-heading text-4xl font-bold">Un logiciel adapté à votre métier</h1>
      <p className="mt-3 max-w-xl text-white/60">
        Le même noyau solide, une configuration par activité. Choisissez la vôtre.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {METIERS_VITRINE.map((m) => (
          <Link
            key={m.slug}
            href={`/metiers/${m.slug}`}
            className="group rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 transition-colors hover:border-lavande/50"
          >
            <h2 className="font-heading text-xl font-semibold">{m.nom}</h2>
            <p className="mt-1 text-sm text-white/60">{m.accroche}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm text-lavande">
              En savoir plus <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
