-- =====================================================================
-- REVORA — Migration 22 : encaissement atomique (R13)
-- Numérotation séquentielle SANS TROU par établissement et par année
-- (obligation légale). Sérialisée par un verrou consultatif pour éviter
-- toute collision de numéro. L'encaissement clôture le RDV (honoré) et
-- alimente le score de fiabilité (R13.5).
-- =====================================================================

create or replace function creer_encaissement(
  p_etablissement   uuid,
  p_client_id       uuid,
  p_rendez_vous_id  uuid,
  p_lignes          jsonb,   -- [{type,libelle,quantite,prix_unitaire,produit_id,prestation_id}]
  p_paiements       jsonb,   -- [{montant,moyen,type}]
  p_acompte_deduit  numeric default 0
)
returns jsonb
language plpgsql as $$
declare
  v_id uuid;
  v_numero text;
  v_annee text := to_char(now(), 'YYYY');
  v_seq int;
  v_total numeric := 0;
  v_paye numeric := 0;
  v_statut text;
  v_ligne jsonb;
  v_paiement jsonb;
begin
  if p_etablissement not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  -- Sérialise la numérotation pour cet établissement (pas de trou, pas de doublon).
  perform pg_advisory_xact_lock(hashtext('encaissement:' || p_etablissement::text));

  select count(*) + 1 into v_seq
  from encaissements
  where etablissement_id = p_etablissement and numero like v_annee || '-%';
  v_numero := v_annee || '-' || lpad(v_seq::text, 4, '0');

  -- Total TTC = somme des lignes (les remises sont des montants négatifs).
  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    v_total := v_total +
      coalesce((v_ligne->>'quantite')::numeric, 1) * coalesce((v_ligne->>'prix_unitaire')::numeric, 0);
  end loop;

  -- Total réglé = acompte déjà versé + paiements (hors remboursements).
  v_paye := coalesce(p_acompte_deduit, 0);
  for v_paiement in select * from jsonb_array_elements(p_paiements) loop
    if coalesce(v_paiement->>'type', 'solde') <> 'remboursement' then
      v_paye := v_paye + coalesce((v_paiement->>'montant')::numeric, 0);
    end if;
  end loop;

  v_statut := case when v_paye >= v_total then 'paye' else 'partiel' end;

  insert into encaissements (
    etablissement_id, client_id, rendez_vous_id, numero,
    total_ttc, acompte_deduit, statut
  ) values (
    p_etablissement, p_client_id, p_rendez_vous_id, v_numero,
    v_total, coalesce(p_acompte_deduit, 0), v_statut
  ) returning id into v_id;

  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    insert into encaissement_lignes (encaissement_id, type, libelle, quantite, prix_unitaire, produit_id, prestation_id)
    values (
      v_id,
      v_ligne->>'type',
      v_ligne->>'libelle',
      coalesce((v_ligne->>'quantite')::numeric, 1),
      coalesce((v_ligne->>'prix_unitaire')::numeric, 0),
      nullif(v_ligne->>'produit_id', '')::uuid,
      nullif(v_ligne->>'prestation_id', '')::uuid
    );
  end loop;

  for v_paiement in select * from jsonb_array_elements(p_paiements) loop
    insert into paiements (etablissement_id, encaissement_id, rendez_vous_id, montant, moyen, type)
    values (
      p_etablissement, v_id, p_rendez_vous_id,
      coalesce((v_paiement->>'montant')::numeric, 0),
      v_paiement->>'moyen',
      coalesce(v_paiement->>'type', 'solde')
    );
  end loop;

  -- L'encaissement clôture le RDV → honoré + fiabilité (R13.5).
  if p_rendez_vous_id is not null then
    update rendez_vous set statut = 'honore' where id = p_rendez_vous_id and statut <> 'honore';
    if not exists (
      select 1 from evenements_fiabilite
      where rendez_vous_id = p_rendez_vous_id and type = 'honore'
    ) and p_client_id is not null then
      insert into evenements_fiabilite (etablissement_id, client_id, rendez_vous_id, type, impact)
      values (p_etablissement, p_client_id, p_rendez_vous_id, 'honore', 3);
    end if;
  end if;

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'total', v_total, 'statut', v_statut);
end $$;
