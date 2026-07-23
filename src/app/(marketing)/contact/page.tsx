import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { FormulaireContact } from "@/components/vitrine/FormulaireContact";

export const metadata: Metadata = {
  title: "Contact et demande de démo",
  description: "Une question ? Une démonstration ? Écrivez-nous, nous répondons sous 24 h.",
};

export default function PageContact() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="font-heading text-4xl font-bold">Parlons de votre activité</h1>
      <p className="mt-3 text-white/60">
        Une question, un besoin particulier, envie d&apos;une démo ? Nous sommes là.
      </p>
      <div className="mt-8">
        <FormulaireContact />
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-white/40">
        <Mail size={15} /> contact@revora.fr
      </p>
    </section>
  );
}
