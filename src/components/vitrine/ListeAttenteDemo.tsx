import { ArrowDown, Check, Clock } from "lucide-react";

/**
 * Démonstration visuelle de la liste d'attente intelligente :
 * créneau libéré → 3 profils compatibles → confirmation → créneau réattribué.
 * Construite en HTML/CSS, données d'illustration d'interface.
 */
export function ListeAttenteDemo() {
  return (
    <div className="rounded-[26px] border border-bordure bg-white p-4 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_30px_60px_-30px_rgb(60_45_74_/_0.2)] sm:p-5">
      {/* Créneau libéré */}
      <div className="flex items-center justify-between rounded-[16px] border border-dashed border-peche/70 bg-peche-clair px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-prune">
          <Clock size={15} className="text-peche" /> 14:00
        </span>
        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-terracotta">
          Créneau libéré
        </span>
      </div>

      <div className="my-2 flex justify-center text-taupe">
        <ArrowDown size={16} />
      </div>

      {/* Profils compatibles */}
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-taupe">
        Clientes compatibles
      </p>
      <ul className="flex flex-col gap-2">
        <ProfilLigne initiales="SM" nom="Sarah M." detail="Même prestation · dispo 14 h" etat="confirme" />
        <ProfilLigne initiales="LR" nom="Léa R." detail="Même prestation · dispo 15 h" etat="notifiee" />
        <ProfilLigne initiales="NB" nom="Nadia B." detail="Prestation proche · dispo 14 h" etat="notifiee" />
      </ul>

      <div className="my-2 flex justify-center text-taupe">
        <ArrowDown size={16} />
      </div>

      {/* Créneau réattribué */}
      <div className="flex items-center justify-between rounded-[16px] bg-violet px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Check size={15} /> 14:00 · Sarah M.
        </span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium">
          Réattribué
        </span>
      </div>
    </div>
  );
}

function ProfilLigne({
  initiales,
  nom,
  detail,
  etat,
}: {
  initiales: string;
  nom: string;
  detail: string;
  etat: "confirme" | "notifiee";
}) {
  return (
    <li className="flex items-center gap-3 rounded-[16px] border border-bordure bg-white px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lavande-clair text-xs font-semibold text-violet">
        {initiales}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-prune">{nom}</p>
        <p className="truncate text-[11px] text-taupe">{detail}</p>
      </div>
      {etat === "confirme" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sauge/12 px-2.5 py-1 text-[11px] font-medium text-sauge">
          <Check size={11} /> A confirmé
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center rounded-full bg-lavande-clair px-2.5 py-1 text-[11px] font-medium text-taupe">
          Notifiée
        </span>
      )}
    </li>
  );
}
