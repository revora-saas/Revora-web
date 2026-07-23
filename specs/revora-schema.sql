-- =====================================================================
-- REVORA — Modèle de données (PostgreSQL / Supabase)
-- Dérivé des documents : Règles métier (R), Adaptation par métier (M),
-- Base clientes (C).
--
-- Conventions :
--   · Toutes les dates sont en timestamptz (UTC) — voir R15.5
--   · Chaque table métier porte etablissement_id → isolation RLS (C10.1)
--   · Suppression = désactivation ou anonymisation, jamais de perte (C9)
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";   -- requis par les contraintes anti-chevauchement


-- =====================================================================
-- 1. ÉTABLISSEMENT, UTILISATEURS, MÉTIERS
-- =====================================================================

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
-- 2. CATALOGUE : PRESTATIONS, DURÉES, RESSOURCES
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
-- 3. DISPONIBILITÉS (R4)
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
-- 4. CLIENTS (documents C)
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
-- 5. RENDEZ-VOUS ET MOTEUR ANTI-COLLISION
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
-- 6. FICHES TECHNIQUES, PHOTOS, TRAÇABILITÉ PMU
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
-- 7. STOCK (R12)
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
-- 8. CAISSE ET FINANCE (R13)
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
-- 9. MESSAGES ET NOTIFICATIONS (R14)
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
-- 10. ABONNEMENT, RÉGLAGES, AUDIT
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
-- 11. SÉCURITÉ : ISOLATION PAR ÉTABLISSEMENT (C10.1)
-- =====================================================================

-- Établissements accessibles à l'utilisateur connecté
create or replace function mes_etablissements()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.etablissement_id
  from membres m
  where m.user_id = auth.uid() and m.actif
$$;

-- Motif à appliquer à TOUTES les tables portant etablissement_id.
-- Exemple pour clients :
alter table clients enable row level security;

create policy clients_lecture on clients for select
  using (etablissement_id in (select mes_etablissements()));

create policy clients_ecriture on clients for insert
  with check (etablissement_id in (select mes_etablissements()));

create policy clients_maj on clients for update
  using (etablissement_id in (select mes_etablissements()));

-- ⚠️ Répliquer ce motif sur : etablissements, membres, categories, prestations,
-- prestation_segments, options_prestation, ressources, prestation_ressources,
-- membre_prestations, horaires, indisponibilites, etiquettes, client_etiquettes,
-- consentements, rendez_vous, rdv_prestations, occupations, liste_attente,
-- evenements_fiabilite, fiches_techniques, photos, produits, lots,
-- mouvements_stock, encaissements, encaissement_lignes, paiements, depenses,
-- modeles_messages, messages, abonnements, reglages, journal_activite.
-- Une table sans RLS = fuite de données entre établissements.


-- =====================================================================
-- 12. NOTES D'IMPLÉMENTATION
-- =====================================================================
--
-- A. CRÉATION D'UN RENDEZ-VOUS — toujours dans UNE transaction :
--    1. calculer debut_bloque = debut_execution - preparation
--                 fin_bloque   = fin_execution + nettoyage + battement
--    2. insérer rendez_vous
--    3. insérer les occupations : une ligne par segment OCCUPÉ (R1.5),
--       plus une ligne par ressource requise
--    4. si une contrainte EXCLUDE lève une erreur → le créneau est pris,
--       annuler et proposer une alternative.
--    C'est la base, et non le code applicatif, qui garantit l'absence
--    de double réservation.
--
-- B. SCORE DE FIABILITÉ : ne jamais recalculer à la volée.
--    Insérer un evenement_fiabilite, puis mettre à jour
--    clients.score_fiabilite par déclencheur (borné entre 0 et 100).
--
-- C. ANONYMISATION (C9.2) : ne jamais supprimer une ligne client.
--    Vider nom, prénom, contacts, adresse, notes ; supprimer les photos ;
--    conserver fiches_techniques, encaissements et consentements ;
--    horodater anonymise_le.
--
-- D. FUSION DE DOUBLONS (C4.3) : réaffecter rendez_vous, fiches_techniques,
--    photos, encaissements et consentements vers la fiche conservée,
--    puis archiver la seconde. Journaliser pour permettre le retour arrière.
--
-- E. FUSEAU HORAIRE : stocker en UTC, convertir à l'affichage.
--    Sans cela, tous les rendez-vous se décalent au changement d'heure.
--
-- F. CRÉNEAUX LIBRES : ne pas les stocker. Les calculer à la demande à
--    partir des horaires, des indisponibilites et des occupations.
--    Une table de créneaux se désynchronise toujours.
