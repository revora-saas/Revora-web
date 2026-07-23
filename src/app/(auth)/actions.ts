"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { creerClientServeur } from "@/lib/supabase/server";
import { envoyerEmailBienvenue } from "@/lib/email/brevo";
import { slugifier, normaliserTelephoneFr } from "@/lib/utils";

/** Résultat standard d'une action : succès, ou message d'erreur en français. */
type Resultat = { ok: true } | { ok: false; erreur: string };

async function origine(): Promise<string> {
  const h = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`
  );
}

// ---------------------------------------------------------------------
// Connexion / inscription par e-mail + mot de passe (repli)
// ---------------------------------------------------------------------

const schemaEmail = z.object({
  email: z.string().email("Adresse e-mail invalide"),
  motDePasse: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères"),
});

export async function connexionMotDePasse(
  email: string,
  motDePasse: string,
): Promise<Resultat> {
  const v = schemaEmail.safeParse({ email, motDePasse });
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithPassword({
    email: v.data.email,
    password: v.data.motDePasse,
  });
  if (error) return { ok: false, erreur: "E-mail ou mot de passe incorrect." };
  return { ok: true };
}

export async function inscriptionMotDePasse(
  email: string,
  motDePasse: string,
): Promise<Resultat & { confirmationRequise?: boolean }> {
  const v = schemaEmail.safeParse({ email, motDePasse });
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };

  const supabase = await creerClientServeur();
  const { data, error } = await supabase.auth.signUp({
    email: v.data.email,
    password: v.data.motDePasse,
    options: { emailRedirectTo: `${await origine()}/auth/confirmer` },
  });
  if (error) {
    if (error.message.includes("already"))
      return { ok: false, erreur: "Un compte existe déjà avec cet e-mail." };
    return { ok: false, erreur: "Inscription impossible. Réessayez." };
  }
  // Si la confirmation e-mail est activée, aucune session n'est ouverte tout de suite.
  const confirmationRequise = !data.session;
  return { ok: true, confirmationRequise };
}

// ---------------------------------------------------------------------
// Connexions sociales (Google, Apple)
// ---------------------------------------------------------------------

export async function urlOAuth(
  fournisseur: "google" | "apple",
  suite?: string,
): Promise<{ url: string } | { ok: false; erreur: string }> {
  const supabase = await creerClientServeur();
  const redirectTo = new URL(`${await origine()}/auth/callback`);
  if (suite) redirectTo.searchParams.set("suite", suite);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: fournisseur,
    options: { redirectTo: redirectTo.toString() },
  });
  if (error || !data.url)
    return { ok: false, erreur: "Connexion impossible pour le moment." };
  return { url: data.url };
}

// ---------------------------------------------------------------------
// Connexion par code SMS (OTP)
// ---------------------------------------------------------------------

export async function envoyerOtpSms(telephone: string): Promise<Resultat> {
  const e164 = normaliserTelephoneFr(telephone);
  if (!e164) return { ok: false, erreur: "Numéro de téléphone invalide." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
  if (error) return { ok: false, erreur: "Envoi du code impossible. Réessayez." };
  return { ok: true };
}

export async function verifierOtpSms(
  telephone: string,
  code: string,
): Promise<Resultat> {
  const e164 = normaliserTelephoneFr(telephone);
  if (!e164) return { ok: false, erreur: "Numéro de téléphone invalide." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.verifyOtp({
    phone: e164,
    token: code.trim(),
    type: "sms",
  });
  if (error) return { ok: false, erreur: "Code incorrect ou expiré." };
  return { ok: true };
}

// ---------------------------------------------------------------------
// Mot de passe oublié / réinitialisation
// ---------------------------------------------------------------------

export async function motDePasseOublie(email: string): Promise<Resultat> {
  const v = z.string().email().safeParse(email);
  if (!v.success) return { ok: false, erreur: "Adresse e-mail invalide." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.resetPasswordForEmail(v.data, {
    redirectTo: `${await origine()}/auth/confirmer?type=recovery`,
  });
  // On ne révèle jamais si l'e-mail existe (sécurité) : toujours « ok ».
  if (error) console.error("[auth] reset:", error.message);
  return { ok: true };
}

export async function definirNouveauMotDePasse(motDePasse: string): Promise<Resultat> {
  if (motDePasse.length < 8)
    return { ok: false, erreur: "Le mot de passe doit faire au moins 8 caractères." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { ok: false, erreur: "Impossible de définir le mot de passe." };
  return { ok: true };
}

// ---------------------------------------------------------------------
// Complétion de profil (après connexion sociale ou inscription)
// ---------------------------------------------------------------------

/** Étape 1 : rattache le téléphone au compte et déclenche l'envoi du code OTP. */
export async function envoyerCodeTelephone(telephone: string): Promise<Resultat> {
  const e164 = normaliserTelephoneFr(telephone);
  if (!e164) return { ok: false, erreur: "Numéro de téléphone invalide." };

  const supabase = await creerClientServeur();
  const { error } = await supabase.auth.updateUser({ phone: e164 });
  if (error) return { ok: false, erreur: "Envoi du code impossible. Réessayez." };
  return { ok: true };
}

const schemaProfil = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  prenom: z.string().optional(),
  nomCommercial: z.string().min(1, "Le nom commercial est obligatoire"),
  telephone: z.string(),
  code: z.string().min(4, "Code invalide"),
});

/** Étape 2 : vérifie le code, enregistre le profil et crée l'établissement. */
export async function finaliserProfil(donnees: {
  nom: string;
  prenom?: string;
  nomCommercial: string;
  telephone: string;
  code: string;
}): Promise<Resultat> {
  const v = schemaProfil.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };

  const e164 = normaliserTelephoneFr(v.data.telephone);
  if (!e164) return { ok: false, erreur: "Numéro de téléphone invalide." };

  const supabase = await creerClientServeur();

  // 1. Vérifie le code : confirme le rattachement du téléphone au compte.
  const { error: errOtp } = await supabase.auth.verifyOtp({
    phone: e164,
    token: v.data.code.trim(),
    type: "phone_change",
  });
  if (errOtp) return { ok: false, erreur: "Code incorrect ou expiré." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erreur: "Session expirée, reconnectez-vous." };

  // 2. Enregistre le profil applicatif (téléphone vérifié).
  const { error: errProfil } = await supabase.from("profils").upsert({
    user_id: user.id,
    nom: v.data.nom,
    prenom: v.data.prenom ?? null,
    telephone: e164,
    telephone_verifie: true,
  });
  if (errProfil) return { ok: false, erreur: "Enregistrement du profil impossible." };

  // 3. Crée l'établissement (+ membre propriétaire, réglages, essai) si absent.
  const { data: membreExistant } = await supabase
    .from("membres")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membreExistant) {
    // Le slug est normalisé et rendu unique côté base (fonction SECURITY DEFINER).
    const nomAffiche = v.data.prenom || v.data.nom;
    const { error: errEtab } = await supabase.rpc("creer_etablissement", {
      p_nom: v.data.nomCommercial,
      p_slug: slugifier(v.data.nomCommercial),
      p_nom_affiche: nomAffiche,
    });
    if (errEtab) return { ok: false, erreur: "Création de l'espace impossible." };

    // E-mail de bienvenue (non bloquant).
    if (user.email) await envoyerEmailBienvenue(user.email, v.data.prenom);
  }

  return { ok: true };
}

// ---------------------------------------------------------------------
// Déconnexion
// ---------------------------------------------------------------------

export async function deconnexion(): Promise<void> {
  const supabase = await creerClientServeur();
  await supabase.auth.signOut();
  redirect("/connexion");
}
