"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { formaterDuree } from "@/lib/utils";
import {
  creerCategorie,
  renommerCategorie,
  supprimerCategorie,
  reordonnerCategories,
  archiverPrestation,
} from "@/app/(app)/catalogue/actions";

interface Prestation {
  id: string;
  nom: string;
  prix: number;
  duree_execution: number;
  categorie_id: string | null;
  actif: boolean;
  pmu: boolean;
}
interface Categorie {
  id: string;
  nom: string;
}

export function CatalogueClient({
  categories: catInit,
  prestations: prestaInit,
  motPrestation,
}: {
  categories: Categorie[];
  prestations: Prestation[];
  motPrestation: string;
}) {
  const router = useRouter();
  const [categories, setCategories] = useState(catInit);
  const [afficherArchivees, setAfficherArchivees] = useState(false);
  const [nouvelleCat, setNouvelleCat] = useState("");
  const [ajoutCat, setAjoutCat] = useState(false);

  const prestations = afficherArchivees
    ? prestaInit
    : prestaInit.filter((p) => p.actif);

  function parCategorie(catId: string | null) {
    return prestations.filter((p) => p.categorie_id === catId);
  }

  async function deplacer(index: number, sens: -1 | 1) {
    const cible = index + sens;
    if (cible < 0 || cible >= categories.length) return;
    const suivant = [...categories];
    [suivant[index], suivant[cible]] = [suivant[cible], suivant[index]];
    setCategories(suivant);
    await reordonnerCategories(suivant.map((c) => c.id));
  }

  async function ajouterCategorie() {
    if (!nouvelleCat.trim()) return;
    const res = await creerCategorie(nouvelleCat);
    if (res.ok && res.id) {
      setCategories([...categories, { id: res.id, nom: nouvelleCat.trim() }]);
      setNouvelleCat("");
      setAjoutCat(false);
    }
  }

  const sansCategorie = parCategorie(null);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-ink">Catalogue</h1>
        <Link href="/catalogue/prestation/nouvelle">
          <Button taille="sm">
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle prestation</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={afficherArchivees}
            onChange={(e) => setAfficherArchivees(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-primary)]"
          />
          Afficher les archivées
        </label>
        {ajoutCat ? (
          <div className="flex items-center gap-2">
            <Input
              value={nouvelleCat}
              onChange={(e) => setNouvelleCat(e.target.value)}
              placeholder="Nom de la catégorie"
              className="h-9"
              autoFocus
            />
            <Button taille="sm" onClick={ajouterCategorie}>
              OK
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setAjoutCat(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <FolderPlus size={15} /> Catégorie
          </button>
        )}
      </div>

      {categories.map((cat, i) => (
        <BlocCategorie
          key={cat.id}
          categorie={cat}
          prestations={parCategorie(cat.id)}
          motPrestation={motPrestation}
          premier={i === 0}
          dernier={i === categories.length - 1}
          onMonter={() => deplacer(i, -1)}
          onDescendre={() => deplacer(i, 1)}
          onRenomme={(nom) => {
            setCategories((c) => c.map((x) => (x.id === cat.id ? { ...x, nom } : x)));
            renommerCategorie(cat.id, nom);
          }}
          onSupprime={async () => {
            await supprimerCategorie(cat.id);
            setCategories((c) => c.filter((x) => x.id !== cat.id));
            router.refresh();
          }}
          onRefresh={() => router.refresh()}
        />
      ))}

      {sansCategorie.length > 0 && (
        <BlocCategorie
          categorie={{ id: "", nom: "Sans catégorie" }}
          prestations={sansCategorie}
          motPrestation={motPrestation}
          onRefresh={() => router.refresh()}
        />
      )}

      {prestations.length === 0 && (
        <p className="py-8 text-center text-sm text-ink/50">
          Aucune {motPrestation} pour l&apos;instant.
        </p>
      )}
    </div>
  );
}

function BlocCategorie({
  categorie,
  prestations,
  motPrestation,
  premier,
  dernier,
  onMonter,
  onDescendre,
  onRenomme,
  onSupprime,
  onRefresh,
}: {
  categorie: Categorie;
  prestations: Prestation[];
  motPrestation: string;
  premier?: boolean;
  dernier?: boolean;
  onMonter?: () => void;
  onDescendre?: () => void;
  onRenomme?: (nom: string) => void;
  onSupprime?: () => void;
  onRefresh: () => void;
}) {
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(categorie.nom);
  const reordonnable = Boolean(onMonter);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {reordonnable && (
          <div className="flex flex-col">
            <button
              onClick={onMonter}
              disabled={premier}
              className="text-ink/30 hover:text-ink disabled:opacity-30"
              aria-label="Monter"
            >
              <ChevronUp size={16} />
            </button>
            <button
              onClick={onDescendre}
              disabled={dernier}
              className="text-ink/30 hover:text-ink disabled:opacity-30"
              aria-label="Descendre"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        )}
        {edition ? (
          <div className="flex flex-1 items-center gap-2">
            <Input value={nom} onChange={(e) => setNom(e.target.value)} className="h-9" autoFocus />
            <Button
              taille="sm"
              onClick={() => {
                onRenomme?.(nom);
                setEdition(false);
              }}
            >
              OK
            </Button>
          </div>
        ) : (
          <h2 className="flex-1 font-heading font-semibold text-ink">{categorie.nom}</h2>
        )}
        {onRenomme && !edition && (
          <button onClick={() => setEdition(true)} className="text-ink/40 hover:text-ink">
            <Pencil size={15} />
          </button>
        )}
        {onSupprime && (
          <button onClick={onSupprime} className="text-ink/40 hover:text-red-600">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {prestations.length === 0 ? (
        <p className="pl-1 text-sm text-ink/40">Aucune {motPrestation}.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-perle overflow-hidden rounded-[var(--radius-lg)] border border-perle bg-white">
          {prestations.map((p) => (
            <LignePrestation key={p.id} prestation={p} onRefresh={onRefresh} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LignePrestation({
  prestation,
  onRefresh,
}: {
  prestation: Prestation;
  onRefresh: () => void;
}) {
  const [enCours, setEnCours] = useState(false);

  async function basculerArchive() {
    setEnCours(true);
    await archiverPrestation(prestation.id, prestation.actif);
    setEnCours(false);
    onRefresh();
  }

  return (
    <li className={`flex items-center gap-3 px-4 py-3 ${!prestation.actif ? "opacity-50" : ""}`}>
      <Link href={`/catalogue/prestation/${prestation.id}`} className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate font-medium text-ink">
          {prestation.nom}
          {prestation.pmu && <Badge ton="primaire">PMU</Badge>}
          {!prestation.actif && <Badge ton="neutre">Archivée</Badge>}
        </p>
        <p className="text-sm text-ink/50">
          {formaterDuree(prestation.duree_execution)} · {prestation.prix} €
        </p>
      </Link>
      <Link
        href={`/catalogue/prestation/${prestation.id}`}
        className="text-ink/40 hover:text-ink"
        aria-label="Modifier"
      >
        <Pencil size={16} />
      </Link>
      <button
        onClick={basculerArchive}
        disabled={enCours}
        className="text-ink/40 hover:text-ink"
        aria-label={prestation.actif ? "Archiver" : "Restaurer"}
      >
        {prestation.actif ? <Archive size={16} /> : <ArchiveRestore size={16} />}
      </button>
    </li>
  );
}
