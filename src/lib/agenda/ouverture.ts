// =====================================================================
// Fenêtres d'ouverture (R4). Convertit des horaires récurrents en heure
// locale vers des instants UTC, sur une période — en gérant le changement
// d'heure (R15.5) via date-fns-tz.
// =====================================================================

import { fromZonedTime, toZonedTime } from "date-fns-tz";
import type { HoraireRecurrent, Intervalle } from "./types";
import { intersecter } from "./intervalles";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Heure locale (jour donné + "HH:MM") → instant UTC, DST géré. */
function versUtc(annee: number, mois: number, jour: number, hhmm: string, fuseau: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const naif = `${annee}-${pad2(mois)}-${pad2(jour)}T${pad2(h)}:${pad2(m)}:00`;
  return fromZonedTime(naif, fuseau);
}

/**
 * Construit les fenêtres d'ouverture (UTC) sur `periode`, à partir des
 * horaires hebdomadaires récurrents exprimés en heure locale.
 * Ne stocke rien : tout est calculé à la demande (règle 9).
 */
export function construireOuvertures(
  fuseau: string,
  periode: Intervalle,
  horaires: HoraireRecurrent[],
): Intervalle[] {
  if (horaires.length === 0) return [];

  // Bornes en jours calendaires locaux.
  const debutLocal = toZonedTime(periode.debut, fuseau);
  const finLocal = toZonedTime(periode.fin, fuseau);

  // Itération jour par jour en UTC (chaque +24 h avance d'un jour calendaire).
  let curseur = Date.UTC(
    debutLocal.getFullYear(),
    debutLocal.getMonth(),
    debutLocal.getDate(),
  );
  const borne = Date.UTC(finLocal.getFullYear(), finLocal.getMonth(), finLocal.getDate());

  const ouvertures: Intervalle[] = [];
  for (let garde = 0; curseur <= borne && garde < 400; garde++) {
    const d = new Date(curseur);
    const annee = d.getUTCFullYear();
    const mois = d.getUTCMonth();
    const jour = d.getUTCDate();
    const jourSemaine = d.getUTCDay(); // 0 = dimanche

    for (const h of horaires) {
      if (h.jourSemaine !== jourSemaine) continue;
      ouvertures.push({
        debut: versUtc(annee, mois + 1, jour, h.debut, fuseau),
        fin: versUtc(annee, mois + 1, jour, h.fin, fuseau),
      });
    }
    curseur += 86400000;
  }

  // On borne à la période demandée.
  return intersecter(ouvertures, [periode]);
}
