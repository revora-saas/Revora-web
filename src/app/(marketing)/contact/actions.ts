"use server";

import { z } from "zod";
import { envoyerEmail } from "@/lib/email/brevo";

const schema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
  demo: z.boolean().optional(),
});

/** Formulaire de contact / demande de démo, relié à Brevo. */
export async function envoyerContact(donnees: {
  nom: string;
  email: string;
  message: string;
  demo?: boolean;
}): Promise<{ ok: boolean; erreur?: string }> {
  const v = schema.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: "Formulaire incomplet." };
  const d = v.data;

  const destination = process.env.BREVO_EXPEDITEUR_EMAIL ?? "contact@revora.fr";
  const sujet = d.demo ? "Demande de démo Revora" : "Contact Revora";
  await envoyerEmail({
    a: { email: destination },
    sujet: `${sujet} — ${d.nom}`,
    html: `<p><strong>${d.nom}</strong> (${d.email})</p><p>${d.message.replace(/\n/g, "<br>")}</p>`,
  });

  return { ok: true };
}
