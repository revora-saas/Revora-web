"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { motDePasseOublie } from "@/app/(auth)/actions";

export function MotDePasseOublieClient() {
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    await motDePasseOublie(email);
    setChargement(false);
    setEnvoye(true);
  }

  if (envoye) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h1 className="font-heading text-xl font-semibold text-ink">
          E-mail envoyé
        </h1>
        <p className="text-sm text-ink/60">
          Si un compte est associé à <strong>{email}</strong>, un lien de
          réinitialisation vient d&apos;être envoyé.
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
        <h1 className="font-heading text-xl font-semibold text-ink">
          Mot de passe oublié
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Entrez votre e-mail, nous vous enverrons un lien.
        </p>
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
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Envoi…" : "Envoyer le lien"}
        </Button>
      </form>
      <p className="text-center text-sm text-ink/60">
        <Link href="/connexion" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
