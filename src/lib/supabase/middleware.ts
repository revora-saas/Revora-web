import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";

/**
 * Rafraîchit la session Supabase à chaque requête et applique la protection
 * des routes de l'application authentifiée.
 *
 * Pattern officiel @supabase/ssr : on recrée la réponse en propageant les
 * cookies mis à jour, sinon la session expire silencieusement.
 */
export async function mettreAJourSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT : ne rien exécuter entre createServerClient et getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;

  // Routes de l'application authentifiée : session obligatoire.
  const besoinAuth =
    chemin.startsWith("/tableau-de-bord") ||
    chemin.startsWith("/agenda") ||
    chemin.startsWith("/clientes") ||
    chemin.startsWith("/catalogue") ||
    chemin.startsWith("/caisse") ||
    chemin.startsWith("/reglages") ||
    chemin.startsWith("/completer-profil") ||
    chemin.startsWith("/onboarding");

  if (besoinAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", chemin);
    return NextResponse.redirect(url);
  }

  // Un utilisateur connecté qui arrive sur les pages d'auth est renvoyé
  // vers l'application.
  const pagesAuth = ["/connexion", "/inscription"];
  if (user && pagesAuth.includes(chemin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/tableau-de-bord";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
