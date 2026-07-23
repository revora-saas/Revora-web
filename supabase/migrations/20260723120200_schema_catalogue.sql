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
