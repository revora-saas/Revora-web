export const metadata = { title: "Hors connexion" };

export default function PageHorsLigne() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink px-6 text-center text-white">
      <span className="font-heading text-2xl font-bold">Vous êtes hors connexion</span>
      <p className="max-w-sm text-sm text-white/60">
        Les pages déjà consultées (comme l&apos;agenda du jour) restent accessibles. Le reste
        se rechargera dès le retour du réseau.
      </p>
    </main>
  );
}
