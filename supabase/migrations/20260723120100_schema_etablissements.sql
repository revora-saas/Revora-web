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
