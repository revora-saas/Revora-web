import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { creerClientService } from "@/lib/supabase/service";
import { PublicBooking } from "@/components/public/PublicBooking";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const svc = creerClientService();
  const { data } = await svc.from("etablissements").select("nom").eq("slug", slug).maybeSingle();
  return { title: data?.nom ? `${data.nom} — Réservation` : "Réservation" };
}

export default async function PageReservationPublique({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const svc = creerClientService();

  const { data: etab } = await svc
    .from("etablissements")
    .select("id, nom, logo_url, adresse, code_postal, ville, telephone, fuseau")
    .eq("slug", slug)
    .is("archive_le", null)
    .maybeSingle();
  if (!etab) notFound();

  const [{ data: categories }, { data: prestations }, { data: horaires }, { data: metiersLiens }] =
    await Promise.all([
      svc.from("categories").select("id, nom, ordre").eq("etablissement_id", etab.id).order("ordre"),
      svc
        .from("prestations")
        .select("id, nom, description, prix, duree_execution, categorie_id, pmu, lieu")
        .eq("etablissement_id", etab.id)
        .eq("actif", true)
        .eq("reservable_en_ligne", true)
        .order("ordre"),
      svc
        .from("horaires")
        .select("jour_semaine, heure_debut, heure_fin")
        .eq("etablissement_id", etab.id)
        .is("membre_id", null),
      svc
        .from("etablissement_metiers")
        .select("metier_code, principal")
        .eq("etablissement_id", etab.id),
    ]);

  // Vocabulaire du métier principal.
  let motPrestation = "prestation";
  const principal = (metiersLiens ?? []).find((m) => m.principal)?.metier_code;
  if (principal) {
    const { data: metier } = await svc
      .from("metiers")
      .select("configuration")
      .eq("code", principal)
      .maybeSingle();
    const cfg = metier?.configuration as { vocabulaire?: { prestation?: string } } | null;
    if (cfg?.vocabulaire?.prestation) motPrestation = cfg.vocabulaire.prestation;
  }

  return (
    <PublicBooking
      slug={slug}
      etablissement={{
        nom: etab.nom,
        logoUrl: etab.logo_url,
        adresse: [etab.adresse, etab.code_postal, etab.ville].filter(Boolean).join(", "),
        telephone: etab.telephone,
        fuseau: etab.fuseau ?? "Europe/Paris",
      }}
      categories={categories ?? []}
      prestations={(prestations ?? []).map((p) => ({ ...p, prix: Number(p.prix) }))}
      horaires={(horaires ?? []).map((h) => ({
        jour: h.jour_semaine,
        debut: h.heure_debut.slice(0, 5),
        fin: h.heure_fin.slice(0, 5),
      }))}
      motPrestation={motPrestation}
    />
  );
}
