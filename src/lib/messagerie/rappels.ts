// =====================================================================
// Orchestration anti no-show (serveur). Planifie les rappels, envoie la file
// en respectant quota et fenêtre de silence, déclenche la liste d'attente.
// Rien ne doit échouer en silence (R15.7).
// =====================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { respecterFenetreSilence } from "./quiet";
import { remplirGabarit } from "./gabarit";
import { candidatsPourCreneau, type CandidatAttente } from "./liste-attente";
import { envoyerSms, envoyerEmailMessage } from "./providers";

type Client = SupabaseClient<Database>;

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://revora.fr";
}

function formatDate(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}
function formatHeure(iso: string, fuseau: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Récupère un modèle de message (surcharge établissement, sinon système). */
async function getModele(
  svc: Client,
  etabId: string,
  code: string,
  canal: string,
): Promise<string | null> {
  const { data } = await svc
    .from("modeles_messages")
    .select("contenu, etablissement_id")
    .eq("code", code)
    .eq("canal", canal)
    .or(`etablissement_id.eq.${etabId},etablissement_id.is.null`)
    .order("etablissement_id", { ascending: false, nullsFirst: false });
  return data && data.length > 0 ? data[0].contenu : null;
}

// ---------------------------------------------------------------------
// 1. Planification des rappels
// ---------------------------------------------------------------------
export async function planifierRappels(svc: Client): Promise<{ crees: number }> {
  const maintenant = new Date();
  const fin = new Date(maintenant.getTime() + 48 * 3600 * 1000);

  const { data: rdvs } = await svc
    .from("rendez_vous")
    .select("id, etablissement_id, client_id, debut_execution")
    .eq("statut", "confirme")
    .gte("debut_execution", maintenant.toISOString())
    .lte("debut_execution", fin.toISOString());
  if (!rdvs || rdvs.length === 0) return { crees: 0 };

  // Caches par établissement.
  const cacheEtab = new Map<
    string,
    { fuseau: string; salon: string; rappels: { heures: number; canal: string }[] }
  >();
  async function infosEtab(etabId: string) {
    if (cacheEtab.has(etabId)) return cacheEtab.get(etabId)!;
    const [{ data: etab }, { data: reg }] = await Promise.all([
      svc.from("etablissements").select("nom, fuseau").eq("id", etabId).maybeSingle(),
      svc.from("reglages").select("rappels").eq("etablissement_id", etabId).maybeSingle(),
    ]);
    const rappels = Array.isArray(reg?.rappels)
      ? (reg!.rappels as { heures: number; canal: string }[])
      : [{ heures: 24, canal: "sms" }, { heures: 2, canal: "sms" }];
    const infos = { fuseau: etab?.fuseau ?? "Europe/Paris", salon: etab?.nom ?? "", rappels };
    cacheEtab.set(etabId, infos);
    return infos;
  }

  const clientsCache = new Map<string, { prenom: string | null; tel: string | null; email: string | null }>();
  async function infosClient(clientId: string) {
    if (clientsCache.has(clientId)) return clientsCache.get(clientId)!;
    const { data } = await svc
      .from("clients")
      .select("prenom, telephone_mobile, email")
      .eq("id", clientId)
      .maybeSingle();
    const infos = { prenom: data?.prenom ?? null, tel: data?.telephone_mobile ?? null, email: data?.email ?? null };
    clientsCache.set(clientId, infos);
    return infos;
  }

  const aInserer: Database["public"]["Tables"]["messages"]["Insert"][] = [];

  for (const rdv of rdvs) {
    if (!rdv.client_id) continue;
    const { fuseau, salon, rappels } = await infosEtab(rdv.etablissement_id);
    const client = await infosClient(rdv.client_id);
    if (!client.tel) continue;

    const debut = new Date(rdv.debut_execution);
    for (const r of rappels) {
      const rappelAt = new Date(debut.getTime() - r.heures * 3600 * 1000);
      // On ne crée pas de rappel déjà dépassé de plus de 5 min.
      if (rappelAt.getTime() < maintenant.getTime() - 5 * 60 * 1000) continue;

      const code = `rappel_${r.heures}h`;
      const modeleCode = r.heures >= 12 ? "rappel_j1" : "rappel_j2h";
      const gabarit =
        (await getModele(svc, rdv.etablissement_id, modeleCode, "sms")) ??
        "Rappel : rendez-vous le {date} a {heure}.";
      const contenu = remplirGabarit(gabarit, {
        prenom: client.prenom,
        date: formatDate(rdv.debut_execution, fuseau),
        heure: formatHeure(rdv.debut_execution, fuseau),
        salon,
      });

      aInserer.push({
        etablissement_id: rdv.etablissement_id,
        client_id: rdv.client_id,
        rendez_vous_id: rdv.id,
        canal: "sms",
        categorie: "transactionnel",
        destinataire: client.tel,
        contenu,
        code,
        statut: "en_file",
        planifie_le: respecterFenetreSilence(rappelAt, fuseau).toISOString(),
      });
    }
  }

  if (aInserer.length === 0) return { crees: 0 };
  // ignoreDuplicates : l'index unique (rdv, code) évite les doublons.
  const { data } = await svc
    .from("messages")
    .upsert(aInserer, { onConflict: "rendez_vous_id,code", ignoreDuplicates: true })
    .select("id");
  return { crees: data?.length ?? 0 };
}

// ---------------------------------------------------------------------
// 2. Envoi de la file (quota R14.4, échecs visibles R15.7)
// ---------------------------------------------------------------------
export async function envoyerFileMessages(
  svc: Client,
): Promise<{ envoyes: number; echecs: number; simules: number }> {
  const maintenant = new Date().toISOString();
  const { data: messages } = await svc
    .from("messages")
    .select("id, etablissement_id, client_id, canal, categorie, destinataire, contenu, cout_credits")
    .eq("statut", "en_file")
    .or(`planifie_le.is.null,planifie_le.lte.${maintenant}`)
    .order("planifie_le", { ascending: true })
    .limit(200);
  if (!messages || messages.length === 0) return { envoyes: 0, echecs: 0, simules: 0 };

  // Crédits par établissement (R14.4).
  const credits = new Map<string, number>();
  async function creditsRestants(etabId: string): Promise<number> {
    if (credits.has(etabId)) return credits.get(etabId)!;
    const { data } = await svc
      .from("abonnements")
      .select("credits_restants")
      .eq("etablissement_id", etabId)
      .maybeSingle();
    const c = data?.credits_restants ?? 0;
    credits.set(etabId, c);
    return c;
  }

  let envoyes = 0;
  let echecs = 0;
  let simules = 0;

  for (const m of messages) {
    let canal = m.canal;
    let destinataire = m.destinataire;

    // Bascule en e-mail si le quota SMS est épuisé (R14.4).
    if (canal === "sms") {
      const restants = await creditsRestants(m.etablissement_id);
      if (restants <= 0 && m.client_id) {
        const { data: cl } = await svc
          .from("clients")
          .select("email")
          .eq("id", m.client_id)
          .maybeSingle();
        if (cl?.email) {
          canal = "email";
          destinataire = cl.email;
        } else {
          await svc
            .from("messages")
            .update({ statut: "echec", erreur: "Quota SMS épuisé, aucun e-mail disponible." })
            .eq("id", m.id);
          echecs++;
          continue;
        }
      }
    }

    const res =
      canal === "email"
        ? await envoyerEmailMessage(destinataire, "Revora", m.contenu ?? "")
        : await envoyerSms(destinataire, m.contenu ?? "", m.categorie as "transactionnel" | "promotionnel");

    if (res.ok) {
      await svc
        .from("messages")
        .update({ statut: "envoye", envoye_le: new Date().toISOString(), canal, destinataire })
        .eq("id", m.id);
      envoyes++;
      if (res.simule) simules++;
      // Décompte du quota pour les SMS réellement envoyés.
      if (canal === "sms") {
        const restants = (await creditsRestants(m.etablissement_id)) - (m.cout_credits ?? 1);
        credits.set(m.etablissement_id, restants);
        await svc
          .from("abonnements")
          .update({ credits_restants: Math.max(0, restants) })
          .eq("etablissement_id", m.etablissement_id);
      }
    } else {
      // Échec visible pour la pro (R15.7).
      await svc.from("messages").update({ statut: "echec", erreur: res.erreur }).eq("id", m.id);
      echecs++;
    }
  }

  return { envoyes, echecs, simules };
}

// ---------------------------------------------------------------------
// 3. Liste d'attente : première vague à la libération d'un créneau (R10)
// ---------------------------------------------------------------------
export async function declencherListeAttente(
  svc: Client,
  etabId: string,
  creneau: { debut: string; fin: string; prestationId: string },
): Promise<{ proposes: number }> {
  const { data: etab } = await svc
    .from("etablissements")
    .select("nom, slug, fuseau")
    .eq("id", etabId)
    .maybeSingle();
  if (!etab) return { proposes: 0 };
  const fuseau = etab.fuseau ?? "Europe/Paris";

  const { data: attentes } = await svc
    .from("liste_attente")
    .select("id, client_id, prestation_id, disponibilites, cree_le")
    .eq("etablissement_id", etabId)
    .eq("prestation_id", creneau.prestationId)
    .eq("statut", "active");
  if (!attentes || attentes.length === 0) return { proposes: 0 };

  // Scores des clientes.
  const clientIds = attentes.map((a) => a.client_id);
  const { data: clients } = await svc
    .from("clients")
    .select("id, score_fiabilite, telephone_mobile, prenom")
    .in("id", clientIds);
  const scoreMap = new Map((clients ?? []).map((c) => [c.id, c]));

  const candidats: CandidatAttente[] = attentes.map((a) => ({
    id: a.id,
    clientId: a.client_id,
    score: scoreMap.get(a.client_id)?.score_fiabilite ?? 80,
    creeLe: a.cree_le,
    prestationId: a.prestation_id,
    disponibilites: Array.isArray(a.disponibilites)
      ? (a.disponibilites as { jour: number; debut: string; fin: string }[])
      : [],
  }));

  const ordonnes = candidatsPourCreneau(
    candidats,
    { debut: new Date(creneau.debut), fin: new Date(creneau.fin), prestationId: creneau.prestationId },
    fuseau,
  ).slice(0, 3); // première vague de 3 (R10.4)
  if (ordonnes.length === 0) return { proposes: 0 };

  const gabarit =
    (await getModele(svc, etabId, "liste_attente", "sms")) ??
    "Un creneau s'est libere le {date} a {heure}. Reservez : {lien}";
  const lien = `${siteUrl()}/${etab.slug}`;

  const messages: Database["public"]["Tables"]["messages"]["Insert"][] = [];
  for (const c of ordonnes) {
    const cl = scoreMap.get(c.clientId);
    if (!cl?.telephone_mobile) continue;
    messages.push({
      etablissement_id: etabId,
      client_id: c.clientId,
      canal: "sms",
      categorie: "transactionnel",
      destinataire: cl.telephone_mobile,
      contenu: remplirGabarit(gabarit, {
        date: formatDate(creneau.debut, fuseau),
        heure: formatHeure(creneau.debut, fuseau),
        lien,
      }),
      statut: "en_file",
      planifie_le: respecterFenetreSilence(new Date(), fuseau).toISOString(),
    });
  }
  if (messages.length > 0) {
    await svc.from("messages").insert(messages);
    await svc
      .from("liste_attente")
      .update({ statut: "proposee", propose_le: new Date().toISOString() })
      .in(
        "id",
        ordonnes.map((c) => c.id),
      );
  }
  return { proposes: messages.length };
}
