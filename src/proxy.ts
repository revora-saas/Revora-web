import type { NextRequest } from "next/server";
import { mettreAJourSession } from "@/lib/supabase/middleware";

/**
 * Proxy Next.js 16 (ex-« middleware ») : rafraîchit la session Supabase et
 * protège les routes de l'application authentifiée avant le rendu.
 */
export function proxy(request: NextRequest) {
  return mettreAJourSession(request);
}

export const config = {
  // Exclut fichiers statiques et images ; s'applique au reste.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
