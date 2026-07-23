import { redirect } from "next/navigation";
import { getEtatProfil } from "@/lib/auth";
import { getMetiers, onboardingEstTermine } from "@/lib/metier";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export const metadata = { title: "Configuration de votre espace" };

export default async function PageOnboarding() {
  const etat = await getEtatProfil();

  if (!etat.user) redirect("/connexion?suite=/onboarding");
  if (!etat.profilComplet || !etat.aEtablissement) redirect("/completer-profil");
  if (etat.etablissementId && (await onboardingEstTermine(etat.etablissementId))) {
    redirect("/tableau-de-bord");
  }

  const metiers = await getMetiers();

  return (
    <OnboardingClient
      metiers={metiers.map((m) => ({ code: m.code, libelle: m.libelle }))}
    />
  );
}
