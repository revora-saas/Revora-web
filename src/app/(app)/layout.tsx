import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, LayoutDashboard, Users } from "lucide-react";
import { getEtatProfil } from "@/lib/auth";
import { onboardingEstTermine, getConfigurationEtablissement } from "@/lib/metier";
import { deconnexion } from "@/app/(auth)/actions";

/**
 * Layout de l'application authentifiée. Garde d'accès :
 *   - session obligatoire (le middleware filtre déjà, on double le contrôle) ;
 *   - profil complet + établissement, sinon redirection vers la complétion.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const etat = await getEtatProfil();

  if (!etat.user) redirect("/connexion");
  if (!etat.profilComplet || !etat.aEtablissement) redirect("/completer-profil");
  // Onboarding métier obligatoire avant d'accéder à l'application.
  if (etat.etablissementId && !(await onboardingEstTermine(etat.etablissementId))) {
    redirect("/onboarding");
  }

  const config = etat.etablissementId
    ? await getConfigurationEtablissement(etat.etablissementId)
    : null;
  const motClient = config ? config.vocabulaire.client + "s" : "clientes";

  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="sticky top-0 z-10 border-b border-perle bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-5">
            <span className="font-heading text-lg font-bold text-ink">Revora</span>
            <nav className="hidden items-center gap-1 sm:flex">
              <LienNav href="/tableau-de-bord" icone={<LayoutDashboard size={16} />}>
                Accueil
              </LienNav>
              <LienNav href="/clientes" icone={<Users size={16} />}>
                <span className="capitalize">{motClient}</span>
              </LienNav>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {etat.nomAffiche && (
              <span className="hidden text-sm text-ink/60 sm:inline">
                {etat.nomAffiche}
              </span>
            )}
            <form action={deconnexion}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2.5 py-1.5 text-sm text-ink/70 hover:bg-surface-muted"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="flex-1 pb-20 sm:pb-0">{children}</div>

      {/* Barre d'onglets mobile (M2.1) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-perle bg-white sm:hidden">
        <OngletMobile href="/tableau-de-bord" icone={<LayoutDashboard size={20} />} label="Accueil" />
        <OngletMobile href="/clientes" icone={<Users size={20} />} label={motClient} />
      </nav>
    </div>
  );
}

function LienNav({
  href,
  icone,
  children,
}: {
  href: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-surface-muted"
    >
      {icone}
      {children}
    </Link>
  );
}

function OngletMobile({
  href,
  icone,
  label,
}: {
  href: string;
  icone: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium capitalize text-ink/60"
    >
      {icone}
      {label}
    </Link>
  );
}
