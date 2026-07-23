import { describe, it, expect } from "vitest";
import { fromZonedTime } from "date-fns-tz";
import {
  calculerFenetres,
  construireOuvertures,
  rechercherCreneaux,
  ordonnerMembres,
  soustraire,
  fusionner,
  type Membre,
  type Temps,
  type SegmentDef,
} from "../index";

const FUSEAU = "Europe/Paris";
const U = (iso: string) => new Date(iso); // instant UTC explicite

// Horaire type : 9h–19h le lundi (jourSemaine 1) et samedi (6).
const HORAIRES_9_19 = [
  { jourSemaine: 1, debut: "09:00", fin: "19:00" },
  { jourSemaine: 6, debut: "09:00", fin: "19:00" },
];

function membreVide(id = "m1"): Membre {
  return { id, horaires: [], indisponibilites: [], occupations: [] };
}

// =====================================================================
describe("Calcul des durées (R1)", () => {
  it("cas des 2 h 30 : cliente voit 2 h, agenda bloque 2 h 30 (R1.3)", () => {
    // Microblading : préparation 10, exécution 120, nettoyage 20.
    const temps: Temps = { preparation: 10, execution: 120, nettoyage: 20, battement: 0 };
    // La cliente réserve à 10:00 (heure d'exécution).
    const debutExec = U("2026-07-06T08:00:00Z"); // 10:00 Paris (été, +2)
    const f = calculerFenetres(debutExec, temps);

    expect(f.visible.debut.toISOString()).toBe("2026-07-06T08:00:00.000Z");
    expect(f.visible.fin.toISOString()).toBe("2026-07-06T10:00:00.000Z"); // +2 h
    // L'agenda bloque 09:50 → 12:20 Paris = 07:50 → 10:20 UTC.
    expect(f.bloque.debut.toISOString()).toBe("2026-07-06T07:50:00.000Z");
    expect(f.bloque.fin.toISOString()).toBe("2026-07-06T10:20:00.000Z");
    // Une seule plage occupée (pas de temps de pose).
    expect(f.occupations).toHaveLength(1);
    expect(f.occupations[0].debut.toISOString()).toBe("2026-07-06T07:50:00.000Z");
    expect(f.occupations[0].fin.toISOString()).toBe("2026-07-06T10:20:00.000Z");
  });

  it("temps de pose : la praticienne se libère pendant la pose (R1.5)", () => {
    // Coloration : application 20 (occupé) → pose 30 (libre) → rinçage 40 (occupé).
    const temps: Temps = { preparation: 0, execution: 0, nettoyage: 0, battement: 0 };
    const segments: SegmentDef[] = [
      { duree: 20, praticienneOccupee: true },
      { duree: 30, praticienneOccupee: false },
      { duree: 40, praticienneOccupee: true },
    ];
    const debut = U("2026-07-06T07:00:00Z");
    const f = calculerFenetres(debut, temps, segments);

    // Durée totale bloquée : 1 h 30.
    expect(f.bloque.debut.toISOString()).toBe("2026-07-06T07:00:00.000Z");
    expect(f.bloque.fin.toISOString()).toBe("2026-07-06T08:30:00.000Z");
    // Deux plages occupées, la pose (07:20→07:50) est libre.
    expect(f.occupations).toHaveLength(2);
    expect(f.occupations[0].fin.toISOString()).toBe("2026-07-06T07:20:00.000Z");
    expect(f.occupations[1].debut.toISOString()).toBe("2026-07-06T07:50:00.000Z");
  });
});

// =====================================================================
describe("Changement d'heure (R15.5)", () => {
  it("été : 09:00 Paris = 07:00 UTC (+2)", () => {
    const ouv = construireOuvertures(
      FUSEAU,
      { debut: U("2026-07-06T00:00:00Z"), fin: U("2026-07-06T23:00:00Z") },
      [{ jourSemaine: 1, debut: "09:00", fin: "19:00" }],
    );
    expect(ouv[0].debut.toISOString()).toBe("2026-07-06T07:00:00.000Z");
    expect(ouv[0].fin.toISOString()).toBe("2026-07-06T17:00:00.000Z");
  });

  it("hiver : 09:00 Paris = 08:00 UTC (+1)", () => {
    const ouv = construireOuvertures(
      FUSEAU,
      { debut: U("2026-01-19T00:00:00Z"), fin: U("2026-01-19T23:00:00Z") },
      [{ jourSemaine: 1, debut: "09:00", fin: "19:00" }],
    );
    expect(ouv[0].debut.toISOString()).toBe("2026-01-19T08:00:00.000Z");
    expect(ouv[0].fin.toISOString()).toBe("2026-01-19T18:00:00.000Z");
  });

  it("bascule de printemps (29 mars) : l'ouverture reste à la bonne heure locale", () => {
    // Le 28/03 (sam, hiver +1) et le 29/03 (dim, été +2) : même 09:00 local,
    // décalage UTC différent → aucun RDV ne « glisse ».
    const sam = construireOuvertures(
      FUSEAU,
      { debut: U("2026-03-28T00:00:00Z"), fin: U("2026-03-28T23:00:00Z") },
      [{ jourSemaine: 6, debut: "09:00", fin: "19:00" }],
    );
    const dim = construireOuvertures(
      FUSEAU,
      { debut: U("2026-03-29T00:00:00Z"), fin: U("2026-03-29T23:00:00Z") },
      [{ jourSemaine: 0, debut: "09:00", fin: "19:00" }],
    );
    expect(sam[0].debut.toISOString()).toBe("2026-03-28T08:00:00.000Z"); // +1
    expect(dim[0].debut.toISOString()).toBe("2026-03-29T07:00:00.000Z"); // +2
  });
});

// =====================================================================
describe("Recherche de créneaux (R5.1)", () => {
  const base = {
    periode: { debut: U("2026-07-06T00:00:00Z"), fin: U("2026-07-06T23:00:00Z") },
    maintenant: U("2026-07-01T00:00:00Z"),
    fuseau: FUSEAU,
    reglages: {
      granularite: 15,
      delaiMin: 0,
      horizonJours: 90,
      strategiePlanning: "libre" as const,
    },
    horairesEtablissement: HORAIRES_9_19,
    indisponibilitesEtablissement: [],
    ressources: [],
    prestationLaPlusCourteMinutes: 30,
  };

  it("propose le premier créneau à l'ouverture (07:10 UTC pour un 2 h 30)", () => {
    const creneaux = rechercherCreneaux({
      ...base,
      prestation: {
        temps: { preparation: 10, execution: 120, nettoyage: 20, battement: 0 },
        ressourceIds: [],
      },
      membres: [membreVide()],
    });
    expect(creneaux.length).toBeGreaterThan(0);
    // bloque.debut = 07:00 UTC (ouverture) → exécution à 07:10.
    expect(creneaux[0].debutBloque.toISOString()).toBe("2026-07-06T07:00:00.000Z");
    expect(creneaux[0].debutExecution.toISOString()).toBe("2026-07-06T07:10:00.000Z");
  });

  it("ne déborde jamais de la fermeture, nettoyage compris (R4.6)", () => {
    const creneaux = rechercherCreneaux({
      ...base,
      prestation: {
        temps: { preparation: 10, execution: 120, nettoyage: 20, battement: 0 },
        ressourceIds: [],
      },
      membres: [membreVide()],
    });
    // Fermeture 19:00 Paris = 17:00 UTC. Aucun créneau ne finit après.
    const fermeture = U("2026-07-06T17:00:00Z").getTime();
    expect(creneaux.every((c) => c.finBloque.getTime() <= fermeture)).toBe(true);
    // Le dernier départ possible bloque à 14:30 UTC (16:30 Paris) : 14:30 + 2 h 30 = 17:00.
    const dernier = Math.max(...creneaux.map((c) => c.debutBloque.getTime()));
    expect(new Date(dernier).toISOString()).toBe("2026-07-06T14:30:00.000Z");
  });

  it("exclut les créneaux en collision avec une occupation existante", () => {
    const membre = membreVide();
    // Occupée 10:00→12:00 Paris = 08:00→10:00 UTC.
    membre.occupations = [{ debut: U("2026-07-06T08:00:00Z"), fin: U("2026-07-06T10:00:00Z") }];
    const creneaux = rechercherCreneaux({
      ...base,
      prestation: {
        temps: { preparation: 0, execution: 60, nettoyage: 0, battement: 0 },
        ressourceIds: [],
      },
      membres: [membre],
    });
    const occDebut = U("2026-07-06T08:00:00Z").getTime();
    const occFin = U("2026-07-06T10:00:00Z").getTime();
    // Aucun créneau ne chevauche l'occupation.
    const chevauche = creneaux.some(
      (c) => c.debutBloque.getTime() < occFin && occDebut < c.finBloque.getTime(),
    );
    expect(chevauche).toBe(false);
  });

  it("réutilise le temps de pose d'un autre rendez-vous (R1.6)", () => {
    const membre = membreVide();
    // RDV coloration existant : occupé 07:00–07:15 et 07:45–08:15, pose libre
    // 07:15–07:45 (alignée sur la granularité de 15 min).
    membre.occupations = [
      { debut: U("2026-07-06T07:00:00Z"), fin: U("2026-07-06T07:15:00Z") },
      { debut: U("2026-07-06T07:45:00Z"), fin: U("2026-07-06T08:15:00Z") },
    ];
    const creneaux = rechercherCreneaux({
      ...base,
      prestation: {
        temps: { preparation: 0, execution: 30, nettoyage: 0, battement: 0 },
        ressourceIds: [],
      },
      membres: [membre],
    });
    // Un créneau de 30 min doit tenir exactement dans la pose 07:15→07:45.
    const dansLaPose = creneaux.some(
      (c) => c.debutExecution.toISOString() === "2026-07-06T07:15:00.000Z",
    );
    expect(dansLaPose).toBe(true);
  });

  it("respecte le délai minimum de réservation (R4.3)", () => {
    const creneaux = rechercherCreneaux({
      ...base,
      maintenant: U("2026-07-06T07:00:00Z"), // le jour même, à l'ouverture
      reglages: { ...base.reglages, delaiMin: 120 }, // 2 h de délai
      prestation: {
        temps: { preparation: 0, execution: 60, nettoyage: 0, battement: 0 },
        ressourceIds: [],
      },
      membres: [membreVide()],
    });
    // Rien avant 09:00 UTC (07:00 + 2 h).
    const borne = U("2026-07-06T09:00:00Z").getTime();
    expect(creneaux.every((c) => c.debutExecution.getTime() >= borne)).toBe(true);
  });
});

// =====================================================================
describe("Rendez-vous à domicile (R6)", () => {
  it("le trajet allonge la fenêtre bloquée et espace deux RDV (R6.5)", () => {
    const temps: Temps = { preparation: 0, execution: 60, nettoyage: 0, battement: 0 };
    const trajet = { avant: 30, apres: 30 };
    const debut = U("2026-07-06T08:00:00Z");
    const f = calculerFenetres(debut, temps, undefined, trajet);
    // Visite 60 min, mais bloqué 120 min (trajet aller + retour).
    expect(f.bloque.debut.toISOString()).toBe("2026-07-06T07:30:00.000Z");
    expect(f.bloque.fin.toISOString()).toBe("2026-07-06T09:30:00.000Z");
    expect(f.occupations[0].debut.toISOString()).toBe("2026-07-06T07:30:00.000Z");
    expect(f.occupations[0].fin.toISOString()).toBe("2026-07-06T09:30:00.000Z");

    // Un premier RDV domicile occupe 07:30→09:30 : le suivant ne peut démarrer
    // qu'après, trajet compris.
    const membre = membreVide();
    membre.occupations = [f.bloque];
    const creneaux = rechercherCreneaux({
      periode: { debut: U("2026-07-06T00:00:00Z"), fin: U("2026-07-06T23:00:00Z") },
      maintenant: U("2026-07-01T00:00:00Z"),
      fuseau: FUSEAU,
      reglages: { granularite: 15, delaiMin: 0, horizonJours: 90, strategiePlanning: "libre" },
      horairesEtablissement: HORAIRES_9_19,
      indisponibilitesEtablissement: [],
      ressources: [],
      prestationLaPlusCourteMinutes: 30,
      prestation: { temps, trajet, ressourceIds: [] },
      membres: [membre],
    });
    // Tous les créneaux évitent la plage occupée du premier.
    const chevauche = creneaux.some(
      (c) =>
        c.debutBloque.getTime() < f.bloque.fin.getTime() &&
        f.bloque.debut.getTime() < c.finBloque.getTime(),
    );
    expect(chevauche).toBe(false);
  });
});

// =====================================================================
describe("Affectation automatique (R5.6)", () => {
  it("privilégie la praticienne habituelle", () => {
    const ordre = ordonnerMembres(
      [
        { membreId: "a", fragmentation: 0, charge: 60 },
        { membreId: "b", fragmentation: 3, charge: 300 },
      ],
      { membreHabituelId: "a" },
    );
    expect(ordre[0]).toBe("a");
  });

  it("sinon, comble la journée la plus fragmentée puis la moins chargée", () => {
    const ordre = ordonnerMembres([
      { membreId: "peu_charge", fragmentation: 1, charge: 30 },
      { membreId: "fragmentee", fragmentation: 4, charge: 200 },
    ]);
    expect(ordre[0]).toBe("fragmentee");
  });
});

// =====================================================================
describe("Algèbre d'intervalles", () => {
  it("soustraction : pause déjeuner découpe la journée", () => {
    const res = soustraire(
      [{ debut: U("2026-07-06T07:00:00Z"), fin: U("2026-07-06T17:00:00Z") }],
      [{ debut: U("2026-07-06T10:00:00Z"), fin: U("2026-07-06T11:00:00Z") }],
    );
    expect(res).toHaveLength(2);
    expect(res[0].fin.toISOString()).toBe("2026-07-06T10:00:00.000Z");
    expect(res[1].debut.toISOString()).toBe("2026-07-06T11:00:00.000Z");
  });

  it("fusion : deux plages contiguës n'en font qu'une", () => {
    const res = fusionner([
      { debut: U("2026-07-06T07:00:00Z"), fin: U("2026-07-06T08:00:00Z") },
      { debut: U("2026-07-06T08:00:00Z"), fin: U("2026-07-06T09:00:00Z") },
    ]);
    expect(res).toHaveLength(1);
    expect(res[0].fin.toISOString()).toBe("2026-07-06T09:00:00.000Z");
  });
});

// Cohérence : fromZonedTime utilisé dans les tests correspond bien au moteur.
describe("Ancrage fuseau", () => {
  it("10:00 Paris été = 08:00 UTC", () => {
    expect(fromZonedTime("2026-07-06T10:00:00", FUSEAU).toISOString()).toBe(
      "2026-07-06T08:00:00.000Z",
    );
  });
});
