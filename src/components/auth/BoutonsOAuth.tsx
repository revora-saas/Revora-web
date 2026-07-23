"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { urlOAuth } from "@/app/(auth)/actions";

/** Boutons de connexion sociale (Google, Apple). */
export function BoutonsOAuth({ suite }: { suite?: string }) {
  const [chargement, setChargement] = useState<"google" | "apple" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function connecter(fournisseur: "google" | "apple") {
    setErreur(null);
    setChargement(fournisseur);
    const res = await urlOAuth(fournisseur, suite);
    if ("url" in res) {
      window.location.href = res.url;
    } else {
      setErreur(res.erreur);
      setChargement(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        type="button"
        variante="secondaire"
        pleineLargeur
        disabled={chargement !== null}
        onClick={() => connecter("google")}
      >
        <LogoGoogle />
        {chargement === "google" ? "Redirection…" : "Continuer avec Google"}
      </Button>
      <Button
        type="button"
        variante="secondaire"
        pleineLargeur
        disabled={chargement !== null}
        onClick={() => connecter("apple")}
      >
        <LogoApple />
        {chargement === "apple" ? "Redirection…" : "Continuer avec Apple"}
      </Button>
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  );
}

function LogoGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function LogoApple() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M16.36 12.9c.03 2.86 2.5 3.81 2.53 3.82-.02.07-.4 1.36-1.31 2.7-.79 1.15-1.6 2.3-2.89 2.32-1.26.03-1.67-.75-3.11-.75-1.45 0-1.9.72-3.1.77-1.24.05-2.19-1.24-2.99-2.39-1.63-2.36-2.88-6.67-1.2-9.58.83-1.45 2.32-2.36 3.94-2.39 1.22-.02 2.36.82 3.11.82.74 0 2.13-1.01 3.6-.87.61.03 2.35.25 3.46 1.86-.09.06-2.07 1.21-2.05 3.6ZM14 4.5c.66-.8 1.1-1.92.98-3.03-.95.04-2.1.63-2.78 1.43-.61.71-1.14 1.85-1 2.94 1.06.08 2.14-.54 2.8-1.34Z" />
    </svg>
  );
}
