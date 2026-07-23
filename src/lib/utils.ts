import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en gérant les conflits.
 * Ex. cn("px-2", condition && "px-4") → "px-4".
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforme un texte en slug URL (nom commercial → revora.fr/<slug>).
 * Ex. "Chez Léa Nails" → "chez-lea-nails".
 */
export function slugifier(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // retire les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // tout ce qui n'est pas alphanumérique → tiret
    .replace(/^-+|-+$/g, ""); // retire les tirets en début/fin
}

/** Formate une durée en minutes pour l'affichage : 150 → "2 h 30", 45 → "45 min". */
export function formaterDuree(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/**
 * Normalise un numéro français au format international E.164 (+33…).
 * "06 12 34 56 78" → "+33612345678". Renvoie null si non reconnu.
 * Le E.164 est la clé d'identification des clientes (C3.3) : sans lui,
 * aucun rappel SMS ne part.
 */
export function normaliserTelephoneFr(saisie: string): string | null {
  const brut = saisie.replace(/[\s.\-()]/g, "");
  if (/^\+33[67]\d{8}$/.test(brut)) return brut; // déjà en +33 (mobile)
  if (/^\+33[1-9]\d{8}$/.test(brut)) return brut; // +33 fixe/autre
  if (/^0[1-9]\d{8}$/.test(brut)) return "+33" + brut.slice(1); // 0X… → +33X…
  if (/^\+\d{7,15}$/.test(brut)) return brut; // autre indicatif international valide
  return null;
}
