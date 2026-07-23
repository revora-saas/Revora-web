-- =====================================================================
-- REVORA — Migration 13 : seed des profils métier (référentiel `metiers`)
-- Configurations dérivées de specs/revora-adaptation-metier.md (M1.2, §3).
--
-- Un profil = une configuration (M1.1). Ajouter un métier = écrire une
-- configuration, sans toucher au code des écrans (M7.2).
--
-- Structure de `configuration` :
--   vocabulaire       { client, prestation, ressource }
--   modules           { <clé>: bool }  — un module masqué est invisible (M1.5)
--   catalogue_defaut  [ { nom, duree_preparation, duree_execution, duree_nettoyage, prix } ]
--   fiche_technique   [ { cle, libelle, type, obligatoire, options? } ]  (M7.3, déclaratif)
--   widgets_accueil   [ <clé> ]  — ordre pondéré par le métier (M5)
--   reglages_defaut   { battement_defaut, cycle_rappel_jours?, ... }
-- =====================================================================

insert into metiers (code, libelle, configuration) values

-- ------------------------------------------------------------------ ONGLES
('ongles', 'Prothésiste ongulaire', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "poste" },
  "modules": {
    "cycle_remplissage": true, "photos_portfolio": true, "allergies": true,
    "temps_pose": false, "formule_couleur": false, "tracabilite_pigments": false,
    "consentements": false, "dossier_ars": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Pose complète gel", "duree_preparation": 5, "duree_execution": 90, "duree_nettoyage": 10, "prix": 45, "cycle_rappel_jours": 21 },
    { "nom": "Remplissage gel", "duree_preparation": 5, "duree_execution": 75, "duree_nettoyage": 10, "prix": 35, "cycle_rappel_jours": 21 },
    { "nom": "Dépose", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 15 },
    { "nom": "Semi-permanent", "duree_preparation": 5, "duree_execution": 45, "duree_nettoyage": 5, "prix": 25, "cycle_rappel_jours": 21 },
    { "nom": "Nail art", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 15 }
  ],
  "fiche_technique": [
    { "cle": "allergies", "libelle": "Allergies", "type": "multi", "obligatoire": false, "options": ["Résine", "Méthacrylate", "Colle", "Latex"] },
    { "cle": "forme", "libelle": "Forme habituelle", "type": "liste", "obligatoire": false, "options": ["Amande", "Carrée", "Ovale", "Ballerine", "Stiletto"] },
    { "cle": "longueur", "libelle": "Longueur habituelle", "type": "liste", "obligatoire": false, "options": ["Courte", "Moyenne", "Longue"] },
    { "cle": "type_pose", "libelle": "Type de pose", "type": "liste", "obligatoire": false, "options": ["Gel", "Résine", "Semi-permanent"] }
  ],
  "widgets_accueil": ["rdv_jour", "remplissages_relancer", "stock_faible", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 0, "cycle_rappel_jours": 21 }
}'),

-- -------------------------------------------------------------------- CILS
('cils', 'Technicienne cils', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "cabine" },
  "modules": {
    "mapping": true, "cycle_remplissage": true, "patch_test": true, "allergies": true,
    "photos_portfolio": true, "tracabilite_pigments": false, "consentements": false,
    "dossier_ars": false, "temps_pose": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Pose cil a cil", "duree_preparation": 5, "duree_execution": 120, "duree_nettoyage": 10, "prix": 70, "patch_test": true, "cycle_rappel_jours": 21 },
    { "nom": "Volume russe", "duree_preparation": 5, "duree_execution": 150, "duree_nettoyage": 10, "prix": 90, "patch_test": true, "cycle_rappel_jours": 21 },
    { "nom": "Remplissage", "duree_preparation": 5, "duree_execution": 90, "duree_nettoyage": 10, "prix": 45, "cycle_rappel_jours": 21 },
    { "nom": "Dépose", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 20 },
    { "nom": "Rehaussement", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 5, "prix": 45 }
  ],
  "fiche_technique": [
    { "cle": "courbure", "libelle": "Courbure", "type": "liste", "obligatoire": false, "options": ["B", "C", "CC", "D", "L", "M"] },
    { "cle": "epaisseur", "libelle": "Épaisseur", "type": "liste", "obligatoire": false, "options": ["0.03", "0.05", "0.07", "0.10", "0.15", "0.20"] },
    { "cle": "longueurs", "libelle": "Longueurs", "type": "texte", "obligatoire": false },
    { "cle": "mapping", "libelle": "Mapping", "type": "texte", "obligatoire": false },
    { "cle": "date_patch_test", "libelle": "Date du patch test colle", "type": "date", "obligatoire": true }
  ],
  "widgets_accueil": ["rdv_jour", "remplissages_avenir", "premieres_poses_sans_patch", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 0, "cycle_rappel_jours": 21 }
}'),

-- --------------------------------------------------------------------- PMU
('pmu', 'Brow Artist / PMU (dermographe)', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "poste de travail" },
  "modules": {
    "tracabilite_pigments": true, "consentements": true, "dossier_ars": true,
    "retouches": true, "photos_portfolio": true, "allergies": true,
    "mapping": true, "temps_pose": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Microblading", "duree_preparation": 10, "duree_execution": 120, "duree_nettoyage": 20, "prix": 300, "pmu": true, "cycle_rappel_jours": 42 },
    { "nom": "Sourcils poudré", "duree_preparation": 10, "duree_execution": 150, "duree_nettoyage": 20, "prix": 350, "pmu": true, "cycle_rappel_jours": 42 },
    { "nom": "Lèvres", "duree_preparation": 10, "duree_execution": 150, "duree_nettoyage": 20, "prix": 400, "pmu": true, "cycle_rappel_jours": 42 },
    { "nom": "Eyeliner", "duree_preparation": 10, "duree_execution": 90, "duree_nettoyage": 20, "prix": 250, "pmu": true, "cycle_rappel_jours": 42 },
    { "nom": "Retouche", "duree_preparation": 10, "duree_execution": 90, "duree_nettoyage": 20, "prix": 80, "pmu": true },
    { "nom": "Consultation", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 0, "prix": 0 }
  ],
  "fiche_technique": [
    { "cle": "phototype", "libelle": "Phototype", "type": "liste", "obligatoire": true, "options": ["I", "II", "III", "IV", "V", "VI"] },
    { "cle": "contre_indications", "libelle": "Contre-indications", "type": "multi", "obligatoire": true, "options": ["Grossesse", "Allaitement", "Diabète", "Traitement anticoagulant", "Herpès", "Allergie"] },
    { "cle": "mapping", "libelle": "Mapping / dessin", "type": "texte", "obligatoire": false },
    { "cle": "pigment", "libelle": "Pigment (marque et teinte)", "type": "texte", "obligatoire": true },
    { "cle": "profondeur", "libelle": "Profondeur", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["rdv_jour", "retouches_planifier", "consentements_manquants", "pigments_perimes"],
  "reglages_defaut": { "battement_defaut": 10, "cycle_rappel_jours": 42 }
}'),

-- --------------------------------------------------------------- COIFFURE F
('coiffure_f', 'Coiffure femme', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "fauteuil" },
  "modules": {
    "temps_pose": true, "formule_couleur": true, "forfaits": true, "allergies": true,
    "photos_portfolio": true, "tracabilite_pigments": false, "consentements": false,
    "dossier_ars": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Coupe", "duree_preparation": 0, "duree_execution": 45, "duree_nettoyage": 5, "prix": 35 },
    { "nom": "Brushing", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 25 },
    { "nom": "Couleur", "duree_preparation": 5, "duree_execution": 90, "duree_nettoyage": 10, "prix": 55 },
    { "nom": "Balayage", "duree_preparation": 5, "duree_execution": 150, "duree_nettoyage": 10, "prix": 90 },
    { "nom": "Mèches", "duree_preparation": 5, "duree_execution": 120, "duree_nettoyage": 10, "prix": 75 },
    { "nom": "Soin", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 20 },
    { "nom": "Forfait coupe + couleur", "duree_preparation": 5, "duree_execution": 120, "duree_nettoyage": 10, "prix": 80 }
  ],
  "fiche_technique": [
    { "cle": "formule_couleur", "libelle": "Formule couleur (nuances)", "type": "texte", "obligatoire": false },
    { "cle": "dosage", "libelle": "Dosage", "type": "texte", "obligatoire": false },
    { "cle": "oxydant", "libelle": "Oxydant", "type": "liste", "obligatoire": false, "options": ["10 vol", "20 vol", "30 vol", "40 vol"] },
    { "cle": "temps_pose", "libelle": "Temps de pose (min)", "type": "nombre", "obligatoire": false },
    { "cle": "longueur", "libelle": "Longueur", "type": "liste", "obligatoire": false, "options": ["Courte", "Mi-longue", "Longue"] },
    { "cle": "nature_cheveu", "libelle": "Nature du cheveu", "type": "liste", "obligatoire": false, "options": ["Lisse", "Ondulé", "Bouclé", "Crépu"] }
  ],
  "widgets_accueil": ["rdv_jour", "taux_remplissage", "temps_pose_exploitables", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 0 }
}'),

-- ----------------------------------------------------------------- BARBIER
('barbier', 'Barbier / coiffeur homme', '{
  "vocabulaire": { "client": "client", "prestation": "prestation", "ressource": "fauteuil" },
  "modules": {
    "file_attente": true, "fidelite_simple": true, "allergies": false,
    "photos_portfolio": false, "consentements": false, "tracabilite_pigments": false,
    "temps_pose": false, "formule_couleur": false
  },
  "catalogue_defaut": [
    { "nom": "Coupe", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 20 },
    { "nom": "Barbe", "duree_preparation": 0, "duree_execution": 20, "duree_nettoyage": 5, "prix": 15 },
    { "nom": "Coupe + barbe", "duree_preparation": 0, "duree_execution": 45, "duree_nettoyage": 5, "prix": 30 },
    { "nom": "Contours", "duree_preparation": 0, "duree_execution": 15, "duree_nettoyage": 5, "prix": 10 },
    { "nom": "Rasage traditionnel", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 25 }
  ],
  "fiche_technique": [
    { "cle": "coupe_habituelle", "libelle": "Coupe habituelle", "type": "texte", "obligatoire": false },
    { "cle": "numero_sabot", "libelle": "Numéro de sabot", "type": "texte", "obligatoire": false },
    { "cle": "preferences", "libelle": "Préférences", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["file_attente", "rdv_jour", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 0 }
}'),

-- -------------------------------------------------------------- ESTHÉTIQUE
('esthetique', 'Esthéticienne / institut', '{
  "vocabulaire": { "client": "cliente", "prestation": "soin", "ressource": "cabine" },
  "modules": {
    "cabines": true, "cures": true, "diagnostic_peau": true, "allergies": true,
    "photos_portfolio": true, "tracabilite_pigments": false, "consentements": false,
    "temps_pose": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Soin visage", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 55 },
    { "nom": "Épilation", "duree_preparation": 0, "duree_execution": 30, "duree_nettoyage": 5, "prix": 25 },
    { "nom": "Massage", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 60 },
    { "nom": "Gommage", "duree_preparation": 5, "duree_execution": 45, "duree_nettoyage": 10, "prix": 40 },
    { "nom": "Cure amincissante (séance)", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 50 }
  ],
  "fiche_technique": [
    { "cle": "type_peau", "libelle": "Type de peau", "type": "liste", "obligatoire": false, "options": ["Normale", "Sèche", "Grasse", "Mixte", "Sensible"] },
    { "cle": "contre_indications", "libelle": "Contre-indications", "type": "multi", "obligatoire": false, "options": ["Grossesse", "Traitement", "Pathologie", "Allergie"] },
    { "cle": "zones", "libelle": "Zones traitées", "type": "texte", "obligatoire": false },
    { "cle": "cure_en_cours", "libelle": "Cure en cours", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["rdv_jour", "cures_en_cours", "occupation_cabines", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 5 }
}'),

-- ------------------------------------------------------------- MAQUILLAGE
('maquillage', 'Maquilleuse professionnelle', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "déplacement" },
  "modules": {
    "evenementiel": true, "devis": true, "domicile": true, "essai_jour_j": true,
    "allergies": true, "photos_portfolio": true, "tracabilite_pigments": false,
    "consentements": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Essai mariée", "duree_preparation": 10, "duree_execution": 90, "duree_nettoyage": 10, "prix": 80 },
    { "nom": "Maquillage mariée", "duree_preparation": 10, "duree_execution": 90, "duree_nettoyage": 10, "prix": 150 },
    { "nom": "Maquillage soirée", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 60 },
    { "nom": "Maquillage groupe", "duree_preparation": 10, "duree_execution": 120, "duree_nettoyage": 10, "prix": 200 },
    { "nom": "Shooting", "duree_preparation": 10, "duree_execution": 120, "duree_nettoyage": 10, "prix": 180 }
  ],
  "fiche_technique": [
    { "cle": "type_evenement", "libelle": "Type d événement", "type": "liste", "obligatoire": false, "options": ["Mariage", "Soirée", "Shooting", "Groupe", "Autre"] },
    { "cle": "date_evenement", "libelle": "Date de l événement", "type": "date", "obligatoire": false },
    { "cle": "teint", "libelle": "Teint", "type": "texte", "obligatoire": false },
    { "cle": "allergies", "libelle": "Allergies", "type": "multi", "obligatoire": false, "options": ["Latex", "Parfum", "Conservateurs"] },
    { "cle": "photos_inspiration", "libelle": "Photos inspiration", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["evenements_avenir", "devis_attente", "essais_programmer", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 0 }
}'),

-- --------------------------------------------------------------------- SPA
('spa', 'Spa / centre de soins', '{
  "vocabulaire": { "client": "client", "prestation": "soin", "ressource": "cabine" },
  "modules": {
    "cabines": true, "soins_duo": true, "cures": true, "equipe": true,
    "allergies": true, "photos_portfolio": false, "tracabilite_pigments": false,
    "consentements": false, "file_attente": false
  },
  "catalogue_defaut": [
    { "nom": "Massage", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 70 },
    { "nom": "Soin corps", "duree_preparation": 5, "duree_execution": 75, "duree_nettoyage": 10, "prix": 85 },
    { "nom": "Soin en duo", "duree_preparation": 5, "duree_execution": 60, "duree_nettoyage": 10, "prix": 140 },
    { "nom": "Accès spa", "duree_preparation": 0, "duree_execution": 120, "duree_nettoyage": 15, "prix": 40 },
    { "nom": "Forfait journée", "duree_preparation": 10, "duree_execution": 240, "duree_nettoyage": 20, "prix": 180 }
  ],
  "fiche_technique": [
    { "cle": "contre_indications", "libelle": "Contre-indications", "type": "multi", "obligatoire": false, "options": ["Grossesse", "Hypertension", "Problème circulatoire", "Allergie"] },
    { "cle": "preferences", "libelle": "Préférences (pression, huiles)", "type": "texte", "obligatoire": false },
    { "cle": "cure_en_cours", "libelle": "Cure en cours", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["occupation_cabines", "rdv_jour", "cures_en_cours", "recette_jour"],
  "reglages_defaut": { "battement_defaut": 10 }
}'),

-- ------------------------------------------------------- AUTRE (repli M8.3)
('autre', 'Autre / généraliste', '{
  "vocabulaire": { "client": "cliente", "prestation": "prestation", "ressource": "poste" },
  "modules": {
    "allergies": true, "photos_portfolio": true, "temps_pose": false,
    "formule_couleur": false, "tracabilite_pigments": false, "consentements": false,
    "dossier_ars": false, "file_attente": false, "cures": false
  },
  "catalogue_defaut": [
    { "nom": "Prestation", "duree_preparation": 0, "duree_execution": 60, "duree_nettoyage": 5, "prix": 40 }
  ],
  "fiche_technique": [
    { "cle": "notes", "libelle": "Notes techniques", "type": "texte", "obligatoire": false }
  ],
  "widgets_accueil": ["rdv_jour", "recette_jour", "relances_faire"],
  "reglages_defaut": { "battement_defaut": 0 }
}');
