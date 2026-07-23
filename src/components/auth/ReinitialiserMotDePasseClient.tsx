"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { definirNouveauMotDePasse } from "@/app/(auth)/actions";

export function ReinitialiserMotDePasseClient() {
  const router = useRouter();
  const [mdp, setMdp] = useState("");
  const [confirme, setConfirme] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    if (mdp !== confirme) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setChargement(true);
    const res = await definirNouveauMotDePasse(mdp);
    setChargement(false);
    if (res.ok) {
      router.push("/tableau-de-bord");
      router.refresh();
    } else {
      setErreur(res.erreur);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">
          Nouveau mot de passe
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>
      <form onSubmit={soumettre} className="flex flex-col gap-3">
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          aide="Au moins 8 caractères."
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          required
        />
        <Input
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          value={confirme}
          onChange={(e) => setConfirme(e.target.value)}
          required
        />
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Enregistrement…" : "Définir le mot de passe"}
        </Button>
      </form>
    </div>
  );
}
