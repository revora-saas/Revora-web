"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  ouvert: boolean;
  onFermer: () => void;
  titre?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Fenêtre modale centrée (usage bureau / tablette).
 * Sur mobile, préférer le composant Sheet (remontée par le bas).
 */
export function Modal({ ouvert, onFermer, titre, children, className }: ModalProps) {
  // Fermeture au clavier (Échap) + blocage du défilement de fond.
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titre}
    >
      {/* Fond assombri */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onFermer}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-[var(--radius-xl)] bg-white p-5 shadow-douce",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          {titre && (
            <h2 className="font-heading text-xl font-semibold text-ink">
              {titre}
            </h2>
          )}
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="ml-auto rounded-full p-1.5 text-ink/50 hover:bg-surface-muted hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
