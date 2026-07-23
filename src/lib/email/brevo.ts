/**
 * Envoi d'e-mails transactionnels via l'API Brevo.
 *
 * Les e-mails d'AUTHENTIFICATION gérés par Supabase (réinitialisation de mot
 * de passe, confirmation de changement d'e-mail) partent via le SMTP configuré
 * dans Supabase → à brancher sur Brevo (voir supabase/README ou la note de fin
 * de prompt). Ce module sert aux e-mails déclenchés par NOTRE code (bienvenue…).
 */

interface Destinataire {
  email: string;
  nom?: string;
}

interface OptionsEmail {
  a: Destinataire;
  sujet: string;
  html: string;
}

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Envoie un e-mail. En l'absence de BREVO_API_KEY (dev local), l'envoi est
 * ignoré avec un avertissement plutôt que de faire échouer l'action.
 */
export async function envoyerEmail({ a, sujet, html }: OptionsEmail): Promise<void> {
  const cle = process.env.BREVO_API_KEY;
  if (!cle) {
    console.warn(`[brevo] BREVO_API_KEY absente — e-mail « ${sujet} » non envoyé (dev).`);
    return;
  }

  const reponse = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": cle,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_EXPEDITEUR_NOM ?? "Revora",
        email: process.env.BREVO_EXPEDITEUR_EMAIL ?? "contact@revora.fr",
      },
      to: [{ email: a.email, name: a.nom }],
      subject: sujet,
      htmlContent: html,
    }),
  });

  if (!reponse.ok) {
    const detail = await reponse.text();
    // On journalise sans casser le parcours utilisateur (l'e-mail n'est pas bloquant).
    console.error(`[brevo] Échec d'envoi (${reponse.status}) : ${detail}`);
  }
}

/** Gabarit HTML sobre aux couleurs Revora (fond sombre, accent violet). */
function gabarit(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#0b1020">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="text-align:center;padding:8px 0 24px">
      <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px">Revora</span>
    </div>
    <div style="background:#ffffff;border-radius:16px;padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px">${titre}</h1>
      ${corps}
    </div>
    <p style="text-align:center;color:#8a90a6;font-size:12px;margin-top:20px">
      Revora — le logiciel adapté à tous les professionnels de la beauté.
    </p>
  </div>
</body></html>`;
}

/** E-mail de bienvenue envoyé après la création du compte / établissement. */
export async function envoyerEmailBienvenue(email: string, prenom?: string): Promise<void> {
  const bonjour = prenom ? `Bonjour ${prenom},` : "Bonjour,";
  const html = gabarit(
    "Bienvenue sur Revora 🎉",
    `<p style="font-size:15px;line-height:1.6;color:#3b3f4d">${bonjour}</p>
     <p style="font-size:15px;line-height:1.6;color:#3b3f4d">
       Votre compte est créé. Il ne reste plus qu'à configurer votre espace selon
       votre métier, créer vos prestations et partager votre lien de réservation.
     </p>
     <p style="margin:24px 0">
       <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora.fr"}/tableau-de-bord"
          style="background:#6d4cff;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;font-size:15px">
         Accéder à mon espace
       </a>
     </p>
     <p style="font-size:13px;line-height:1.6;color:#8a90a6">
       Besoin d'aide pour démarrer ? Répondez simplement à cet e-mail.
     </p>`,
  );
  await envoyerEmail({ a: { email, nom: prenom }, sujet: "Bienvenue sur Revora", html });
}
