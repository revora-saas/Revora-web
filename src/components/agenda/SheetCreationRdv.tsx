"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { Search, Plus, Check } from "lucide-react";
import { Sheet, Input, Button } from "@/components/ui";
import { formaterDuree } from "@/lib/utils";
import { formaterTelephone } from "@/lib/clientes-ui";
import { rechercherClientes, creerClienteRapide } from "@/app/(app)/clientes/actions";
import { listerPrestationsPourRdv, creerRdvPro } from "@/app/(app)/agenda/actions";

interface ClienteMin {
  id: string;
  nom: string;
  prenom: string | null;
  telephone_mobile: string | null;
}
interface PrestaMin {
  id: string;
  nom: string;
  prix: number;
  duree_execution: number;
}

export function SheetCreationRdv({
  ouvert,
  onFermer,
  debutExecutionIso,
  fuseau,
  onCree,
}: {
  ouvert: boolean;
  onFermer: () => void;
  debutExecutionIso: string | null;
  fuseau: string;
  onCree: () => void;
}) {
  const [etape, setEtape] = useState<"cliente" | "prestation">("cliente");
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<ClienteMin[]>([]);
  const [cliente, setCliente] = useState<ClienteMin | null>(null);
  const [prestations, setPrestations] = useState<PrestaMin[]>([]);
  const [choisies, setChoisies] = useState<string[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [creationCliente, setCreationCliente] = useState(false);
  const [nouvNom, setNouvNom] = useState("");
  const [nouvTel, setNouvTel] = useState("");

  // Chargement du catalogue au montage. Le composant est remonté (key) à
  // chaque ouverture par le parent : l'état repart donc à zéro tout seul.
  useEffect(() => {
    listerPrestationsPourRdv().then(setPrestations);
  }, []);

  useEffect(() => {
    const q = recherche.trim();
    if (q.length < 2) return;
    const t = setTimeout(async () => {
      const r = await rechercherClientes(q, 0);
      setResultats(r as ClienteMin[]);
    }, 200);
    return () => clearTimeout(t);
  }, [recherche]);

  // N'affiche des résultats qu'à partir de 2 caractères.
  const resultatsAffiches = recherche.trim().length >= 2 ? resultats : [];

  const heureLisible = debutExecutionIso
    ? toZonedTime(new Date(debutExecutionIso), fuseau).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  async function creerCliente() {
    setErreur(null);
    setChargement(true);
    const res = await creerClienteRapide(nouvNom, nouvTel);
    setChargement(false);
    if (res.ok) {
      setCliente({ id: res.id, nom: nouvNom, prenom: null, telephone_mobile: null });
      setEtape("prestation");
    } else setErreur(res.erreur);
  }

  function basculer(id: string) {
    setChoisies((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  const totalDuree = choisies
    .map((id) => prestations.find((p) => p.id === id)?.duree_execution ?? 0)
    .reduce((a, b) => a + b, 0);
  const totalPrix = choisies
    .map((id) => prestations.find((p) => p.id === id)?.prix ?? 0)
    .reduce((a, b) => a + b, 0);

  async function confirmer() {
    if (!debutExecutionIso || choisies.length === 0) return;
    setErreur(null);
    setChargement(true);
    const res = await creerRdvPro({
      clientId: cliente?.id ?? null,
      prestationIds: choisies,
      debutExecutionIso,
    });
    setChargement(false);
    if (res.ok) onCree();
    else setErreur(res.erreur);
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre={`Nouveau rendez-vous · ${heureLisible}`}>
      {etape === "cliente" ? (
        <div className="flex flex-col gap-3">
          {creationCliente ? (
            <>
              <Input label="Nom" value={nouvNom} onChange={(e) => setNouvNom(e.target.value)} autoFocus />
              <Input
                label="Mobile"
                type="tel"
                placeholder="06 12 34 56 78"
                value={nouvTel}
                onChange={(e) => setNouvTel(e.target.value)}
              />
              {erreur && <p className="text-sm text-red-600">{erreur}</p>}
              <div className="flex gap-2">
                <Button variante="secondaire" onClick={() => setCreationCliente(false)}>
                  Retour
                </Button>
                <Button pleineLargeur onClick={creerCliente} disabled={chargement}>
                  Créer et continuer
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <Input
                  className="pl-10"
                  placeholder="Rechercher une cliente…"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                onClick={() => setCreationCliente(true)}
                className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
              >
                <Plus size={15} /> Nouvelle cliente
              </button>
              <button
                onClick={() => {
                  setCliente(null);
                  setEtape("prestation");
                }}
                className="text-left text-sm text-ink/50 hover:text-ink"
              >
                Sans cliente (blocage / perso)
              </button>
              <ul className="flex flex-col divide-y divide-perle">
                {resultatsAffiches.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        setCliente(c);
                        setEtape("prestation");
                      }}
                      className="flex w-full items-center justify-between py-2.5 text-left hover:bg-surface-muted"
                    >
                      <span className="font-medium text-ink">
                        {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                      </span>
                      <span className="text-sm text-ink/50">
                        {formaterTelephone(c.telephone_mobile)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink/60">
            Cliente : <strong>{cliente ? (cliente.prenom ? `${cliente.prenom} ${cliente.nom}` : cliente.nom) : "—"}</strong>
          </p>
          <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-md)] border border-perle">
            {prestations.map((p) => {
              const active = choisies.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => basculer(p.id)}
                    className={`flex w-full items-center justify-between px-3 py-2.5 text-left ${active ? "bg-primary-50" : "hover:bg-surface-muted"}`}
                  >
                    <span className="font-medium text-ink">{p.nom}</span>
                    <span className="flex items-center gap-2 text-sm text-ink/50">
                      {formaterDuree(p.duree_execution)} · {p.prix} €
                      {active && <Check size={16} className="text-primary" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {choisies.length > 0 && (
            <p className="text-sm text-ink/70">
              Total : {formaterDuree(totalDuree)} · {totalPrix} €
            </p>
          )}
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <div className="flex gap-2">
            <Button variante="secondaire" onClick={() => setEtape("cliente")}>
              Retour
            </Button>
            <Button pleineLargeur onClick={confirmer} disabled={chargement || choisies.length === 0}>
              {chargement ? "Création…" : "Confirmer le rendez-vous"}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
