import Link from "next/link";
import { METIERS_VITRINE } from "@/lib/vitrine-metiers";

/** Layout du site vitrine : identité sombre premium, contrastant avec l'app claire. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white">
      <EnTete />
      <div className="flex-1">{children}</div>
      <PiedDePage />
    </div>
  );
}

function EnTete() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight">
          Revora
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          <Link href="/fonctionnalites" className="hover:text-white">Fonctionnalités</Link>
          <Link href="/metiers" className="hover:text-white">Métiers</Link>
          <Link href="/tarifs" className="hover:text-white">Tarifs</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/connexion" className="hidden text-white/70 hover:text-white sm:inline">
            Connexion
          </Link>
          <Link
            href="/inscription"
            className="rounded-[var(--radius-md)] bg-primary px-4 py-2 font-medium text-white hover:bg-primary-600"
          >
            Essai gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}

function PiedDePage() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-lg font-bold">Revora</p>
          <p className="mt-2 text-sm text-white/50">
            Le logiciel adapté à tous les professionnels de la beauté.
          </p>
        </div>
        <ColonneFooter titre="Produit" liens={[
          { href: "/fonctionnalites", label: "Fonctionnalités" },
          { href: "/tarifs", label: "Tarifs" },
          { href: "/contact", label: "Demander une démo" },
        ]} />
        <ColonneFooter titre="Métiers" liens={METIERS_VITRINE.slice(0, 6).map((m) => ({
          href: `/metiers/${m.slug}`,
          label: m.nom,
        }))} />
        <ColonneFooter titre="Légal" liens={[
          { href: "/legal/mentions-legales", label: "Mentions légales" },
          { href: "/legal/confidentialite", label: "Confidentialité" },
          { href: "/legal/cgu", label: "CGU" },
          { href: "/legal/cgv", label: "CGV" },
          { href: "/legal/sous-traitance", label: "Sous-traitance (RGPD)" },
          { href: "/legal/cookies", label: "Cookies" },
        ]} />
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © Revora — France. Fait avec soin pour les professionnels de la beauté.
      </div>
    </footer>
  );
}

function ColonneFooter({ titre, liens }: { titre: string; liens: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white/80">{titre}</p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-white/50">
        {liens.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
