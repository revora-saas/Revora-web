"use server";

import { creerClientServeur } from "@/lib/supabase/server";

type CleChecklist = "catalogue" | "clientes" | "lien";

/** Marque (ou dé-marque) une étape de la checklist de démarrage. */
export async function marquerChecklist(
  cle: CleChecklist,
  valeur: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await creerClientServeur();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: membre } = await supabase
    .from("membres")
    .select("etablissement_id")
    .eq("user_id", user.id)
    .eq("actif", true)
    .maybeSingle();
  if (!membre) return { ok: false };

  const { data: reglages } = await supabase
    .from("reglages")
    .select("autres")
    .eq("etablissement_id", membre.etablissement_id)
    .maybeSingle();

  const autres = (reglages?.autres as Record<string, unknown>) ?? {};
  const checklist = {
    ...((autres.checklist as Record<string, boolean>) ?? {}),
    [cle]: valeur,
  };

  const { error } = await supabase
    .from("reglages")
    .update({ autres: { ...autres, checklist } })
    .eq("etablissement_id", membre.etablissement_id);

  return { ok: !error };
}
