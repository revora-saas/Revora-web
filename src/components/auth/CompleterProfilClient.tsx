"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { envoyerCodeTelephone, finaliserProfil } from "@/app/(auth)/actions";

/**
 * Complétion de profil après connexion. Étape indispensable : les connexions
 * sociales (surtout Apple) ne transmettent ni téléphone fiable ni parfois
 * l'e-mail. Le téléphone est vérifié par OTP — sans lui, aucun rappel ne part.
 */
export function CompleterProfilClient({
  valeursInitiales,
}: {
  valeursInitiales: { nom: string; prenom: string };
}) {
  const router = useRouter();

  const [etape, setEtape] = useState<"profil" | "code">("profil");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState(valeursInitiales.nom);
  const [prenom, setPrenom] = useState(valeursInitiales.prenom);
  const [nomCommercial, setNomCommercial] = useState("");
  const [telephone, setTelephone] = useState("");
  const [code, setCode] = useState("");

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await envoyerCodeTelephone(telephone);
    setChargement(false);
    if (res.ok) setEtape("code");
    else setErreur(res.erreur);
  }

  async function finaliser(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await finaliserProfil({ nom, prenom, nomCommercial, telephone, code });
    setChargement(false);
    if (res.ok) {
      // L'espace est créé : on enchaîne sur la configuration métier.
      router.push("/onboarding");
      router.refresh();
    } else {
      setErreur(res.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">
          Complétez votre profil
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          {etape === "profil"
            ? "Encore quelques informations pour créer votre espace."
            : `Entrez le code envoyé au ${telephone}.`}
        </p>
      </div>

      {etape === "profil" ? (
        <form onSubmit={envoyerCode} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              autoComplete="given-name"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <Input
              label="Nom"
              autoComplete="family-name"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
            />
          </div>
          <Input
            label="Nom commercial"
            aide="Le nom de votre salon, visible par vos clientes."
            value={nomCommercial}
            onChange={(e) => setNomCommercial(e.target.value)}
            required
          />
          <Input
            label="Téléphone mobile"
            type="tel"
            inputMode="tel"
            placeholder="06 12 34 56 78"
            aide="Vérifié par SMS : indispensable aux rappels."
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            required
          />
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" pleineLargeur disabled={chargement}>
            {chargement ? "Envoi du code…" : "Recevoir le code de vérification"}
          </Button>
        </form>
      ) : (
        <form onSubmit={finaliser} className="flex flex-col gap-3">
          <Input
            label="Code reçu par SMS"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" pleineLargeur disabled={chargement}>
            {chargement ? "Création de l'espace…" : "Valider et créer mon espace"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setErreur(null);
              setEtape("profil");
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Modifier mes informations
          </button>
        </form>
      )}
    </div>
  );
}
