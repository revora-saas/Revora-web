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
