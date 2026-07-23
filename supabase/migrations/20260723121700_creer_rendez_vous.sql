-- =====================================================================
-- REVORA — Migration 17 : création d'un rendez-vous en transaction stricte
-- (note A du schéma). La BASE garantit l'absence de double réservation via
-- les contraintes EXCLUDE sur `occupations`, pas le code applicatif (R7.3).
--
-- Une fonction plpgsql est atomique : si l'insertion d'une occupation viole
-- une contrainte EXCLUDE (créneau déjà pris), tout le rendez-vous est annulé
-- et l'erreur « CRENEAU_PRIS » est renvoyée pour proposer une alternative.
-- =====================================================================

create or replace function creer_rendez_vous(
  p_etablissement    uuid,
  p_client_id        uuid,
  p_membre_id        uuid,
  p_debut_execution  timestamptz,
  p_fin_execution    timestamptz,
  p_debut_bloque     timestamptz,
  p_fin_bloque       timestamptz,
  p_occupations      jsonb,                 -- [{"debut":"...","fin":"..."}] segments OCCUPÉS
  p_ressource_ids    uuid[]   default '{}', -- ressources bloquées sur toute la fenêtre (R1.7)
  p_statut           statut_rdv default 'confirme',
  p_origine          text     default 'pro',
  p_montant_total    numeric  default 0,
  p_acompte_du       numeric  default 0,
  p_a_domicile       boolean  default false,
  p_adresse          text     default null,
  p_notes            text     default null,
  p_prestations      jsonb    default '[]'  -- [{"prestation_id","libelle","prix","duree_execution","ordre"}]
)
returns uuid
language plpgsql as $$
declare
  v_rdv uuid;
  v_occ jsonb;
  v_presta jsonb;
  v_rid uuid;
begin
  if p_etablissement not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  insert into rendez_vous (
    etablissement_id, client_id, membre_id,
    debut_execution, fin_execution, debut_bloque, fin_bloque,
    statut, origine, montant_total, acompte_du, a_domicile, adresse_intervention, notes
  ) values (
    p_etablissement, p_client_id, p_membre_id,
    p_debut_execution, p_fin_execution, p_debut_bloque, p_fin_bloque,
    p_statut, p_origine, p_montant_total, p_acompte_du, p_a_domicile, p_adresse, p_notes
  ) returning id into v_rdv;

  -- Occupations de la praticienne : une ligne par segment occupé (R1.5).
  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (
      p_etablissement, v_rdv, p_membre_id,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz)
    );
  end loop;

  -- Occupations des ressources : toute la fenêtre bloquée (la salle reste
  -- occupée pendant la pose, R1.7).
  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (p_etablissement, v_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

  -- Prestations figées (le catalogue peut changer ensuite).
  for v_presta in select * from jsonb_array_elements(p_prestations) loop
    insert into rdv_prestations (rendez_vous_id, prestation_id, libelle, prix, duree_execution, ordre)
    values (
      v_rdv,
      nullif(v_presta->>'prestation_id', '')::uuid,
      v_presta->>'libelle',
      coalesce((v_presta->>'prix')::numeric, 0),
      coalesce((v_presta->>'duree_execution')::int, 0),
      coalesce((v_presta->>'ordre')::int, 0)
    );
  end loop;

  return v_rdv;

exception
  -- Une contrainte EXCLUDE a levé : le créneau vient d'être pris.
  -- Toute la transaction de la fonction est annulée automatiquement.
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;
