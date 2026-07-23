import { redirect } from "next/navigation";
import { getEtatProfil } from "@/lib/auth";
import { CompleterProfilClient } from "@/components/auth/CompleterProfilClient";

export const metadata = { title: "Compléter le profil" };

export default async function PageCompleterProfil() {
  const etat = await getEtatProfil();

  // Non connecté → le middleware a déjà dû rediriger ; ceinture et bretelles.
  if (!etat.user) redirect("/connexion?suite=/completer-profil");

  // Profil déjà complet → direction l'application.
  if (etat.profilComplet && etat.aEtablissement) redirect("/tableau-de-bord");

  // Pré-remplissage depuis les métadonnées de la connexion sociale.
  const meta = (etat.user.user_metadata ?? {}) as Record<string, string>;
  const nomComplet = meta.full_name ?? meta.name ?? "";
  const prenom = meta.given_name ?? nomComplet.split(" ")[0] ?? "";
  const nom =
    meta.family_name ?? nomComplet.split(" ").slice(1).join(" ") ?? "";

  return (
    <CompleterProfilClient valeursInitiales={{ nom, prenom }} />
  );
}
