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
