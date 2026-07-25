"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, Printer,
  CreditCard, Banknote, ArrowLeftRight, FileText, Link2, Ticket, type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  encaisser,
  type LigneEncaissement,
  type PaiementEntree,
} from "@/app/(app)/caisse/actions";

const MOYENS: { cle: PaiementEntree["moyen"]; label: string; icone: LucideIcon }[] = [
  { cle: "carte", label: "Carte bancaire", icone: CreditCard },
  { cle: "especes", label: "Espèces", icone: Banknote },
  { cle: "virement", label: "Virement", icone: ArrowLeftRight },
  { cle: "cheque", label: "Chèque", icone: FileText },
  { cle: "lien", label: "Lien", icone: Link2 },
  { cle: "avoir", label: "Avoir", icone: Ticket },
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
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Encaissement</h1>
        <p className="mt-0.5 text-sm text-ink/55">{clientNom}</p>
      </div>

      {/* Panier */}
      <div className="rounded-[18px] border border-perle bg-white p-4">
        <div className="flex flex-col gap-2">
          {lignes.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={l.libelle}
                onChange={(e) => majLigne(i, { libelle: e.target.value })}
                className="h-10 min-w-0 flex-1 rounded-[10px] border border-perle px-2.5 text-sm text-ink focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                value={l.quantite}
                min={1}
                onChange={(e) => majLigne(i, { quantite: Number(e.target.value) })}
                className="h-10 w-12 rounded-[10px] border border-perle px-1 text-center text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                value={l.prix_unitaire}
                onChange={(e) => majLigne(i, { prix_unitaire: Number(e.target.value) })}
                className="h-10 w-20 rounded-[10px] border border-perle px-2 text-right text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => retirerLigne(i)}
                aria-label="Retirer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/40 hover:bg-surface-muted hover:text-terracotta"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {lignes.length === 0 && (
            <p className="py-2 text-center text-sm text-ink/40">Ajoutez une prestation ou un produit.</p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-perle pt-3">
          {produits.length > 0 && (
            <select
              onChange={(e) => {
                if (e.target.value) ajouterProduit(e.target.value);
                e.target.value = "";
              }}
              className="h-10 rounded-[10px] border border-perle bg-white px-2 text-sm text-primary"
              defaultValue=""
            >
              <option value="">+ Ajouter un produit</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} ({p.prix} €)
                </option>
              ))}
            </select>
          )}
          <button
            onClick={ajouterRemise}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-primary hover:bg-primary-50"
          >
            <Plus size={15} /> Remise
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-[18px] border border-perle bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink/70">Total</span>
          <span className="font-heading text-2xl font-bold text-ink">{total.toFixed(2)} €</span>
        </div>
        {acompteDeduit > 0 && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink/55">Acompte déjà versé</span>
            <span className="text-sauge">− {acompteDeduit.toFixed(2)} €</span>
          </div>
        )}
        {(acompteDeduit > 0 || paiements.length > 0) && (
          <div className="mt-2 flex justify-between border-t border-perle pt-2 text-sm font-semibold">
            <span className="text-ink">Reste à payer</span>
            <span className={reste > 0.009 ? "text-ink" : "text-sauge"}>{reste.toFixed(2)} €</span>
          </div>
        )}
      </div>

      {/* Paiement */}
      <div className="rounded-[18px] border border-perle bg-white p-4">
        <p className="mb-2 text-sm font-medium text-ink">Paiement</p>
        {paiements.map((p, i) => (
          <div key={i} className="mb-2 flex items-center gap-2">
            <span className="flex-1 text-sm capitalize text-ink/70">{p.moyen}</span>
            <input
              type="number"
              value={p.montant}
              onChange={(e) => majPaiement(i, Number(e.target.value))}
              className="h-10 w-24 rounded-[10px] border border-perle px-2 text-right text-sm focus:border-primary focus:outline-none"
            />
            <button
              onClick={() => setPaiements((ps) => ps.filter((_, j) => j !== i))}
              aria-label="Retirer le paiement"
              className="grid h-9 w-9 place-items-center rounded-full text-ink/40 hover:bg-surface-muted hover:text-terracotta"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {MOYENS.map((m) => (
            <button
              key={m.cle}
              onClick={() => ajouterPaiement(m.cle)}
              className="flex flex-col items-center gap-1.5 rounded-[14px] border border-perle bg-white px-2 py-3 text-center transition-colors hover:border-primary/40 hover:bg-primary-50/50"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary">
                <m.icone size={17} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-ink">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {erreur && <p className="text-sm text-terracotta">{erreur}</p>}
      <button
        onClick={valider}
        disabled={chargement || lignes.length === 0}
        className={cn(
          "inline-flex h-14 w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-white shadow-[0_12px_28px_-10px_rgb(109_76_255_/_0.7)] transition-colors hover:bg-primary-600 disabled:opacity-60",
        )}
      >
        {chargement ? "Encaissement…" : reste > 0.009 ? `Encaisser (reste ${reste.toFixed(2)} €)` : "Encaisser"}
      </button>
    </div>
  );
}
