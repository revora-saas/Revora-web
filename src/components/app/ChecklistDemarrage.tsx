"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Circle, Copy, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { marquerChecklist } from "@/app/(app)/actions";

interface EtatChecklist {
  catalogue: boolean;
  clientes: boolean;
  lien: boolean;
}

/**
 * Checklist de démarrage : « 3 étapes avant votre premier rendez-vous ».
 * Persistée dans reglages.autres.checklist. Disparaît une fois tout coché.
 */
export function ChecklistDemarrage({
  etatInitial,
  lienReservation,
  motClient,
}: {
  etatInitial: EtatChecklist;
  lienReservation: string;
  motClient: string; // vocabulaire : "clientes" / "clients"
}) {
  const [etat, setEtat] = useState<EtatChecklist>(etatInitial);
  const [copie, setCopie] = useState(false);

  async function basculer(cle: keyof EtatChecklist) {
    const valeur = !etat[cle];
    setEtat((p) => ({ ...p, [cle]: valeur }));
    await marquerChecklist(cle, valeur);
  }

  async function copierLien() {
    try {
      await navigator.clipboard.writeText(lienReservation);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      // Presse-papiers indisponible : on ignore silencieusement.
    }
    if (!etat.lien) basculer("lien");
  }

  const fait = Number(etat.catalogue) + Number(etat.clientes) + Number(etat.lien);
  if (fait === 3) return null; // tout est fait : on masque la checklist

  return (
    <Card className="border-primary/20 bg-primary-50/40">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading font-semibold text-ink">
          Avant votre premier rendez-vous
        </h2>
        <span className="text-sm font-medium text-primary">{fait}/3</span>
      </div>

      <ul className="flex flex-col gap-1">
        <LigneChecklist
          faite={etat.catalogue}
          onToggle={() => basculer("catalogue")}
          titre="Compléter mon catalogue"
          description="Ajustez vos prix et vos prestations."
          action={
            <Link
              href="/catalogue"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ouvrir
            </Link>
          }
        />
        <LigneChecklist
          faite={etat.clientes}
          onToggle={() => basculer("clientes")}
          titre={`Importer mes ${motClient}`}
          description="Depuis un fichier ou vos contacts."
          action={
            <Link
              href="/clientes"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ouvrir
            </Link>
          }
        />
        <LigneChecklist
          faite={etat.lien}
          onToggle={() => basculer("lien")}
          titre="Partager mon lien de réservation"
          description={lienReservation}
          action={
            <button
              type="button"
              onClick={copierLien}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {copie ? <CheckCheck size={15} /> : <Copy size={15} />}
              {copie ? "Copié" : "Copier"}
            </button>
          }
        />
      </ul>
    </Card>
  );
}

function LigneChecklist({
  faite,
  onToggle,
  titre,
  description,
  action,
}: {
  faite: boolean;
  onToggle: () => void;
  titre: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 rounded-[var(--radius-md)] px-1 py-2">
      <button
        type="button"
        onClick={onToggle}
        aria-label={faite ? "Marquer non fait" : "Marquer comme fait"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          faite ? "border-primary bg-primary text-white" : "border-perle text-transparent",
        )}
      >
        {faite ? <Check size={14} /> : <Circle size={0} />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            faite ? "text-ink/40 line-through" : "text-ink",
          )}
        >
          {titre}
        </p>
        <p className="truncate text-xs text-ink/50">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </li>
  );
}
