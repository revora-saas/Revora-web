import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { contexteEtablissement } from "@/lib/auth";
import { creerClientService } from "@/lib/supabase/service";
import { ImprimerBouton } from "@/components/clientes/ImprimerBouton";

export const metadata = { title: "Dossier prêt contrôle" };

const LABELS_CONSENT: Record<string, string> = {
  soin_pmu: "Consentement aux soins",
  image: "Consentement à l'image",
  donnees_sante: "Consentement données de santé",
  marketing: "Consentement marketing",
  sms: "Consentement SMS",
};

export default async function PageDossier({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const { data: client } = await ctx.supabase
    .from("clients")
    .select("nom, prenom, date_naissance, telephone_mobile, allergies, contre_indications")
    .eq("id", id)
    .eq("etablissement_id", ctx.etablissementId)
    .maybeSingle();
  if (!client) notFound();

  const { data: etab } = await ctx.supabase
    .from("etablissements")
    .select("nom")
    .eq("id", ctx.etablissementId)
    .maybeSingle();

  const [{ data: consents }, { data: fiches }, { data: photosRows }, { data: rdvs }] =
    await Promise.all([
      ctx.supabase
        .from("consentements")
        .select("type, accorde, date_consentement")
        .eq("client_id", id)
        .order("date_consentement", { ascending: false }),
      ctx.supabase
        .from("fiches_techniques")
        .select("id, cree_le, donnees, materiel, zone, numero_seance, lot_id, cloturee_le")
        .eq("client_id", id)
        .order("cree_le", { ascending: false }),
      ctx.supabase.from("photos").select("id, type, url, fiche_technique_id").eq("client_id", id),
      ctx.supabase
        .from("rendez_vous")
        .select("debut_execution, statut, montant_total")
        .eq("client_id", id)
        .eq("statut", "honore")
        .order("debut_execution", { ascending: false }),
    ]);

  // Lots des fiches (numéro + péremption).
  const lotIds = (fiches ?? []).map((f) => f.lot_id).filter(Boolean) as string[];
  const { data: lots } = lotIds.length
    ? await ctx.supabase
        .from("lots")
        .select("id, numero_lot, date_peremption, conforme_reach")
        .in("id", lotIds)
    : { data: [] };
  const lotMap = new Map((lots ?? []).map((l) => [l.id, l]));

  // URLs signées des photos.
  const svc = creerClientService();
  const photos: { id: string; type: string; ficheId: string | null; url: string }[] = [];
  for (const p of photosRows ?? []) {
    const { data } = await svc.storage.from("photos-clientes").createSignedUrl(p.url, 3600);
    photos.push({ id: p.id, type: p.type, ficheId: p.fiche_technique_id, url: data?.signedUrl ?? "" });
  }

  const nom = client.prenom ? `${client.prenom} ${client.nom}` : client.nom;

  return (
    <main className="mx-auto max-w-3xl px-5 py-6 print:px-0 print:py-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/clientes/${id}`} className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
          <ArrowLeft size={16} /> Retour
        </Link>
        <ImprimerBouton />
      </div>

      <article className="flex flex-col gap-6 text-ink">
        <header className="border-b border-perle pb-3">
          <h1 className="font-heading text-2xl font-bold">Dossier — {nom}</h1>
          <p className="text-sm text-ink/60">
            {etab?.nom} · Édité le {new Date().toLocaleDateString("fr-FR")}
          </p>
        </header>

        <section>
          <h2 className="mb-1 font-heading font-semibold">Identité</h2>
          <p className="text-sm">Nom : {nom}</p>
          {client.date_naissance && <p className="text-sm">Naissance : {client.date_naissance}</p>}
          {client.allergies && <p className="text-sm text-red-700">Allergies : {client.allergies}</p>}
          {client.contre_indications && (
            <p className="text-sm text-red-700">Contre-indications : {client.contre_indications}</p>
          )}
        </section>

        <section>
          <h2 className="mb-1 font-heading font-semibold">Consentements</h2>
          {(consents ?? []).length === 0 ? (
            <p className="text-sm text-ink/50">Aucun.</p>
          ) : (
            <ul className="text-sm">
              {consents!.map((c, i) => (
                <li key={i}>
                  {LABELS_CONSENT[c.type] ?? c.type} : {c.accorde ? "accordé" : "refusé"} le{" "}
                  {new Date(c.date_consentement).toLocaleDateString("fr-FR")}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-heading font-semibold">Séances et traçabilité</h2>
          {(fiches ?? []).length === 0 ? (
            <p className="text-sm text-ink/50">Aucune séance.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {fiches!.map((f) => {
                const lot = f.lot_id ? lotMap.get(f.lot_id) : null;
                const donnees = (f.donnees ?? {}) as Record<string, unknown>;
                const photosFiche = photos.filter((p) => p.ficheId === f.id);
                return (
                  <div key={f.id} className="rounded-[var(--radius-md)] border border-perle p-3 print:break-inside-avoid">
                    <p className="text-sm font-semibold">
                      Séance {f.numero_seance ? `n°${f.numero_seance}` : ""} —{" "}
                      {new Date(f.cree_le).toLocaleDateString("fr-FR")}
                      {f.cloturee_le ? " (clôturée)" : ""}
                    </p>
                    {f.zone && <p className="text-sm">Zone : {f.zone}</p>}
                    {f.materiel && <p className="text-sm">Matériel : {f.materiel}</p>}
                    {lot && (
                      <p className="text-sm">
                        Pigment — lot {lot.numero_lot}
                        {lot.date_peremption ? `, péremption ${lot.date_peremption}` : ""}
                        {lot.conforme_reach === false ? ", NON conforme REACH" : ""}
                      </p>
                    )}
                    {Object.entries(donnees).map(([k, v]) => (
                      <p key={k} className="text-sm">
                        {k} : {Array.isArray(v) ? v.join(", ") : String(v)}
                      </p>
                    ))}
                    {photosFiche.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {photosFiche.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={p.url} alt={p.type} className="h-24 w-24 rounded object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-1 font-heading font-semibold">Historique des rendez-vous honorés</h2>
          {(rdvs ?? []).length === 0 ? (
            <p className="text-sm text-ink/50">Aucun.</p>
          ) : (
            <ul className="text-sm">
              {rdvs!.map((r, i) => (
                <li key={i}>
                  {new Date(r.debut_execution).toLocaleDateString("fr-FR")} — {r.montant_total} €
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </main>
  );
}
