import { NextResponse, type NextRequest } from "next/server";
import { creerClientService } from "@/lib/supabase/service";
import { planifierRappels, envoyerFileMessages } from "@/lib/messagerie/rappels";

export const dynamic = "force-dynamic";

/**
 * Cron des rappels (appelé par Railway). Planifie les rappels à venir puis
 * envoie la file due. Protégé par RAILWAY_CRON_SECRET (header x-cron-secret).
 *
 * Test local :
 *   curl -X POST http://localhost:3000/api/cron/rappels -H "x-cron-secret: <secret>"
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RAILWAY_CRON_SECRET;
  if (secret && request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ erreur: "Non autorisé" }, { status: 401 });
  }

  const svc = creerClientService();
  const planif = await planifierRappels(svc);
  const envoi = await envoyerFileMessages(svc);

  return NextResponse.json({
    ok: true,
    rappels_planifies: planif.crees,
    ...envoi,
  });
}
