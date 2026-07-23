import { creerClientServeur } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

/** Utilisateur connecté (ou null) — côté serveur. */
export async function getUtilisateur(): Promise<User | null> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export interface EtatProfil {
  user: User | null;
  /** Le profil applicatif existe et le téléphone est vérifié. */
  profilComplet: boolean;
  /** L'utilisateur possède au moins un établissement (membre actif). */
  aEtablissement: boolean;
  etablissementId: string | null;
  nomAffiche: string | null;
}

/**
 * État complet du compte : sert de garde aux routes (app) et à l'onboarding.
 *
 * Un compte est « prêt » quand :
 *   1. le profil existe et le téléphone est vérifié (sinon rappels cassés) ;
 *   2. un établissement propriétaire existe (créé à la complétion du profil).
 */
export async function getEtatProfil(): Promise<EtatProfil> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profilComplet: false,
      aEtablissement: false,
      etablissementId: null,
      nomAffiche: null,
    };
  }

  const [{ data: profil }, { data: membre }] = await Promise.all([
    supabase
      .from("profils")
      .select("telephone_verifie")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("membres")
      .select("etablissement_id, nom_affiche")
      .eq("user_id", user.id)
      .eq("actif", true)
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    user,
    profilComplet: Boolean(profil?.telephone_verifie),
    aEtablissement: Boolean(membre),
    etablissementId: membre?.etablissement_id ?? null,
    nomAffiche: membre?.nom_affiche ?? null,
  };
}
