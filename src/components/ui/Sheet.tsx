"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  ouvert: boolean;
  onFermer: () => void;
  titre?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Panneau mobile remontant depuis le bas (bottom sheet).
 * Composant privilégié sur mobile : atteignable au pouce, geste naturel.
 */
export function Sheet({ ouvert, onFermer, titre, children, className }: SheetProps) {
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFermer();
    };
    document.addEventListener("keydown", surTouche);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = "";
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onFermer}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-t-[var(--radius-xl)] bg-white p-5 shadow-douce",
          "sm:max-w-lg sm:rounded-[var(--radius-xl)]",
          className,
        )}
      >
        {/* Poignée de préhension (affordance mobile) */}
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-perle sm:hidden" />
        {titre && (
          <h2 className="mb-3 font-heading text-xl font-semibold text-ink">
            {titre}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
