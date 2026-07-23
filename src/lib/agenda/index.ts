/**
 * =====================================================================
 * MOTEUR DE CRÉNEAUX — module isolé et testable (specs R1 à R6).
 * =====================================================================
 *
 * La pièce la plus critique du produit. Aucune dépendance à React, Next ou
 * Supabase : instants absolus (Date, UTC), fonctions pures, couvert par des
 * tests unitaires (voir __tests__/).
 *
 * Principe cardinal (CLAUDE.md, règle 9) : les créneaux libres ne sont JAMAIS
 * stockés — ils sont recalculés à la demande à partir des horaires, des
 * indisponibilités et des occupations.
 */

export * from "./types";
export * from "./intervalles";
export * from "./duree";
export * from "./ouverture";
export * from "./disponibilites";
export * from "./creneaux";
export * from "./affectation";
export * from "./composition";
export * from "./feries";
