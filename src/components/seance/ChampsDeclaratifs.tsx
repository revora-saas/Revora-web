"use client";

import type { ChampFiche } from "@/lib/metier-types";

/**
 * Composant UNIQUE qui interprète un schéma de champs déclaratif (M7.3).
 * Jamais un écran par métier : le schéma (libellé, type, obligation) vient
 * de la configuration du profil métier.
 */
export function ChampsDeclaratifs({
  schema,
  valeurs,
  onChange,
  desactive,
}: {
  schema: ChampFiche[];
  valeurs: Record<string, unknown>;
  onChange: (cle: string, valeur: unknown) => void;
  desactive?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {schema.map((champ) => (
        <div key={champ.cle} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">
            {champ.libelle}
            {champ.obligatoire && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <ChampUnique champ={champ} valeur={valeurs[champ.cle]} onChange={onChange} desactive={desactive} />
        </div>
      ))}
    </div>
  );
}

function ChampUnique({
  champ,
  valeur,
  onChange,
  desactive,
}: {
  champ: ChampFiche;
  valeur: unknown;
  onChange: (cle: string, valeur: unknown) => void;
  desactive?: boolean;
}) {
  const classe =
    "rounded-[var(--radius-md)] border border-perle bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:bg-surface-muted";

  switch (champ.type) {
    case "liste":
      return (
        <select
          value={(valeur as string) ?? ""}
          onChange={(e) => onChange(champ.cle, e.target.value)}
          disabled={desactive}
          className={`h-11 ${classe}`}
        >
          <option value="">—</option>
          {champ.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );

    case "multi": {
      const selection = Array.isArray(valeur) ? (valeur as string[]) : [];
      return (
        <div className="flex flex-wrap gap-2">
          {champ.options?.map((o) => {
            const actif = selection.includes(o);
            return (
              <button
                key={o}
                type="button"
                disabled={desactive}
                onClick={() =>
                  onChange(
                    champ.cle,
                    actif ? selection.filter((x) => x !== o) : [...selection, o],
                  )
                }
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${actif ? "bg-primary text-white" : "border border-perle bg-white text-ink/70"}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      );
    }

    case "nombre":
      return (
        <input
          type="number"
          value={(valeur as number) ?? ""}
          onChange={(e) => onChange(champ.cle, e.target.value === "" ? null : Number(e.target.value))}
          disabled={desactive}
          className={`h-11 ${classe}`}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(valeur as string) ?? ""}
          onChange={(e) => onChange(champ.cle, e.target.value)}
          disabled={desactive}
          className={`h-11 ${classe}`}
        />
      );

    case "booleen":
      return (
        <input
          type="checkbox"
          checked={Boolean(valeur)}
          onChange={(e) => onChange(champ.cle, e.target.checked)}
          disabled={desactive}
          className="h-5 w-5 accent-[var(--color-primary)]"
        />
      );

    default: // texte
      return (
        <textarea
          value={(valeur as string) ?? ""}
          onChange={(e) => onChange(champ.cle, e.target.value)}
          disabled={desactive}
          rows={2}
          className={classe}
        />
      );
  }
}
