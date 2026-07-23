// =====================================================================
// Composition de plusieurs prestations en un seul rendez-vous (R7.6).
// Les durées bloquées s'additionnent ; préparation en tête, nettoyage en
// queue. Pur et testable.
// =====================================================================

import type { SegmentDef, Temps } from "./types";

export interface PrestationComposable {
  duree_preparation: number;
  duree_execution: number;
  duree_nettoyage: number;
  battement: number;
  segments: SegmentDef[]; // vide = un seul bloc occupé de duree_execution
  ressource_ids: string[];
}

export interface Composition {
  temps: Temps;
  segments: SegmentDef[];
  ressourceIds: string[];
}

/**
 * Compose une liste de prestations enchaînées. La préparation de la première
 * et le nettoyage de la dernière encadrent l'ensemble ; les exécutions (avec
 * leurs temps de pose) se succèdent.
 */
export function composer(
  prestations: PrestationComposable[],
  battementDefaut = 0,
): Composition {
  if (prestations.length === 0) {
    return {
      temps: { preparation: 0, execution: 0, nettoyage: 0, battement: battementDefaut },
      segments: [],
      ressourceIds: [],
    };
  }

  const segments: SegmentDef[] = [];
  const ressourceIds = new Set<string>();

  for (const p of prestations) {
    if (p.segments.length > 0) {
      segments.push(...p.segments);
    } else {
      segments.push({ duree: p.duree_execution, praticienneOccupee: true });
    }
    p.ressource_ids.forEach((r) => ressourceIds.add(r));
  }

  const premiere = prestations[0];
  const derniere = prestations[prestations.length - 1];
  const battement = Math.max(
    battementDefaut,
    ...prestations.map((p) => p.battement),
  );

  return {
    temps: {
      preparation: premiere.duree_preparation,
      execution: 0, // piloté par les segments
      nettoyage: derniere.duree_nettoyage,
      battement,
    },
    segments,
    ressourceIds: [...ressourceIds],
  };
}
