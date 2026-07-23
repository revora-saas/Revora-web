"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

/** Déclenche l'impression / export PDF du navigateur. */
export function ImprimerBouton() {
  return (
    <Button taille="sm" onClick={() => window.print()} className="print:hidden">
      <Printer size={15} /> Imprimer / PDF
    </Button>
  );
}
