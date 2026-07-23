import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  erreur?: string;
  aide?: string;
}

/** Champ de saisie avec label et message d'erreur. Mobile-first. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, erreur, aide, id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={erreur ? true : undefined}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] border bg-white px-3 text-base text-ink",
            "placeholder:text-ink/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            erreur ? "border-red-500" : "border-perle",
            className,
          )}
          {...props}
        />
        {erreur ? (
          <p className="text-sm text-red-600">{erreur}</p>
        ) : (
          aide && <p className="text-sm text-ink/50">{aide}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
