/**
 * =====================================================================
 * MOTEUR DE CRÉNEAUX — module isolé et testable (voir specs R1 à R6).
 * =====================================================================
 *
 * C'est la pièce la plus critique du produit : tout l'agenda en dépend.
 * Il est volontairement séparé du reste du code (aucune dépendance à React
 * ou à Next.js) pour pouvoir être couvert par des tests unitaires purs.
 *
 * Construit au prompt 06. Règles de référence :
 *   - R1  : décomposition des durées (préparation / exécution / nettoyage
 *           / battement) et temps de pose libérable.
 *   - R2  : ressources (praticienne, poste/cabine, équipement).
 *   - R4  : hiérarchie des disponibilités.
 *   - R5  : algorithme de recherche et optimisation anti-trou.
 *   - R6  : prestations à domicile (temps de trajet).
 *
 * Principe cardinal (CLAUDE.md, règle 9) :
 *   Les créneaux libres ne sont JAMAIS stockés. Ils sont toujours
 *   recalculés à la demande à partir des horaires, des indisponibilités
 *   et des occupations.
 */

/** Durées d'une prestation, en minutes (R1.1). */
export interface DureesPrestation {
  preparation: number;
  execution: number;
  nettoyage: number;
  battement: number;
}

/**
 * Calcule la durée totale bloquée par l'agenda pour une prestation (R1.2).
 * La cliente, elle, ne voit que `execution` (R1.1).
 */
export function dureeBloquee(d: DureesPrestation): number {
  return d.preparation + d.execution + d.nettoyage + d.battement;
}
