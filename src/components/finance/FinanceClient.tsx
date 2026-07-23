"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { Button, Input, Sheet } from "@/components/ui";
import { ajouterDepense, exportComptableCsv } from "@/app/(app)/finance/actions";

export function FinanceActions() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [categorie, setCategorie] = useState("");
  const [montant, setMontant] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    const res = await ajouterDepense({ libelle, categorie, montant });
    if (res.ok) {
      setOuvert(false);
      setLibelle("");
      setCategorie("");
      setMontant(0);
      router.refresh();
    } else setErreur(res.erreur ?? "Erreur.");
  }

  async function exporter() {
    const csv = await exportComptableCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "revora-comptable.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex gap-2">
        <Button taille="sm" variante="secondaire" onClick={exporter}>
          <Download size={15} /> Export comptable
        </Button>
        <Button taille="sm" onClick={() => setOuvert(true)}>
          <Plus size={15} /> Dépense
        </Button>
      </div>

      <Sheet ouvert={ouvert} onFermer={() => setOuvert(false)} titre="Nouvelle dépense">
        <form onSubmit={valider} className="flex flex-col gap-3">
          <Input label="Libellé" value={libelle} onChange={(e) => setLibelle(e.target.value)} required autoFocus />
          <Input label="Catégorie (facultatif)" value={categorie} onChange={(e) => setCategorie(e.target.value)} />
          <Input label="Montant (€)" type="number" value={String(montant)} onChange={(e) => setMontant(Number(e.target.value))} required />
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" pleineLargeur>Enregistrer</Button>
        </form>
      </Sheet>
    </>
  );
}
