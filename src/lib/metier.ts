import { creerClientServeur } from "@/lib/supabase/server";
import {
  type ConfigurationMetier,
  type Metier,
  type Vocabulaire,
  VOCABULAIRE_DEFAUT,
  ORDRE_METIERS,
} from "@/lib/metier-types";

/** Liste des métiers du référentiel, triés pour l'assistant d'onboarding. */
export async function getMetiers(): Promise<Metier[]> {
  const supabase = await creerClientServeur();
  const { data } = await supabase.from("metiers").select("code, libelle, configuration");
  const metiers = (data ?? []) as unknown as Metier[];
  return metiers.sort(
    (a, b) => indexOrdre(a.code) - indexOrdre(b.code),
  );
}

function indexOrdre(code: string): number {
  const i = ORDRE_METIERS.indexOf(code);
  return i === -1 ? ORDRE_METIERS.length : i;
}

export interface ConfigEtablissement {
  vocabulaire: Vocabulaire;
  /** Modules actifs (fusion additive de tous les profils — M1.3). */
  modules: Record<string, boolean>;
  /** Widgets d'accueil (union ordonnée, dédupliquée). */
  widgets: string[];
  /** Champs de fiche technique (union par clé). */
  ficheTechnique: ConfigurationMetier["fiche_technique"];
  metierPrincipal: string | null;
  metierCodes: string[];
}

/**
 * Configuration effective d'un établissement : fusionne les profils métier
 * actifs. Le vocabulaire vient du métier PRINCIPAL ; les modules sont additifs
 * (un module actif chez l'un est actif) ; widgets et fiches sont unis.
 */
export async function getConfigurationEtablissement(
  etablissementId: string,
): Promise<ConfigEtablissement> {
  const supabase = await creerClientServeur();

  // Deux requêtes simples (jointure imbriquée évitée : types Relationships vides).
  const { data: liens } = await supabase
    .from("etablissement_metiers")
    .select("metier_code, principal")
    .eq("etablissement_id", etablissementId);

  const codes = (liens ?? []).map((l) => l.metier_code);
  const { data: metiersData } = codes.length
    ? await supabase.from("metiers").select("code, configuration").in("code", codes)
    : { data: [] };

  const configs = new Map<string, ConfigurationMetier>(
    ((metiersData ?? []) as unknown as Array<{ code: string; configuration: ConfigurationMetier }>).map(
      (m) => [m.code, m.configuration],
    ),
  );

  const lignes = (liens ?? []).map((l) => ({
    metier_code: l.metier_code,
    principal: l.principal,
    metiers: configs.has(l.metier_code)
      ? { configuration: configs.get(l.metier_code)! }
      : null,
  }));

  if (lignes.length === 0) {
    return {
      vocabulaire: VOCABULAIRE_DEFAUT,
      modules: {},
      widgets: [],
      ficheTechnique: [],
      metierPrincipal: null,
      metierCodes: [],
    };
  }

  const principal = lignes.find((l) => l.principal) ?? lignes[0];
  const vocabulaire = principal.metiers?.configuration.vocabulaire ?? VOCABULAIRE_DEFAUT;

  const modules: Record<string, boolean> = {};
  const widgets: string[] = [];
  const fiches: ConfigurationMetier["fiche_technique"] = [];
  const clesVues = new Set<string>();

  // Le principal d'abord (priorité d'ordre pour widgets et vocabulaire).
  const ordonnees = [principal, ...lignes.filter((l) => l !== principal)];
  for (const ligne of ordonnees) {
    const cfg = ligne.metiers?.configuration;
    if (!cfg) continue;
    for (const [cle, actif] of Object.entries(cfg.modules)) {
      modules[cle] = modules[cle] || actif; // additif (OR)
    }
    for (const w of cfg.widgets_accueil) {
      if (!widgets.includes(w)) widgets.push(w);
    }
    for (const champ of cfg.fiche_technique) {
      if (!clesVues.has(champ.cle)) {
        clesVues.add(champ.cle);
        fiches.push(champ);
      }
    }
  }

  return {
    vocabulaire,
    modules,
    widgets,
    ficheTechnique: fiches,
    metierPrincipal: principal.metier_code,
    metierCodes: lignes.map((l) => l.metier_code),
  };
}

/** L'onboarding est terminé quand un métier principal est choisi. */
export async function onboardingEstTermine(etablissementId: string): Promise<boolean> {
  const supabase = await creerClientServeur();
  const { data } = await supabase
    .from("etablissement_metiers")
    .select("metier_code")
    .eq("etablissement_id", etablissementId)
    .eq("principal", true)
    .maybeSingle();
  return Boolean(data);
}
