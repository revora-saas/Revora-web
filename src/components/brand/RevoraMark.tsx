/**
 * Marque Revora — monogramme angulaire (approximation du logo « VA ») en dégradé
 * violet, + variante avec le nom. Purement décoratif (aria-hidden).
 * Note : approximation propre ; le logo vectoriel exact pourra être déposé ici.
 */
export function RevoraMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 44"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="revora-mark-grad"
          x1="26"
          y1="6"
          x2="26"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#B794F6" />
          <stop offset="1" stopColor="#6D4CFF" />
        </linearGradient>
      </defs>
      {/* Monogramme « VA » : V à gauche, A à droite, tracé continu */}
      <path
        d="M9 8 L20 37 L27 20 L34 8 L45 37"
        stroke="url(#revora-mark-grad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barre centrale (accent) */}
      <path
        d="M22 32 L31 32"
        stroke="url(#revora-mark-grad)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Logo complet : monogramme + nom « Revora ». */
export function RevoraWordmark({
  className = "",
  markSize = 28,
  tone = "ink",
}: {
  className?: string;
  markSize?: number;
  tone?: "ink" | "light";
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <RevoraMark size={markSize} />
      <span
        className={`font-heading text-lg font-bold tracking-[0.14em] ${
          tone === "light" ? "text-white" : "text-ink"
        }`}
      >
        REVORA
      </span>
    </span>
  );
}
