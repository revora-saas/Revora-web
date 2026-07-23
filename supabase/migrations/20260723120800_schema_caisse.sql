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
