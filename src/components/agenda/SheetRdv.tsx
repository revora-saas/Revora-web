"use client";

import { useState } from "react";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import { Phone, MessageSquare, Move, Trash2, User, Check, X, Euro } from "lucide-react";
import { Sheet, Button, Badge } from "@/components/ui";
import { formaterTelephone } from "@/lib/clientes-ui";
import { qualifierRdv, annulerRdv } from "@/app/(app)/agenda/actions";
import type { RdvVue } from "./types";

/** Le RDV est-il passé (à qualifier) ? */
function estPasse(rdv: RdvVue): boolean {
  return new Date(rdv.finExecution) < new Date();
}

export function SheetRdv({
  rdv,
  fuseau,
  onFermer,
  onDeplacer,
  onChange,
}: {
  rdv: RdvVue | null;
  fuseau: string;
  onFermer: () => void;
  onDeplacer: (rdvId: string) => void;
  onChange: () => void;
}) {
  const [chargement, setChargement] = useState(false);

  if (!rdv) return null;

  const debut = toZonedTime(new Date(rdv.debutExecution), fuseau);
  const fin = toZonedTime(new Date(rdv.finExecution), fuseau);
  const heure = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const date = debut.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const passe = estPasse(rdv);
  const aQualifier = passe && (rdv.statut === "confirme" || rdv.statut === "demande");

  async function qualifier(r: "honore" | "annule" | "absent") {
    setChargement(true);
    await qualifierRdv(rdv!.id, r);
    setChargement(false);
    onChange();
    onFermer();
  }

  async function annuler() {
    setChargement(true);
    await annulerRdv(rdv!.id);
    setChargement(false);
    onChange();
    onFermer();
  }

  return (
    <Sheet ouvert={!!rdv} onFermer={onFermer} titre={rdv.clientNom}>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm capitalize text-ink/60">{date}</p>
          <p className="font-heading text-lg font-semibold text-ink">
            {heure(debut)} – {heure(fin)}
          </p>
          <p className="mt-1 text-sm text-ink/60">{rdv.prestations.join(", ") || "—"}</p>
          {rdv.horsPlage && (
            <p className="mt-2 rounded-[var(--radius-md)] bg-red-50 p-2 text-sm text-red-700">
              ⚠ Ce rendez-vous est hors de vos horaires d&apos;ouverture actuels.
            </p>
          )}
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-3 gap-2">
          <BoutonAction
            icone={Phone}
            label="Appeler"
            href={rdv.clientTel ? `tel:${rdv.clientTel}` : undefined}
          />
          <BoutonAction
            icone={MessageSquare}
            label="Message"
            href={rdv.clientTel ? `sms:${rdv.clientTel}` : undefined}
          />
          <BoutonAction
            icone={User}
            label="Fiche"
            href={rdv.clientId ? `/clientes/${rdv.clientId}` : undefined}
          />
        </div>

        <Link href={`/caisse/nouveau?rdv=${rdv.id}`}>
          <div className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] border border-perle bg-white py-2.5 text-sm font-medium text-ink hover:bg-surface-muted">
            <Euro size={16} /> Encaisser
          </div>
        </Link>

        {rdv.clientTel && (
          <p className="text-sm text-ink/50">
            {formaterTelephone(rdv.clientTel)}
            {rdv.clientFiabilite !== null && rdv.clientFiabilite < 50 && (
              <Badge ton="danger" className="ml-2">
                Fiabilité {rdv.clientFiabilite}
              </Badge>
            )}
          </p>
        )}

        {/* Pointage d'un RDV passé (R8.6) */}
        {aQualifier && (
          <div className="rounded-[var(--radius-md)] border border-orange-200 bg-orange-50 p-3">
            <p className="mb-2 text-sm font-medium text-orange-800">
              Comment s&apos;est passé ce rendez-vous ?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button taille="sm" onClick={() => qualifier("honore")} disabled={chargement}>
                <Check size={15} /> Honoré
              </Button>
              <Button taille="sm" variante="secondaire" onClick={() => qualifier("annule")} disabled={chargement}>
                Annulé
              </Button>
              <Button taille="sm" variante="danger" onClick={() => qualifier("absent")} disabled={chargement}>
                <X size={15} /> Absent
              </Button>
            </div>
          </div>
        )}

        {/* Déplacer / annuler */}
        {!passe && (
          <div className="flex gap-2">
            <Button
              variante="secondaire"
              pleineLargeur
              onClick={() => {
                onDeplacer(rdv.id);
                onFermer();
              }}
            >
              <Move size={16} /> Déplacer
            </Button>
            <Button variante="danger" pleineLargeur onClick={annuler} disabled={chargement}>
              <Trash2 size={16} /> Annuler
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function BoutonAction({
  icone: Icone,
  label,
  href,
}: {
  icone: typeof Phone;
  label: string;
  href?: string;
}) {
  const contenu = (
    <div
      className={`flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-perle bg-white py-2.5 text-xs font-medium ${href ? "text-ink hover:bg-surface-muted" : "text-ink/30"}`}
    >
      <Icone size={18} />
      {label}
    </div>
  );
  return href ? <Link href={href}>{contenu}</Link> : contenu;
}
