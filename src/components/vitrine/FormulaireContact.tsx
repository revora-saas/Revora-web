"use client";

import { useState } from "react";
import { envoyerContact } from "@/app/(marketing)/contact/actions";

export function FormulaireContact() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [demo, setDemo] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await envoyerContact({ nom, email, message, demo });
    setChargement(false);
    if (res.ok) setEnvoye(true);
    else setErreur(res.erreur ?? "Erreur.");
  }

  if (envoye) {
    return (
      <div className="rounded-[20px] border border-bordure bg-white p-6 text-center">
        <p className="font-heading text-lg font-semibold text-prune">Message envoyé 🎉</p>
        <p className="mt-1 text-sm text-taupe">Nous vous répondons sous 24 h ouvrées.</p>
      </div>
    );
  }

  const champ =
    "w-full rounded-[14px] border border-bordure bg-white px-3.5 py-3 text-sm text-prune placeholder:text-taupe/70 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/15";

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <input className={champ} placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <input className={champ} type="email" placeholder="Votre e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <textarea className={champ} rows={4} placeholder="Votre message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm text-taupe">
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-4 w-4 accent-[var(--color-violet)]" />
        Je souhaite une démonstration
      </label>
      {erreur && <p className="text-sm text-terracotta">{erreur}</p>}
      <button
        type="submit"
        disabled={chargement}
        className="inline-flex h-12 items-center justify-center rounded-full bg-violet px-6 font-semibold text-white transition-colors hover:bg-violet-600 disabled:opacity-60"
      >
        {chargement ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
