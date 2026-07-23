/**
 * Layout de l'onboarding : écran de travail clair, plein écran, focalisé
 * (aucune navigation parasite tant que la configuration n'est pas terminée).
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-surface-muted">{children}</div>;
}
