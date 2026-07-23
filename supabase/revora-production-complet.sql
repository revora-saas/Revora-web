-- =====================================================================
-- REVORA — Schéma de production complet (toutes les migrations regroupées)
-- =====================================================================
-- Ce fichier regroupe, dans leur ordre chronologique exact, l'ensemble des
-- migrations du dossier supabase/migrations/, À L'EXCEPTION de la migration
-- de démonstration 20260723121400_seed_demo.sql (données fictives), qui est
-- volontairement exclue pour un déploiement en production.
--
-- Généré par concaténation — les fichiers de migration d'origine ne sont pas
-- modifiés. En cas de doute, la source de vérité reste supabase/migrations/.
-- =====================================================================



-- =====================================================================
-- Migration : 20260723120100_schema_etablissements.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 01 : établissements, utilisateurs, métiers
-- Section 1 du schéma (specs/revora-schema.sql).
-- Conventions : dates en timestamptz (UTC) · etablissement_id → RLS.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";   -- requis par les contraintes anti-chevauchement

create table etablissements (
  id                    uuid primary key default gen_random_uuid(),
  nom                   text not null,
  slug                  text unique not null,          -- revora.fr/<slug> : page de réservation
  telephone             text,
  email                 text,
  adresse               text,
  code_postal           text,
  ville                 text,
  logo_url              text,
  fuseau                text not null default 'Europe/Paris',
  solo                  boolean not null default true, -- M6.3 : masque tout le module équipe
  domicile              boolean not null default false,
  cree_le               timestamptz not null default now(),
  archive_le            timestamptz
);

-- Profil applicatif adossé à auth.users (Supabase)
create table profils (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  nom                   text,
  prenom                text,
  telephone             text,                          -- vérifié par OTP : sans lui, pas de compte
  telephone_verifie     boolean not null default false,
  avatar_url            text,
  cree_le               timestamptz not null default now()
);

create type role_membre as enum ('proprietaire','gestionnaire','employe','receptionniste');

-- Lien utilisateur ↔ établissement. En V1 : une seule ligne 'proprietaire'.
create table membres (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  user_id               uuid references auth.users(id) on delete set null,
  nom_affiche           text not null,
  couleur               text,                          -- colonne d'agenda
  role                  role_membre not null default 'proprietaire',
  actif                 boolean not null default true,
  unique (etablissement_id, user_id)
);

-- Référentiel des métiers (données de départ, non modifiable par l'utilisateur)
create table metiers (
  code                  text primary key,              -- 'ongles','cils','pmu','coiffure_f','barbier',...
  libelle               text not null,
  configuration         jsonb not null                 -- M1.2 : vocabulaire, modules, widgets, schéma de fiche
);

create table etablissement_metiers (
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  metier_code           text not null references metiers(code),
  principal             boolean not null default false,
  primary key (etablissement_id, metier_code)
);


-- =====================================================================
-- Migration : 20260723120200_schema_catalogue.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 02 : catalogue (prestations, durées, ressources)
-- Section 2 du schéma. Voir règles R1 (durées), R2 (ressources), R3 (compétences).
-- =====================================================================

create table categories (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  nom                   text not null,
  ordre                 int not null default 0
);

create table prestations (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  categorie_id          uuid references categories(id) on delete set null,
  nom                   text not null,
  description           text,
  photo_url             text,
  prix                  numeric(10,2) not null default 0,
  -- R1.1 : décomposition des durées. La cliente ne voit que duree_execution.
  duree_preparation     int not null default 0,        -- minutes
  duree_execution       int not null default 30,
  duree_nettoyage       int not null default 0,
  battement             int not null default 0,
  -- Contexte
  lieu                  text not null default 'salon'  check (lieu in ('salon','domicile','les_deux')),
  -- Contraintes métier
  pmu                   boolean not null default false, -- M3.3 / R11.1 : impose consentement + traçabilité
  patch_test_requis     boolean not null default false, -- profil cils
  cycle_rappel_jours    int,                            -- retouche PMU, remplissage ongles/cils (R11.4)
  reservable_en_ligne   boolean not null default true,
  acompte_type          text check (acompte_type in ('aucun','fixe','pourcentage')) default 'aucun',
  acompte_valeur        numeric(10,2) default 0,
  actif                 boolean not null default true,  -- R15.3 : archivage, jamais de suppression
  ordre                 int not null default 0
);

-- R1.5 : temps de pose. Si aucune ligne, l'exécution est un bloc unique occupé.
create table prestation_segments (
  id                    uuid primary key default gen_random_uuid(),
  prestation_id         uuid not null references prestations(id) on delete cascade,
  ordre                 int not null,
  libelle               text,                          -- 'application', 'pose', 'rinçage'
  duree                 int not null,                  -- minutes
  praticienne_occupee   boolean not null default true, -- false = créneau libérable (R1.6)
  unique (prestation_id, ordre)
);

create table options_prestation (
  id                    uuid primary key default gen_random_uuid(),
  prestation_id         uuid not null references prestations(id) on delete cascade,
  nom                   text not null,
  prix                  numeric(10,2) not null default 0,
  duree_sup             int not null default 0
);

-- R2.1 : salles, postes, cabines, équipements
create table ressources (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  nom                   text not null,
  type                  text not null check (type in ('salle','poste','equipement')),
  actif                 boolean not null default true
);

create table prestation_ressources (
  prestation_id         uuid not null references prestations(id) on delete cascade,
  ressource_id          uuid not null references ressources(id) on delete cascade,
  primary key (prestation_id, ressource_id)
);

-- R3.1 / R3.3 : compétences et durée surchargée par praticienne
create table membre_prestations (
  membre_id             uuid not null references membres(id) on delete cascade,
  prestation_id         uuid not null references prestations(id) on delete cascade,
  duree_execution       int,                           -- null = durée par défaut de la prestation
  primary key (membre_id, prestation_id)
);


-- =====================================================================
-- Migration : 20260723120300_schema_disponibilites.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 03 : disponibilités (R4)
-- Section 3 du schéma. Horaires récurrents, congés, absences, blocages.
-- =====================================================================

-- Horaires récurrents. membre_id null = horaires de l'établissement.
create table horaires (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  membre_id             uuid references membres(id) on delete cascade,
  jour_semaine          int not null check (jour_semaine between 0 and 6), -- 0 = dimanche
  heure_debut           time not null,
  heure_fin             time not null,
  check (heure_fin > heure_debut)
);

-- Congés, absences, fermetures, blocages manuels (R4.1)
create table indisponibilites (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  membre_id             uuid references membres(id) on delete cascade, -- null = tout l'établissement
  ressource_id          uuid references ressources(id) on delete cascade,
  motif                 text,
  type                  text not null default 'blocage'
                        check (type in ('conge','absence','pause','ferie','blocage')),
  periode               tstzrange not null,
  cree_le               timestamptz not null default now()
);
create index on indisponibilites using gist (periode);


-- =====================================================================
-- Migration : 20260723120400_schema_clients.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 04 : clients (documents C)
-- Section 4 du schéma. Fiche cliente, étiquettes, consentements.
-- =====================================================================

create table clients (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  -- Identité (C2.1)
  civilite              text,
  nom                   text not null,
  prenom                text,
  date_naissance        date,
  photo_url             text,
  -- Contact — le mobile est la clé d'identification
  telephone_mobile      text,                          -- stocké en E.164 (C3.3)
  telephone_fixe        text,
  email                 text,
  canal_prefere         text check (canal_prefere in ('sms','whatsapp','email')),
  -- Adresse (obligatoire si domicile)
  adresse               text,
  complement            text,
  code_postal           text,
  ville                 text,
  notes_acces           text,
  zone_deplacement_id   uuid,
  -- Données sensibles (C2.2) — accès journalisé
  allergies             text,
  contre_indications    text,
  -- Suivi (C2.5) : champs calculés, mis à jour par déclencheur
  nombre_visites        int not null default 0,
  total_depense         numeric(12,2) not null default 0,
  derniere_visite       timestamptz,
  frequence_moyenne_j   int,
  score_fiabilite       int not null default 80,       -- R9.1
  membre_habituel_id    uuid references membres(id) on delete set null,
  -- Segmentation
  statut                text not null default 'nouvelle'
                        check (statut in ('nouvelle','reguliere','fidele','inactive','a_risque')),
  source                text,
  notes_privees         text,
  -- Cycle de vie (C9)
  cree_le               timestamptz not null default now(),
  archive_le            timestamptz,
  anonymise_le          timestamptz
);

create index on clients (etablissement_id, nom);
create index on clients (etablissement_id, telephone_mobile);
-- C5.1 / C5.2 : recherche instantanée et tolérante aux fautes
create extension if not exists pg_trgm;
create index on clients using gin ((coalesce(nom,'') || ' ' || coalesce(prenom,'') || ' ' ||
                                    coalesce(telephone_mobile,'') || ' ' || coalesce(email,'')) gin_trgm_ops);

create table etiquettes (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  nom                   text not null,
  couleur               text,
  unique (etablissement_id, nom)
);

create table client_etiquettes (
  client_id             uuid not null references clients(id) on delete cascade,
  etiquette_id          uuid not null references etiquettes(id) on delete cascade,
  primary key (client_id, etiquette_id)
);

-- C2.7 : preuve de consentement, horodatée et versionnée
create table consentements (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  type                  text not null check (type in
                        ('sms','marketing','image','donnees_sante','soin_pmu')),
  accorde               boolean not null,
  document_version      text,
  document_url          text,                          -- PDF signé archivé (R11.1)
  signature_url         text,
  adresse_ip            text,
  date_consentement     timestamptz not null default now()
);
create index on consentements (client_id, type, date_consentement desc);


-- =====================================================================
-- Migration : 20260723120500_schema_rendez_vous.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 05 : rendez-vous et moteur anti-collision
-- Section 5 du schéma. Cœur du système : table occupations + EXCLUDE.
-- =====================================================================

create type statut_rdv as enum
  ('demande','confirme','a_qualifier','honore','annule','absent');

create table rendez_vous (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid references clients(id) on delete set null,
  membre_id             uuid references membres(id) on delete restrict,   -- R15.4
  -- R1.2 : deux fenêtres distinctes
  debut_execution       timestamptz not null,          -- ce que voit la cliente (R1.3)
  fin_execution         timestamptz not null,
  debut_bloque          timestamptz not null,          -- ce que bloque l'agenda
  fin_bloque            timestamptz not null,
  statut                statut_rdv not null default 'confirme',
  origine               text not null default 'pro'
                        check (origine in ('pro','en_ligne','liste_attente','walk_in')),
  a_domicile            boolean not null default false,
  adresse_intervention  text,
  montant_total         numeric(10,2) not null default 0,
  acompte_du            numeric(10,2) not null default 0,
  acompte_paye          numeric(10,2) not null default 0,
  notes                 text,
  motif_annulation      text,
  -- Verrou de réservation (R7.3)
  verrou_expire_le      timestamptz,
  cree_le               timestamptz not null default now(),
  annule_le             timestamptz,
  check (fin_execution > debut_execution),
  check (fin_bloque >= fin_execution and debut_bloque <= debut_execution)
);
create index on rendez_vous (etablissement_id, debut_execution);
create index on rendez_vous (client_id, debut_execution desc);

create table rdv_prestations (
  id                    uuid primary key default gen_random_uuid(),
  rendez_vous_id        uuid not null references rendez_vous(id) on delete cascade,
  prestation_id         uuid references prestations(id) on delete restrict,
  libelle               text not null,                 -- figé : le catalogue peut changer ensuite
  prix                  numeric(10,2) not null default 0,
  duree_execution       int not null,
  ordre                 int not null default 0
);

-- -----------------------------------------------------------------
-- CŒUR DU SYSTÈME : table des occupations réelles.
-- Un rendez-vous génère une ligne par intervalle RÉELLEMENT occupé.
-- Le temps de pose (R1.5) ne génère PAS de ligne praticienne :
-- le créneau reste donc réservable pour une autre cliente.
-- Les contraintes EXCLUDE rendent le double-booking impossible
-- au niveau de la base — pas seulement dans le code (R7.3).
-- -----------------------------------------------------------------
create table occupations (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  rendez_vous_id        uuid references rendez_vous(id) on delete cascade,
  indisponibilite_id    uuid references indisponibilites(id) on delete cascade,
  membre_id             uuid references membres(id) on delete cascade,
  ressource_id          uuid references ressources(id) on delete cascade,
  periode               tstzrange not null,
  check (num_nonnulls(membre_id, ressource_id) = 1),
  constraint membre_sans_chevauchement
    exclude using gist (membre_id with =, periode with &&)
    where (membre_id is not null),
  constraint ressource_sans_chevauchement
    exclude using gist (ressource_id with =, periode with &&)
    where (ressource_id is not null)
);
create index on occupations using gist (periode);

-- R10 : liste d'attente et remplissage automatique
create table liste_attente (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  prestation_id         uuid not null references prestations(id) on delete cascade,
  membre_id             uuid references membres(id) on delete set null,
  disponibilites        jsonb not null,                -- [{jour:1, debut:'09:00', fin:'12:00'}, ...]
  horizon_le            date,
  statut                text not null default 'active'
                        check (statut in ('active','proposee','servie','expiree','annulee')),
  propose_le            timestamptz,                   -- R10.4 : vagues de 3, délai 15 min
  cree_le               timestamptz not null default now()
);

-- R9.2 : journal des événements qui alimentent le score
create table evenements_fiabilite (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,
  type                  text not null check (type in
                        ('honore','retard','annulation_delai','annulation_hors_delai','absence','correction')),
  impact                int not null,                  -- +3, -5, -10, -25 …
  commentaire           text,                          -- R9.5 : correction manuelle justifiée
  cree_le               timestamptz not null default now()
);


-- =====================================================================
-- Migration : 20260723120600_schema_fiches_photos.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 06 : fiches techniques, photos, traçabilité PMU
-- Section 6 du schéma. Champs déclaratifs JSONB, historisés par séance.
-- =====================================================================

-- M4.2 / M7.3 : champs déclaratifs en JSONB, schéma porté par le profil métier.
-- Une ligne par séance : jamais écrasée, toujours historisée.
create table fiches_techniques (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,
  metier_code           text references metiers(code),
  donnees               jsonb not null default '{}',   -- formule couleur, mapping, phototype…
  -- Traçabilité PMU (R11.2) : bloquant à la clôture
  lot_id                uuid,
  materiel              text,
  zone                  text,
  numero_seance         int,
  cloturee_le           timestamptz,
  cree_le               timestamptz not null default now()
);
create index on fiches_techniques (client_id, cree_le desc);

create table photos (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid not null references clients(id) on delete cascade,
  fiche_technique_id    uuid references fiches_techniques(id) on delete cascade,
  type                  text not null check (type in ('avant','apres','inspiration')),
  url                   text not null,                 -- C10.2 : servie par URL signée
  utilisable_communication boolean not null default false,  -- R11.5 : dépend du consentement image
  prise_le              timestamptz not null default now()
);


-- =====================================================================
-- Migration : 20260723120700_schema_stock.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 07 : stock (R12)
-- Section 7 du schéma. Produits, lots + péremption (PMU), mouvements.
-- =====================================================================

create table produits (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  nom                   text not null,
  marque                text,
  type                  text not null default 'consommable'
                        check (type in ('consommable','pigment','revente')),
  unite                 text default 'unité',
  seuil_alerte          numeric(10,2) not null default 0,
  prix_achat            numeric(10,2),
  prix_vente            numeric(10,2),
  actif                 boolean not null default true
);

-- Lot + péremption : indispensable au PMU (R11.3)
create table lots (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  produit_id            uuid not null references produits(id) on delete cascade,
  numero_lot            text not null,
  date_peremption       date,
  conforme_reach        boolean,
  quantite              numeric(10,2) not null default 0
);
create index on lots (produit_id, date_peremption);

create table mouvements_stock (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  produit_id            uuid not null references produits(id) on delete cascade,
  lot_id                uuid references lots(id) on delete set null,
  quantite              numeric(10,2) not null,        -- négatif = sortie
  motif                 text not null check (motif in
                        ('entree','prestation','vente','perte','peremption','inventaire')),
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,
  cree_le               timestamptz not null default now()
);


-- =====================================================================
-- Migration : 20260723120800_schema_caisse.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 08 : caisse et finance (R13)
-- Section 8 du schéma. Encaissements, lignes, paiements fractionnés, dépenses.
-- =====================================================================

create table encaissements (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid references clients(id) on delete set null,
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,
  numero                text not null,                 -- numérotation séquentielle (obligation légale)
  total_ht              numeric(10,2),
  total_ttc             numeric(10,2) not null default 0,
  acompte_deduit        numeric(10,2) not null default 0,   -- R13.2
  statut                text not null default 'paye'
                        check (statut in ('paye','partiel','rembourse','annule')),
  cree_le               timestamptz not null default now(),
  unique (etablissement_id, numero)
);

create table encaissement_lignes (
  id                    uuid primary key default gen_random_uuid(),
  encaissement_id       uuid not null references encaissements(id) on delete cascade,
  type                  text not null check (type in ('prestation','produit','option','remise')),
  libelle               text not null,
  quantite              numeric(10,2) not null default 1,
  prix_unitaire         numeric(10,2) not null default 0,
  produit_id            uuid references produits(id) on delete set null,
  prestation_id         uuid references prestations(id) on delete set null
);

-- R13.3 : paiement fractionnable en plusieurs moyens
create table paiements (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  encaissement_id       uuid references encaissements(id) on delete cascade,
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,  -- acompte avant encaissement
  montant               numeric(10,2) not null,
  moyen                 text not null check (moyen in
                        ('especes','carte','virement','lien','cheque','avoir')),
  type                  text not null default 'solde' check (type in ('acompte','solde','remboursement')),
  reference_externe     text,                          -- identifiant Stripe
  cree_le               timestamptz not null default now()
);

create table depenses (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  libelle               text not null,
  categorie             text,
  montant               numeric(10,2) not null,
  date_depense          date not null default current_date,
  justificatif_url      text
);


-- =====================================================================
-- Migration : 20260723120900_schema_messages.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 09 : messages et notifications (R14)
-- Section 9 du schéma. Modèles, journal des envois (quota, diagnostic).
-- =====================================================================

create table modeles_messages (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid references etablissements(id) on delete cascade, -- null = modèle système
  code                  text not null,                 -- 'rappel_j1','confirmation','retouche'…
  canal                 text not null check (canal in ('sms','whatsapp','email')),
  objet                 text,
  contenu               text not null,                 -- variables : {prenom}, {date}, {salon}
  actif                 boolean not null default true
);

-- Journal des envois : indispensable au décompte du quota (R14.4) et au diagnostic
create table messages (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  client_id             uuid references clients(id) on delete set null,
  rendez_vous_id        uuid references rendez_vous(id) on delete set null,
  canal                 text not null check (canal in ('sms','whatsapp','email')),
  categorie             text not null check (categorie in ('transactionnel','promotionnel')), -- flux séparés
  destinataire          text not null,
  contenu               text,
  statut                text not null default 'en_file'
                        check (statut in ('en_file','envoye','delivre','echec','repondu')),
  reponse               text,                          -- OUI / NON / STOP (R14.1)
  cout_credits          int not null default 1,
  erreur                text,                          -- R15.7 : échec remonté à la pro
  planifie_le           timestamptz,                   -- R14.3 : rien entre 21 h et 8 h
  envoye_le             timestamptz,
  cree_le               timestamptz not null default now()
);
create index on messages (etablissement_id, cree_le desc);
create index on messages (statut, planifie_le) where statut = 'en_file';


-- =====================================================================
-- Migration : 20260723121000_schema_abonnement_reglages_audit.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 10 : abonnement, réglages, audit
-- Section 10 du schéma. Réglages exposés (R16), journal d'activité (C8).
-- =====================================================================

create table abonnements (
  id                    uuid primary key default gen_random_uuid(),
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  formule               text not null default 'independante',
  statut                text not null default 'essai'
                        check (statut in ('essai','actif','impaye','resilie')),
  essai_fin_le          timestamptz,
  periode               text check (periode in ('mensuel','annuel')),
  stripe_customer_id    text,
  stripe_subscription_id text,
  quota_messages        int not null default 200,
  credits_restants      int not null default 200,
  renouvelle_le         timestamptz
);

-- R16 : tous les réglages exposés, jamais codés en dur
create table reglages (
  etablissement_id      uuid primary key references etablissements(id) on delete cascade,
  battement_defaut      int not null default 0,
  granularite_creneaux  int not null default 15,
  delai_min_reservation int not null default 120,      -- minutes (R4.3)
  horizon_max_jours     int not null default 90,       -- R4.4
  validation_auto       boolean not null default true, -- R7.4
  delai_annulation_h    int not null default 24,       -- R8.3
  strategie_planning    text not null default 'optimiser'
                        check (strategie_planning in ('optimiser','libre','concentrer')), -- R5.4
  rappels               jsonb not null default '[{"heures":24,"canal":"sms"},{"heures":2,"canal":"sms"}]',
  seuil_acompte_obligatoire int not null default 50,   -- R9.3
  zones_deplacement     jsonb not null default '[]',   -- R6.3 : [{nom, codes_postaux, minutes, frais}]
  autres                jsonb not null default '{}'
);

-- C8.1 : traçabilité des modifications, y compris accès aux données de santé (C8.2)
create table journal_activite (
  id                    bigserial primary key,
  etablissement_id      uuid not null references etablissements(id) on delete cascade,
  user_id               uuid references auth.users(id) on delete set null,
  action                text not null,                 -- 'creation','modification','suppression','acces_sante'
  entite                text not null,                 -- 'client','rendez_vous',…
  entite_id             uuid,
  avant                 jsonb,
  apres                 jsonb,
  cree_le               timestamptz not null default now()
);
create index on journal_activite (etablissement_id, cree_le desc);


-- =====================================================================
-- Migration : 20260723121100_rls.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 11 : sécurité, isolation par établissement (C10.1)
-- Section 11 du schéma.
--
-- Règle de sécurité la plus critique du produit : aucune requête ne peut
-- atteindre les données d'un autre établissement. RLS est activé sur
-- CHAQUE table, sans exception.
--
-- Motif :
--   · Tables portant etablissement_id → policy directe via mes_etablissements()
--   · Tables enfant sans etablissement_id → scoping via la table parente
--   · profils → chaque utilisateur ne voit que sa propre ligne
--   · metiers → référentiel public en lecture seule (aucune écriture)
-- =====================================================================

-- Établissements accessibles à l'utilisateur connecté.
create or replace function mes_etablissements()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.etablissement_id
  from membres m
  where m.user_id = auth.uid() and m.actif
$$;

-- ---------------------------------------------------------------------
-- profils : chaque utilisateur gère uniquement sa propre fiche.
-- ---------------------------------------------------------------------
alter table profils enable row level security;
create policy profils_acces on profils for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- metiers : référentiel partagé, lisible par tout utilisateur connecté,
-- jamais modifiable depuis l'application (seed uniquement).
-- ---------------------------------------------------------------------
alter table metiers enable row level security;
create policy metiers_lecture on metiers for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- etablissements : accès via appartenance. La CRÉATION d'un établissement
-- passe par la fonction SECURITY DEFINER creer_etablissement() (migration 12),
-- car au moment de l'insert l'utilisateur n'est pas encore membre.
-- ---------------------------------------------------------------------
alter table etablissements enable row level security;
create policy etablissements_lecture on etablissements for select
  using (id in (select mes_etablissements()));
create policy etablissements_maj on etablissements for update
  using (id in (select mes_etablissements()))
  with check (id in (select mes_etablissements()));

-- ---------------------------------------------------------------------
-- Tables portant directement etablissement_id.
-- Une policy « for all » : lecture, insertion, mise à jour, suppression,
-- toutes limitées aux établissements de l'utilisateur.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tables_etab text[] := array[
    'membres','etablissement_metiers','categories','prestations','ressources',
    'horaires','indisponibilites','clients','etiquettes','consentements',
    'rendez_vous','occupations','liste_attente','evenements_fiabilite',
    'fiches_techniques','photos','produits','lots','mouvements_stock',
    'encaissements','paiements','depenses','messages','abonnements',
    'reglages','journal_activite'
  ];
begin
  foreach t in array tables_etab loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy %1$s_acces on %1$I for all
        using (etablissement_id in (select mes_etablissements()))
        with check (etablissement_id in (select mes_etablissements()));
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- modeles_messages : etablissement_id NULLABLE (null = modèle système).
-- Lecture : modèles système OU ceux de l'établissement.
-- Écriture : uniquement ses propres modèles.
-- ---------------------------------------------------------------------
alter table modeles_messages enable row level security;
create policy modeles_lecture on modeles_messages for select
  using (etablissement_id is null or etablissement_id in (select mes_etablissements()));
create policy modeles_ecriture on modeles_messages for insert
  with check (etablissement_id in (select mes_etablissements()));
create policy modeles_maj on modeles_messages for update
  using (etablissement_id in (select mes_etablissements()))
  with check (etablissement_id in (select mes_etablissements()));
create policy modeles_suppr on modeles_messages for delete
  using (etablissement_id in (select mes_etablissements()));

-- ---------------------------------------------------------------------
-- Tables ENFANT sans etablissement_id : scoping via la table parente.
-- ---------------------------------------------------------------------

-- prestation_segments, options_prestation → prestations
alter table prestation_segments enable row level security;
create policy prestation_segments_acces on prestation_segments for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

alter table options_prestation enable row level security;
create policy options_prestation_acces on options_prestation for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

-- prestation_ressources → prestations
alter table prestation_ressources enable row level security;
create policy prestation_ressources_acces on prestation_ressources for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

-- membre_prestations → membres
alter table membre_prestations enable row level security;
create policy membre_prestations_acces on membre_prestations for all
  using (exists (select 1 from membres m
                 where m.id = membre_id
                   and m.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from membres m
                 where m.id = membre_id
                   and m.etablissement_id in (select mes_etablissements())));

-- client_etiquettes → clients
alter table client_etiquettes enable row level security;
create policy client_etiquettes_acces on client_etiquettes for all
  using (exists (select 1 from clients c
                 where c.id = client_id
                   and c.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from clients c
                 where c.id = client_id
                   and c.etablissement_id in (select mes_etablissements())));

-- rdv_prestations → rendez_vous
alter table rdv_prestations enable row level security;
create policy rdv_prestations_acces on rdv_prestations for all
  using (exists (select 1 from rendez_vous r
                 where r.id = rendez_vous_id
                   and r.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from rendez_vous r
                 where r.id = rendez_vous_id
                   and r.etablissement_id in (select mes_etablissements())));

-- encaissement_lignes → encaissements
alter table encaissement_lignes enable row level security;
create policy encaissement_lignes_acces on encaissement_lignes for all
  using (exists (select 1 from encaissements e
                 where e.id = encaissement_id
                   and e.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from encaissements e
                 where e.id = encaissement_id
                   and e.etablissement_id in (select mes_etablissements())));


-- =====================================================================
-- Migration : 20260723121200_triggers.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 12 : fonctions et déclencheurs
-- Voir specs : R9 (fiabilité), C2.4 (statut), C2.5 (champs calculés),
-- C8.1/C8.2 (journalisation).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Onboarding : création atomique d'un établissement par l'utilisateur
-- connecté. SECURITY DEFINER car au moment de l'insert l'utilisateur
-- n'est pas encore membre (le RLS le bloquerait sinon).
-- ---------------------------------------------------------------------
create or replace function creer_etablissement(
  p_nom text,
  p_slug text,
  p_nom_affiche text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  insert into etablissements (nom, slug)
    values (p_nom, p_slug)
    returning id into v_id;

  insert into membres (etablissement_id, user_id, nom_affiche, role)
    values (v_id, v_uid, coalesce(p_nom_affiche, p_nom), 'proprietaire');

  -- Réglages et abonnement d'essai par défaut (R16).
  insert into reglages (etablissement_id) values (v_id);
  insert into abonnements (etablissement_id, statut, essai_fin_le)
    values (v_id, 'essai', now() + interval '14 days');

  return v_id;
end $$;


-- ---------------------------------------------------------------------
-- STATUT CLIENT (C2.4) : calculé à partir du score, du nombre de visites
-- et de l'inactivité. Priorité : à risque > inactive > fidèle > régulière > nouvelle.
-- ---------------------------------------------------------------------
create or replace function calculer_statut_client(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare c clients%rowtype;
begin
  select * into c from clients where id = p_client_id;
  if not found or c.anonymise_le is not null then
    return;
  end if;

  update clients set statut = case
    when c.score_fiabilite < 50 then 'a_risque'
    when c.derniere_visite is not null
         and now() - c.derniere_visite
             > make_interval(days => greatest(coalesce(c.frequence_moyenne_j, 0) * 2, 180))
      then 'inactive'
    when c.nombre_visites > 5  then 'fidele'
    when c.nombre_visites >= 2 then 'reguliere'
    else 'nouvelle'
  end
  where id = p_client_id;
end $$;


-- ---------------------------------------------------------------------
-- CHAMPS CALCULÉS DE LA FICHE CLIENTE (C2.5) :
-- nombre_visites, derniere_visite, frequence_moyenne_j (depuis les RDV
-- honorés) et total_depense (depuis les encaissements).
-- Le recalcul ne doit PAS générer d'entrée dans le journal d'activité :
-- on pose un drapeau de session que le trigger de journalisation lit.
-- ---------------------------------------------------------------------
create or replace function recalculer_stats_client(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_client_id is null then
    return;
  end if;

  perform set_config('revora.skip_journal', 'on', true);

  update clients cl set
    nombre_visites      = sub.nb,
    derniere_visite     = sub.derniere,
    frequence_moyenne_j = sub.freq,
    total_depense       = coalesce(enc.total, 0)
  from (
    select
      count(*) filter (where statut = 'honore') as nb,
      max(debut_execution) filter (where statut = 'honore') as derniere,
      case
        when count(*) filter (where statut = 'honore') >= 2 then (
          extract(epoch from (
            max(debut_execution) filter (where statut = 'honore')
            - min(debut_execution) filter (where statut = 'honore')
          )) / 86400.0 / (count(*) filter (where statut = 'honore') - 1)
        )::int
        else null
      end as freq
    from rendez_vous
    where client_id = p_client_id
  ) sub
  cross join (
    select sum(total_ttc) as total
    from encaissements
    where client_id = p_client_id and statut in ('paye', 'partiel')
  ) enc
  where cl.id = p_client_id;

  perform calculer_statut_client(p_client_id);
  perform set_config('revora.skip_journal', 'off', true);
end $$;


-- ---------------------------------------------------------------------
-- SCORE DE FIABILITÉ (R9.2) : à chaque événement, on ajuste le score,
-- borné entre 0 et 100. Ne jamais recalculer à la volée (note B du schéma).
-- ---------------------------------------------------------------------
create or replace function appliquer_impact_fiabilite()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update clients
    set score_fiabilite = greatest(0, least(100, score_fiabilite + new.impact))
    where id = new.client_id;
  -- Le score influe sur le statut (à risque < 50).
  perform calculer_statut_client(new.client_id);
  return new;
end $$;

create trigger trg_fiabilite
  after insert on evenements_fiabilite
  for each row execute function appliquer_impact_fiabilite();


-- ---------------------------------------------------------------------
-- RECALCUL DES STATS quand un RDV change de statut (→ honoré, etc.)
-- ou quand un encaissement est créé / modifié / supprimé.
-- ---------------------------------------------------------------------
create or replace function trig_stats_depuis_rdv()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform recalculer_stats_client(old.client_id);
    return old;
  end if;
  perform recalculer_stats_client(new.client_id);
  -- Un changement de client sur un RDV existant impacte aussi l'ancienne fiche.
  if tg_op = 'UPDATE' and old.client_id is distinct from new.client_id then
    perform recalculer_stats_client(old.client_id);
  end if;
  return new;
end $$;

create trigger trg_stats_rdv
  after insert or delete or update of statut, client_id, debut_execution
  on rendez_vous
  for each row execute function trig_stats_depuis_rdv();

create or replace function trig_stats_depuis_encaissement()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform recalculer_stats_client(old.client_id);
    return old;
  end if;
  perform recalculer_stats_client(new.client_id);
  if tg_op = 'UPDATE' and old.client_id is distinct from new.client_id then
    perform recalculer_stats_client(old.client_id);
  end if;
  return new;
end $$;

create trigger trg_stats_encaissement
  after insert or delete or update of total_ttc, statut, client_id
  on encaissements
  for each row execute function trig_stats_depuis_encaissement();


-- ---------------------------------------------------------------------
-- JOURNALISATION DES MODIFICATIONS DE FICHES CLIENTES (C8.1).
-- Ignore les recalculs automatiques (drapeau revora.skip_journal).
-- SECURITY DEFINER pour écrire dans journal_activite sans dépendre du RLS.
-- ---------------------------------------------------------------------
create or replace function journaliser_client()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Ne pas journaliser les mises à jour de champs calculés (stats).
  if current_setting('revora.skip_journal', true) = 'on' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, apres)
      values (new.etablissement_id, auth.uid(), 'creation', 'client', new.id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant, apres)
      values (new.etablissement_id, auth.uid(), 'modification', 'client', new.id,
              to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant)
      values (old.etablissement_id, auth.uid(), 'suppression', 'client', old.id, to_jsonb(old));
    return old;
  end if;
  return null;
end $$;

create trigger trg_journal_client
  after insert or update or delete on clients
  for each row execute function journaliser_client();


-- ---------------------------------------------------------------------
-- JOURNALISATION DES ACCÈS AUX DONNÉES DE SANTÉ (C8.2).
-- À appeler depuis l'application au moment de consulter allergies /
-- contre-indications d'une cliente (les SELECT ne se tracent pas par trigger).
-- ---------------------------------------------------------------------
create or replace function logger_acces_sante(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_etab uuid;
begin
  select etablissement_id into v_etab from clients where id = p_client_id;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;
  insert into journal_activite (etablissement_id, user_id, action, entite, entite_id)
    values (v_etab, auth.uid(), 'acces_sante', 'client', p_client_id);
end $$;


-- =====================================================================
-- Migration : 20260723121300_seed_metiers.sql
-- =====================================================================

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


-- =====================================================================
-- Migration : 20260723121500_creer_etablissement_slug_unique.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 15 : slug unique dans creer_etablissement()
-- Le slug de réservation (revora.fr/<slug>) doit être unique. Sous RLS,
-- l'application ne voit pas les établissements des autres comptes et ne
-- peut donc pas garantir l'unicité. On confie ce calcul à la fonction
-- SECURITY DEFINER, qui a une vue globale.
-- =====================================================================

create or replace function creer_etablissement(
  p_nom text,
  p_slug text,
  p_nom_affiche text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
  v_base text;
  v_slug text;
  v_n int := 1;
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  -- Normalise le slug proposé : minuscules, accents translittérés (portable,
  -- sans extension), puis tout caractère non alphanumérique devient un tiret.
  v_base := lower(coalesce(nullif(p_slug, ''), 'mon-salon'));
  v_base := translate(v_base,
              'àâäáãéèêëíìîïóòôöõúùûüçÿ',
              'aaaaaeeeeiiiiooooouuuucy');
  v_base := trim(both '-' from regexp_replace(v_base, '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'mon-salon';
  end if;
  v_slug := v_base;
  while exists (select 1 from etablissements where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into etablissements (nom, slug)
    values (p_nom, v_slug)
    returning id into v_id;

  insert into membres (etablissement_id, user_id, nom_affiche, role)
    values (v_id, v_uid, coalesce(p_nom_affiche, p_nom), 'proprietaire');

  insert into reglages (etablissement_id) values (v_id);
  insert into abonnements (etablissement_id, statut, essai_fin_le)
    values (v_id, 'essai', now() + interval '14 days');

  return v_id;
end $$;


-- =====================================================================
-- Migration : 20260723121600_clients_fonctions.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 16 : fonctions de la base clientes
--   · rechercher_clients  : recherche instantanée (C5.1, C5.2)
--   · anonymiser_cliente  : effacement RGPD sans perte comptable (C9.2)
--   · fusionner_clientes  : fusion de doublons cumulant l'historique (C4.3)
-- =====================================================================

-- ---------------------------------------------------------------------
-- RECHERCHE (C5.1 / C5.2)
-- Instantanée dès 2 caractères sur nom, prénom, e-mail et téléphone.
-- Téléphone trouvable dans TOUS les formats : on compare les chiffres,
-- indicatif +33 et zéro initial neutralisés (la pro tape « 5678 »).
-- Tolérante aux fautes via trigramme (« Dubois » trouve « Duboit »).
-- SECURITY INVOKER (défaut) : le RLS s'applique automatiquement.
-- ---------------------------------------------------------------------
create or replace function rechercher_clients(
  p_etablissement uuid,
  p_recherche text default '',
  p_limit int default 30,
  p_offset int default 0
)
returns setof clients
language sql stable set search_path = public as $$
  with params as (
    select
      trim(coalesce(p_recherche, '')) as q,
      -- forme « nationale » du numéro tapé : chiffres, sans zéro ni +33 initial
      regexp_replace(
        regexp_replace(ltrim(regexp_replace(coalesce(p_recherche, ''), '\D', '', 'g'), '0'),
        '^33', ''), '', '', 'g') as q_tel
  )
  select c.*
  from clients c, params p
  where c.etablissement_id = p_etablissement
    and c.archive_le is null
    and c.anonymise_le is null
    and (
      p.q = ''
      or c.nom ilike '%' || p.q || '%'
      or c.prenom ilike '%' || p.q || '%'
      or c.email ilike '%' || p.q || '%'
      or (
        length(p.q_tel) >= 2
        and regexp_replace(
              coalesce(c.telephone_mobile, '') || ' ' || coalesce(c.telephone_fixe, ''),
              '\D', '', 'g') like '%' || p.q_tel || '%'
      )
      or (length(p.q) >= 3 and c.nom % p.q)
      or (length(p.q) >= 3 and coalesce(c.prenom, '') % p.q)
    )
  order by
    case when p.q = '' then 0 else -similarity(c.nom, p.q) end,
    c.nom
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;


-- ---------------------------------------------------------------------
-- ANONYMISATION RGPD (C9.2) : effacer l'identité, garder la preuve.
-- Identité / contact / adresse / notes effacés définitivement ;
-- photos supprimées (biométrie) ; fiches techniques, encaissements et
-- consentements CONSERVÉS (obligation légale). Jamais de suppression pure.
-- ---------------------------------------------------------------------
create or replace function anonymiser_cliente(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_etab uuid;
begin
  select etablissement_id into v_etab from clients where id = p_client_id;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;

  delete from photos where client_id = p_client_id;

  update clients set
    civilite = null, nom = 'Cliente anonymisée', prenom = null,
    date_naissance = null, photo_url = null,
    telephone_mobile = null, telephone_fixe = null, email = null,
    adresse = null, complement = null, code_postal = null, ville = null,
    notes_acces = null, allergies = null, contre_indications = null,
    notes_privees = null,
    anonymise_le = now(),
    archive_le = coalesce(archive_le, now())
  where id = p_client_id;
end $$;


-- ---------------------------------------------------------------------
-- FUSION DE DOUBLONS (C4.3) : réaffecte tout l'historique vers la fiche
-- conservée, puis archive l'autre. Journalisé, réversible (archive).
-- ---------------------------------------------------------------------
create or replace function fusionner_clientes(p_garde uuid, p_absorbe uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v1 uuid; v2 uuid;
begin
  if p_garde = p_absorbe then
    raise exception 'Impossible de fusionner une fiche avec elle-même';
  end if;
  select etablissement_id into v1 from clients where id = p_garde;
  select etablissement_id into v2 from clients where id = p_absorbe;
  if v1 is null or v2 is null or v1 <> v2 or v1 not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;

  update rendez_vous        set client_id = p_garde where client_id = p_absorbe;
  update encaissements      set client_id = p_garde where client_id = p_absorbe;
  update fiches_techniques  set client_id = p_garde where client_id = p_absorbe;
  update photos             set client_id = p_garde where client_id = p_absorbe;
  update consentements      set client_id = p_garde where client_id = p_absorbe;
  update evenements_fiabilite set client_id = p_garde where client_id = p_absorbe;
  update liste_attente      set client_id = p_garde where client_id = p_absorbe;

  -- Étiquettes : ne déplacer que celles absentes de la fiche conservée (PK composite).
  update client_etiquettes set client_id = p_garde
    where client_id = p_absorbe
      and etiquette_id not in (
        select etiquette_id from client_etiquettes where client_id = p_garde);
  delete from client_etiquettes where client_id = p_absorbe;

  update clients set archive_le = now() where id = p_absorbe;

  perform recalculer_stats_client(p_garde);
end $$;


-- =====================================================================
-- Migration : 20260723121700_creer_rendez_vous.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 17 : création d'un rendez-vous en transaction stricte
-- (note A du schéma). La BASE garantit l'absence de double réservation via
-- les contraintes EXCLUDE sur `occupations`, pas le code applicatif (R7.3).
--
-- Une fonction plpgsql est atomique : si l'insertion d'une occupation viole
-- une contrainte EXCLUDE (créneau déjà pris), tout le rendez-vous est annulé
-- et l'erreur « CRENEAU_PRIS » est renvoyée pour proposer une alternative.
-- =====================================================================

create or replace function creer_rendez_vous(
  p_etablissement    uuid,
  p_client_id        uuid,
  p_membre_id        uuid,
  p_debut_execution  timestamptz,
  p_fin_execution    timestamptz,
  p_debut_bloque     timestamptz,
  p_fin_bloque       timestamptz,
  p_occupations      jsonb,                 -- [{"debut":"...","fin":"..."}] segments OCCUPÉS
  p_ressource_ids    uuid[]   default '{}', -- ressources bloquées sur toute la fenêtre (R1.7)
  p_statut           statut_rdv default 'confirme',
  p_origine          text     default 'pro',
  p_montant_total    numeric  default 0,
  p_acompte_du       numeric  default 0,
  p_a_domicile       boolean  default false,
  p_adresse          text     default null,
  p_notes            text     default null,
  p_prestations      jsonb    default '[]'  -- [{"prestation_id","libelle","prix","duree_execution","ordre"}]
)
returns uuid
language plpgsql as $$
declare
  v_rdv uuid;
  v_occ jsonb;
  v_presta jsonb;
  v_rid uuid;
begin
  if p_etablissement not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  insert into rendez_vous (
    etablissement_id, client_id, membre_id,
    debut_execution, fin_execution, debut_bloque, fin_bloque,
    statut, origine, montant_total, acompte_du, a_domicile, adresse_intervention, notes
  ) values (
    p_etablissement, p_client_id, p_membre_id,
    p_debut_execution, p_fin_execution, p_debut_bloque, p_fin_bloque,
    p_statut, p_origine, p_montant_total, p_acompte_du, p_a_domicile, p_adresse, p_notes
  ) returning id into v_rdv;

  -- Occupations de la praticienne : une ligne par segment occupé (R1.5).
  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (
      p_etablissement, v_rdv, p_membre_id,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz)
    );
  end loop;

  -- Occupations des ressources : toute la fenêtre bloquée (la salle reste
  -- occupée pendant la pose, R1.7).
  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (p_etablissement, v_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

  -- Prestations figées (le catalogue peut changer ensuite).
  for v_presta in select * from jsonb_array_elements(p_prestations) loop
    insert into rdv_prestations (rendez_vous_id, prestation_id, libelle, prix, duree_execution, ordre)
    values (
      v_rdv,
      nullif(v_presta->>'prestation_id', '')::uuid,
      v_presta->>'libelle',
      coalesce((v_presta->>'prix')::numeric, 0),
      coalesce((v_presta->>'duree_execution')::int, 0),
      coalesce((v_presta->>'ordre')::int, 0)
    );
  end loop;

  return v_rdv;

exception
  -- Une contrainte EXCLUDE a levé : le créneau vient d'être pris.
  -- Toute la transaction de la fonction est annulée automatiquement.
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;


-- =====================================================================
-- Migration : 20260723121800_deplacer_rendez_vous.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 18 : déplacement d'un rendez-vous en transaction stricte
-- Recalcule les fenêtres et réécrit les occupations atomiquement. Si le
-- nouveau créneau entre en collision (EXCLUDE), tout est annulé et l'ancien
-- rendez-vous reste intact (CRENEAU_PRIS).
-- =====================================================================

create or replace function deplacer_rendez_vous(
  p_rdv             uuid,
  p_debut_execution timestamptz,
  p_fin_execution   timestamptz,
  p_debut_bloque    timestamptz,
  p_fin_bloque      timestamptz,
  p_occupations     jsonb,
  p_ressource_ids   uuid[] default '{}'
)
returns void
language plpgsql as $$
declare
  v_etab uuid;
  v_membre uuid;
  v_occ jsonb;
  v_rid uuid;
begin
  select etablissement_id, membre_id into v_etab, v_membre
  from rendez_vous where id = p_rdv;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  -- On libère l'ancien créneau avant de réserver le nouveau.
  delete from occupations where rendez_vous_id = p_rdv;

  update rendez_vous set
    debut_execution = p_debut_execution,
    fin_execution   = p_fin_execution,
    debut_bloque    = p_debut_bloque,
    fin_bloque      = p_fin_bloque
  where id = p_rdv;

  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (v_etab, p_rdv, v_membre,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz));
  end loop;

  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (v_etab, p_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

exception
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;


-- =====================================================================
-- Migration : 20260723121900_reservation_publique.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 19 : réservation publique (verrou anti-collision R7.3)
--
-- La page publique n'a pas d'utilisateur authentifié : ces fonctions sont
-- appelées côté serveur avec la clé service role, TOUJOURS bornées à
-- l'établissement résolu par le slug. Le verrou repose sur les contraintes
-- EXCLUDE de `occupations` : deux clientes ne peuvent jamais confirmer le
-- même créneau (garanti par la base, pas par le code).
-- =====================================================================

-- Pose un verrou temporaire sur un créneau : crée un rendez-vous « demande »
-- sans cliente, valable p_verrou_minutes. Atomique : si le créneau est pris,
-- tout est annulé (CRENEAU_PRIS).
create or replace function verrouiller_creneau(
  p_etablissement   uuid,
  p_membre_id       uuid,
  p_debut_execution timestamptz,
  p_fin_execution   timestamptz,
  p_debut_bloque    timestamptz,
  p_fin_bloque      timestamptz,
  p_occupations     jsonb,
  p_ressource_ids   uuid[] default '{}',
  p_verrou_minutes  int    default 10
)
returns uuid
language plpgsql as $$
declare
  v_rdv uuid;
  v_occ jsonb;
  v_rid uuid;
begin
  insert into rendez_vous (
    etablissement_id, membre_id, debut_execution, fin_execution,
    debut_bloque, fin_bloque, statut, origine, verrou_expire_le
  ) values (
    p_etablissement, p_membre_id, p_debut_execution, p_fin_execution,
    p_debut_bloque, p_fin_bloque, 'demande', 'en_ligne',
    now() + make_interval(mins => p_verrou_minutes)
  ) returning id into v_rdv;

  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (p_etablissement, v_rdv, p_membre_id,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz));
  end loop;

  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (p_etablissement, v_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

  return v_rdv;
exception
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;


-- Libère les verrous expirés (holds non finalisés). À appeler avant de
-- calculer les créneaux disponibles. Les occupations tombent en cascade.
create or replace function nettoyer_verrous(p_etablissement uuid)
returns void
language plpgsql as $$
begin
  delete from rendez_vous
  where etablissement_id = p_etablissement
    and origine = 'en_ligne'
    and client_id is null
    and statut = 'demande'
    and verrou_expire_le is not null
    and verrou_expire_le < now();
end $$;


-- =====================================================================
-- Migration : 20260723122000_modeles_messages.sql
-- =====================================================================

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


-- =====================================================================
-- Migration : 20260723122100_messages_code.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 21 : colonne `code` sur messages
-- Identifie le type de message (rappel_24h, rappel_2h, confirmation…) pour
-- éviter d'envoyer deux fois le même rappel pour un rendez-vous.
-- =====================================================================

alter table messages add column if not exists code text;

-- Dédoublonnage des rappels : un seul message d'un code donné par RDV.
create unique index if not exists messages_rdv_code_unique
  on messages (rendez_vous_id, code)
  where rendez_vous_id is not null and code is not null;


-- =====================================================================
-- Migration : 20260723122200_creer_encaissement.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 22 : encaissement atomique (R13)
-- Numérotation séquentielle SANS TROU par établissement et par année
-- (obligation légale). Sérialisée par un verrou consultatif pour éviter
-- toute collision de numéro. L'encaissement clôture le RDV (honoré) et
-- alimente le score de fiabilité (R13.5).
-- =====================================================================

create or replace function creer_encaissement(
  p_etablissement   uuid,
  p_client_id       uuid,
  p_rendez_vous_id  uuid,
  p_lignes          jsonb,   -- [{type,libelle,quantite,prix_unitaire,produit_id,prestation_id}]
  p_paiements       jsonb,   -- [{montant,moyen,type}]
  p_acompte_deduit  numeric default 0
)
returns jsonb
language plpgsql as $$
declare
  v_id uuid;
  v_numero text;
  v_annee text := to_char(now(), 'YYYY');
  v_seq int;
  v_total numeric := 0;
  v_paye numeric := 0;
  v_statut text;
  v_ligne jsonb;
  v_paiement jsonb;
begin
  if p_etablissement not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  -- Sérialise la numérotation pour cet établissement (pas de trou, pas de doublon).
  perform pg_advisory_xact_lock(hashtext('encaissement:' || p_etablissement::text));

  select count(*) + 1 into v_seq
  from encaissements
  where etablissement_id = p_etablissement and numero like v_annee || '-%';
  v_numero := v_annee || '-' || lpad(v_seq::text, 4, '0');

  -- Total TTC = somme des lignes (les remises sont des montants négatifs).
  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    v_total := v_total +
      coalesce((v_ligne->>'quantite')::numeric, 1) * coalesce((v_ligne->>'prix_unitaire')::numeric, 0);
  end loop;

  -- Total réglé = acompte déjà versé + paiements (hors remboursements).
  v_paye := coalesce(p_acompte_deduit, 0);
  for v_paiement in select * from jsonb_array_elements(p_paiements) loop
    if coalesce(v_paiement->>'type', 'solde') <> 'remboursement' then
      v_paye := v_paye + coalesce((v_paiement->>'montant')::numeric, 0);
    end if;
  end loop;

  v_statut := case when v_paye >= v_total then 'paye' else 'partiel' end;

  insert into encaissements (
    etablissement_id, client_id, rendez_vous_id, numero,
    total_ttc, acompte_deduit, statut
  ) values (
    p_etablissement, p_client_id, p_rendez_vous_id, v_numero,
    v_total, coalesce(p_acompte_deduit, 0), v_statut
  ) returning id into v_id;

  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    insert into encaissement_lignes (encaissement_id, type, libelle, quantite, prix_unitaire, produit_id, prestation_id)
    values (
      v_id,
      v_ligne->>'type',
      v_ligne->>'libelle',
      coalesce((v_ligne->>'quantite')::numeric, 1),
      coalesce((v_ligne->>'prix_unitaire')::numeric, 0),
      nullif(v_ligne->>'produit_id', '')::uuid,
      nullif(v_ligne->>'prestation_id', '')::uuid
    );
  end loop;

  for v_paiement in select * from jsonb_array_elements(p_paiements) loop
    insert into paiements (etablissement_id, encaissement_id, rendez_vous_id, montant, moyen, type)
    values (
      p_etablissement, v_id, p_rendez_vous_id,
      coalesce((v_paiement->>'montant')::numeric, 0),
      v_paiement->>'moyen',
      coalesce(v_paiement->>'type', 'solde')
    );
  end loop;

  -- L'encaissement clôture le RDV → honoré + fiabilité (R13.5).
  if p_rendez_vous_id is not null then
    update rendez_vous set statut = 'honore' where id = p_rendez_vous_id and statut <> 'honore';
    if not exists (
      select 1 from evenements_fiabilite
      where rendez_vous_id = p_rendez_vous_id and type = 'honore'
    ) and p_client_id is not null then
      insert into evenements_fiabilite (etablissement_id, client_id, rendez_vous_id, type, impact)
      values (p_etablissement, p_client_id, p_rendez_vous_id, 'honore', 3);
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'total', v_total, 'statut', v_statut);
end $$;


-- =====================================================================
-- Migration : 20260723122300_journal_rendez_vous.sql
-- =====================================================================

-- =====================================================================
-- REVORA — Migration 23 : journalisation des rendez-vous (R15.10)
-- Toute annulation, modification ou suppression d'un rendez-vous est
-- journalisée (qui, quand, quoi) pour pouvoir expliquer un litige.
-- =====================================================================

create or replace function journaliser_rendez_vous()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant)
      values (old.etablissement_id, auth.uid(), 'suppression', 'rendez_vous', old.id, to_jsonb(old));
    return old;
  end if;

  -- On ne journalise que les changements significatifs (statut ou horaires),
  -- pas les recalculs techniques.
  if old.statut is distinct from new.statut
     or old.debut_execution is distinct from new.debut_execution
     or old.fin_execution is distinct from new.fin_execution then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant, apres)
      values (
        new.etablissement_id,
        auth.uid(),
        case when new.statut = 'annule' then 'annulation' else 'modification' end,
        'rendez_vous',
        new.id,
        jsonb_build_object('statut', old.statut, 'debut_execution', old.debut_execution),
        jsonb_build_object('statut', new.statut, 'debut_execution', new.debut_execution)
      );
  end if;
  return new;
end $$;

create trigger trg_journal_rdv
  after update or delete on rendez_vous
  for each row execute function journaliser_rendez_vous();

