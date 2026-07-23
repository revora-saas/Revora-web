// =====================================================================
// Algèbre d'intervalles [debut, fin). Base du moteur : fusion, soustraction,
// intersection. Toutes les fonctions sont pures et testables.
// =====================================================================

import type { Intervalle } from "./types";

export function dureeMinutes(i: Intervalle): number {
  return (i.fin.getTime() - i.debut.getTime()) / 60000;
}

/** Deux intervalles se chevauchent-ils (bornes ouvertes à droite) ? */
export function chevauchent(a: Intervalle, b: Intervalle): boolean {
  return a.debut < b.fin && b.debut < a.fin;
}

/** a contient-il entièrement b ? */
export function contient(a: Intervalle, b: Intervalle): boolean {
  return a.debut <= b.debut && a.fin >= b.fin;
}

/** Fusionne les intervalles qui se chevauchent ou se touchent, triés par début. */
export function fusionner(intervalles: Intervalle[]): Intervalle[] {
  if (intervalles.length === 0) return [];
  const tries = [...intervalles].sort(
    (a, b) => a.debut.getTime() - b.debut.getTime(),
  );
  const res: Intervalle[] = [{ ...tries[0] }];
  for (let i = 1; i < tries.length; i++) {
    const dernier = res[res.length - 1];
    const courant = tries[i];
    if (courant.debut <= dernier.fin) {
      // chevauchement ou contiguïté → on étend
      if (courant.fin > dernier.fin) dernier.fin = courant.fin;
    } else {
      res.push({ ...courant });
    }
  }
  return res;
}

/**
 * Soustrait `retraits` de `base`. Renvoie les portions de `base` non couvertes.
 * Ex. [09:00–19:00] − [12:00–13:00] = [09:00–12:00], [13:00–19:00].
 */
export function soustraire(base: Intervalle[], retraits: Intervalle[]): Intervalle[] {
  const bloquants = fusionner(retraits);
  const res: Intervalle[] = [];
  for (const b of base) {
    let segments: Intervalle[] = [{ ...b }];
    for (const r of bloquants) {
      const suivant: Intervalle[] = [];
      for (const s of segments) {
        if (!chevauchent(s, r)) {
          suivant.push(s);
          continue;
        }
        // portion avant le retrait
        if (s.debut < r.debut) suivant.push({ debut: s.debut, fin: r.debut });
        // portion après le retrait
        if (s.fin > r.fin) suivant.push({ debut: r.fin, fin: s.fin });
      }
      segments = suivant;
    }
    res.push(...segments);
  }
  return res.filter((i) => i.fin > i.debut);
}

/** Intersection de deux ensembles d'intervalles. */
export function intersecter(a: Intervalle[], b: Intervalle[]): Intervalle[] {
  const res: Intervalle[] = [];
  for (const x of a) {
    for (const y of b) {
      const debut = x.debut > y.debut ? x.debut : y.debut;
      const fin = x.fin < y.fin ? x.fin : y.fin;
      if (fin > debut) res.push({ debut, fin });
    }
  }
  return fusionner(res);
}
