"use client";

import { useEffect } from "react";

/** Frontière d'erreur : message clair en français, jamais de trace technique brute. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // La trace est journalisée pour le suivi, jamais affichée à l'utilisatrice.
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <span className="font-heading text-2xl font-bold text-ink">Une erreur est survenue</span>
      <p className="max-w-sm text-sm text-ink/60">
        Quelque chose n&apos;a pas fonctionné. Vos données sont en sécurité. Vous pouvez
        réessayer.
      </p>
      <button
        onClick={reset}
        className="rounded-[var(--radius-md)] bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-600"
      >
        Réessayer
      </button>
    </main>
  );
}
