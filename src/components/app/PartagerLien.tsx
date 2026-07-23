"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, CheckCheck, Download, QrCode } from "lucide-react";
import { Card } from "@/components/ui";

/** Lien de réservation partageable + QR code (Instagram, WhatsApp). */
export function PartagerLien({ lien }: { lien: string }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copie, setCopie] = useState(false);
  const [afficheQr, setAfficheQr] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(lien, { width: 320, margin: 1, color: { dark: "#0b1020", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [lien]);

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      /* presse-papiers indisponible */
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-ink">Votre lien de réservation</h2>
        <button
          onClick={() => setAfficheQr((v) => !v)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <QrCode size={15} /> {afficheQr ? "Masquer" : "QR code"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-ink/70">
          {lien}
        </code>
        <button
          onClick={copier}
          className="inline-flex items-center gap-1 rounded-[var(--radius-md)] bg-primary px-3 py-2 text-sm font-medium text-white"
        >
          {copie ? <CheckCheck size={15} /> : <Copy size={15} />}
          {copie ? "Copié" : "Copier"}
        </button>
      </div>

      {afficheQr && qr && (
        <div className="flex flex-col items-center gap-2 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code de réservation" className="h-48 w-48" />
          <a
            href={qr}
            download="revora-reservation.png"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <Download size={15} /> Télécharger le QR
          </a>
        </div>
      )}
    </Card>
  );
}
