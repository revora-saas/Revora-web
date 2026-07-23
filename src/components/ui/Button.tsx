import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variante = "primaire" | "secondaire" | "fantome" | "danger";
type Taille = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  taille?: Taille;
  pleineLargeur?: boolean;
}

const variantes: Record<Variante, string> = {
  primaire:
    "bg-primary text-white hover:bg-primary-600 active:bg-primary-700 shadow-carte",
  secondaire:
    "bg-white text-ink border border-perle hover:bg-surface-muted",
  fantome: "bg-transparent text-ink hover:bg-surface-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const tailles: Record<Taille, string> = {
  // Mobile-first : cibles tactiles confortables (utilisable d'une main).
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/** Bouton de base. Voir CLAUDE.md : mobile-first, bords arrondis, ombres douces. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variante = "primaire", taille = "md", pleineLargeur, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "disabled:pointer-events-none disabled:opacity-50",
          variantes[variante],
          tailles[taille],
          pleineLargeur && "w-full",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
