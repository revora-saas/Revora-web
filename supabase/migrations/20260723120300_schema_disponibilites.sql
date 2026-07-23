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
