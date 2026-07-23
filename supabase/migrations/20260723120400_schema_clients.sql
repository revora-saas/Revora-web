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
