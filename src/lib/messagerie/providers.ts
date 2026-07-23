// =====================================================================
// Envoi effectif des messages. Twilio (SMS) et Brevo (email).
//
// SÉPARATION STRICTE DES FLUX (obligation réglementaire française) :
// le transactionnel (rappels, confirmations) et le promotionnel (campagnes)
// utilisent des expéditeurs Twilio DISTINCTS.
//
// Mode DEV : sans clés, l'envoi est SIMULÉ (journalisé) — permet de tester
// tout le cycle en local sans envoyer de vrais SMS.
// =====================================================================

import { envoyerEmail } from "@/lib/email/brevo";

export interface ResultatEnvoi {
  ok: boolean;
  simule?: boolean;
  erreur?: string;
}

type Categorie = "transactionnel" | "promotionnel";

/** Expéditeur SMS selon le flux (connexions Twilio distinctes). */
function expediteurSms(categorie: Categorie): string | undefined {
  return categorie === "promotionnel"
    ? process.env.TWILIO_SMS_SENDER_PROMO ?? process.env.TWILIO_SMS_SENDER
    : process.env.TWILIO_SMS_SENDER;
}

export async function envoyerSms(
  destinataire: string,
  contenu: string,
  categorie: Categorie,
): Promise<ResultatEnvoi> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = expediteurSms(categorie);

  // Mode simulation (dev / test local).
  if (!sid || !token || !from) {
    console.info(`[sms:${categorie}:SIMULÉ] → ${destinataire} : ${contenu}`);
    return { ok: true, simule: true };
  }

  try {
    const reponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: from, To: destinataire, Body: contenu }),
      },
    );
    if (!reponse.ok) {
      const detail = await reponse.text();
      return { ok: false, erreur: `Twilio ${reponse.status}: ${detail.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Échec d'envoi SMS" };
  }
}

export async function envoyerEmailMessage(
  destinataire: string,
  sujet: string,
  contenu: string,
): Promise<ResultatEnvoi> {
  if (!process.env.BREVO_API_KEY) {
    console.info(`[email:SIMULÉ] → ${destinataire} : ${sujet}`);
    return { ok: true, simule: true };
  }
  try {
    await envoyerEmail({
      a: { email: destinataire },
      sujet,
      html: `<p>${contenu.replace(/\n/g, "<br>")}</p>`,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, erreur: e instanceof Error ? e.message : "Échec d'envoi e-mail" };
  }
}
