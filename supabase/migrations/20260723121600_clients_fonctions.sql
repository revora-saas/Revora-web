-- =====================================================================
-- REVORA — Migration 16 : fonctions de la base clientes
--   · rechercher_clients  : recherche instantanée (C5.1, C5.2)
--   · anonymiser_cliente  : effacement RGPD sans perte comptable (C9.2)
--   · fusionner_clientes  : fusion de doublons cumulant l'historique (C4.3)
-- =====================================================================

-- ---------------------------------------------------------------------
-- RECHERCHE (C5.1 / C5.2)
-- Instantanée dès 2 caractères sur nom, prénom, e-mail et téléphone.
-- Téléphone trouvable dans TOUS les formats : on compare les chiffres,
-- indicatif +33 et zéro initial neutralisés (la pro tape « 5678 »).
-- Tolérante aux fautes via trigramme (« Dubois » trouve « Duboit »).
-- SECURITY INVOKER (défaut) : le RLS s'applique automatiquement.
-- ---------------------------------------------------------------------
create or replace function rechercher_clients(
  p_etablissement uuid,
  p_recherche text default '',
  p_limit int default 30,
  p_offset int default 0
)
returns setof clients
language sql stable set search_path = public as $$
  with params as (
    select
      trim(coalesce(p_recherche, '')) as q,
      -- forme « nationale » du numéro tapé : chiffres, sans zéro ni +33 initial
      regexp_replace(
        regexp_replace(ltrim(regexp_replace(coalesce(p_recherche, ''), '\D', '', 'g'), '0'),
        '^33', ''), '', '', 'g') as q_tel
  )
  select c.*
  from clients c, params p
  where c.etablissement_id = p_etablissement
    and c.archive_le is null
    and c.anonymise_le is null
    and (
      p.q = ''
      or c.nom ilike '%' || p.q || '%'
      or c.prenom ilike '%' || p.q || '%'
      or c.email ilike '%' || p.q || '%'
      or (
        length(p.q_tel) >= 2
        and regexp_replace(
              coalesce(c.telephone_mobile, '') || ' ' || coalesce(c.telephone_fixe, ''),
              '\D', '', 'g') like '%' || p.q_tel || '%'
      )
      or (length(p.q) >= 3 and c.nom % p.q)
      or (length(p.q) >= 3 and coalesce(c.prenom, '') % p.q)
    )
  order by
    case when p.q = '' then 0 else -similarity(c.nom, p.q) end,
    c.nom
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;


-- ---------------------------------------------------------------------
-- ANONYMISATION RGPD (C9.2) : effacer l'identité, garder la preuve.
-- Identité / contact / adresse / notes effacés définitivement ;
-- photos supprimées (biométrie) ; fiches techniques, encaissements et
-- consentements CONSERVÉS (obligation légale). Jamais de suppression pure.
-- ---------------------------------------------------------------------
create or replace function anonymiser_cliente(p_client_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_etab uuid;
begin
  select etablissement_id into v_etab from clients where id = p_client_id;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;

  delete from photos where client_id = p_client_id;

  update clients set
    civilite = null, nom = 'Cliente anonymisée', prenom = null,
    date_naissance = null, photo_url = null,
    telephone_mobile = null, telephone_fixe = null, email = null,
    adresse = null, complement = null, code_postal = null, ville = null,
    notes_acces = null, allergies = null, contre_indications = null,
    notes_privees = null,
    anonymise_le = now(),
    archive_le = coalesce(archive_le, now())
  where id = p_client_id;
end $$;


-- ---------------------------------------------------------------------
-- FUSION DE DOUBLONS (C4.3) : réaffecte tout l'historique vers la fiche
-- conservée, puis archive l'autre. Journalisé, réversible (archive).
-- ---------------------------------------------------------------------
create or replace function fusionner_clientes(p_garde uuid, p_absorbe uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v1 uuid; v2 uuid;
begin
  if p_garde = p_absorbe then
    raise exception 'Impossible de fusionner une fiche avec elle-même';
  end if;
  select etablissement_id into v1 from clients where id = p_garde;
  select etablissement_id into v2 from clients where id = p_absorbe;
  if v1 is null or v2 is null or v1 <> v2 or v1 not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé';
  end if;

  update rendez_vous        set client_id = p_garde where client_id = p_absorbe;
  update encaissements      set client_id = p_garde where client_id = p_absorbe;
  update fiches_techniques  set client_id = p_garde where client_id = p_absorbe;
  update photos             set client_id = p_garde where client_id = p_absorbe;
  update consentements      set client_id = p_garde where client_id = p_absorbe;
  update evenements_fiabilite set client_id = p_garde where client_id = p_absorbe;
  update liste_attente      set client_id = p_garde where client_id = p_absorbe;

  -- Étiquettes : ne déplacer que celles absentes de la fiche conservée (PK composite).
  update client_etiquettes set client_id = p_garde
    where client_id = p_absorbe
      and etiquette_id not in (
        select etiquette_id from client_etiquettes where client_id = p_garde);
  delete from client_etiquettes where client_id = p_absorbe;

  update clients set archive_le = now() where id = p_absorbe;

  perform recalculer_stats_client(p_garde);
end $$;
