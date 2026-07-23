// =====================================================================
// Calcul des durées (R1). Socle de tout l'agenda.
// =====================================================================

import type { Fenetres, Intervalle, SegmentDef, Temps, Trajet } from "./types";
import { soustraire } from "./intervalles";

function ajouter(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

/** Durée totale d'exécution (somme des segments s'il y en a, sinon temps.execution). */
export function dureeExecution(temps: Temps, segments?: SegmentDef[]): number {
  if (segments && segments.length > 0) {
    return segments.reduce((s, seg) => s + seg.duree, 0);
  }
  return temps.execution;
}

/** Durée totale bloquée par l'agenda (R1.2), trajet compris. */
export function dureeBloquee(temps: Temps, segments?: SegmentDef[], trajet?: Trajet): number {
  return (
    temps.preparation +
    dureeExecution(temps, segments) +
    temps.nettoyage +
    temps.battement +
    (trajet?.avant ?? 0) +
    (trajet?.apres ?? 0)
  );
}

/**
 * Calcule les fenêtres d'un rendez-vous à partir du début d'exécution (R1.3).
 *
 * - `visible` : ce que voit la cliente (début → fin d'exécution).
 * - `bloque`  : ce que bloque l'agenda (préparation, nettoyage, battement, trajet).
 * - `occupations` : sous-intervalles où la praticienne est occupée — les temps
 *   de pose (segments libres) en sont retirés (R1.5). Ce sont ces intervalles
 *   qui vont dans la table `occupations` pour la praticienne.
 */
export function calculerFenetres(
  debutExecution: Date,
  temps: Temps,
  segments?: SegmentDef[],
  trajet?: Trajet,
): Fenetres {
  const execTotale = dureeExecution(temps, segments);
  const finExecution = ajouter(debutExecution, execTotale);

  const bloque: Intervalle = {
    debut: ajouter(debutExecution, -(temps.preparation + (trajet?.avant ?? 0))),
    fin: ajouter(finExecution, temps.nettoyage + temps.battement + (trajet?.apres ?? 0)),
  };

  // Intervalles LIBRES (temps de pose) à l'intérieur de l'exécution.
  const libres: Intervalle[] = [];
  if (segments && segments.length > 0) {
    let curseur = debutExecution;
    for (const seg of segments) {
      const finSeg = ajouter(curseur, seg.duree);
      if (!seg.praticienneOccupee) libres.push({ debut: curseur, fin: finSeg });
      curseur = finSeg;
    }
  }

  // La praticienne est occupée sur tout le bloqué SAUF les temps de pose.
  const occupations = soustraire([bloque], libres);

  return {
    visible: { debut: debutExecution, fin: finExecution },
    bloque,
    occupations,
  };
}
