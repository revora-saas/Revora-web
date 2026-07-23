import Link from "next/link";

/**
 * Layout des écrans d'authentification : fond sombre premium (identité de
 * marque), carte claire centrée. Mobile-first.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ink px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-heading text-2xl font-bold tracking-tight text-white"
          >
            Revora
          </Link>
        </div>
        <div className="rounded-[var(--radius-xl)] bg-white p-6 shadow-douce">
          {children}
        </div>
      </div>
    </div>
  );
}
