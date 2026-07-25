import { RevoraMark } from "@/components/brand/RevoraMark";

/**
 * Marque Revora pour la vitrine : monogramme « VA » + nom en toutes lettres.
 * Le monogramme vectoriel exact pourra remplacer RevoraMark plus tard.
 */
export function LogoRevora({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <RevoraMark size={30} />
      <span className="font-heading text-lg font-semibold tracking-tight text-prune">
        Revora
      </span>
    </span>
  );
}
