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
      viewBox="0 0 44 44"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="revora-mark-grad"
          x1="8"
          y1="6"
          x2="36"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B7DF0" />
          <stop offset="1" stopColor="#5A3CE6" />
        </linearGradient>
      </defs>
      {/* Pic « A » */}
      <path
        d="M7 37 L22 7 L37 37"
        stroke="url(#revora-mark-grad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Barre centrale (accent) */}
      <path
        d="M15.5 27 L28.5 27"
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
