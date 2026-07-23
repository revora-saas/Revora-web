"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { BoutonsOAuth } from "./BoutonsOAuth";
import { inscriptionMotDePasse } from "@/app/(auth)/actions";

export function InscriptionClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await inscriptionMotDePasse(email, motDePasse);
    setChargement(false);
    if (!res.ok) {
      setErreur(res.erreur);
      return;
    }
    if (res.confirmationRequise) {
      setConfirmation(true);
    } else {
      // Session ouverte : on passe à la complétion de profil.
      router.push("/completer-profil");
      router.refresh();
    }
  }

  if (confirmation) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-heading text-xl font-semibold text-ink">
          Vérifiez votre e-mail
        </h1>
        <p className="text-sm text-ink/60">
          Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
          Cliquez dessus pour activer votre compte, puis revenez ici.
        </p>
        <Link href="/connexion" className="text-sm font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">Créer un compte</h1>
        <p className="mt-1 text-sm text-ink/60">
          Essai gratuit, sans carte bancaire.
        </p>
      </div>

      <BoutonsOAuth suite="/completer-profil" />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-perle" />
        <span className="text-xs text-ink/40">ou</span>
        <span className="h-px flex-1 bg-perle" />
      </div>

      <form onSubmit={soumettre} className="flex flex-col gap-3">
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          aide="Au moins 8 caractères."
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
        />
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink/60">
        Déjà inscrite ?{" "}
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
