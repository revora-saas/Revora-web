// =====================================================================
// Liste d'attente & remplissage automatique (R10). Sélection PURE et
// testable des candidates pour un créneau libéré.
// =====================================================================

import { toZonedTime } from "date-fns-tz";

export interface CandidatAttente {
  id: string; // id de la ligne liste_attente
  clientId: string;
  score: number;
  creeLe: string; // ISO — ancienneté d'inscription
  prestationId: string;
  /** Plages de disponibilité déclarées, en heure locale. jour 0=dim … 6=sam. */
  disponibilites: { jour: number; debut: string; fin: string }[];
}

export interface CreneauLibere {
  debut: Date; // exécution, UTC
  fin: Date;
  prestationId: string;
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Sélectionne et ordonne les candidates pour un créneau libéré (R10.2/R10.3) :
 *   - même prestation ;
 *   - une plage de disponibilité qui COUVRE le créneau (jour + horaire) ;
 *   - tri par score de fiabilité décroissant, puis ancienneté d'inscription.
 */
export function candidatsPourCreneau(
  candidats: CandidatAttente[],
  creneau: CreneauLibere,
  fuseau: string,
): CandidatAttente[] {
  const localDebut = toZonedTime(creneau.debut, fuseau);
  const localFin = toZonedTime(creneau.fin, fuseau);
  const jour = localDebut.getDay();
  const minDebut = localDebut.getHours() * 60 + localDebut.getMinutes();
  const minFin = localFin.getHours() * 60 + localFin.getMinutes();

  return candidats
    .filter((c) => c.prestationId === creneau.prestationId)
    .filter((c) =>
      c.disponibilites.some(
        (d) => d.jour === jour && minutes(d.debut) <= minDebut && minutes(d.fin) >= minFin,
      ),
    )
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score; // fiabilité décroissante
      return new Date(a.creeLe).getTime() - new Date(b.creeLe).getTime(); // ancienneté
    });
}

/** Découpe une liste de candidates en vagues de `taille` (R10.4 : 3). */
export function decouperEnVagues<T>(candidats: T[], taille = 3): T[][] {
  const vagues: T[][] = [];
  for (let i = 0; i < candidats.length; i += taille) {
    vagues.push(candidats.slice(i, i + taille));
  }
  return vagues;
}
