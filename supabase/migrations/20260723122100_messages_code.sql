-- =====================================================================
-- REVORA — Migration 21 : colonne `code` sur messages
-- Identifie le type de message (rappel_24h, rappel_2h, confirmation…) pour
-- éviter d'envoyer deux fois le même rappel pour un rendez-vous.
-- =====================================================================

alter table messages add column if not exists code text;

-- Dédoublonnage des rappels : un seul message d'un code donné par RDV.
create unique index if not exists messages_rdv_code_unique
  on messages (rendez_vous_id, code)
  where rendez_vous_id is not null and code is not null;
