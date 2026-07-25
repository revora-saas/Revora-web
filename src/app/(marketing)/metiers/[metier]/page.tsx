import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, ArrowRight } from "lucide-react";
import { METIERS_VITRINE, getMetierVitrine } from "@/lib/vitrine-metiers";

export function generateStaticParams() {
  return METIERS_VITRINE.map((m) => ({ metier: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ metier: string }>;
}): Promise<Metadata> {
  const { metier } = await params;
  const m = getMetierVitrine(metier);
  if (!m) return { title: "Métier" };
  return {
    title: `${m.nom} — le logiciel ${m.nom.toLowerCase()} | Revora`,
    description: m.intro,
    openGraph: { title: `Revora pour ${m.nom}`, description: m.intro, type: "website", locale: "fr_FR" },
  };
}

export default async function PageMetier({
  params,
}: {
  params: Promise<{ metier: string }>;
}) {
  const { metier } = await params;
  const m = getMetierVitrine(metier);
  if (!m) notFound();

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-12 pt-16">
        <Link href="/metiers" className="text-sm text-taupe transition-colors hover:text-prune">
          ← Tous les métiers
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-violet">{m.nom}</p>
        <h1 className="mt-2 max-w-3xl font-serif text-4xl font-medium leading-[1.1] text-prune sm:text-5xl">
          {m.accroche}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-taupe">{m.intro}</p>
        <Link
          href="/inscription"
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-violet px-6 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
        >
          Essayer gratuitement <ArrowRight size={18} />
        </Link>
      </section>

      <section className="border-y border-bordure bg-lavande-clair/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-2xl font-medium text-prune sm:text-3xl">Ce que Revora fait pour vous</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {m.fonctions.map((f) => (
              <div key={f.titre} className="flex gap-3 rounded-[20px] border border-bordure bg-white p-5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet text-white">
                  <Check size={14} />
                </span>
                <div>
                  <h3 className="font-heading font-semibold text-prune">{f.titre}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-taupe">{f.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="font-serif text-2xl font-medium text-prune sm:text-3xl">Prête à essayer Revora ?</h2>
        <p className="mx-auto mt-2 max-w-md text-taupe">30 jours gratuits, configuration en quelques minutes.</p>
        <Link
          href="/inscription"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-violet px-6 font-semibold text-white shadow-[0_10px_24px_-8px_rgb(118_86_201_/_0.65)] transition-colors hover:bg-violet-600"
        >
          Commencer <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
