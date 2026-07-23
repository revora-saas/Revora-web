import { type NextRequest } from "next/server";
import { creerClientService } from "@/lib/supabase/service";
import { declencherListeAttente } from "@/lib/messagerie/rappels";
import { normaliserTelephoneFr } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Réponse TwiML (SMS de réponse automatique à la cliente). */
function twiml(message: string): Response {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}

/**
 * Webhook Twilio pour les rappels bidirectionnels (R14.1).
 *   OUI  → confirme le rendez-vous à venir.
 *   NON  → annule et libère le créneau (déclenche la liste d'attente).
 *   STOP → désinscription du promotionnel.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const corps = String(form.get("Body") ?? "").trim().toUpperCase();
  const tel = normaliserTelephoneFr(from) ?? from;

  const svc = creerClientService();

  // STOP : désinscription marketing (obligation réglementaire).
  if (corps === "STOP") {
    const { data: clients } = await svc
      .from("clients")
      .select("id, etablissement_id")
      .eq("telephone_mobile", tel);
    for (const c of clients ?? []) {
      await svc.from("consentements").insert({
        etablissement_id: c.etablissement_id,
        client_id: c.id,
        type: "marketing",
        accorde: false,
      });
    }
    return twiml("Vous ne recevrez plus de messages promotionnels.");
  }

  // Prochain rendez-vous à venir de cette cliente.
  const { data: clients } = await svc
    .from("clients")
    .select("id")
    .eq("telephone_mobile", tel)
    .is("archive_le", null);
  const clientIds = (clients ?? []).map((c) => c.id);
  if (clientIds.length === 0) return twiml("Numéro non reconnu.");

  const { data: rdvs } = await svc
    .from("rendez_vous")
    .select("id, etablissement_id, debut_execution, fin_execution, statut")
    .in("client_id", clientIds)
    .in("statut", ["confirme", "demande"])
    .gt("debut_execution", new Date().toISOString())
    .order("debut_execution", { ascending: true })
    .limit(1);
  const rdv = rdvs?.[0];
  if (!rdv) return twiml("Aucun rendez-vous à venir trouvé.");

  if (corps === "OUI" || corps === "OK") {
    await svc.from("rendez_vous").update({ statut: "confirme" }).eq("id", rdv.id);
    return twiml("Merci, votre rendez-vous est confirmé. À bientôt !");
  }

  if (corps === "NON" || corps === "ANNULER") {
    await svc
      .from("rendez_vous")
      .update({ statut: "annule", annule_le: new Date().toISOString() })
      .eq("id", rdv.id);
    // Libère le créneau.
    await svc.from("occupations").delete().eq("rendez_vous_id", rdv.id);
    // Déclenche la liste d'attente sur ce créneau (R10).
    const { data: rp } = await svc
      .from("rdv_prestations")
      .select("prestation_id")
      .eq("rendez_vous_id", rdv.id)
      .limit(1)
      .maybeSingle();
    if (rp?.prestation_id) {
      await declencherListeAttente(svc, rdv.etablissement_id, {
        debut: rdv.debut_execution,
        fin: rdv.fin_execution,
        prestationId: rp.prestation_id,
      });
    }
    return twiml("Votre rendez-vous est annulé. Merci de nous avoir prévenus.");
  }

  return twiml('Répondez OUI pour confirmer, NON pour annuler, STOP pour ne plus être contactée.');
}
