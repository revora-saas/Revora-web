"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertTriangle, Package, CalendarClock } from "lucide-react";
import { Button, Input, Badge, Sheet } from "@/components/ui";
import {
  creerProduit,
  ajouterLot,
  mouvementStock,
  type ProduitVue,
} from "@/app/(app)/stock/actions";

const TYPES = [
  { cle: "consommable", label: "Consommable" },
  { cle: "pigment", label: "Pigment" },
  { cle: "revente", label: "Revente" },
] as const;

export function StockClient({ produits }: { produits: ProduitVue[] }) {
  const router = useRouter();
  const [creation, setCreation] = useState(false);
  const [detail, setDetail] = useState<ProduitVue | null>(null);

  const sousSeuil = produits.filter((p) => p.sousSeuil);
  const perimes = produits.flatMap((p) =>
    p.lots.filter((l) => l.perime || l.perimeBientot).map((l) => ({ produit: p.nom, lot: l })),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink">Stock</h1>
        <Button taille="sm" onClick={() => setCreation(true)}>
          <Plus size={16} /> Produit
        </Button>
      </div>

      {/* Alertes (R12.2 / R12.3) */}
      {(sousSeuil.length > 0 || perimes.length > 0) && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {sousSeuil.map((p) => (
            <p key={p.id} className="flex items-center gap-1.5">
              <AlertTriangle size={14} /> {p.nom} sous le seuil ({p.quantite} {p.unite})
            </p>
          ))}
          {perimes.map((x, i) => (
            <p key={i} className="flex items-center gap-1.5">
              <CalendarClock size={14} /> {x.produit} — lot {x.lot.numero}
              {x.lot.perime ? " périmé" : ` périme le ${x.lot.peremption}`}
            </p>
          ))}
        </div>
      )}

      {produits.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">Aucun produit.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {produits.map((p) => (
            <li key={p.id}>
              <button
                onClick={() => setDetail(p)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-muted"
              >
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-ink/40" />
                  <div>
                    <p className="font-medium text-ink">{p.nom}</p>
                    <p className="text-xs text-ink/50 capitalize">{p.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${p.sousSeuil ? "text-amber-700" : "text-ink"}`}>
                    {p.quantite} {p.unite}
                  </p>
                  {p.seuil > 0 && <p className="text-xs text-ink/40">seuil {p.seuil}</p>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SheetCreation ouvert={creation} onFermer={() => setCreation(false)} onCree={() => { setCreation(false); router.refresh(); }} />
      <SheetDetail produit={detail} onFermer={() => setDetail(null)} onChange={() => router.refresh()} />
    </div>
  );
}

function SheetCreation({ ouvert, onFermer, onCree }: { ouvert: boolean; onFermer: () => void; onCree: () => void }) {
  const [nom, setNom] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["cle"]>("consommable");
  const [marque, setMarque] = useState("");
  const [unite, setUnite] = useState("unité");
  const [seuil, setSeuil] = useState(0);
  const [prix, setPrix] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider(e: React.FormEvent) {
    e.preventDefault();
    const res = await creerProduit({ nom, type, marque, unite, seuil, prixVente: type === "revente" ? prix : undefined });
    if (res.ok) onCree();
    else setErreur(res.erreur ?? "Erreur.");
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre="Nouveau produit">
      <form onSubmit={valider} className="flex flex-col gap-3">
        <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
        <div className="flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.cle}
              type="button"
              onClick={() => setType(t.cle)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${type === t.cle ? "bg-primary text-white" : "border border-perle text-ink/70"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Input label="Marque (facultatif)" value={marque} onChange={(e) => setMarque(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Unité" value={unite} onChange={(e) => setUnite(e.target.value)} />
          <Input label="Seuil d'alerte" type="number" value={String(seuil)} onChange={(e) => setSeuil(Number(e.target.value))} />
        </div>
        {type === "revente" && (
          <Input label="Prix de vente (€)" type="number" value={String(prix)} onChange={(e) => setPrix(Number(e.target.value))} />
        )}
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <Button type="submit" pleineLargeur>Créer</Button>
      </form>
    </Sheet>
  );
}

function SheetDetail({ produit, onFermer, onChange }: { produit: ProduitVue | null; onFermer: () => void; onChange: () => void }) {
  const [qte, setQte] = useState(1);
  const [nouvLot, setNouvLot] = useState({ numero: "", peremption: "", quantite: 1 });

  if (!produit) return null;

  async function mouvement(quantite: number, motif: "entree" | "sortie" | "perte" | "inventaire") {
    await mouvementStock({ produitId: produit!.id, quantite, motif });
    onChange();
    onFermer();
  }

  async function creerLot(e: React.FormEvent) {
    e.preventDefault();
    await ajouterLot({
      produitId: produit!.id,
      numero: nouvLot.numero,
      peremption: nouvLot.peremption || undefined,
      quantite: nouvLot.quantite,
    });
    onChange();
    onFermer();
  }

  return (
    <Sheet ouvert={!!produit} onFermer={onFermer} titre={produit.nom}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink/60">
          En stock : <strong>{produit.quantite} {produit.unite}</strong>
        </p>

        {/* Mouvement rapide */}
        <div className="flex items-center gap-2">
          <Input type="number" value={String(qte)} onChange={(e) => setQte(Number(e.target.value))} className="w-20" />
          <Button taille="sm" variante="secondaire" onClick={() => mouvement(Math.abs(qte), "entree")}>Entrée</Button>
          <Button taille="sm" variante="secondaire" onClick={() => mouvement(-Math.abs(qte), "sortie")}>Sortie</Button>
          <Button taille="sm" variante="secondaire" onClick={() => mouvement(-Math.abs(qte), "perte")}>Perte</Button>
        </div>

        {/* Lots (pigments) */}
        {produit.type === "pigment" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-ink">Lots</p>
            {produit.lots.map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span>
                  Lot {l.numero} · {l.quantite} {produit.unite}
                </span>
                {l.perime ? (
                  <Badge ton="danger">Périmé</Badge>
                ) : l.perimeBientot ? (
                  <Badge ton="alerte">Bientôt</Badge>
                ) : (
                  <span className="text-xs text-ink/40">{l.peremption ?? "—"}</span>
                )}
              </div>
            ))}
            <form onSubmit={creerLot} className="mt-2 flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface-muted p-3">
              <p className="text-sm font-medium text-ink">Nouveau lot</p>
              <div className="grid grid-cols-2 gap-2">
                <Input label="N° de lot" value={nouvLot.numero} onChange={(e) => setNouvLot({ ...nouvLot, numero: e.target.value })} required />
                <Input label="Péremption" type="date" value={nouvLot.peremption} onChange={(e) => setNouvLot({ ...nouvLot, peremption: e.target.value })} />
              </div>
              <Input label="Quantité" type="number" value={String(nouvLot.quantite)} onChange={(e) => setNouvLot({ ...nouvLot, quantite: Number(e.target.value) })} />
              <Button type="submit" taille="sm">Ajouter le lot</Button>
            </form>
          </div>
        )}
      </div>
    </Sheet>
  );
}
