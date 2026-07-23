import { redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import { getMetiers } from "@/lib/metier";
import { ReglagesClient } from "@/components/reglages/ReglagesClient";

export const metadata = { title: "Réglages" };

export default async function PageReglages() {
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const [{ data: reglages }, { data: horaires }, { data: liens }, { data: abo }, metiers] =
    await Promise.all([
      ctx.supabase.from("reglages").select("*").eq("etablissement_id", ctx.etablissementId).maybeSingle(),
      ctx.supabase
        .from("horaires")
        .select("jour_semaine, heure_debut, heure_fin")
        .eq("etablissement_id", ctx.etablissementId)
        .is("membre_id", null),
      ctx.supabase
        .from("etablissement_metiers")
        .select("metier_code, principal")
        .eq("etablissement_id", ctx.etablissementId),
      ctx.supabase
        .from("abonnements")
        .select("statut, essai_fin_le, formule, credits_restants, quota_messages")
        .eq("etablissement_id", ctx.etablissementId)
        .maybeSingle(),
      getMetiers(),
    ]);

  const autres = (reglages?.autres as Record<string, unknown>) ?? {};
  const principal = (liens ?? []).find((l) => l.principal)?.metier_code ?? null;
  const complementaires = (liens ?? []).filter((l) => !l.principal).map((l) => l.metier_code);

  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <ReglagesClient
        reglages={{
          battement_defaut: reglages?.battement_defaut ?? 0,
          granularite_creneaux: reglages?.granularite_creneaux ?? 15,
          delai_min_reservation: reglages?.delai_min_reservation ?? 120,
          horizon_max_jours: reglages?.horizon_max_jours ?? 90,
          validation_auto: reglages?.validation_auto ?? true,
          delai_annulation_h: reglages?.delai_annulation_h ?? 24,
          strategie_planning: (reglages?.strategie_planning ?? "optimiser") as
            | "optimiser"
            | "libre"
            | "concentrer",
          seuil_acompte_obligatoire: reglages?.seuil_acompte_obligatoire ?? 50,
          rappels: Array.isArray(reglages?.rappels)
            ? (reglages!.rappels as { heures: number; canal: string }[])
            : [],
          zones_deplacement: Array.isArray(reglages?.zones_deplacement)
            ? (reglages!.zones_deplacement as { nom: string; codes_postaux: string[]; frais: number; minutes: number }[])
            : [],
        }}
        horaires={(horaires ?? []).map((h) => ({
          jour: h.jour_semaine,
          debut: h.heure_debut.slice(0, 5),
          fin: h.heure_fin.slice(0, 5),
        }))}
        metiers={metiers.map((m) => ({ code: m.code, libelle: m.libelle }))}
        principal={principal}
        complementaires={complementaires}
        abonnement={{
          statut: abo?.statut ?? "essai",
          essaiFinLe: abo?.essai_fin_le ?? null,
          formule: abo?.formule ?? "independante",
          credits: abo?.credits_restants ?? 0,
          quota: abo?.quota_messages ?? 0,
        }}
        attestation={(autres.attestation_hygiene as { date_obtention?: string }) ?? null}
        // eslint-disable-next-line react-hooks/purity -- Server Component : horodatage serveur légitime
        maintenantMs={Date.now()}
      />
    </main>
  );
}
