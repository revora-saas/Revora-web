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
