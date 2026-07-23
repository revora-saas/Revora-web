import { notFound, redirect } from "next/navigation";
import { contexteEtablissement } from "@/lib/auth";
import {
  EditeurPrestation,
  type PrestationInitiale,
} from "@/components/catalogue/EditeurPrestation";

export const metadata = { title: "Prestation" };

const DEFAUT: PrestationInitiale = {
  id: null,
  nom: "",
  categorie_id: null,
  description: null,
  photo_url: null,
  prix: 0,
  duree_preparation: 0,
  duree_execution: 30,
  duree_nettoyage: 0,
  battement: 0,
  lieu: "salon",
  reservable_en_ligne: true,
  acompte_type: "aucun",
  acompte_valeur: 0,
  pmu: false,
  patch_test_requis: false,
  cycle_rappel_jours: null,
  segments: [],
  options: [],
  ressource_ids: [],
};

export default async function PageEditeurPrestation({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await contexteEtablissement();
  if (!ctx) redirect("/connexion");

  const [{ data: categories }, { data: ressources }] = await Promise.all([
    ctx.supabase
      .from("categories")
      .select("id, nom")
      .eq("etablissement_id", ctx.etablissementId)
      .order("ordre"),
    ctx.supabase
      .from("ressources")
      .select("id, nom, type")
      .eq("etablissement_id", ctx.etablissementId)
      .eq("actif", true),
  ]);

  let initiale = DEFAUT;

  if (id !== "nouvelle") {
    const { data: p } = await ctx.supabase
      .from("prestations")
      .select("*")
      .eq("id", id)
      .eq("etablissement_id", ctx.etablissementId)
      .maybeSingle();
    if (!p) notFound();

    const [{ data: segments }, { data: options }, { data: liens }] = await Promise.all([
      ctx.supabase
        .from("prestation_segments")
        .select("libelle, duree, praticienne_occupee, ordre")
        .eq("prestation_id", id)
        .order("ordre"),
      ctx.supabase
        .from("options_prestation")
        .select("nom, prix, duree_sup")
        .eq("prestation_id", id),
      ctx.supabase
        .from("prestation_ressources")
        .select("ressource_id")
        .eq("prestation_id", id),
    ]);

    initiale = {
      id: p.id,
      nom: p.nom,
      categorie_id: p.categorie_id,
      description: p.description,
      photo_url: p.photo_url,
      prix: Number(p.prix),
      duree_preparation: p.duree_preparation,
      duree_execution: p.duree_execution,
      duree_nettoyage: p.duree_nettoyage,
      battement: p.battement,
      lieu: p.lieu as PrestationInitiale["lieu"],
      reservable_en_ligne: p.reservable_en_ligne,
      acompte_type: (p.acompte_type ?? "aucun") as PrestationInitiale["acompte_type"],
      acompte_valeur: Number(p.acompte_valeur ?? 0),
      pmu: p.pmu,
      patch_test_requis: p.patch_test_requis,
      cycle_rappel_jours: p.cycle_rappel_jours,
      segments: (segments ?? []).map((s) => ({
        libelle: s.libelle ?? "",
        duree: s.duree,
        praticienne_occupee: s.praticienne_occupee,
      })),
      options: (options ?? []).map((o) => ({
        nom: o.nom,
        prix: Number(o.prix),
        duree_sup: o.duree_sup,
      })),
      ressource_ids: (liens ?? []).map((l) => l.ressource_id).filter(Boolean) as string[],
    };
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-6">
      <EditeurPrestation
        initiale={initiale}
        categories={categories ?? []}
        ressources={ressources ?? []}
      />
    </main>
  );
}
