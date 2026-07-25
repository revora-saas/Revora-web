import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";

const STATUTS: Record<string, { label: string; classe: string }> = {
  confirme: { label: "Confirmé", classe: "bg-sauge/12 text-sauge" },
  demande: { label: "À valider", classe: "bg-amber-100 text-amber-700" },
  a_qualifier: { label: "À qualifier", classe: "bg-amber-100 text-amber-700" },
  honore: { label: "Honoré", classe: "bg-sauge/12 text-sauge" },
  absent: { label: "Absent", classe: "bg-terracotta/10 text-terracotta" },
};

/** Avatar en initiales (évite l'exposition des photos privées sur le tableau de bord). */
export function Avatar({ nom, taille = 44 }: { nom: string; taille?: number }) {
  const initiales = nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase())
    .join("");
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-primary-50 font-heading font-semibold text-primary"
      style={{ width: taille, height: taille, fontSize: taille * 0.34 }}
      aria-hidden
    >
      {initiales || "—"}
    </span>
  );
}

/** Carte « Prochain rendez-vous » du tableau de bord (présentation). */
export function ProchainRdv({
  heure,
  jourLabel,
  nom,
  prestation,
  statut,
  href,
}: {
  heure: string;
  jourLabel?: string;
  nom: string;
  prestation?: string;
  statut: string;
  href: string;
}) {
  const s = STATUTS[statut] ?? { label: statut, classe: "bg-perle text-ink/60" };
  return (
    <Link
      href={href}
      className="block rounded-[20px] border border-perle bg-white p-4 shadow-[0_1px_2px_rgb(11_16_32_/_0.04),0_16px_32px_-24px_rgb(11_16_32_/_0.25)] transition-shadow hover:shadow-[0_1px_2px_rgb(11_16_32_/_0.05),0_20px_40px_-24px_rgb(11_16_32_/_0.3)]"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
        <Calendar size={14} className="text-primary" /> Prochain rendez-vous
      </div>
      <div className="flex items-center gap-3">
        <Avatar nom={nom} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold text-ink">{heure}</span>
            {jourLabel && <span className="text-xs text-ink/45">{jourLabel}</span>}
          </div>
          <p className="truncate text-sm font-medium text-ink">{nom}</p>
          {prestation && <p className="truncate text-xs text-ink/55">{prestation}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.classe}`}>
          {s.label}
        </span>
        <ChevronRight size={18} className="text-ink/30" />
      </div>
    </Link>
  );
}
