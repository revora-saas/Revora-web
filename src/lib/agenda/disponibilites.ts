// =====================================================================
// Disponibilités d'une praticienne (R4.1). Applique la hiérarchie des
// contraintes : ouverture établissement → ouverture praticienne → pauses,
// absences, congés → rendez-vous → blocages.
// =====================================================================

import type { HoraireRecurrent, Intervalle, Membre } from "./types";
import { construireOuvertures } from "./ouverture";
import { fusionner, intersecter, soustraire } from "./intervalles";

/**
 * Intervalles réellement libres pour une praticienne sur `periode`.
 * Les temps de pose d'autres rendez-vous ne figurent PAS dans ses
 * occupations : ils restent donc libres, comme voulu (R1.5/R1.6).
 */
export function disponibiliteMembre(
  membre: Membre,
  horairesEtablissement: HoraireRecurrent[],
  indisponibilitesEtablissement: Intervalle[],
  periode: Intervalle,
  fuseau: string,
): Intervalle[] {
  const ouverturesEtab = construireOuvertures(fuseau, periode, horairesEtablissement);

  // Horaires propres plus restrictifs, sinon ceux de l'établissement (R4.1).
  const base =
    membre.horaires.length > 0
      ? intersecter(
          ouverturesEtab,
          construireOuvertures(fuseau, periode, membre.horaires),
        )
      : ouverturesEtab;

  const bloquants = fusionner([
    ...indisponibilitesEtablissement,
    ...membre.indisponibilites,
    ...membre.occupations,
  ]);

  return soustraire(base, bloquants);
}
