import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DOCS_LEGAUX, getDocLegal } from "@/lib/vitrine-legal";

export function generateStaticParams() {
  return DOCS_LEGAUX.map((d) => ({ doc: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const d = getDocLegal(doc);
  return { title: d?.titre ?? "Mentions légales", robots: { index: true, follow: true } };
}

export default async function PageLegale({
  params,
}: {
  params: Promise<{ doc: string }>;
}) {
  const { doc } = await params;
  const d = getDocLegal(doc);
  if (!d) notFound();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-serif text-3xl font-medium text-prune sm:text-4xl">{d.titre}</h1>
      <div className="mt-8 flex flex-col gap-6">
        {d.sections.map((s) => (
          <div key={s.titre}>
            <h2 className="font-heading text-lg font-semibold text-prune">{s.titre}</h2>
            <p className="mt-1 text-sm leading-relaxed text-taupe">{s.texte}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xs text-taupe/70">
        Modèle fourni à titre indicatif, à faire valider par un conseil juridique avant
        exploitation.
      </p>
    </section>
  );
}
