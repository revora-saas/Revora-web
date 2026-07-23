import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Confirmation des liens e-mail Supabase : réinitialisation de mot de passe,
 * changement d'e-mail, confirmation d'inscription.
 * Vérifie le token_hash puis redirige vers la page adéquate.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const suite = searchParams.get("suite") ?? "/tableau-de-bord";

  if (token_hash && type) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Un lien de récupération mène à la page de définition du nouveau mot de passe.
      const destination = type === "recovery" ? "/reinitialiser-mot-de-passe" : suite;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=lien`);
}
