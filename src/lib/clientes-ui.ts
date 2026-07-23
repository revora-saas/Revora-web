// Helpers d'affichage pour les clientes. Fichier PUR (aucun import serveur).

type TonBadge = "neutre" | "primaire" | "succes" | "alerte" | "danger";

export const STATUTS: Record<string, { label: string; ton: TonBadge }> = {
  nouvelle: { label: "Nouvelle", ton: "neutre" },
  reguliere: { label: "Régulière", ton: "primaire" },
  fidele: { label: "Fidèle", ton: "succes" },
  inactive: { label: "Inactive", ton: "alerte" },
  a_risque: { label: "À risque", ton: "danger" },
};

/** Formate un numéro E.164 français pour l'affichage : +33612345678 → 06 12 34 56 78. */
export function formaterTelephone(e164: string | null): string {
  if (!e164) return "";
  if (e164.startsWith("+33")) {
    const national = "0" + e164.slice(3);
    return national.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return e164;
}

/** Champs pris en compte dans l'indicateur de complétude de la fiche. */
const CHAMPS_COMPLETUDE = [
  "prenom",
  "email",
  "date_naissance",
  "code_postal",
  "ville",
  "canal_prefere",
  "source",
] as const;

/** Complétude de la fiche en pourcentage (nom + mobile déjà obligatoires). */
export function calculerCompletude(
  cliente: Record<string, unknown>,
): number {
  const remplis = CHAMPS_COMPLETUDE.filter((c) => {
    const v = cliente[c];
    return v !== null && v !== undefined && v !== "";
  }).length;
  // 2 champs de base (nom, mobile) toujours présents → pondération.
  const total = CHAMPS_COMPLETUDE.length + 2;
  return Math.round(((remplis + 2) / total) * 100);
}
