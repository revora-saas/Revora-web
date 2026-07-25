import Link from "next/link";
import { EnteteVitrine } from "@/components/vitrine/EnteteVitrine";
import { LogoRevora } from "@/components/vitrine/LogoRevora";

/** Layout du site vitrine : identité beauté-tech premium, lumineuse (fond ivoire). */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ivoire text-prune">
      <EnteteVitrine />
      <main className="flex-1">{children}</main>
      <PiedDePage />
    </div>
  );
}

function PiedDePage() {
  const liens = [
    { href: "/fonctionnalites", label: "Fonctionnalités" },
    { href: "/tarifs", label: "Tarifs" },
    { href: "/connexion", label: "Connexion" },
    { href: "/legal/mentions-legales", label: "Mentions légales" },
    { href: "/legal/confidentialite", label: "Confidentialité" },
    { href: "/legal/cgu", label: "CGU" },
    { href: "/legal/cgv", label: "CGV" },
  ];

  return (
    <footer className="border-t border-bordure">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xs">
          <LogoRevora />
          <p className="mt-3 text-sm text-taupe">
            Le logiciel des professionnelles de la beauté, enfin simple à gérer.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {liens.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-taupe transition-colors hover:text-prune"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-bordure py-5 text-center text-xs text-taupe/80">
        © Revora — France.
      </div>
    </footer>
  );
}
