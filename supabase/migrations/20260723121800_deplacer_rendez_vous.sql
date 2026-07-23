-- =====================================================================
-- REVORA — Migration 18 : déplacement d'un rendez-vous en transaction stricte
-- Recalcule les fenêtres et réécrit les occupations atomiquement. Si le
-- nouveau créneau entre en collision (EXCLUDE), tout est annulé et l'ancien
-- rendez-vous reste intact (CRENEAU_PRIS).
-- =====================================================================

create or replace function deplacer_rendez_vous(
  p_rdv             uuid,
  p_debut_execution timestamptz,
  p_fin_execution   timestamptz,
  p_debut_bloque    timestamptz,
  p_fin_bloque      timestamptz,
  p_occupations     jsonb,
  p_ressource_ids   uuid[] default '{}'
)
returns void
language plpgsql as $$
declare
  v_etab uuid;
  v_membre uuid;
  v_occ jsonb;
  v_rid uuid;
begin
  select etablissement_id, membre_id into v_etab, v_membre
  from rendez_vous where id = p_rdv;
  if v_etab is null or v_etab not in (select mes_etablissements()) then
    raise exception 'Accès non autorisé' using errcode = '42501';
  end if;

  -- On libère l'ancien créneau avant de réserver le nouveau.
  delete from occupations where rendez_vous_id = p_rdv;

  update rendez_vous set
    debut_execution = p_debut_execution,
    fin_execution   = p_fin_execution,
    debut_bloque    = p_debut_bloque,
    fin_bloque      = p_fin_bloque
  where id = p_rdv;

  for v_occ in select * from jsonb_array_elements(p_occupations) loop
    insert into occupations (etablissement_id, rendez_vous_id, membre_id, periode)
    values (v_etab, p_rdv, v_membre,
      tstzrange((v_occ->>'debut')::timestamptz, (v_occ->>'fin')::timestamptz));
  end loop;

  if array_length(p_ressource_ids, 1) is not null then
    foreach v_rid in array p_ressource_ids loop
      insert into occupations (etablissement_id, rendez_vous_id, ressource_id, periode)
      values (v_etab, p_rdv, v_rid, tstzrange(p_debut_bloque, p_fin_bloque));
    end loop;
  end if;

exception
  when exclusion_violation then
    raise exception 'CRENEAU_PRIS' using errcode = 'P0001';
end $$;
