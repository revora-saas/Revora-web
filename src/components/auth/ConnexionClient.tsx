"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { BoutonsOAuth } from "./BoutonsOAuth";
import {
  connexionMotDePasse,
  envoyerOtpSms,
  verifierOtpSms,
} from "@/app/(auth)/actions";

export function ConnexionClient() {
  const router = useRouter();
  const params = useSearchParams();
  const suite = params.get("suite") ?? "/tableau-de-bord";

  const [mode, setMode] = useState<"email" | "sms">("email");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  // Champs e-mail
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  // Champs SMS
  const [etapeSms, setEtapeSms] = useState<"tel" | "code">("tel");
  const [telephone, setTelephone] = useState("");
  const [code, setCode] = useState("");

  function reussite() {
    router.push(suite);
    router.refresh();
  }

  async function soumettreEmail(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await connexionMotDePasse(email, motDePasse);
    setChargement(false);
    if (res.ok) reussite();
    else setErreur(res.erreur);
  }

  async function envoyerCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await envoyerOtpSms(telephone);
    setChargement(false);
    if (res.ok) setEtapeSms("code");
    else setErreur(res.erreur);
  }

  async function verifierCode(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await verifierOtpSms(telephone, code);
    setChargement(false);
    if (res.ok) reussite();
    else setErreur(res.erreur);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">Connexion</h1>
        <p className="mt-1 text-sm text-ink/60">Accédez à votre espace Revora.</p>
      </div>

      <BoutonsOAuth suite={suite} />

      <Separateur />

      {mode === "email" ? (
        <form onSubmit={soumettreEmail} className="flex flex-col gap-3">
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
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
          <div className="text-right">
            <Link
              href="/mot-de-passe-oublie"
              className="text-sm font-medium text-primary hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" pleineLargeur disabled={chargement}>
            {chargement ? "Connexion…" : "Se connecter"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setErreur(null);
              setMode("sms");
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Se connecter par SMS
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          {etapeSms === "tel" ? (
            <form onSubmit={envoyerCode} className="flex flex-col gap-3">
              <Input
                label="Téléphone mobile"
                type="tel"
                inputMode="tel"
                placeholder="06 12 34 56 78"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
              />
              {erreur && <p className="text-sm text-red-600">{erreur}</p>}
              <Button type="submit" pleineLargeur disabled={chargement}>
                {chargement ? "Envoi…" : "Recevoir un code par SMS"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifierCode} className="flex flex-col gap-3">
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
                {chargement ? "Vérification…" : "Valider le code"}
              </Button>
            </form>
          )}
          <button
            type="button"
            onClick={() => {
              setErreur(null);
              setMode("email");
              setEtapeSms("tel");
            }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Utiliser un e-mail et un mot de passe
          </button>
        </div>
      )}

      <p className="text-center text-sm text-ink/60">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

function Separateur() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-perle" />
      <span className="text-xs text-ink/40">ou</span>
      <span className="h-px flex-1 bg-perle" />
    </div>
  );
}
