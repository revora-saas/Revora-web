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
      <div className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6 text-center">
        <p className="font-heading text-lg font-semibold">Message envoyé 🎉</p>
        <p className="mt-1 text-sm text-white/60">Nous vous répondons sous 24 h ouvrées.</p>
      </div>
    );
  }

  const champ =
    "w-full rounded-[var(--radius-md)] border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-lavande focus:outline-none";

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3">
      <input className={champ} placeholder="Votre nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <input className={champ} type="email" placeholder="Votre e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <textarea className={champ} rows={4} placeholder="Votre message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      <label className="flex items-center gap-2 text-sm text-white/70">
        <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
        Je souhaite une démonstration
      </label>
      {erreur && <p className="text-sm text-red-400">{erreur}</p>}
      <button
        type="submit"
        disabled={chargement}
        className="rounded-[var(--radius-md)] bg-primary px-6 py-3 font-medium hover:bg-primary-600 disabled:opacity-60"
      >
        {chargement ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
