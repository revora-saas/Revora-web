import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, LogOut, Settings } from "lucide-react";
import { getEtatProfil } from "@/lib/auth";
import { onboardingEstTermine, getConfigurationEtablissement } from "@/lib/metier";
import { deconnexion } from "@/app/(auth)/actions";
import { Pwa } from "@/components/app/Pwa";
import { NavApp } from "@/components/app/NavApp";
import { RevoraWordmark } from "@/components/brand/RevoraMark";

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
      <header className="sticky top-0 z-20 border-b border-perle bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-6">
            <Link href="/tableau-de-bord" aria-label="Accueil Revora">
              <RevoraWordmark markSize={26} />
            </Link>
            <NavApp motClient={motClient} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {etat.nomAffiche && (
              <span className="hidden text-sm font-medium text-ink/70 lg:inline">
                {etat.nomAffiche}
              </span>
            )}
            <Link
              href="/relances"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </Link>
            <Link
              href="/reglages"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="Réglages"
            >
              <Settings size={18} />
            </Link>
            <form action={deconnexion} className="hidden sm:block">
              <button
                type="submit"
                aria-label="Déconnexion"
                className="grid h-9 w-9 place-items-center rounded-full text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 pb-24 md:pb-8">{children}</div>

      <Pwa />
    </div>
  );
}
