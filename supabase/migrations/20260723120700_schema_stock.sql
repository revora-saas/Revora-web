-- =====================================================================
-- REVORA — Migration 07 : stock (R12)
-- Section 7 du schéma. Produits, lots + péremption (PMU), mouvements.
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
