-- =====================================================================
-- REVORA — Migration 15 : slug unique dans creer_etablissement()
-- Le slug de réservation (revora.fr/<slug>) doit être unique. Sous RLS,
-- l'application ne voit pas les établissements des autres comptes et ne
-- peut donc pas garantir l'unicité. On confie ce calcul à la fonction
-- SECURITY DEFINER, qui a une vue globale.
-- =====================================================================

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
  v_base text;
  v_slug text;
  v_n int := 1;
begin
  if v_uid is null then
    raise exception 'Authentification requise';
  end if;

  -- Normalise le slug proposé : minuscules, accents translittérés (portable,
  -- sans extension), puis tout caractère non alphanumérique devient un tiret.
  v_base := lower(coalesce(nullif(p_slug, ''), 'mon-salon'));
  v_base := translate(v_base,
              'àâäáãéèêëíìîïóòôöõúùûüçÿ',
              'aaaaaeeeeiiiiooooouuuucy');
  v_base := trim(both '-' from regexp_replace(v_base, '[^a-z0-9]+', '-', 'g'));
  if v_base = '' then
    v_base := 'mon-salon';
  end if;
  v_slug := v_base;
  while exists (select 1 from etablissements where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  insert into etablissements (nom, slug)
    values (p_nom, v_slug)
    returning id into v_id;

  insert into membres (etablissement_id, user_id, nom_affiche, role)
    values (v_id, v_uid, coalesce(p_nom_affiche, p_nom), 'proprietaire');

  insert into reglages (etablissement_id) values (v_id);
  insert into abonnements (etablissement_id, statut, essai_fin_le)
    values (v_id, 'essai', now() + interval '14 days');

  return v_id;
end $$;
