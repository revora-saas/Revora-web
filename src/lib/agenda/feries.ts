// =====================================================================
// Jours fériés français (R4.2). Calcul pur, sans dépendance.
// Fériés fixes + fériés mobiles calés sur Pâques (algorithme de Meeus).
// =====================================================================

/** Dimanche de Pâques pour une année (algorithme de Meeus/Butcher). */
function paques(annee: number): { mois: number; jour: number } {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return { mois, jour };
}

function iso(annee: number, mois: number, jour: number): string {
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

/** Ajoute des jours à une date (année, mois 1-12, jour) → "YYYY-MM-DD". */
function ajouterJours(annee: number, mois: number, jour: number, delta: number): string {
  const d = new Date(Date.UTC(annee, mois - 1, jour + delta));
  return iso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Ensemble des jours fériés français ("YYYY-MM-DD") pour une année. */
export function joursFeries(annee: number): Set<string> {
  const p = paques(annee);
  return new Set([
    iso(annee, 1, 1), // Jour de l'an
    ajouterJours(annee, p.mois, p.jour, 1), // Lundi de Pâques
    iso(annee, 5, 1), // Fête du Travail
    iso(annee, 5, 8), // Victoire 1945
    ajouterJours(annee, p.mois, p.jour, 39), // Ascension
    ajouterJours(annee, p.mois, p.jour, 50), // Lundi de Pentecôte
    iso(annee, 7, 14), // Fête nationale
    iso(annee, 8, 15), // Assomption
    iso(annee, 11, 1), // Toussaint
    iso(annee, 11, 11), // Armistice 1918
    iso(annee, 12, 25), // Noël
  ]);
}

/** La date "YYYY-MM-DD" est-elle un jour férié français ? */
export function estFerie(dateIso: string): boolean {
  const annee = Number(dateIso.slice(0, 4));
  return joursFeries(annee).has(dateIso);
}
