-- =====================================================================
-- REVORA — Migration 23 : journalisation des rendez-vous (R15.10)
-- Toute annulation, modification ou suppression d'un rendez-vous est
-- journalisée (qui, quand, quoi) pour pouvoir expliquer un litige.
-- =====================================================================

create or replace function journaliser_rendez_vous()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant)
      values (old.etablissement_id, auth.uid(), 'suppression', 'rendez_vous', old.id, to_jsonb(old));
    return old;
  end if;

  -- On ne journalise que les changements significatifs (statut ou horaires),
  -- pas les recalculs techniques.
  if old.statut is distinct from new.statut
     or old.debut_execution is distinct from new.debut_execution
     or old.fin_execution is distinct from new.fin_execution then
    insert into journal_activite (etablissement_id, user_id, action, entite, entite_id, avant, apres)
      values (
        new.etablissement_id,
        auth.uid(),
        case when new.statut = 'annule' then 'annulation' else 'modification' end,
        'rendez_vous',
        new.id,
        jsonb_build_object('statut', old.statut, 'debut_execution', old.debut_execution),
        jsonb_build_object('statut', new.statut, 'debut_execution', new.debut_execution)
      );
  end if;
  return new;
end $$;

create trigger trg_journal_rdv
  after update or delete on rendez_vous
  for each row execute function journaliser_rendez_vous();
