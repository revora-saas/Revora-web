import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Fusionne des classes Tailwind en gérant les conflits.
 * Ex. cn("px-2", condition && "px-4") → "px-4".
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
