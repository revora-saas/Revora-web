"use server";

import { z } from "zod";
import { contexteEtablissement } from "@/lib/auth";
import { normaliserTelephoneFr } from "@/lib/utils";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/database.types";

type Cliente = Tables<"clients">;

const PAGE = 30;

// ---------------------------------------------------------------------
// Recherche (C5.1) — pagination progressive
// ---------------------------------------------------------------------
export async function rechercherClientes(
  recherche: string,
  offset = 0,
): Promise<Cliente[]> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data } = await ctx.supabase.rpc("rechercher_clients", {
    p_etablissement: ctx.etablissementId,
    p_recherche: recherche,
    p_limit: PAGE,
    p_offset: offset,
  });
  return (data ?? []) as Cliente[];
}

// ---------------------------------------------------------------------
// Création rapide (C3.1) — nom + mobile suffisent, dédup non bloquante
// ---------------------------------------------------------------------
const schemaCreation = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),
  telephone: z.string().min(1, "Le mobile est obligatoire"),
});

export async function creerClienteRapide(
  nom: string,
  telephone: string,
): Promise<
  | { ok: true; id: string; doublon: { id: string; nom: string } | null }
  | { ok: false; erreur: string }
> {
  const v = schemaCreation.safeParse({ nom, telephone });
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };

  const e164 = normaliserTelephoneFr(telephone);
  if (!e164) return { ok: false, erreur: "Numéro de mobile invalide." };

  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // Détection de doublon (C4.1) : même mobile — alerte NON bloquante (R15.6).
  const { data: existant } = await ctx.supabase
    .from("clients")
    .select("id, nom")
    .eq("etablissement_id", ctx.etablissementId)
    .eq("telephone_mobile", e164)
    .is("archive_le", null)
    .limit(1)
    .maybeSingle();

  const { data: cree, error } = await ctx.supabase
    .from("clients")
    .insert({
      etablissement_id: ctx.etablissementId,
      nom: v.data.nom.trim(),
      telephone_mobile: e164,
    })
    .select("id")
    .single();
  if (error || !cree) return { ok: false, erreur: "Création impossible." };

  return { ok: true, id: cree.id, doublon: existant ?? null };
}

// ---------------------------------------------------------------------
// Mise à jour d'une fiche (enrichissement progressif) + normalisation
// ---------------------------------------------------------------------
const schemaMaj = z.object({
  civilite: z.string().nullish(),
  nom: z.string().min(1),
  prenom: z.string().nullish(),
  email: z.string().email("E-mail invalide").nullish().or(z.literal("")),
  telephone_mobile: z.string().nullish(),
  date_naissance: z.string().nullish().or(z.literal("")),
  adresse: z.string().nullish(),
  code_postal: z.string().nullish(),
  ville: z.string().nullish(),
  canal_prefere: z.enum(["sms", "whatsapp", "email"]).nullish().or(z.literal("")),
  source: z.string().nullish(),
  allergies: z.string().nullish(),
  contre_indications: z.string().nullish(),
  notes_privees: z.string().nullish(),
});

export async function majCliente(
  id: string,
  donnees: Record<string, unknown>,
): Promise<{ ok: boolean; erreur?: string }> {
  const v = schemaMaj.safeParse(donnees);
  if (!v.success) return { ok: false, erreur: v.error.issues[0].message };

  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  const d = v.data;
  const maj: TablesUpdate<"clients"> = {
    civilite: d.civilite || null,
    nom: d.nom.trim(),
    prenom: d.prenom || null,
    email: d.email ? d.email.toLowerCase().trim() : null, // C3.3 : minuscules
    date_naissance: d.date_naissance || null,
    adresse: d.adresse || null,
    code_postal: d.code_postal || null,
    ville: d.ville || null,
    canal_prefere: d.canal_prefere || null,
    source: d.source || null,
    allergies: d.allergies || null,
    contre_indications: d.contre_indications || null,
    notes_privees: d.notes_privees || null,
  };

  if (d.telephone_mobile) {
    const e164 = normaliserTelephoneFr(d.telephone_mobile);
    if (!e164) return { ok: false, erreur: "Numéro de mobile invalide." };
    maj.telephone_mobile = e164;
  } else {
    maj.telephone_mobile = null;
  }

  const { error } = await ctx.supabase
    .from("clients")
    .update(maj)
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId);
  return error ? { ok: false, erreur: "Enregistrement impossible." } : { ok: true };
}

// ---------------------------------------------------------------------
// Anonymisation RGPD (C9.2) et fusion de doublons (C4.3)
// ---------------------------------------------------------------------
export async function anonymiserClienteAction(
  id: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase.rpc("anonymiser_cliente", { p_client_id: id });
  return error ? { ok: false, erreur: "Anonymisation impossible." } : { ok: true };
}

/** Clientes à relancer : prochaine visite estimée dépassée (C2.3). */
export async function listerRelances(): Promise<
  { id: string; nom: string; tel: string | null; joursRetard: number }[]
> {
  const ctx = await contexteEtablissement();
  if (!ctx) return [];
  const { data } = await ctx.supabase
    .from("clients")
    .select("id, nom, prenom, telephone_mobile, derniere_visite, frequence_moyenne_j")
    .eq("etablissement_id", ctx.etablissementId)
    .is("archive_le", null)
    .is("anonymise_le", null)
    .not("derniere_visite", "is", null);

  const maintenant = Date.now();
  return (data ?? [])
    .map((c) => {
      if (!c.derniere_visite || !c.frequence_moyenne_j) return null;
      const prochaine = new Date(c.derniere_visite).getTime() + c.frequence_moyenne_j * 86400000;
      if (prochaine >= maintenant) return null;
      return {
        id: c.id,
        nom: c.prenom ? `${c.prenom} ${c.nom}` : c.nom,
        tel: c.telephone_mobile,
        joursRetard: Math.floor((maintenant - prochaine) / 86400000),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.joursRetard - a!.joursRetard) as {
    id: string;
    nom: string;
    tel: string | null;
    joursRetard: number;
  }[];
}

/** Correction manuelle et justifiée du score de fiabilité (R9.5). */
export async function corrigerFiabilite(
  clientId: string,
  impact: number,
  commentaire: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  if (!Number.isFinite(impact) || impact < -100 || impact > 100)
    return { ok: false, erreur: "Impact invalide." };

  const { error } = await ctx.supabase.from("evenements_fiabilite").insert({
    etablissement_id: ctx.etablissementId,
    client_id: clientId,
    type: "correction",
    impact: Math.round(impact),
    commentaire: commentaire || null,
  });
  return error ? { ok: false, erreur: "Correction impossible." } : { ok: true };
}

export async function fusionnerClientesAction(
  garde: string,
  absorbe: string,
): Promise<{ ok: boolean; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };
  const { error } = await ctx.supabase.rpc("fusionner_clientes", {
    p_garde: garde,
    p_absorbe: absorbe,
  });
  return error ? { ok: false, erreur: "Fusion impossible." } : { ok: true };
}

// ---------------------------------------------------------------------
// Import CSV (C6.1) : insertion en lot, dédup, rapport, annulation
// ---------------------------------------------------------------------
export interface LigneImport {
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
}

export interface RapportImport {
  importees: number;
  ignorees: number;
  erreurs: number;
  ids: string[]; // pour l'annulation
}

export async function importerClientes(
  lignes: LigneImport[],
): Promise<{ ok: boolean; rapport?: RapportImport; erreur?: string }> {
  const ctx = await contexteEtablissement();
  if (!ctx) return { ok: false, erreur: "Session expirée." };

  // Numéros déjà présents → dédup.
  const { data: existantes } = await ctx.supabase
    .from("clients")
    .select("telephone_mobile")
    .eq("etablissement_id", ctx.etablissementId)
    .is("archive_le", null);
  const telsExistants = new Set(
    (existantes ?? []).map((c) => c.telephone_mobile).filter(Boolean),
  );

  const aInserer: TablesInsert<"clients">[] = [];
  let ignorees = 0;
  let erreurs = 0;

  for (const l of lignes) {
    if (!l.nom || !l.nom.trim()) {
      erreurs += 1;
      continue;
    }
    let e164: string | null = null;
    if (l.telephone) {
      e164 = normaliserTelephoneFr(l.telephone);
      if (!e164) {
        erreurs += 1;
        continue;
      }
      if (telsExistants.has(e164)) {
        ignorees += 1;
        continue;
      }
      telsExistants.add(e164);
    }
    aInserer.push({
      etablissement_id: ctx.etablissementId,
      nom: l.nom.trim(),
      prenom: l.prenom?.trim() || null,
      telephone_mobile: e164,
      email: l.email ? l.email.toLowerCase().trim() : null,
      source: "import",
    });
  }

  let ids: string[] = [];
  if (aInserer.length > 0) {
    const { data, error } = await ctx.supabase
      .from("clients")
      .insert(aInserer)
      .select("id");
    if (error) return { ok: false, erreur: "Import impossible." };
    ids = (data ?? []).map((c) => c.id);
  }

  return {
    ok: true,
    rapport: { importees: ids.length, ignorees, erreurs, ids },
  };
}

/** Annulation d'un import : archive les fiches créées (jamais de suppression). */
export async function annulerImport(ids: string[]): Promise<{ ok: boolean }> {
  const ctx = await contexteEtablissement();
  if (!ctx || ids.length === 0) return { ok: false };
  const { error } = await ctx.supabase
    .from("clients")
    .update({ archive_le: new Date().toISOString() })
    .in("id", ids)
    .eq("etablissement_id", ctx.etablissementId);
  return { ok: !error };
}

// ---------------------------------------------------------------------
// Export CSV (C6.3) : complet, libre, à tout moment
// ---------------------------------------------------------------------
export async function exporterClientesCsv(): Promise<string> {
  const ctx = await contexteEtablissement();
  if (!ctx) return "";

  const { data } = await ctx.supabase
    .from("clients")
    .select(
      "civilite, nom, prenom, telephone_mobile, email, date_naissance, adresse, code_postal, ville, statut, nombre_visites, total_depense, derniere_visite",
    )
    .eq("etablissement_id", ctx.etablissementId)
    .is("archive_le", null)
    .is("anonymise_le", null)
    .order("nom");

  const colonnes = [
    "civilite", "nom", "prenom", "telephone_mobile", "email", "date_naissance",
    "adresse", "code_postal", "ville", "statut", "nombre_visites",
    "total_depense", "derniere_visite",
  ];
  const echapper = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lignes = [colonnes.join(",")];
  for (const c of data ?? []) {
    lignes.push(colonnes.map((col) => echapper((c as Record<string, unknown>)[col])).join(","));
  }
  return lignes.join("\n");
}
