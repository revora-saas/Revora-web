-- =====================================================================
-- REVORA — Migration 20 : modèles de messages système (R14)
-- etablissement_id NULL = modèle système, lisible par tous, surchargeable
-- par établissement. Variables : {prenom}, {date}, {heure}, {salon}, {lien}.
-- =====================================================================

insert into modeles_messages (etablissement_id, code, canal, objet, contenu) values
  (null, 'confirmation', 'sms', null,
   'Bonjour {prenom}, votre rendez-vous chez {salon} le {date} a {heure} est confirme. A bientot !'),
  (null, 'rappel_j1', 'sms', null,
   'Rappel : rendez-vous chez {salon} demain {date} a {heure}. Repondez OUI pour confirmer, NON pour annuler.'),
  (null, 'rappel_j2h', 'sms', null,
   'Votre rendez-vous chez {salon} est dans 2h ({heure}). A tout a l''heure !'),
  (null, 'annulation', 'sms', null,
   'Votre rendez-vous chez {salon} du {date} a ete annule.'),
  (null, 'liste_attente', 'sms', null,
   'Un creneau s''est libere chez {salon} le {date} a {heure}. Repondez OUI pour le reserver (premiere arrivee).'),
  (null, 'liste_attente_pris', 'sms', null,
   'Le creneau chez {salon} vient d''etre pris. Vous restez sur la liste d''attente.'),
  (null, 'retouche', 'sms', null,
   'Il est temps de planifier votre retouche chez {salon}. Reservez : {lien}'),
  (null, 'confirmation', 'email', 'Confirmation de votre rendez-vous',
   'Bonjour {prenom}, votre rendez-vous chez {salon} le {date} a {heure} est confirme.');
