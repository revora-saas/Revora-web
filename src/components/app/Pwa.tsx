"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface EvenementInstall extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

/**
 * Enregistre le service worker et propose discrètement l'installation de la
 * PWA après quelques usages (compteur en localStorage).
 */
export function Pwa() {
  const [invite, setInvite] = useState<EvenementInstall | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    function surInstall(e: Event) {
      e.preventDefault();
      const dejaRefuse = localStorage.getItem("revora-install-refuse");
      const visites = Number(localStorage.getItem("revora-visites") ?? "0") + 1;
      localStorage.setItem("revora-visites", String(visites));
      // Invitation discrète après 3 usages, une seule fois.
      if (!dejaRefuse && visites >= 3) {
        setInvite(e as EvenementInstall);
        setVisible(true);
      }
    }
    window.addEventListener("beforeinstallprompt", surInstall);
    return () => window.removeEventListener("beforeinstallprompt", surInstall);
  }, []);

  async function installer() {
    if (!invite) return;
    await invite.prompt();
    await invite.userChoice;
    setVisible(false);
    setInvite(null);
  }

  function refuser() {
    localStorage.setItem("revora-install-refuse", "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 mx-auto max-w-sm rounded-[var(--radius-lg)] border border-perle bg-white p-4 shadow-douce sm:bottom-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-ink">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">Installer Revora</p>
          <p className="text-xs text-ink/60">Accès rapide, plein écran, même hors connexion.</p>
          <div className="mt-2 flex gap-2">
            <button onClick={installer} className="rounded-[var(--radius-md)] bg-primary px-3 py-1.5 text-sm font-medium text-white">
              Installer
            </button>
            <button onClick={refuser} className="text-sm text-ink/50">Plus tard</button>
          </div>
        </div>
        <button onClick={refuser} aria-label="Fermer" className="text-ink/40 hover:text-ink">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
