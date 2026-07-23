// Types de la configuration métier (M1.2). Fichier PUR (aucun import serveur) :
// importable aussi bien côté serveur que client.

export type TypeChampFiche =
  | "texte"
  | "nombre"
  | "liste"
  | "date"
  | "booleen"
  | "multi";

export interface ChampFiche {
  cle: string;
  libelle: string;
  type: TypeChampFiche;
  obligatoire: boolean;
  options?: string[];
}

export interface PrestationDefaut {
  nom: string;
  duree_preparation?: number;
  duree_execution: number;
  duree_nettoyage?: number;
  prix?: number;
  pmu?: boolean;
  patch_test?: boolean;
  cycle_rappel_jours?: number;
}

export interface Vocabulaire {
  client: string; // "cliente" / "client"
  prestation: string; // "prestation" / "soin"
  ressource: string; // "poste" / "cabine" / "fauteuil"
}

export interface ConfigurationMetier {
  vocabulaire: Vocabulaire;
  modules: Record<string, boolean>;
  catalogue_defaut: PrestationDefaut[];
  fiche_technique: ChampFiche[];
  widgets_accueil: string[];
  reglages_defaut: Record<string, number | string>;
}

export interface Metier {
  code: string;
  libelle: string;
  configuration: ConfigurationMetier;
}

/** Vocabulaire par défaut si aucun métier n'est encore choisi. */
export const VOCABULAIRE_DEFAUT: Vocabulaire = {
  client: "cliente",
  prestation: "prestation",
  ressource: "poste",
};

/**
 * Ordre d'affichage des métiers dans l'assistant : les 3 profils complets
 * (M8.1) d'abord, « Autre » en dernier (repli M8.3).
 */
export const ORDRE_METIERS = [
  "pmu",
  "ongles",
  "cils",
  "coiffure_f",
  "barbier",
  "esthetique",
  "maquillage",
  "spa",
  "autre",
];
