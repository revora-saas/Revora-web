"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Download, Phone, Upload } from "lucide-react";
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exporter}
            aria-label="Exporter"
            className="grid h-10 w-10 place-items-center rounded-full border border-perle text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <Download size={17} />
          </button>
          <Link
            href="/clientes/importer"
            aria-label="Importer"
            className="grid h-10 w-10 place-items-center rounded-full border border-perle text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <Upload size={17} />
          </Link>
          <button
            type="button"
            onClick={() => setCreation(true)}
            aria-label="Nouvelle fiche"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white shadow-[0_8px_18px_-8px_rgb(109_76_255_/_0.7)] transition-colors hover:bg-primary-600"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
        />
        <input
          className="h-12 w-full rounded-[14px] border border-perle bg-white pl-11 pr-4 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          placeholder={`Rechercher un nom, un numéro…`}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          inputMode="search"
          aria-label="Rechercher"
        />
      </div>

      {/* Filtres rapides */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTRES.map((f) => (
          <button
            key={f.cle}
            onClick={() => setFiltre(f.cle)}
            className={cn(
              "min-h-9 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
              filtre === f.cle
                ? "bg-primary text-white shadow-[0_6px_16px_-8px_rgb(109_76_255_/_0.7)]"
                : "border border-perle bg-white text-ink/60 hover:text-ink",
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
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[18px] border border-perle bg-white">
          {affichees.map((c) => {
            const st = STATUTS[c.statut] ?? STATUTS.nouvelle;
            return (
              <li key={c.id}>
                <Link
                  href={`/clientes/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted"
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
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge ton={st.ton}>{st.label}</Badge>
                    <span className="text-[11px] text-ink/45">
                      {c.nombre_visites} visite{c.nombre_visites > 1 ? "s" : ""}
                    </span>
                  </div>
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-50 font-heading text-sm font-semibold text-primary">
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
