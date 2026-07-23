-- =====================================================================
-- REVORA — Migration 19 : réservation publique (verrou anti-collision R7.3)
--
-- La page publique n'a pas d'utilisateur authentifié : ces fonctions sont
-- appelées côté serveur avec la clé service role, TOUJOURS bornées à
-- l'établissement résolu par le slug. Le verrou repose sur les contraintes
-- EXCLUDE de `occupations` : deux clientes ne peuvent jamais confirmer le
-- même créneau (garanti par la base, pas par le code).
-- =====================================================================

-- Pose un verrou temporaire sur un créneau : crée un rendez-vous « demande »
-- sans cliente, valable p_verrou_minutes. Atomique : si le créneau est pris,
-- tout est annulé (CRENEAU_PRIS).
create or replace function verrouiller_creneau(
  p_etablissement   uuid,
  p_membre_id       uuid,
  p_debut_execution timestamptz,
  p_fin_execution   timestamptz,
  p_debut_bloque    timestamptz,
  p_fin_bloque      timestamptz,
  p_occupations     jsonb,
  p_ressource_ids   uuid[] default '{}',
  p_verrou_minutes  int    default 10
)
returns uuid
language plpgsql as $$
declare
  v_rdv uuid;
  v_occ jsonb;
  v_rid uuid;
begin
  insert into rendez_vous (
    etablissement_id, membre_id, debut_execution, fin_execution,
    debut_bloque, fin_bloque, statut, origine, verrou_expire_le
  ) values (
    p_etablissement, p_membre_id, p_debut_execution, p_fin_execution,
    p_debut_bloque, p_fin_bloque, 'demande', 'en_ligne',
    now() + make_interval(mins => p_verrou_minutes)
  ) returning id into v_rdv;

  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (p_etablissement, v_rdv, p_membre_id,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz));
  end loop;

  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (p_etablissement, v_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

  return v_rdv;
exception
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;


-- Libère les verrous expirés (holds non finalisés). À appeler avant de
-- calculer les créneaux disponibles. Les occupations tombent en cascade.
create or replace function nettoyer_verrous(p_etablissement uuid)
returns void
language plpgsql as $$
begin
  delete from rendez_vous
  where etablissement_id = p_etablissement
    and origine = 'en_ligne'
    and client_id is null
    and statut = 'demande'
    and verrou_expire_le is not null
    and verrou_expire_le < now();
end $$;
