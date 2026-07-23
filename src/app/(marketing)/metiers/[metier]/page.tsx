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
        <Link href="/metiers" className="text-sm text-white/50 hover:text-white">
          ← Tous les métiers
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-lavande">{m.nom}</p>
        <h1 className="mt-2 max-w-3xl font-heading text-4xl font-bold leading-tight sm:text-5xl">
          {m.accroche}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-white/70">{m.intro}</p>
        <Link
          href="/inscription"
          className="mt-8 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
        >
          Essayer gratuitement <ArrowRight size={18} />
        </Link>
      </section>

      <section className="border-t border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-heading text-2xl font-bold">Ce que Revora fait pour vous</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {m.fonctions.map((f) => (
              <div key={f.titre} className="flex gap-3 rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Check size={14} />
                </span>
                <div>
                  <h3 className="font-heading font-semibold">{f.titre}</h3>
                  <p className="mt-1 text-sm text-white/60">{f.texte}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold">Prête à essayer Revora ?</h2>
        <p className="mx-auto mt-2 max-w-md text-white/60">30 jours gratuits, configuration en 10 minutes.</p>
        <Link
          href="/inscription"
          className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600"
        >
          Commencer <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
