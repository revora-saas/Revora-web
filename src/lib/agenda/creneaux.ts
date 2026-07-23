// =====================================================================
// Recherche de créneaux (R5.1) + optimisation anti-trou (R5.2/R5.3).
// Ne stocke JAMAIS les créneaux : tout est recalculé à la demande.
// =====================================================================

import type {
  Creneau,
  HoraireRecurrent,
  Intervalle,
  Membre,
  Reglages,
  Ressource,
  SegmentDef,
  Temps,
  Trajet,
} from "./types";
import { calculerFenetres, dureeBloquee } from "./duree";
import { construireOuvertures } from "./ouverture";
import { chevauchent, fusionner, intersecter } from "./intervalles";

export interface EntreePrestation {
  id?: string; // pour le filtrage des compétences (R3.1)
  temps: Temps;
  segments?: SegmentDef[];
  trajet?: Trajet;
  ressourceIds: string[];
}

export interface EntreeRecherche {
  prestation: EntreePrestation;
  periode: Intervalle;
  maintenant: Date;
  fuseau: string;
  reglages: Reglages;
  horairesEtablissement: HoraireRecurrent[];
  indisponibilitesEtablissement: Intervalle[];
  membres: Membre[];
  ressources: Ressource[];
  /** Plus courte prestation du catalogue, en minutes (R5.3). */
  prestationLaPlusCourteMinutes: number;
}

function ajouter(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60000);
}

/**
 * Recherche tous les créneaux possibles pour une prestation, toutes
 * praticiennes compétentes confondues. Résultat trié (anti-trou, R5.2).
 */
export function rechercherCreneaux(e: EntreeRecherche): Creneau[] {
  const { prestation, reglages, fuseau } = e;

  // Bornes : délai minimum (R4.3) et horizon maximum (R4.4).
  const borneDelai = ajouter(e.maintenant, reglages.delaiMin);
  const borneHorizon = ajouter(e.maintenant, reglages.horizonJours * 24 * 60);
  const debut = new Date(Math.max(e.periode.debut.getTime(), e.maintenant.getTime()));
  const fin = new Date(Math.min(e.periode.fin.getTime(), borneHorizon.getTime()));
  if (fin <= debut) return [];
  const periode: Intervalle = { debut, fin };

  const dureeBloq = dureeBloquee(prestation.temps, prestation.segments, prestation.trajet);
  const plusCourte = e.prestationLaPlusCourteMinutes;

  const ressourcesRequises = e.ressources.filter((r) =>
    prestation.ressourceIds.includes(r.id),
  );

  const ouverturesEtab = construireOuvertures(fuseau, periode, e.horairesEtablissement);
  const creneaux: Creneau[] = [];

  for (const membre of e.membres) {
    // Compétences (R3.1) : une praticienne non habilitée n'apparaît jamais.
    if (
      prestation.id &&
      membre.competences &&
      !membre.competences.has(prestation.id)
    ) {
      continue;
    }

    // Ouverture effective de la praticienne = établissement ∩ ses horaires.
    const ouvertures =
      membre.horaires.length > 0
        ? intersecter(
            ouverturesEtab,
            construireOuvertures(fuseau, periode, membre.horaires),
          )
        : ouverturesEtab;

    // Occupé de la praticienne (pour collisions et adjacence).
    const occupe = fusionner([
      ...e.indisponibilitesEtablissement,
      ...membre.indisponibilites,
      ...membre.occupations,
    ]);

    for (const ouv of ouvertures) {
      // On parcourt la grille (R4.5) depuis l'ouverture.
      for (
        let t = ouv.debut.getTime();
        t + dureeBloq * 60000 <= ouv.fin.getTime();
        t += reglages.granularite * 60000
      ) {
        const debutBloque = new Date(t);
        const debutExecution = ajouter(
          debutBloque,
          prestation.temps.preparation + (prestation.trajet?.avant ?? 0),
        );
        const f = calculerFenetres(
          debutExecution,
          prestation.temps,
          prestation.segments,
          prestation.trajet,
        );

        // Délai minimum de réservation (R4.3).
        if (debutExecution < borneDelai) continue;

        // Collision praticienne : seuls les segments OCCUPÉS comptent (R1.5/R1.6).
        // Les temps de pose peuvent chevaucher un autre RDV.
        const collisionPraticienne = f.occupations.some((occ) =>
          occupe.some((b) => chevauchent(occ, b)),
        );
        if (collisionPraticienne) continue;

        // Ressources : la salle reste occupée tout le bloqué (R1.7).
        const collisionRessource = ressourcesRequises.some((r) =>
          r.occupations.some((o) => chevauchent(o, f.bloque)),
        );
        if (collisionRessource) continue;

        const { accole, deconseille } = evaluerTrou(f.bloque, ouv, occupe, plusCourte);
        const score = accole ? 0 : bordJournee(f.bloque, ouv) ? 1 : 2;

        creneaux.push({
          debutExecution: f.visible.debut,
          finExecution: f.visible.fin,
          debutBloque: f.bloque.debut,
          finBloque: f.bloque.fin,
          membreId: membre.id,
          accole,
          deconseille,
          score,
        });
      }
    }
  }

  return trierCreneaux(creneaux, reglages.strategiePlanning);
}

/** Le créneau touche-t-il le début ou la fin de la journée d'ouverture (R5.2) ? */
function bordJournee(bloque: Intervalle, ouv: Intervalle): boolean {
  return (
    bloque.debut.getTime() === ouv.debut.getTime() ||
    bloque.fin.getTime() === ouv.fin.getTime()
  );
}

/**
 * Évalue un créneau : accolé à une occupation existante (R5.2) et/ou
 * laissant un trou invendable, plus court que `plusCourte` (R5.3).
 */
function evaluerTrou(
  bloque: Intervalle,
  ouv: Intervalle,
  occupe: Intervalle[],
  plusCourte: number,
): { accole: boolean; deconseille: boolean } {
  let finPrec = ouv.debut.getTime();
  let debutSuiv = ouv.fin.getTime();
  for (const b of occupe) {
    if (b.fin.getTime() <= bloque.debut.getTime())
      finPrec = Math.max(finPrec, b.fin.getTime());
    if (b.debut.getTime() >= bloque.fin.getTime())
      debutSuiv = Math.min(debutSuiv, b.debut.getTime());
  }
  const trouGauche = (bloque.debut.getTime() - finPrec) / 60000;
  const trouDroite = (debutSuiv - bloque.fin.getTime()) / 60000;

  // Accolé : touche une occupation réelle (et non le simple bord d'ouverture).
  const toucheOccupation = occupe.some(
    (b) =>
      b.fin.getTime() === bloque.debut.getTime() ||
      b.debut.getTime() === bloque.fin.getTime(),
  );

  const deconseille =
    (trouGauche > 0 &&
      trouGauche < plusCourte &&
      bloque.debut.getTime() !== ouv.debut.getTime()) ||
    (trouDroite > 0 &&
      trouDroite < plusCourte &&
      bloque.fin.getTime() !== ouv.fin.getTime());

  return { accole: toucheOccupation, deconseille };
}

/** Tri des créneaux selon la stratégie de planning (R5.4). */
export function trierCreneaux(
  creneaux: Creneau[],
  strategie: Reglages["strategiePlanning"],
): Creneau[] {
  const tries = [...creneaux];
  if (strategie === "libre") {
    // Tous les créneaux, simplement par heure.
    tries.sort((a, b) => a.debutExecution.getTime() - b.debutExecution.getTime());
  } else {
    // « optimiser » / « concentrer » : regrouper, déconseillés en dernier (R5.2/R5.3).
    tries.sort((a, b) => {
      if (a.deconseille !== b.deconseille) return a.deconseille ? 1 : -1;
      if (a.score !== b.score) return a.score - b.score;
      return a.debutExecution.getTime() - b.debutExecution.getTime();
    });
  }
  return tries;
}
