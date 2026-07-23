"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Download, Phone } from "lucide-react";
import { Button, Input, Badge, Sheet } from "@/components/ui";
import { STATUTS, formaterTelephone } from "@/lib/clientes-ui";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";
import {
  rechercherClientes,
  creerClienteRapide,
  exporterClientesCsv,
} from "@/app/(app)/clientes/actions";

type Cliente = Tables<"clients">;

const FILTRES = [
  { cle: "tous", label: "Toutes" },
  { cle: "fidele", label: "Fidèles" },
  { cle: "reguliere", label: "Régulières" },
  { cle: "nouvelle", label: "Nouvelles" },
  { cle: "inactive", label: "Inactives" },
  { cle: "a_risque", label: "À risque" },
];

export function ListeClientes({
  initiales,
  motClient,
}: {
  initiales: Cliente[];
  motClient: string; // "clientes" / "clients"
}) {
  const router = useRouter();
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");
  const [clientes, setClientes] = useState<Cliente[]>(initiales);
  const [offset, setOffset] = useState(initiales.length);
  const [finListe, setFinListe] = useState(initiales.length < 30);
  const [enCours, demarrer] = useTransition();
  const [creation, setCreation] = useState(false);

  const premierRendu = useRef(true);

  // Recherche instantanée dès 2 caractères (C5.1), avec léger debounce.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const q = recherche.trim();
    if (q.length === 1) return; // on attend 2 caractères
    const t = setTimeout(() => {
      demarrer(async () => {
        const res = await rechercherClientes(q, 0);
        setClientes(res);
        setOffset(res.length);
        setFinListe(res.length < 30);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [recherche]);

  function chargerPlus() {
    demarrer(async () => {
      const res = await rechercherClientes(recherche.trim(), offset);
      setClientes((prec) => [...prec, ...res]);
      setOffset((o) => o + res.length);
      if (res.length < 30) setFinListe(true);
    });
  }

  async function exporter() {
    const csv = await exporterClientesCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes-revora.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const affichees =
    filtre === "tous" ? clientes : clientes.filter((c) => c.statut === filtre);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold capitalize text-ink">
          {motClient}
        </h1>
        <div className="flex gap-2">
          <Button variante="secondaire" taille="sm" onClick={exporter}>
            <Download size={16} />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
          <Link href="/clientes/importer">
            <Button variante="secondaire" taille="sm">
              <span className="hidden sm:inline">Importer</span>
              <span className="sm:hidden">Import</span>
            </Button>
          </Link>
          <Button taille="sm" onClick={() => setCreation(true)}>
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle</span>
          </Button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <Input
          className="pl-10"
          placeholder="Rechercher un nom, un numéro…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          inputMode="search"
        />
      </div>

      {/* Filtres rapides */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            onClick={() => setFiltre(f.cle)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              filtre === f.cle
                ? "bg-primary text-white"
                : "bg-white text-ink/70 border border-perle hover:bg-surface-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {affichees.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink/50">
          {recherche ? "Aucun résultat." : `Aucune fiche pour l'instant.`}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {affichees.map((c) => {
            const st = STATUTS[c.statut] ?? STATUTS.nouvelle;
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted"
                >
                  <Avatar nom={c.nom} prenom={c.prenom} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                    </p>
                    <p className="flex items-center gap-1 truncate text-sm text-ink/50">
                      <Phone size={12} />
                      {formaterTelephone(c.telephone_mobile) || "—"}
                    </p>
                  </div>
                  <Badge ton={st.ton}>{st.label}</Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!finListe && affichees.length > 0 && filtre === "tous" && (
        <Button variante="secondaire" onClick={chargerPlus} disabled={enCours}>
          {enCours ? "Chargement…" : "Charger plus"}
        </Button>
      )}

      <SheetCreation
        ouvert={creation}
        onFermer={() => setCreation(false)}
        onCree={(id) => {
          setCreation(false);
          router.push(`/clientes/${id}`);
        }}
      />
    </div>
  );
}

function Avatar({ nom, prenom }: { nom: string; prenom: string | null }) {
  const initiales = `${prenom?.[0] ?? ""}${nom[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
      {initiales}
    </div>
  );
}

function SheetCreation({
  ouvert,
  onFermer,
  onCree,
}: {
  ouvert: boolean;
  onFermer: () => void;
  onCree: (id: string) => void;
}) {
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [doublon, setDoublon] = useState<{ id: string; nom: string } | null>(null);
  const [idCree, setIdCree] = useState<string | null>(null);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await creerClienteRapide(nom, tel);
    setChargement(false);
    if (!res.ok) {
      setErreur(res.erreur);
      return;
    }
    if (res.doublon) {
      // Alerte NON bloquante : la fiche est créée, on prévient (mère/fille possible).
      setDoublon(res.doublon);
      setIdCree(res.id);
    } else {
      onCree(res.id);
    }
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre="Nouvelle fiche">
      {doublon && idCree ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-[var(--radius-md)] bg-amber-50 p-3 text-sm text-amber-800">
            Une fiche existe déjà avec ce numéro ({doublon.nom}). Cela peut être
            normal (mère et fille). La nouvelle fiche a bien été créée.
          </p>
          <Button pleineLargeur onClick={() => onCree(idCree)}>
            Ouvrir la nouvelle fiche
          </Button>
        </div>
      ) : (
        <form onSubmit={soumettre} className="flex flex-col gap-3">
          <Input
            label="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Mobile"
            type="tel"
            inputMode="tel"
            placeholder="06 12 34 56 78"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            required
          />
          {erreur && <p className="text-sm text-red-600">{erreur}</p>}
          <Button type="submit" pleineLargeur disabled={chargement}>
            {chargement ? "Création…" : "Créer la fiche"}
          </Button>
        </form>
      )}
    </Sheet>
  );
}
