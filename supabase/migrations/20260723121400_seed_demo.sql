-- =====================================================================
-- REVORA — Migration 14 : jeu de test (établissement de démonstration)
-- Permet de développer sans partir d'une base vide.
--
-- ⚠️  Données de DÉMO uniquement. À ne pas appliquer en production.
--
-- Pour voir ce salon dans l'application, rattachez votre compte au membre
-- propriétaire (une fois inscrit et connecté) :
--
--   update membres
--     set user_id = auth.uid()
--     where id = 'aaaaaaaa-0000-0000-0000-000000000002';
--
-- (ou remplacez auth.uid() par l'UUID de votre utilisateur auth.users).
-- Cette migration s'exécute en tant que rôle privilégié : le RLS est
-- contourné, ce qui est normal pour un seed.
-- =====================================================================

-- Établissement de démo : un salon d'onglerie.
insert into etablissements (id, nom, slug, ville, code_postal, telephone, email)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Salon Démo', 'salon-demo',
        'Lyon', '69002', '+33400000000', 'demo@revora.fr');

insert into etablissement_metiers (etablissement_id, metier_code, principal)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'ongles', true);

insert into reglages (etablissement_id) values ('aaaaaaaa-0000-0000-0000-000000000001');

insert into abonnements (etablissement_id, statut, essai_fin_le)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'essai', now() + interval '14 days');

-- Membre propriétaire (user_id null : à rattacher à votre compte, cf. entête).
insert into membres (id, etablissement_id, user_id, nom_affiche, role, couleur)
values ('aaaaaaaa-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
        null, 'Camille (démo)', 'proprietaire', '#6d4cff');

-- Horaires : mardi→samedi, 9h–19h.
insert into horaires (etablissement_id, membre_id, jour_semaine, heure_debut, heure_fin)
select 'aaaaaaaa-0000-0000-0000-000000000001', null, j, '09:00', '19:00'
from generate_series(2, 6) as j;

-- Catégorie + prestations.
insert into categories (id, etablissement_id, nom, ordre)
values ('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 'Ongles', 0);

insert into prestations (id, etablissement_id, categorie_id, nom, prix,
                         duree_preparation, duree_execution, duree_nettoyage, ordre)
values
  ('aaaaaaaa-0000-0000-0000-000000000010', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000003', 'Pose complète gel', 45, 5, 90, 10, 0),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000003', 'Remplissage gel', 35, 5, 75, 10, 1),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000003', 'Semi-permanent', 25, 5, 45, 5, 2);

-- Clientes.
insert into clients (id, etablissement_id, nom, prenom, telephone_mobile, email, source)
values
  ('aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Martin', 'Léa', '+33611111111', 'lea.martin@example.fr', 'instagram'),
  ('aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Dubois', 'Sarah', '+33622222222', 'sarah.dubois@example.fr', 'bouche_a_oreille'),
  ('aaaaaaaa-0000-0000-0000-000000000022', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Petit', 'Inès', '+33633333333', null, 'reservation_en_ligne');

-- RDV passé (honoré) : hier 10:00 → 11:30 exécution, bloqué 09:55 → 11:40.
insert into rendez_vous (id, etablissement_id, client_id, membre_id,
                         debut_execution, fin_execution, debut_bloque, fin_bloque,
                         statut, origine, montant_total)
values
  ('aaaaaaaa-0000-0000-0000-000000000030', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000020', 'aaaaaaaa-0000-0000-0000-000000000002',
   date_trunc('day', now()) - interval '1 day' + interval '10 hours',
   date_trunc('day', now()) - interval '1 day' + interval '11 hours 30 minutes',
   date_trunc('day', now()) - interval '1 day' + interval '9 hours 55 minutes',
   date_trunc('day', now()) - interval '1 day' + interval '11 hours 40 minutes',
   'honore', 'pro', 45);

insert into rdv_prestations (rendez_vous_id, prestation_id, libelle, prix, duree_execution)
values ('aaaaaaaa-0000-0000-0000-000000000030', 'aaaaaaaa-0000-0000-0000-000000000010',
        'Pose complète gel', 45, 90);

insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000030',
        'aaaaaaaa-0000-0000-0000-000000000002',
        tstzrange(
          date_trunc('day', now()) - interval '1 day' + interval '9 hours 55 minutes',
          date_trunc('day', now()) - interval '1 day' + interval '11 hours 40 minutes'));

-- Encaissement du RDV honoré (alimente total_depense).
insert into encaissements (etablissement_id, client_id, rendez_vous_id, numero, total_ttc, statut)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000020',
        'aaaaaaaa-0000-0000-0000-000000000030', '2026-0001', 45, 'paye');

-- Événement de fiabilité : RDV honoré (+3).
insert into evenements_fiabilite (etablissement_id, client_id, rendez_vous_id, type, impact)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000020',
        'aaaaaaaa-0000-0000-0000-000000000030', 'honore', 3);

-- RDV à venir (confirmé) : demain 14:00 → 15:15, bloqué 13:55 → 15:25.
insert into rendez_vous (id, etablissement_id, client_id, membre_id,
                         debut_execution, fin_execution, debut_bloque, fin_bloque,
                         statut, origine, montant_total)
values
  ('aaaaaaaa-0000-0000-0000-000000000031', 'aaaaaaaa-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000021', 'aaaaaaaa-0000-0000-0000-000000000002',
   date_trunc('day', now()) + interval '1 day' + interval '14 hours',
   date_trunc('day', now()) + interval '1 day' + interval '15 hours 15 minutes',
   date_trunc('day', now()) + interval '1 day' + interval '13 hours 55 minutes',
   date_trunc('day', now()) + interval '1 day' + interval '15 hours 25 minutes',
   'confirme', 'en_ligne', 35);

insert into rdv_prestations (rendez_vous_id, prestation_id, libelle, prix, duree_execution)
values ('aaaaaaaa-0000-0000-0000-000000000031', 'aaaaaaaa-0000-0000-0000-000000000011',
        'Remplissage gel', 35, 75);

insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000031',
        'aaaaaaaa-0000-0000-0000-000000000002',
        tstzrange(
          date_trunc('day', now()) + interval '1 day' + interval '13 hours 55 minutes',
          date_trunc('day', now()) + interval '1 day' + interval '15 hours 25 minutes'));
