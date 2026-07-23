"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Info } from "lucide-react";
import { Button, Input, Card } from "@/components/ui";
import { cn, formaterDuree } from "@/lib/utils";
import { creerPrestation, majPrestation } from "@/app/(app)/catalogue/actions";

interface Segment {
  libelle: string;
  duree: number;
  praticienne_occupee: boolean;
}
interface Option {
  nom: string;
  prix: number;
  duree_sup: number;
}
export interface PrestationInitiale {
  id: string | null;
  nom: string;
  categorie_id: string | null;
  description: string | null;
  photo_url: string | null;
  prix: number;
  duree_preparation: number;
  duree_execution: number;
  duree_nettoyage: number;
  battement: number;
  lieu: "salon" | "domicile" | "les_deux";
  reservable_en_ligne: boolean;
  acompte_type: "aucun" | "fixe" | "pourcentage";
  acompte_valeur: number;
  pmu: boolean;
  patch_test_requis: boolean;
  cycle_rappel_jours: number | null;
  segments: Segment[];
  options: Option[];
  ressource_ids: string[];
}

const SEGMENTS_EXEMPLE: Segment[] = [
  { libelle: "Application", duree: 20, praticienne_occupee: true },
  { libelle: "Pose", duree: 30, praticienne_occupee: false },
  { libelle: "Rinçage et coiffage", duree: 40, praticienne_occupee: true },
];

export function EditeurPrestation({
  initiale,
  categories,
  ressources,
}: {
  initiale: PrestationInitiale;
  categories: { id: string; nom: string }[];
  ressources: { id: string; nom: string; type: string }[];
}) {
  const router = useRouter();
  const [f, setF] = useState<PrestationInitiale>(initiale);
  const [segmentsActifs, setSegmentsActifs] = useState(initiale.segments.length > 0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function set<K extends keyof PrestationInitiale>(cle: K, valeur: PrestationInitiale[K]) {
    setF((p) => ({ ...p, [cle]: valeur }));
  }

  const execution = segmentsActifs
    ? f.segments.reduce((s, seg) => s + seg.duree, 0)
    : f.duree_execution;
  const bloquee = f.duree_preparation + execution + f.duree_nettoyage + f.battement;

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const donnees = {
      ...f,
      duree_execution: execution,
      segments: segmentsActifs ? f.segments : [],
    };
    const res = initiale.id
      ? await majPrestation(initiale.id, donnees)
      : await creerPrestation(donnees);
    setChargement(false);
    if (res.ok) {
      router.push("/catalogue");
      router.refresh();
    } else {
      setErreur(res.erreur);
    }
  }

  return (
    <form onSubmit={enregistrer} className="flex flex-col gap-5">
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={16} /> Catalogue
      </Link>
      <h1 className="font-heading text-2xl font-bold text-ink">
        {initiale.id ? "Modifier la prestation" : "Nouvelle prestation"}
      </h1>

      {/* Informations de base */}
      <Card className="flex flex-col gap-3">
        <Input label="Nom" value={f.nom} onChange={(e) => set("nom", e.target.value)} required />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Catégorie</span>
          <select
            value={f.categorie_id ?? ""}
            onChange={(e) => set("categorie_id", e.target.value || null)}
            className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm"
          >
            <option value="">Sans catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <ChampTexte
          label="Description (facultatif)"
          value={f.description ?? ""}
          onChange={(v) => set("description", v || null)}
        />
        <ChampNombre label="Prix (€)" value={f.prix} onChange={(v) => set("prix", v)} pas={0.5} />
      </Card>

      {/* Les 4 temps */}
      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="font-heading font-semibold text-ink">Durées</h2>
          <p className="text-sm text-ink/60">
            La cliente ne voit que l&apos;exécution. L&apos;agenda bloque tout.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChampNombre
            label="Préparation (min)"
            value={f.duree_preparation}
            onChange={(v) => set("duree_preparation", v)}
          />
          <ChampNombre
            label="Exécution (min)"
            value={f.duree_execution}
            onChange={(v) => set("duree_execution", v)}
            disabled={segmentsActifs}
            aide={segmentsActifs ? "Calculée depuis les segments" : undefined}
          />
          <ChampNombre
            label="Nettoyage (min)"
            value={f.duree_nettoyage}
            onChange={(v) => set("duree_nettoyage", v)}
          />
          <ChampNombre
            label="Battement (min)"
            value={f.battement}
            onChange={(v) => set("battement", v)}
          />
        </div>

        {/* Calcul en direct */}
        <div className="rounded-[var(--radius-md)] bg-primary-50 p-3 text-sm text-primary-700">
          La cliente voit <strong>{formaterDuree(execution)}</strong> — votre
          agenda bloque <strong>{formaterDuree(bloquee)}</strong>.
        </div>
      </Card>

      {/* Segments / temps de pose */}
      <Card className="flex flex-col gap-3">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="font-heading font-semibold text-ink">Temps de pose</span>
            <span className="block text-sm text-ink/60">
              Pendant la pose, vous pouvez recevoir une autre cliente.
            </span>
          </span>
          <Interrupteur
            actif={segmentsActifs}
            onChange={(a) => {
              setSegmentsActifs(a);
              if (a && f.segments.length === 0) set("segments", SEGMENTS_EXEMPLE);
            }}
          />
        </label>

        {segmentsActifs && (
          <div className="flex flex-col gap-2">
            {f.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={seg.libelle}
                  onChange={(e) => {
                    const s = [...f.segments];
                    s[i] = { ...s[i], libelle: e.target.value };
                    set("segments", s);
                  }}
                  placeholder="Étape"
                  className="h-10 flex-1 rounded-[var(--radius-md)] border border-perle px-2 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={seg.duree}
                  onChange={(e) => {
                    const s = [...f.segments];
                    s[i] = { ...s[i], duree: Number(e.target.value) };
                    set("segments", s);
                  }}
                  className="h-10 w-20 rounded-[var(--radius-md)] border border-perle px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const s = [...f.segments];
                    s[i] = { ...s[i], praticienne_occupee: !s[i].praticienne_occupee };
                    set("segments", s);
                  }}
                  className={cn(
                    "h-10 rounded-[var(--radius-md)] px-2 text-xs font-medium",
                    seg.praticienne_occupee
                      ? "bg-ink/10 text-ink"
                      : "bg-green-100 text-green-700",
                  )}
                >
                  {seg.praticienne_occupee ? "Occupée" : "Libre"}
                </button>
                <button
                  type="button"
                  onClick={() => set("segments", f.segments.filter((_, j) => j !== i))}
                  className="text-ink/40 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set("segments", [
                  ...f.segments,
                  { libelle: "", duree: 15, praticienne_occupee: true },
                ])
              }
              className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
            >
              <Plus size={15} /> Ajouter une étape
            </button>
          </div>
        )}
      </Card>

      {/* Options */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold text-ink">Options et suppléments</h2>
        {f.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={opt.nom}
              onChange={(e) => {
                const o = [...f.options];
                o[i] = { ...o[i], nom: e.target.value };
                set("options", o);
              }}
              placeholder="Nom"
              className="h-10 flex-1 rounded-[var(--radius-md)] border border-perle px-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={opt.prix}
              onChange={(e) => {
                const o = [...f.options];
                o[i] = { ...o[i], prix: Number(e.target.value) };
                set("options", o);
              }}
              placeholder="€"
              className="h-10 w-16 rounded-[var(--radius-md)] border border-perle px-2 text-sm"
            />
            <input
              type="number"
              min={0}
              value={opt.duree_sup}
              onChange={(e) => {
                const o = [...f.options];
                o[i] = { ...o[i], duree_sup: Number(e.target.value) };
                set("options", o);
              }}
              placeholder="min"
              className="h-10 w-16 rounded-[var(--radius-md)] border border-perle px-2 text-sm"
            />
            <button
              type="button"
              onClick={() => set("options", f.options.filter((_, j) => j !== i))}
              className="text-ink/40 hover:text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("options", [...f.options, { nom: "", prix: 0, duree_sup: 0 }])}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary hover:underline"
        >
          <Plus size={15} /> Ajouter une option
        </button>
      </Card>

      {/* Paramètres */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold text-ink">Paramètres</h2>
        <LigneInterrupteur
          label="Réservable en ligne"
          actif={f.reservable_en_ligne}
          onChange={(a) => set("reservable_en_ligne", a)}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-ink">Lieu</span>
          <select
            value={f.lieu}
            onChange={(e) => set("lieu", e.target.value as PrestationInitiale["lieu"])}
            className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm"
          >
            <option value="salon">En salon</option>
            <option value="domicile">À domicile</option>
            <option value="les_deux">Les deux</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Acompte</span>
            <select
              value={f.acompte_type}
              onChange={(e) =>
                set("acompte_type", e.target.value as PrestationInitiale["acompte_type"])
              }
              className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm"
            >
              <option value="aucun">Aucun</option>
              <option value="fixe">Montant fixe</option>
              <option value="pourcentage">Pourcentage</option>
            </select>
          </label>
          {f.acompte_type !== "aucun" && (
            <ChampNombre
              label={f.acompte_type === "fixe" ? "Montant (€)" : "Pourcentage (%)"}
              value={f.acompte_valeur}
              onChange={(v) => set("acompte_valeur", v)}
            />
          )}
        </div>
        <LigneInterrupteur
          label="Prestation PMU (traçabilité obligatoire)"
          actif={f.pmu}
          onChange={(a) => set("pmu", a)}
        />
        <LigneInterrupteur
          label="Patch test requis avant la 1re pose"
          actif={f.patch_test_requis}
          onChange={(a) => set("patch_test_requis", a)}
        />
        <ChampNombre
          label="Cycle de rappel (jours, retouche/remplissage — 0 = aucun)"
          value={f.cycle_rappel_jours ?? 0}
          onChange={(v) => set("cycle_rappel_jours", v > 0 ? v : null)}
        />
      </Card>

      {/* Ressources — uniquement si l'établissement en a déclaré (R2.3) */}
      {ressources.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-heading font-semibold text-ink">Ressources requises</h2>
          {ressources.map((r) => (
            <label key={r.id} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={f.ressource_ids.includes(r.id)}
                onChange={(e) =>
                  set(
                    "ressource_ids",
                    e.target.checked
                      ? [...f.ressource_ids, r.id]
                      : f.ressource_ids.filter((id) => id !== r.id),
                  )
                }
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              {r.nom} <span className="text-ink/40">({r.type})</span>
            </label>
          ))}
        </Card>
      )}

      {erreur && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <Info size={15} /> {erreur}
        </p>
      )}
      <div className="sticky bottom-16 flex gap-2 sm:bottom-0">
        <Link href="/catalogue" className="flex-1">
          <Button variante="secondaire" pleineLargeur type="button">
            Annuler
          </Button>
        </Link>
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

// --- Petits composants de formulaire ---

function ChampNombre({
  label,
  value,
  onChange,
  disabled,
  aide,
  pas = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  aide?: string;
  pas?: number;
}) {
  return (
    <Input
      label={label}
      type="number"
      min={0}
      step={pas}
      value={String(value)}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      aide={aide}
    />
  );
}

function ChampTexte({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="rounded-[var(--radius-md)] border border-perle bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
    </label>
  );
}

function Interrupteur({
  actif,
  onChange,
}: {
  actif: boolean;
  onChange: (a: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      onClick={() => onChange(!actif)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        actif ? "bg-primary" : "bg-perle",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
          actif ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function LigneInterrupteur({
  label,
  actif,
  onChange,
}: {
  label: string;
  actif: boolean;
  onChange: (a: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <Interrupteur actif={actif} onChange={onChange} />
    </label>
  );
}
