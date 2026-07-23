// Documents légaux du site vitrine. Modèles de départ à faire valider par un
// juriste avant mise en production (placeholders entre crochets).

export interface DocLegal {
  slug: string;
  titre: string;
  sections: { titre: string; texte: string }[];
}

const SOUS_TRAITANCE_INTRO =
  "Dans le cadre de l'utilisation de Revora, la professionnelle est responsable de traitement des données de ses clientes, et Revora agit en qualité de sous-traitant au sens de l'article 28 du RGPD.";

export const DOCS_LEGAUX: DocLegal[] = [
  {
    slug: "mentions-legales",
    titre: "Mentions légales",
    sections: [
      { titre: "Éditeur", texte: "Le site et le service Revora sont édités par [Raison sociale], [forme juridique] au capital de [montant], immatriculée au RCS de [ville] sous le numéro [SIREN], dont le siège est situé [adresse]." },
      { titre: "Directeur de la publication", texte: "[Nom du représentant légal]." },
      { titre: "Hébergement", texte: "Application : Vercel (région UE). Base de données et stockage : Supabase (région UE). Tâches de fond : Railway (région UE)." },
      { titre: "Contact", texte: "contact@revora.fr" },
    ],
  },
  {
    slug: "confidentialite",
    titre: "Politique de confidentialité",
    sections: [
      { titre: "Responsabilité", texte: SOUS_TRAITANCE_INTRO },
      { titre: "Données traitées", texte: "Revora traite les données de compte des professionnelles (identité, contact, établissement) et, pour leur compte, les données de leurs clientes (identité, contact, historique de rendez-vous, données techniques et de santé pour le PMU)." },
      { titre: "Localisation", texte: "Toutes les données, y compris les photos et données de santé, sont hébergées dans l'Union européenne." },
      { titre: "Durées de conservation", texte: "Les données sont conservées le temps de la relation contractuelle, puis archivées ou anonymisées conformément aux obligations légales. Les données comptables sont conservées selon la durée légale applicable." },
      { titre: "Vos droits", texte: "Droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. L'effacement des données d'une cliente est traité par anonymisation lorsque la conservation d'une preuve légale (traçabilité PMU, comptabilité) l'impose." },
      { titre: "Sécurité", texte: "Isolation stricte par établissement (sécurité au niveau des lignes en base), chiffrement en transit et au repos, photos servies par URL signée à durée limitée." },
    ],
  },
  {
    slug: "cgu",
    titre: "Conditions générales d'utilisation",
    sections: [
      { titre: "Objet", texte: "Les présentes CGU régissent l'accès et l'utilisation du service Revora, logiciel de gestion pour professionnels de la beauté." },
      { titre: "Compte", texte: "L'accès nécessite la création d'un compte avec un numéro de téléphone vérifié. La professionnelle est responsable de la confidentialité de ses identifiants." },
      { titre: "Usage", texte: "Le service est destiné à un usage professionnel. La professionnelle s'engage à un usage licite et à ne pas exploiter le service à des fins de prospection non consentie." },
      { titre: "Disponibilité", texte: "Revora s'efforce d'assurer une disponibilité continue mais ne garantit pas l'absence d'interruption. Des sauvegardes quotidiennes sont réalisées." },
      { titre: "Résiliation", texte: "Le compte peut être résilié à tout moment. Les données restent exportables pendant 30 jours après la résiliation." },
    ],
  },
  {
    slug: "cgv",
    titre: "Conditions générales de vente",
    sections: [
      { titre: "Offre", texte: "Revora propose une offre d'abonnement « Indépendante », en formule mensuelle ou annuelle, précédée d'un essai gratuit de 30 jours." },
      { titre: "Prix et paiement", texte: "Les paiements sont opérés via Stripe. Les prix sont indiqués en euros. La formule annuelle inclut deux mois offerts." },
      { titre: "Quota de messages", texte: "Chaque abonnement inclut un quota de messages SMS. Des crédits supplémentaires peuvent être achetés." },
      { titre: "Rétractation", texte: "L'essai gratuit permet d'évaluer le service sans engagement. La résiliation est possible à tout moment ; l'abonnement annuel n'est pas remboursé au prorata sauf disposition légale contraire." },
      { titre: "Factures", texte: "Les factures sont disponibles au téléchargement depuis l'espace de la professionnelle." },
    ],
  },
  {
    slug: "sous-traitance",
    titre: "Contrat de sous-traitance (RGPD)",
    sections: [
      { titre: "Rôles", texte: SOUS_TRAITANCE_INTRO },
      { titre: "Objet", texte: "Revora traite les données pour le seul compte de la professionnelle et selon ses instructions, aux fins d'exécution du service (agenda, rappels, fiches, caisse)." },
      { titre: "Engagements de Revora", texte: "Confidentialité, sécurité des traitements, notification des violations de données, assistance à l'exercice des droits des personnes, et hébergement dans l'Union européenne. Revora n'exploite jamais les fichiers clients à des fins commerciales propres." },
      { titre: "Sous-traitants ultérieurs", texte: "Revora recourt à des sous-traitants (hébergement, envoi de messages, paiement) situés dans l'UE ou présentant des garanties adéquates. La liste est disponible sur demande." },
      { titre: "Fin du contrat", texte: "À la fin de la relation, les données sont restituées (export) puis supprimées ou anonymisées, sous réserve des obligations légales de conservation." },
    ],
  },
  {
    slug: "cookies",
    titre: "Politique de cookies",
    sections: [
      { titre: "Cookies utilisés", texte: "Revora utilise des cookies strictement nécessaires au fonctionnement (session, sécurité). Aucun cookie publicitaire n'est déposé." },
      { titre: "Mesure d'audience", texte: "Une mesure d'audience respectueuse de la vie privée peut être utilisée, sans traceur publicitaire ni revente de données." },
      { titre: "Gestion", texte: "Vous pouvez configurer votre navigateur pour refuser les cookies ; certaines fonctionnalités pourraient alors être dégradées." },
    ],
  },
];

export function getDocLegal(slug: string): DocLegal | undefined {
  return DOCS_LEGAUX.find((d) => d.slug === slug);
}
