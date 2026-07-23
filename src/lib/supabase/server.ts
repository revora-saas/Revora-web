import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server Actions).
 * Lit et rafraîchit la session via les cookies.
 *
 * Note Next.js 16 : cookies() est asynchrone.
 */
export async function creerClientServeur() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un Server Component : l'écriture de cookies
            // est ignorée. Le middleware se charge du rafraîchissement.
          }
        },
      },
    },
  );
}
