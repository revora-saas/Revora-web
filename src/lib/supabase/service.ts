import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Client Supabase avec la clé SERVICE ROLE — contourne le RLS.
 *
 * ⚠️ SERVEUR UNIQUEMENT (import "server-only"). À n'utiliser que pour la
 * réservation publique (aucun utilisateur authentifié), et TOUJOURS en
 * bornant chaque requête à l'établissement résolu par le slug. Ne jamais
 * exposer cette clé au navigateur.
 */
export function creerClientService() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
