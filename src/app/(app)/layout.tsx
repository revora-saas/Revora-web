import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getEtatProfil } from "@/lib/auth";
import { onboardingEstTermine } from "@/lib/metier";
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

  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="sticky top-0 z-10 border-b border-perle bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <span className="font-heading text-lg font-bold text-ink">Revora</span>
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
      <div className="flex-1">{children}</div>
    </div>
  );
}
