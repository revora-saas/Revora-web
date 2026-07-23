// =====================================================================
// Remplissage des gabarits de message (R14). Remplace {variable} par la
// valeur, laisse le texte tel quel si la variable est absente.
// =====================================================================

export function remplirGabarit(
  gabarit: string,
  variables: Record<string, string | null | undefined>,
): string {
  return gabarit.replace(/\{(\w+)\}/g, (_m, cle) => {
    const v = variables[cle];
    return v == null ? "" : String(v);
  });
}
