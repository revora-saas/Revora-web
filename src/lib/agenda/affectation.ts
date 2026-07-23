// =====================================================================
// Affectation automatique d'une praticienne quand la cliente n'exprime
// aucune préférence (R5.6). Le choix explicite de la cliente prime toujours
// (R5.5) et court-circuite cette logique en amont.
// =====================================================================

import type { Intervalle, Membre } from "./types";
import { dureeMinutes, fusionner } from "./intervalles";

export interface StatMembre {
  membreId: string;
  /** Nombre de blocs occupés distincts sur la période (proxy de fragmentation). */
  fragmentation: number;
  /** Minutes occupées sur la période. */
  charge: number;
}

/** Statistiques d'un membre sur une période (charge, fragmentation). */
export function calculerStatMembre(membre: Membre, periode: Intervalle): StatMembre {
  const dansPeriode = membre.occupations.filter(
    (o) => o.fin > periode.debut && o.debut < periode.fin,
  );
  const blocs = fusionner(dansPeriode);
  return {
    membreId: membre.id,
    fragmentation: blocs.length,
    charge: blocs.reduce((s, b) => s + dureeMinutes(b), 0),
  };
}

/**
 * Ordonne les praticiennes candidates selon R5.6 :
 *   1. la praticienne habituelle de la cliente ;
 *   2. celle dont la journée est la plus fragmentée (on comble ses trous) ;
 *   3. celle dont la charge est la plus faible (équilibrage).
 * En mode « concentrer » (R5.7), on inverse le dernier critère pour remplir
 * au maximum certaines journées.
 */
export function ordonnerMembres(
  stats: StatMembre[],
  options?: { membreHabituelId?: string; concentrer?: boolean },
): string[] {
  const habituel = options?.membreHabituelId;
  const concentrer = options?.concentrer ?? false;

  return [...stats]
    .sort((a, b) => {
      if (habituel) {
        if (a.membreId === habituel) return -1;
        if (b.membreId === habituel) return 1;
      }
      if (a.fragmentation !== b.fragmentation) return b.fragmentation - a.fragmentation;
      return concentrer ? b.charge - a.charge : a.charge - b.charge;
    })
    .map((s) => s.membreId);
}
