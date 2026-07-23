// =====================================================================
// Fenêtre de silence (R14.3) : aucun envoi automatique entre 21 h et 8 h.
// Les messages prévus dans cette plage sont reportés à l'ouverture (8 h).
// Pur et testable.
// =====================================================================

import { toZonedTime, fromZonedTime } from "date-fns-tz";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Décale un instant d'envoi hors de la fenêtre 21 h–8 h (heure locale).
 * - Avant 8 h  → 8 h le jour même.
 * - 21 h ou après → 8 h le lendemain.
 * - Sinon → inchangé.
 */
export function respecterFenetreSilence(instant: Date, fuseau: string): Date {
  const local = toZonedTime(instant, fuseau);
  const heure = local.getHours();
  if (heure >= 8 && heure < 21) return instant;

  // Jour cible : lendemain si on est le soir (>=21 h), sinon le jour même.
  const base = new Date(local);
  if (heure >= 21) base.setDate(base.getDate() + 1);

  const naif = `${base.getFullYear()}-${pad2(base.getMonth() + 1)}-${pad2(base.getDate())}T08:00:00`;
  return fromZonedTime(naif, fuseau);
}
