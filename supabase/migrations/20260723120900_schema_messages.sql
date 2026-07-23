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
