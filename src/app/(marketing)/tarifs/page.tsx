import type { Metadata } from "next";
import { OffresRevora } from "@/components/vitrine/OffresRevora";

export const metadata: Metadata = {
  title: "Tarifs — Revora Start, Pro et Elite",
  description:
    "Trois offres claires : Revora Start (9,99 €), Pro (24,90 €) et Elite (49,99 €). Essai gratuit 30 jours, sans carte bancaire.",
};

const FAQ = [
  { q: "L'essai est-il vraiment gratuit ?", r: "Oui, 30 jours sans carte bancaire. Vous ne payez qu'à la fin si vous continuez." },
  { q: "Puis-je changer d'offre à tout moment ?", r: "Oui. Vous pouvez passer d'une offre à l'autre quand vous voulez, sans perdre vos données." },
  { q: "Puis-je récupérer mes données ?", r: "À tout moment. Vos fichiers clientes vous appartiennent : export libre et complet, même après résiliation." },
  { q: "Que se passe-t-il si je dépasse mon quota de SMS ?", r: "Vous êtes alertée et les rappels basculent en e-mail. Vous pouvez acheter des crédits supplémentaires." },
  { q: "Puis-je résilier à tout moment ?", r: "Oui, sans engagement." },
];

export default function PageTarifs() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-6 pt-16 text-center">
        <h1 className="font-serif text-4xl font-medium text-prune sm:text-5xl">Nos offres</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-taupe">
          Un tarif clair pour chaque étape de votre activité. Essai gratuit de 30 jours,
          sans carte bancaire.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6">
        <OffresRevora />
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="font-serif text-2xl font-medium text-prune sm:text-3xl">Questions fréquentes</h2>
        <div className="mt-6 flex flex-col gap-3">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-[20px] border border-bordure bg-white p-5">
              <h3 className="font-heading font-semibold text-prune">{f.q}</h3>
              <p className="mt-1 text-sm leading-relaxed text-taupe">{f.r}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
