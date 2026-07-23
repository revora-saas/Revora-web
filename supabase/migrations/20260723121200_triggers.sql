-- =====================================================================
-- REVORA — Migration 12 : fonctions et déclencheurs
-- Voir specs : R9 (fiabilité), C2.4 (statut), C2.5 (champs calculés),
-- C8.1/C8.2 (journalisation).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Onboarding : création atomique d'un établissement par l'utilisateur
-- connecté. SECURITY DEFINER car au moment de l'insert l'utilisateur
-- n'est pas encore membre (le RLS le bloquerait sinon).
-- ---------------------------------------------------------------------
create or replace function creer_etablissement(
  p_nom text,
  p_slug text,
  p_nom_affiche text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  insert into etablissements (nom, slug)
    values (p_nom, p_slug)
    returning id into v_id;

  insert into membres (etablissement_id, user_id, nom_affiche, role)
    values (v_id, v_uid, coalesce(p_nom_affiche, p_nom), 'proprietaire');

  -- Réglages et abonnement d'essai par défaut (R16).
  insert into reglages (etablissement_id) values (v_id);
  insert into abonnements (etablissement_id, statut, essai_fin_le)
    values (v_id, 'essai', now() + interval '14 days');

  return v_id;
end $$;


-- ---------------------------------------------------------------------
-- STATUT CLIENT (C2.4) : calculé à partir du score, du nombre de visites
-- et de l'inactivité. Priorité : à risque > inactive > fidèle > régulière > nouvelle.
-- ---------------------------------------------------------------------
create or replace function calculer_statut_client(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare c clients%rowtype;
begin
  select * into c from clients where id = p_client_id;
  if not found or c.anonymise_le is not null then
    return;
  end if;

  update clients set statut = case
    when c.score_fiabilite < 50 then 'a_risque'
    when c.derniere_visite is not null
         and now() - c.derniere_visite
             > make_interval(days => greatest(coalesce(c.frequence_moyenne_j, 0) * 2, 180))
      then 'inactive'
    when c.nombre_visites > 5  then 'fidele'
    when c.nombre_visites >= 2 then 'reguliere'
    else 'nouvelle'
  end
  where id = p_client_id;
end $$;


-- ---------------------------------------------------------------------
-- CHAMPS CALCULÉS DE LA FICHE CLIENTE (C2.5) :
-- nombre_visites, derniere_visite, frequence_moyenne_j (depuis les RDV
-- honorés) et total_depense (depuis les encaissements).
-- Le recalcul ne doit PAS générer d'entrée dans le journal d'activité :
-- on pose un drapeau de session que le trigger de journalisation lit.
-- ---------------------------------------------------------------------
create or replace function recalculer_stats_client(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_client_id is null then
    return;
  end if;

  perform set_config('revora.skip_journal', 'on', true);

  update clients cl set
    nombre_visites      = sub.nb,
    derniere_visite     = sub.derniere,
    frequence_moyenne_j = sub.freq,
    total_depense       = coalesce(enc.total, 0)
  from (
    select
      count(*) filter (where statut = 'honore') as nb,
      max(debut_execution) filter (where statut = 'honore') as derniere,
      case
        when count(*) filter (where statut = 'honore') >= 2 then (
          extract(epoch from (
            max(debut_execution) filter (where statut = 'honore')
            - min(debut_execution) filter (where statut = 'honore')
          )) / 86400.0 / (count(*) filter (where statut = 'honore') - 1)
        )::int
        else null
      end as freq
    from rendez_vous
    where client_id = p_client_id
  ) sub
  cross join (
    select sum(total_ttc) as total
    from encaissements
    where client_id = p_client_id and statut in ('paye', 'partiel')
  ) enc
  where cl.id = p_client_id;

  perform calculer_statut_client(p_client_id);
  perform set_config('revora.skip_journal', 'off', true);
end $$;


-- ---------------------------------------------------------------------
-- SCORE DE FIABILITÉ (R9.2) : à chaque événement, on ajuste le score,
-- borné entre 0 et 100. Ne jamais recalculer à la volée (note B du schéma).
-- ---------------------------------------------------------------------
create or replace function appliquer_impact_fiabilite()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update clients
    set score_fiabilite = greatest(0, least(100, score_fiabilite + new.impact))
    where id = new.client_id;
  -- Le score influe sur le statut (à risque < 50).
  perform calculer_statut_client(new.client_id);
  return new;
end $$;

create trigger trg_fiabilite
  after insert on evenements_fiabilite
  for each row execute function appliquer_impact_fiabilite();


-- ---------------------------------------------------------------------
-- RECALCUL DES STATS quand un RDV change de statut (→ honoré, etc.)
-- ou quand un encaissement est créé / modifié / supprimé.
-- ---------------------------------------------------------------------
create or replace function trig_stats_depuis_rdv()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform recalculer_stats_client(old.client_id);
    return old;
  end if;
  perform recalculer_stats_client(new.client_id);
  -- Un changement de client sur un RDV existant impacte aussi l'ancienne fiche.
  if tg_op = 'UPDATE' and old.client_id is distinct from new.client_id then
    perform recalculer_stats_client(old.client_id);
  end if;
  return new;
end $$;

create trigger trg_stats_rdv
  after insert or delete or update of statut, client_id, debut_execution
  on rendez_vous
  for each row execute function trig_stats_depuis_rdv();

create or replace function trig_stats_depuis_encaissement()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform recalculer_stats_client(old.client_id);
    return old;
  end if;
  perform recalculer_stats_client(new.client_id);
  if tg_op = 'UPDATE' and old.client_id is distinct from new.client_id then
    perform recalculer_stats_client(old.client_id);
  end if;
  return new;
end $$;

create trigger trg_stats_encaissement
  after insert or delete or update of total_ttc, statut, client_id
  on encaissements
  for each row execute function trig_stats_depuis_encaissement();


-- ---------------------------------------------------------------------
-- JOURNALISATION DES MODIFICATIONS DE FICHES CLIENTES (C8.1).
-- Ignore les recalculs automatiques (drapeau revora.skip_journal).
-- SECURITY DEFINER pour écrire dans journal_activite sans dépendre du RLS.
-- ---------------------------------------------------------------------
create or replace function journaliser_client()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Ne pas journaliser les mises à jour de champs calculés (stats).
  if current_setting('revora.skip_journal', true) = 'on' then
    return coalesce(new, old);
  end if;

  if tg_op = 'INSERT' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, apres)
      values (new.etablissement_id, auth.uid(), 'creation', 'client', new.id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant, apres)
      values (new.etablissement_id, auth.uid(), 'modification', 'client', new.id,
              to_jsonb(old), to_jsonb(new));
    return new;
  elsif tg_op = 'DELETE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant)
      values (old.etablissement_id, auth.uid(), 'suppression', 'client', old.id, to_jsonb(old));
    return old;
  end if;
  return null;
end $$;

create trigger trg_journal_client
  after insert or update or delete on clients
  for each row execute function journaliser_client();


-- ---------------------------------------------------------------------
-- JOURNALISATION DES ACCÈS AUX DONNÉES DE SANTÉ (C8.2).
-- À appeler depuis l'application au moment de consulter allergies /
-- contre-indications d'une cliente (les SELECT ne se tracent pas par trigger).
-- ---------------------------------------------------------------------
create or replace function logger_acces_sante(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_etab uuid;
begin
  select etablissement_id into v_etab from clients where id = p_client_id;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;
  insert into journal_activite (etablissement_id, user_id, action, entite, entite_id)
    values (v_etab, auth.uid(), 'acces_sante', 'client', p_client_id);
end $$;
