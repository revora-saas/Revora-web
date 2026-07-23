import { NextResponse, type NextRequest } from "next/server";
import { creerClientServeur } from "@/lib/supabase/server";

/**
 * Retour des connexions OAuth (Google, Apple) et des liens magiques.
 * Échange le `code` contre une session, puis redirige.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const suite = searchParams.get("suite") ?? "/tableau-de-bord";

  if (code) {
    const supabase = await creerClientServeur();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // La redirection finale (complétion de profil ou app) est arbitrée par
      // le layout (app) selon l'état du compte.
      return NextResponse.redirect(`${origin}${suite}`);
    }
  }

  return NextResponse.redirect(`${origin}/connexion?erreur=oauth`);
}
