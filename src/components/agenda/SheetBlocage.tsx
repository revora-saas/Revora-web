"use client";

import { useState } from "react";
import { fromZonedTime } from "date-fns-tz";
import { Sheet, Input, Button } from "@/components/ui";
import { bloquerCreneau } from "@/app/(app)/agenda/actions";

const TYPES = [
  { cle: "pause", label: "Pause" },
  { cle: "absence", label: "Absence" },
  { cle: "conge", label: "Congé" },
  { cle: "blocage", label: "Autre blocage" },
] as const;

export function SheetBlocage({
  ouvert,
  onFermer,
  dateStr,
  fuseau,
  onCree,
}: {
  ouvert: boolean;
  onFermer: () => void;
  dateStr: string;
  fuseau: string;
  onCree: () => void;
}) {
  const [type, setType] = useState<(typeof TYPES)[number]["cle"]>("pause");
  const [motif, setMotif] = useState("");
  const [debut, setDebut] = useState("12:00");
  const [fin, setFin] = useState("13:00");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (fin <= debut) {
      setErreur("L'heure de fin doit être après le début.");
      return;
    }
    setChargement(true);
    const res = await bloquerCreneau({
      debutIso: fromZonedTime(`${dateStr}T${debut}:00`, fuseau).toISOString(),
      finIso: fromZonedTime(`${dateStr}T${fin}:00`, fuseau).toISOString(),
      motif: motif || TYPES.find((t) => t.cle === type)!.label,
      type,
    });
    setChargement(false);
    if (res.ok) onCree();
    else setErreur(res.erreur);
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre="Bloquer un créneau">
      <form onSubmit={valider} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.cle}
              type="button"
              onClick={() => setType(t.cle)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${type === t.cle ? "bg-primary text-white" : "border border-perle bg-white text-ink/70"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Début</span>
            <input
              type="time"
              value={debut}
              onChange={(e) => setDebut(e.target.value)}
              className="h-11 rounded-[var(--radius-md)] border border-perle px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Fin</span>
            <input
              type="time"
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className="h-11 rounded-[var(--radius-md)] border border-perle px-3 text-sm"
            />
          </label>
        </div>
        <Input label="Motif (facultatif)" value={motif} onChange={(e) => setMotif(e.target.value)} />
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Enregistrement…" : "Bloquer"}
        </Button>
      </form>
    </Sheet>
  );
}
