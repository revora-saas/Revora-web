// =====================================================================
// Types du moteur de créneaux. Domaine PUR : instants absolus (Date, UTC),
// aucune dépendance à React, Next ou Supabase.
// =====================================================================

/** Intervalle de temps [debut, fin) en instants absolus (UTC). */
export interface Intervalle {
  debut: Date;
  fin: Date;
}

/** Les quatre temps d'une prestation, en minutes (R1.1). */
export interface Temps {
  preparation: number;
  execution: number;
  nettoyage: number;
  battement: number;
}

/** Un segment d'exécution (R1.5). praticienneOccupee=false → temps de pose. */
export interface SegmentDef {
  duree: number; // minutes
  praticienneOccupee: boolean;
  libelle?: string;
}

/** Trajet domicile (R6) : marges de déplacement, invisibles pour la cliente. */
export interface Trajet {
  avant: number; // minutes de trajet aller
  apres: number; // minutes de trajet retour
}

/** Résultat du calcul des fenêtres d'un rendez-vous. */
export interface Fenetres {
  /** Ce que voit la cliente (R1.1) : début → fin d'exécution. */
  visible: Intervalle;
  /** Ce que bloque l'agenda (R1.2) : préparation, nettoyage, battement, trajet. */
  bloque: Intervalle;
  /**
   * Sous-intervalles où la PRATICIENNE est réellement occupée (R1.5).
   * Les temps de pose en sont exclus : ce sont eux que l'on écrit dans
   * `occupations` pour la praticienne. La salle, elle, reste occupée
   * tout du long (R1.7) → utiliser `bloque` pour les ressources.
   */
  occupations: Intervalle[];
}

/** Horaire récurrent hebdomadaire, en heure LOCALE. */
export interface HoraireRecurrent {
  jourSemaine: number; // 0 = dimanche … 6 = samedi
  debut: string; // "HH:MM" local
  fin: string; // "HH:MM" local
}

/** Une praticienne et ses contraintes (déjà en UTC). */
export interface Membre {
  id: string;
  /** Horaires propres ; si vide, suit ceux de l'établissement (R4.1). */
  horaires: HoraireRecurrent[];
  /** Congés, absences, pauses, blocages (R4.1). */
  indisponibilites: Intervalle[];
  /** Occupations existantes de la praticienne (segments occupés uniquement). */
  occupations: Intervalle[];
  /** Prestations autorisées (R3.1). undefined = toutes. */
  competences?: Set<string>;
}

/** Une ressource (salle, poste, équipement) et ses occupations (R2). */
export interface Ressource {
  id: string;
  occupations: Intervalle[];
}

/** Réglages exposés à la pro qui influent sur la recherche (R16). */
export interface Reglages {
  granularite: number; // minutes (R4.5)
  delaiMin: number; // minutes avant le créneau (R4.3)
  horizonJours: number; // R4.4
  strategiePlanning: "optimiser" | "libre" | "concentrer"; // R5.4
}

/** Un créneau proposé. */
export interface Creneau {
  debutExecution: Date;
  finExecution: Date;
  debutBloque: Date;
  finBloque: Date;
  membreId: string;
  /** Accolé à un rendez-vous existant (R5.2) : ne crée pas de trou. */
  accole: boolean;
  /** Laisse derrière lui un trou invendable (R5.3). */
  deconseille: boolean;
  /** Score de tri (plus petit = proposé en premier). */
  score: number;
}
