import { Check, Clock, Users } from "lucide-react";

/**
 * Aperçu produit du hero : maquette réaliste de l'agenda du jour, construite
 * en HTML/CSS (pas d'image générique). Montre immédiatement ce que fait Revora :
 * rendez-vous, cliente confirmée, créneau libéré, et la liste d'attente.
 * Données d'illustration d'interface (ni chiffres ni témoignages marketing).
 */
export function ApercuProduit() {
  return (
    <div className="rounded-[26px] border border-bordure bg-white p-3 shadow-[0_2px_8px_rgb(60_45_74_/_0.04),0_30px_60px_-30px_rgb(60_45_74_/_0.22)] sm:p-4">
      {/* Barre de fenêtre */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-bordure" />
          <span className="h-2.5 w-2.5 rounded-full bg-bordure" />
          <span className="h-2.5 w-2.5 rounded-full bg-bordure" />
        </div>
        <span className="text-[11px] font-medium text-taupe">Agenda du jour</span>
      </div>

      {/* En-tête de journée */}
      <div className="flex items-center justify-between rounded-[16px] bg-lavande-clair px-4 py-2.5">
        <p className="font-heading text-sm font-semibold text-prune">Mardi</p>
        <p className="text-xs text-taupe">4 rendez-vous · 1 libéré</p>
      </div>

      {/* Créneaux */}
      <ul className="mt-2.5 flex flex-col gap-2">
        <RdvLigne
          heure="9:00"
          prestation="Pose gel"
          cliente="Camille R."
          statut="confirme"
        />
        <RdvLigne
          heure="10:30"
          prestation="Remplissage"
          cliente="Inès B."
          statut="acompte"
        />
        {/* Créneau libéré, mis en avant */}
        <li className="rounded-[16px] border border-dashed border-peche/70 bg-peche-clair px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-peche" />
              <span className="text-sm font-semibold text-prune">14:00</span>
            </div>
            <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-terracotta">
              Créneau libéré
            </span>
          </div>
        </li>
        <RdvLigne
          heure="16:00"
          prestation="Dépose + pose"
          cliente="Sarah M."
          statut="confirme"
        />
      </ul>

      {/* Notification liste d'attente */}
      <div className="mt-3 rounded-[18px] border border-bordure bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="v-halo grid h-9 w-9 shrink-0 place-items-center rounded-full bg-peche/15 text-peche">
            <Users size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-prune">
              3 clientes compatibles sur la liste d&apos;attente
            </p>
            <p className="mt-0.5 truncate text-[11px] text-taupe">
              Même prestation · disponibles cet après-midi
            </p>
          </div>
        </div>
        <span className="mt-2.5 inline-flex w-full items-center justify-center rounded-full bg-violet px-3 py-2 text-xs font-semibold text-white">
          Proposer le créneau
        </span>
      </div>
    </div>
  );
}

function RdvLigne({
  heure,
  prestation,
  cliente,
  statut,
}: {
  heure: string;
  prestation: string;
  cliente: string;
  statut: "confirme" | "acompte";
}) {
  return (
    <li className="flex items-center gap-3 rounded-[16px] border border-bordure bg-white px-4 py-2.5">
      <span className="w-11 shrink-0 text-xs font-semibold text-taupe">{heure}</span>
      <span className="h-8 w-1 shrink-0 rounded-full bg-violet/25" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-prune">{prestation}</p>
        <p className="truncate text-[11px] text-taupe">{cliente}</p>
      </div>
      {statut === "confirme" ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sauge/12 px-2 py-0.5 text-[11px] font-medium text-sauge">
          <Check size={11} /> Confirmé
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center rounded-full bg-lavande-clair px-2 py-0.5 text-[11px] font-medium text-violet">
          Acompte
        </span>
      )}
    </li>
  );
}
