import { cn } from "@/lib/utils";

type Ton = "neutre" | "primaire" | "succes" | "alerte" | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  ton?: Ton;
}

const tons: Record<Ton, string> = {
  neutre: "bg-surface-muted text-ink/70",
  primaire: "bg-primary-50 text-primary-700",
  succes: "bg-green-50 text-green-700",
  alerte: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
};

/** Pastille de statut (ex. statut de RDV, statut cliente). */
export function Badge({ className, ton = "neutre", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tons[ton],
        className,
      )}
      {...props}
    />
  );
}
