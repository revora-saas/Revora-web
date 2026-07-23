import { describe, it, expect } from "vitest";
import { respecterFenetreSilence } from "../quiet";
import { remplirGabarit } from "../gabarit";
import { candidatsPourCreneau, decouperEnVagues, type CandidatAttente } from "../liste-attente";

const FUSEAU = "Europe/Paris";
const U = (iso: string) => new Date(iso);

describe("Fenêtre de silence (R14.3)", () => {
  it("22 h → reporté au lendemain 8 h", () => {
    // 22:00 Paris (été) = 20:00 UTC.
    const r = respecterFenetreSilence(U("2026-07-01T20:00:00Z"), FUSEAU);
    // Lendemain 8:00 Paris = 06:00 UTC.
    expect(r.toISOString()).toBe("2026-07-02T06:00:00.000Z");
  });
  it("6 h → reporté à 8 h le jour même", () => {
    const r = respecterFenetreSilence(U("2026-07-01T04:00:00Z"), FUSEAU); // 06:00 Paris
    expect(r.toISOString()).toBe("2026-07-01T06:00:00.000Z"); // 08:00 Paris
  });
  it("14 h → inchangé", () => {
    const i = U("2026-07-01T12:00:00Z"); // 14:00 Paris
    expect(respecterFenetreSilence(i, FUSEAU).toISOString()).toBe(i.toISOString());
  });
});

describe("Gabarits (R14)", () => {
  it("remplace les variables connues", () => {
    expect(
      remplirGabarit("Bonjour {prenom}, RDV le {date}.", { prenom: "Léa", date: "5 juillet" }),
    ).toBe("Bonjour Léa, RDV le 5 juillet.");
  });
});

describe("Liste d'attente (R10.2/R10.3)", () => {
  const creneau = {
    // Mercredi 1er juillet 2026, 10:00–11:00 Paris = 08:00–09:00 UTC.
    debut: U("2026-07-01T08:00:00Z"),
    fin: U("2026-07-01T09:00:00Z"),
    prestationId: "presta-A",
  };

  const base: CandidatAttente[] = [
    {
      id: "w1",
      clientId: "c1",
      score: 90,
      creeLe: "2026-06-01T00:00:00Z",
      prestationId: "presta-A",
      disponibilites: [{ jour: 3, debut: "09:00", fin: "12:00" }], // mercredi matin
    },
    {
      id: "w2",
      clientId: "c2",
      score: 60,
      creeLe: "2026-05-01T00:00:00Z",
      prestationId: "presta-A",
      disponibilites: [{ jour: 3, debut: "09:00", fin: "18:00" }],
    },
    {
      id: "w3",
      clientId: "c3",
      score: 100,
      creeLe: "2026-06-15T00:00:00Z",
      prestationId: "presta-B", // autre prestation → exclue
      disponibilites: [{ jour: 3, debut: "00:00", fin: "23:59" }],
    },
    {
      id: "w4",
      clientId: "c4",
      score: 95,
      creeLe: "2026-06-10T00:00:00Z",
      prestationId: "presta-A",
      disponibilites: [{ jour: 3, debut: "14:00", fin: "18:00" }], // ne couvre pas 10:00
    },
  ];

  it("filtre par prestation et disponibilité, trie par fiabilité puis ancienneté", () => {
    const ordre = candidatsPourCreneau(base, creneau, FUSEAU).map((c) => c.id);
    // w3 exclue (prestation B), w4 exclue (dispo l'après-midi).
    // Restent w1 (90) et w2 (60) → tri par score décroissant.
    expect(ordre).toEqual(["w1", "w2"]);
  });

  it("découpe en vagues de 3 (R10.4)", () => {
    const vagues = decouperEnVagues([1, 2, 3, 4, 5], 3);
    expect(vagues).toEqual([[1, 2, 3], [4, 5]]);
  });
});
