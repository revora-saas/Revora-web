import Link from "next/link";

export const metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <span className="font-heading text-3xl font-bold text-ink">Page introuvable</span>
      <p className="max-w-sm text-sm text-ink/60">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius-md)] bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-600"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
