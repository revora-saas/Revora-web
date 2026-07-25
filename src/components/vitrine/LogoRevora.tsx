/**
 * Marque Revora : un emplacement propre pour le futur logo (petit médaillon
 * violet avec un « R » et un point pêche en accent) + le nom en toutes lettres.
 * Purement décoratif et sobre — remplaçable par le vrai logo plus tard.
 */
export function LogoRevora({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className="relative grid h-8 w-8 place-items-center rounded-[10px] bg-violet font-heading text-[15px] font-bold text-white"
      >
        R
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-peche ring-2 ring-ivoire" />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight text-prune">
        Revora
      </span>
    </span>
  );
}
