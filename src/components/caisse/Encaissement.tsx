"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, Printer } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  encaisser,
  type LigneEncaissement,
  type PaiementEntree,
} from "@/app/(app)/caisse/actions";

const MOYENS: { cle: PaiementEntree["moyen"]; label: string }[] = [
  { cle: "carte", label: "Carte" },
  { cle: "especes", label: "Espèces" },
  { cle: "virement", label: "Virement" },
  { cle: "cheque", label: "Chèque" },
  { cle: "lien", label: "Lien" },
  { cle: "avoir", label: "Avoir" },
];

export function Encaissement({
  clientId,
  clientNom,
  rdvId,
  lignesInitiales,
  acompteDeduit,
  produits,
}: {
  clientId: string | null;
  clientNom: string;
  rdvId: string | null;
  lignesInitiales: LigneEncaissement[];
  acompteDeduit: number;
  produits: { id: string; nom: string; prix: number }[];
}) {
  const [lignes, setLignes] = useState<LigneEncaissement[]>(lignesInitiales);
  const [paiements, setPaiements] = useState<PaiementEntree[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [recu, setRecu] = useState<string | null>(null);

  const total = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
  const regle = acompteDeduit + paiements.reduce((s, p) => s + p.montant, 0);
  const reste = Math.round((total - regle) * 100) / 100;

  function majLigne(i: number, champ: Partial<LigneEncaissement>) {
    setLignes((l) => l.map((x, j) => (j === i ? { ...x, ...champ } : x)));
  }
  function retirerLigne(i: number) {
    setLignes((l) => l.filter((_, j) => j !== i));
  }
  function ajouterProduit(id: string) {
    const p = produits.find((x) => x.id === id);
    if (!p) return;
    setLignes((l) => [
      ...l,
      { type: "produit", libelle: p.nom, quantite: 1, prix_unitaire: p.prix, produit_id: p.id },
    ]);
  }
  function ajouterRemise() {
    setLignes((l) => [...l, { type: "remise", libelle: "Remise", quantite: 1, prix_unitaire: 0 }]);
  }
  function ajouterPaiement(moyen: PaiementEntree["moyen"]) {
    setPaiements((p) => [...p, { montant: Math.max(0, reste), moyen, type: "solde" }]);
  }
  function majPaiement(i: number, montant: number) {
    setPaiements((p) => p.map((x, j) => (j === i ? { ...x, montant } : x)));
  }

  async function valider() {
    setErreur(null);
    setChargement(true);
    const res = await encaisser({ clientId, rdvId, lignes, paiements, acompteDeduit });
    setChargement(false);
    if (res.ok) setRecu(res.numero);
    else setErreur(res.erreur);
  }

  if (recu) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center print:py-0">
        <CheckCircle2 size={48} className="text-green-600 print:hidden" />
        <div>
          <h1 className="font-heading text-xl font-bold text-ink">Reçu {recu}</h1>
          <p className="text-sm text-ink/60">{clientNom}</p>
        </div>
        <div className="w-full max-w-xs rounded-[var(--radius-lg)] border border-perle p-4 text-left text-sm">
          {lignes.map((l, i) => (
            <div key={i} className="flex justify-between">
              <span>
                {l.libelle} × {l.quantite}
              </span>
              <span>{(l.quantite * l.prix_unitaire).toFixed(2)} €</span>
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-perle pt-2 font-semibold">
            <span>Total</span>
            <span>{total.toFixed(2)} €</span>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variante="secondaire" onClick={() => window.print()}>
            <Printer size={16} /> Imprimer
          </Button>
          <Link href="/caisse">
            <Button>Terminer</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/caisse" className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink">
        <ArrowLeft size={16} /> Caisse
      </Link>
      <h1 className="font-heading text-2xl font-bold text-ink">Encaissement</h1>
      <p className="text-sm text-ink/60">{clientNom}</p>

      {/* Panier */}
      <Card className="flex flex-col gap-2">
        {lignes.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={l.libelle}
              onChange={(e) => majLigne(i, { libelle: e.target.value })}
              className="h-9 flex-1 rounded-[var(--radius-sm)] border border-perle px-2 text-sm"
            />
            <input
              type="number"
              value={l.quantite}
              min={1}
              onChange={(e) => majLigne(i, { quantite: Number(e.target.value) })}
              className="h-9 w-12 rounded-[var(--radius-sm)] border border-perle px-1 text-center text-sm"
            />
            <input
              type="number"
              value={l.prix_unitaire}
              onChange={(e) => majLigne(i, { prix_unitaire: Number(e.target.value) })}
              className="h-9 w-20 rounded-[var(--radius-sm)] border border-perle px-2 text-right text-sm"
            />
            <button onClick={() => retirerLigne(i)} className="text-ink/40 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-1">
          {produits.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) ajouterProduit(e.target.value);
                e.target.value = "";
              }}
              className="h-9 rounded-[var(--radius-md)] border border-perle bg-white px-2 text-sm"
              defaultValue=""
            >
              <option value="">+ Produit</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.prix} €)
                </option>
              ))}
            </select>
          )}
          <button onClick={ajouterRemise} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Plus size={15} /> Remise
          </button>
        </div>
      </Card>

      {/* Totaux */}
      <Card className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-ink/60">Total</span>
          <span className="font-semibold text-ink">{total.toFixed(2)} €</span>
        </div>
        {acompteDeduit > 0 && (
          <div className="flex justify-between">
            <span className="text-ink/60">Acompte déjà versé</span>
            <span className="text-green-700">− {acompteDeduit.toFixed(2)} €</span>
          </div>
        )}
        <div className="flex justify-between border-t border-perle pt-1 text-base font-bold">
          <span>Reste à payer</span>
          <span className={reste > 0 ? "text-ink" : "text-green-700"}>{reste.toFixed(2)} €</span>
        </div>
      </Card>

      {/* Paiements fractionnés */}
      <Card className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">Paiement</p>
        {paiements.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex-1 text-sm capitalize text-ink/70">{p.moyen}</span>
            <input
              type="number"
              value={p.montant}
              onChange={(e) => majPaiement(i, Number(e.target.value))}
              className="h-9 w-24 rounded-[var(--radius-sm)] border border-perle px-2 text-right text-sm"
            />
            <button
              onClick={() => setPaiements((ps) => ps.filter((_, j) => j !== i))}
              className="text-ink/40 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {MOYENS.map((m) => (
            <button
              key={m.cle}
              onClick={() => ajouterPaiement(m.cle)}
              className="rounded-full border border-perle px-3 py-1.5 text-sm font-medium text-ink/70 hover:border-primary"
            >
              + {m.label}
            </button>
          ))}
        </div>
      </Card>

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <Button
        pleineLargeur
        onClick={valider}
        disabled={chargement || lignes.length === 0}
        className={cn(reste > 0.009 && "opacity-90")}
      >
        {chargement ? "Encaissement…" : reste > 0.009 ? `Encaisser (reste ${reste.toFixed(2)} €)` : "Encaisser"}
      </Button>
    </div>
  );
}
