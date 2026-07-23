/** État de chargement de l'application : squelette discret. */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 h-7 w-48 animate-pulse rounded-[var(--radius-md)] bg-perle" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-perle/60" />
        ))}
      </div>
    </div>
  );
}
