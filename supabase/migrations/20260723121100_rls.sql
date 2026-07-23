-- =====================================================================
-- REVORA — Migration 11 : sécurité, isolation par établissement (C10.1)
-- Section 11 du schéma.
--
-- Règle de sécurité la plus critique du produit : aucune requête ne peut
-- atteindre les données d'un autre établissement. RLS est activé sur
-- CHAQUE table, sans exception.
--
-- Motif :
--   · Tables portant etablissement_id → policy directe via mes_etablissements()
--   · Tables enfant sans etablissement_id → scoping via la table parente
--   · profils → chaque utilisateur ne voit que sa propre ligne
--   · metiers → référentiel public en lecture seule (aucune écriture)
-- =====================================================================

-- Établissements accessibles à l'utilisateur connecté.
create or replace function mes_etablissements()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select m.etablissement_id
  from membres m
  where m.user_id = auth.uid() and m.actif
$$;

-- ---------------------------------------------------------------------
-- profils : chaque utilisateur gère uniquement sa propre fiche.
-- ---------------------------------------------------------------------
alter table profils enable row level security;
create policy profils_acces on profils for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- metiers : référentiel partagé, lisible par tout utilisateur connecté,
-- jamais modifiable depuis l'application (seed uniquement).
-- ---------------------------------------------------------------------
alter table metiers enable row level security;
create policy metiers_lecture on metiers for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------
-- etablissements : accès via appartenance. La CRÉATION d'un établissement
-- passe par la fonction SECURITY DEFINER creer_etablissement() (migration 12),
-- car au moment de l'insert l'utilisateur n'est pas encore membre.
-- ---------------------------------------------------------------------
alter table etablissements enable row level security;
create policy etablissements_lecture on etablissements for select
  using (id in (select mes_etablissements()));
create policy etablissements_maj on etablissements for update
  using (id in (select mes_etablissements()))
  with check (id in (select mes_etablissements()));

-- ---------------------------------------------------------------------
-- Tables portant directement etablissement_id.
-- Une policy « for all » : lecture, insertion, mise à jour, suppression,
-- toutes limitées aux établissements de l'utilisateur.
-- ---------------------------------------------------------------------
do $$
declare
  t text;
  tables_etab text[] := array[
    'membres','etablissement_metiers','categories','prestations','ressources',
    'horaires','indisponibilites','clients','etiquettes','consentements',
    'rendez_vous','occupations','liste_attente','evenements_fiabilite',
    'fiches_techniques','photos','produits','lots','mouvements_stock',
    'encaissements','paiements','depenses','messages','abonnements',
    'reglages','journal_activite'
  ];
begin
  foreach t in array tables_etab loop
    execute format('alter table %I enable row level security;', t);
    execute format($f$
      create policy %1$s_acces on %1$I for all
        using (etablissement_id in (select mes_etablissements()))
        with check (etablissement_id in (select mes_etablissements()));
    $f$, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- modeles_messages : etablissement_id NULLABLE (null = modèle système).
-- Lecture : modèles système OU ceux de l'établissement.
-- Écriture : uniquement ses propres modèles.
-- ---------------------------------------------------------------------
alter table modeles_messages enable row level security;
create policy modeles_lecture on modeles_messages for select
  using (etablissement_id is null or etablissement_id in (select mes_etablissements()));
create policy modeles_ecriture on modeles_messages for insert
  with check (etablissement_id in (select mes_etablissements()));
create policy modeles_maj on modeles_messages for update
  using (etablissement_id in (select mes_etablissements()))
  with check (etablissement_id in (select mes_etablissements()));
create policy modeles_suppr on modeles_messages for delete
  using (etablissement_id in (select mes_etablissements()));

-- ---------------------------------------------------------------------
-- Tables ENFANT sans etablissement_id : scoping via la table parente.
-- ---------------------------------------------------------------------

-- prestation_segments, options_prestation → prestations
alter table prestation_segments enable row level security;
create policy prestation_segments_acces on prestation_segments for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

alter table options_prestation enable row level security;
create policy options_prestation_acces on options_prestation for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

-- prestation_ressources → prestations
alter table prestation_ressources enable row level security;
create policy prestation_ressources_acces on prestation_ressources for all
  using (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from prestations p
                 where p.id = prestation_id
                   and p.etablissement_id in (select mes_etablissements())));

-- membre_prestations → membres
alter table membre_prestations enable row level security;
create policy membre_prestations_acces on membre_prestations for all
  using (exists (select 1 from membres m
                 where m.id = membre_id
                   and m.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from membres m
                 where m.id = membre_id
                   and m.etablissement_id in (select mes_etablissements())));

-- client_etiquettes → clients
alter table client_etiquettes enable row level security;
create policy client_etiquettes_acces on client_etiquettes for all
  using (exists (select 1 from clients c
                 where c.id = client_id
                   and c.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from clients c
                 where c.id = client_id
                   and c.etablissement_id in (select mes_etablissements())));

-- rdv_prestations → rendez_vous
alter table rdv_prestations enable row level security;
create policy rdv_prestations_acces on rdv_prestations for all
  using (exists (select 1 from rendez_vous r
                 where r.id = rendez_vous_id
                   and r.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from rendez_vous r
                 where r.id = rendez_vous_id
                   and r.etablissement_id in (select mes_etablissements())));

-- encaissement_lignes → encaissements
alter table encaissement_lignes enable row level security;
create policy encaissement_lignes_acces on encaissement_lignes for all
  using (exists (select 1 from encaissements e
                 where e.id = encaissement_id
                   and e.etablissement_id in (select mes_etablissements())))
  with check (exists (select 1 from encaissements e
                 where e.id = encaissement_id
                   and e.etablissement_id in (select mes_etablissements())));
