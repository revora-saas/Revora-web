// Contenu des pages métier du site vitrine (SEO + promesse « adapté »).
// Une page par métier — dérivé de specs/revora-adaptation-metier.md.

export interface MetierVitrine {
  slug: string;
  nom: string;
  accroche: string;
  intro: string;
  fonctions: { titre: string; texte: string }[];
}

export const METIERS_VITRINE: MetierVitrine[] = [
  {
    slug: "prothesiste-ongulaire",
    nom: "Prothésiste ongulaire",
    accroche: "Le logiciel pensé pour les ongulaires",
    intro:
      "Gérez vos poses et remplissages, relancez automatiquement au bon moment et ne perdez plus une cliente au profit d'un lapin.",
    fonctions: [
      { titre: "Cycle de remplissage", texte: "Rappel automatique à l'approche des 3–4 semaines, pour remplir votre agenda sans y penser." },
      { titre: "Portfolio photos", texte: "Gardez la trace des poses réalisées, avec le consentement de vos clientes." },
      { titre: "Allergies suivies", texte: "Résine, méthacrylate : les alertes santé remontent en haut de fiche." },
      { titre: "Anti no-show", texte: "Rappels bidirectionnels, acompte et score de fiabilité pour en finir avec les absences." },
    ],
  },
  {
    slug: "technicienne-cils",
    nom: "Technicienne cils",
    accroche: "Le logiciel des expertes du regard",
    intro:
      "Fiches de mapping, cycles de remplissage et patch test obligatoire : tout ce qu'il faut pour un travail précis et sûr.",
    fonctions: [
      { titre: "Fiche de mapping", texte: "Courbure, épaisseur, longueurs : historisées à chaque pose." },
      { titre: "Patch test bloquant", texte: "Alerte avant une première pose si le patch test colle est absent." },
      { titre: "Remplissages relancés", texte: "Vos clientes reviennent au bon rythme, sans effort de votre part." },
      { titre: "Anti no-show", texte: "Le cœur de Revora : plus de créneaux perdus." },
    ],
  },
  {
    slug: "pmu-brow-artist",
    nom: "PMU / Brow Artist",
    accroche: "Le logiciel de la dermographie, conforme et complet",
    intro:
      "Traçabilité des pigments, consentements signés, dossier prêt contrôle : la profondeur métier que les généralistes n'ont pas.",
    fonctions: [
      { titre: "Traçabilité pigments", texte: "Marque, teinte, numéro de lot, péremption, conformité REACH — clôture impossible sans dossier complet." },
      { titre: "Consentements signés", texte: "Consentement aux soins et à l'image, signés sur écran et archivés." },
      { titre: "Dossier prêt contrôle", texte: "Export complet par cliente : consentements, traçabilité, photos, historique." },
      { titre: "Retouches planifiées", texte: "Rappel automatique dans la fenêtre recommandée." },
    ],
  },
  {
    slug: "coiffure-femme",
    nom: "Coiffure femme",
    accroche: "Le logiciel qui retient vos formules couleur",
    intro:
      "Historique des formules, temps de pose réutilisable et forfaits : l'agenda enfin adapté au salon de coiffure.",
    fonctions: [
      { titre: "Formules couleur", texte: "Nuances, dosage, oxydant, temps : l'historique le plus réclamé du métier." },
      { titre: "Temps de pose exploitable", texte: "Pendant la pose, recevez une autre cliente : votre agenda le calcule tout seul." },
      { titre: "Forfaits", texte: "Coupe + couleur en un clic, cumul des durées et des prix." },
      { titre: "Anti no-show", texte: "Rappels et acomptes pour sécuriser vos journées chargées." },
    ],
  },
  {
    slug: "barbier",
    nom: "Barbier",
    accroche: "Le logiciel qui gère aussi le walk-in",
    intro:
      "File d'attente sans rendez-vous, prestations courtes et fidélité simple : l'outil des barbershops.",
    fonctions: [
      { titre: "File d'attente", texte: "Gérez les arrivées sans réservation avec un temps d'attente estimé." },
      { titre: "Prestations rapides", texte: "Coupe, barbe, contours : un encaissement en quelques secondes." },
      { titre: "Fidélité simple", texte: "Récompensez vos habitués sans usine à gaz." },
      { titre: "Recette du jour", texte: "Suivez votre chiffre en temps réel." },
    ],
  },
  {
    slug: "estheticienne",
    nom: "Esthéticienne / institut",
    accroche: "Le logiciel des instituts de beauté",
    intro:
      "Cures multi-séances, cabines et diagnostic peau : gérez un institut complet sans vous éparpiller.",
    fonctions: [
      { titre: "Cures", texte: "Forfait de N séances, décompte automatique et relance." },
      { titre: "Cabines", texte: "Suivez l'occupation de vos espaces de soin." },
      { titre: "Diagnostic peau", texte: "Fiche technique adaptée, historisée à chaque visite." },
      { titre: "Anti no-show", texte: "Rappels et acomptes pour un planning qui tient." },
    ],
  },
  {
    slug: "maquilleuse",
    nom: "Maquilleuse professionnelle",
    accroche: "Le logiciel de l'événementiel beauté",
    intro:
      "Essai + jour J liés, devis et déplacements : l'organisation des mariages et shootings, simplifiée.",
    fonctions: [
      { titre: "Essai / jour J", texte: "Deux rendez-vous liés, réservés ensemble, avec acompte élevé." },
      { titre: "Devis", texte: "Prestations sur mesure, prix à confirmer." },
      { titre: "Domicile", texte: "Adresse, temps de trajet et frais de déplacement automatiques." },
      { titre: "Anti no-show", texte: "Sécurisez les prestations à forte valeur." },
    ],
  },
  {
    slug: "spa",
    nom: "Spa / centre de soins",
    accroche: "Le logiciel des spas et centres de bien-être",
    intro:
      "Cabines multiples, soins en duo et cures : orchestrez un centre complet, plusieurs praticiennes à la fois.",
    fonctions: [
      { titre: "Soins en duo", texte: "Deux clients, deux praticiennes, une cabine, sur le même créneau." },
      { titre: "Cabines multiples", texte: "Visualisez l'occupation de toutes vos cabines." },
      { titre: "Cures", texte: "Forfaits multi-séances suivis automatiquement." },
      { titre: "Anti no-show", texte: "Rappels et acomptes à l'échelle du centre." },
    ],
  },
];

export function getMetierVitrine(slug: string): MetierVitrine | undefined {
  return METIERS_VITRINE.find((m) => m.slug === slug);
}
