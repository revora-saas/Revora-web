"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  CalendarPlus,
  Euro,
  AlertTriangle,
  Pencil,
  ShieldAlert,
} from "lucide-react";
import { Badge, Button, Input, Sheet, Modal } from "@/components/ui";
import { STATUTS, formaterTelephone, calculerCompletude } from "@/lib/clientes-ui";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/database.types";
import { majCliente, anonymiserClienteAction } from "@/app/(app)/clientes/actions";

type Cliente = Tables<"clients">;

interface RdvHisto {
  id: string;
  debut_execution: string;
  statut: string;
  montant_total: number;
  prestations: string[];
}
interface Fiche {
  id: string;
  cree_le: string;
  donnees: unknown;
  zone: string | null;
  materiel: string | null;
  numero_seance: number | null;
  cloturee_le: string | null;
}
interface Photo {
  id: string;
  url: string;
  type: string;
  prise_le: string;
}

const STATUTS_RDV: Record<string, string> = {
  demande: "Demande",
  confirme: "Confirmé",
  a_qualifier: "À qualifier",
  honore: "Honoré",
  annule: "Annulé",
  absent: "Absent",
};

const ONGLETS = [
  { cle: "profil", label: "Profil" },
  { cle: "historique", label: "Historique" },
  { cle: "technique", label: "Fiche technique" },
  { cle: "photos", label: "Photos" },
  { cle: "notes", label: "Notes" },
] as const;

type CleOnglet = (typeof ONGLETS)[number]["cle"];

export function FicheCliente({
  cliente,
  historique,
  fiches,
  photos,
}: {
  cliente: Cliente;
  historique: RdvHisto[];
  fiches: Fiche[];
  photos: Photo[];
}) {
  const router = useRouter();
  const [onglet, setOnglet] = useState<CleOnglet>("profil");
  const [edition, setEdition] = useState(false);

  const st = STATUTS[cliente.statut] ?? STATUTS.nouvelle;
  const completude = calculerCompletude(cliente as Record<string, unknown>);
  const nomComplet = cliente.prenom ? `${cliente.prenom} ${cliente.nom}` : cliente.nom;
  const tel = cliente.telephone_mobile;

  // Bandeau d'alerte permanent (C11.3) : santé ou fiabilité faible.
  const alertes: string[] = [];
  if (cliente.allergies) alertes.push(`Allergies : ${cliente.allergies}`);
  if (cliente.contre_indications)
    alertes.push(`Contre-indications : ${cliente.contre_indications}`);
  if (cliente.score_fiabilite < 50)
    alertes.push(`Fiabilité faible (${cliente.score_fiabilite}/100)`);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={16} /> Retour
      </Link>

      {/* Bandeau d'alerte — jamais masqué dans un onglet */}
      {alertes.length > 0 && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div>
            {alertes.map((a) => (
              <p key={a}>{a}</p>
            ))}
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-50 text-lg font-semibold text-primary-700">
          {`${cliente.prenom?.[0] ?? ""}${cliente.nom[0] ?? ""}`.toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-xl font-bold text-ink">{nomComplet}</h1>
            <Badge ton={st.ton}>{st.label}</Badge>
          </div>
          <p className="text-sm text-ink/50">{formaterTelephone(tel) || "Pas de mobile"}</p>
          <p className="mt-1 text-xs text-ink/40">Fiche remplie à {completude} %</p>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-4 gap-2">
        <ActionRapide
          icone={Phone}
          label="Appeler"
          href={tel ? `tel:${tel}` : undefined}
        />
        <ActionRapide
          icone={MessageSquare}
          label="Message"
          href={tel ? `sms:${tel}` : undefined}
        />
        <ActionRapide
          icone={CalendarPlus}
          label="RDV"
          href={`/agenda?client=${cliente.id}`}
        />
        <ActionRapide
          icone={Euro}
          label="Encaisser"
          href={`/caisse?client=${cliente.id}`}
        />
      </div>

      {/* Onglets */}
      <div className="flex gap-1 overflow-x-auto border-b border-perle">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            onClick={() => setOnglet(o.cle)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              onglet === o.cle
                ? "border-primary text-primary"
                : "border-transparent text-ink/50 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {onglet === "profil" && (
        <OngletProfil cliente={cliente} onModifier={() => setEdition(true)} />
      )}
      {onglet === "historique" && <OngletHistorique historique={historique} />}
      {onglet === "technique" && <OngletTechnique fiches={fiches} />}
      {onglet === "photos" && <OngletPhotos photos={photos} />}
      {onglet === "notes" && (
        <OngletNotes cliente={cliente} onModifier={() => setEdition(true)} />
      )}

      <SheetEdition
        cliente={cliente}
        ouvert={edition}
        onFermer={() => setEdition(false)}
        onEnregistre={() => {
          setEdition(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function ActionRapide({
  icone: Icone,
  label,
  href,
}: {
  icone: typeof Phone;
  label: string;
  href?: string;
}) {
  const contenu = (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-[var(--radius-md)] border border-perle bg-white py-2.5 text-xs font-medium",
        href ? "text-ink hover:bg-surface-muted" : "text-ink/30",
      )}
    >
      <Icone size={18} />
      {label}
    </div>
  );
  return href ? <Link href={href}>{contenu}</Link> : contenu;
}

function Ligne({ label, valeur }: { label: string; valeur: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-perle py-2 last:border-0">
      <span className="text-sm text-ink/50">{label}</span>
      <span className="text-right text-sm font-medium text-ink">{valeur || "—"}</span>
    </div>
  );
}

function OngletProfil({
  cliente,
  onModifier,
}: {
  cliente: Cliente;
  onModifier: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button variante="secondaire" taille="sm" onClick={onModifier}>
          <Pencil size={15} /> Modifier
        </Button>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-perle bg-white px-4">
        <Ligne label="Civilité" valeur={cliente.civilite} />
        <Ligne label="Nom" valeur={cliente.nom} />
        <Ligne label="Prénom" valeur={cliente.prenom} />
        <Ligne
          label="Mobile"
          valeur={formaterTelephone(cliente.telephone_mobile)}
        />
        <Ligne label="E-mail" valeur={cliente.email} />
        <Ligne label="Date de naissance" valeur={cliente.date_naissance} />
        <Ligne
          label="Adresse"
          valeur={[cliente.adresse, cliente.code_postal, cliente.ville]
            .filter(Boolean)
            .join(" ")}
        />
        <Ligne label="Source" valeur={cliente.source} />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-perle bg-white px-4">
        <Ligne label="Visites" valeur={cliente.nombre_visites} />
        <Ligne label="Total dépensé" valeur={`${cliente.total_depense} €`} />
        <Ligne label="Fiabilité" valeur={`${cliente.score_fiabilite}/100`} />
      </div>

      <ZoneRgpd cliente={cliente} />
    </div>
  );
}

function ZoneRgpd({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const [confirme, setConfirme] = useState(false);
  const [chargement, setChargement] = useState(false);

  if (cliente.anonymise_le) {
    return (
      <p className="text-center text-xs text-ink/40">
        Fiche anonymisée le{" "}
        {new Date(cliente.anonymise_le).toLocaleDateString("fr-FR")}.
      </p>
    );
  }

  async function anonymiser() {
    setChargement(true);
    const res = await anonymiserClienteAction(cliente.id);
    setChargement(false);
    if (res.ok) {
      setConfirme(false);
      router.push("/clientes");
      router.refresh();
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirme(true)}
        className="inline-flex items-center justify-center gap-1.5 self-start text-sm text-red-600 hover:underline"
      >
        <ShieldAlert size={15} /> Anonymiser (droit à l&apos;effacement)
      </button>
      <Modal
        ouvert={confirme}
        onFermer={() => setConfirme(false)}
        titre="Anonymiser cette fiche ?"
      >
        <p className="text-sm text-ink/70">
          L&apos;identité et les coordonnées seront effacées définitivement et
          les photos supprimées. L&apos;historique technique et comptable est
          conservé sous forme anonyme (obligation légale). Cette action est
          irréversible.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variante="secondaire" pleineLargeur onClick={() => setConfirme(false)}>
            Annuler
          </Button>
          <Button variante="danger" pleineLargeur onClick={anonymiser} disabled={chargement}>
            {chargement ? "Anonymisation…" : "Anonymiser"}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function OngletHistorique({ historique }: { historique: RdvHisto[] }) {
  if (historique.length === 0)
    return <VideOnglet texte="Aucun rendez-vous pour l'instant." />;
  return (
    <ul className="flex flex-col gap-2">
      {historique.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-[var(--radius-md)] border border-perle bg-white px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-ink">
              {new Date(r.debut_execution).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-ink/50">
              {r.prestations.join(", ") || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-ink">{r.montant_total} €</p>
            <p className="text-xs text-ink/50">{STATUTS_RDV[r.statut] ?? r.statut}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function OngletTechnique({ fiches }: { fiches: Fiche[] }) {
  if (fiches.length === 0)
    return <VideOnglet texte="Aucune fiche technique enregistrée." />;
  return (
    <ul className="flex flex-col gap-3">
      {fiches.map((f) => {
        const donnees = (f.donnees ?? {}) as Record<string, unknown>;
        return (
          <li
            key={f.id}
            className="rounded-[var(--radius-lg)] border border-perle bg-white p-4"
          >
            <p className="mb-2 text-xs text-ink/50">
              {new Date(f.cree_le).toLocaleDateString("fr-FR")}
              {f.numero_seance ? ` · Séance n°${f.numero_seance}` : ""}
            </p>
            {Object.entries(donnees).length === 0 ? (
              <p className="text-sm text-ink/40">Aucune donnée.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {Object.entries(donnees).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 text-sm">
                    <span className="text-ink/50">{k}</span>
                    <span className="text-right font-medium text-ink">
                      {Array.isArray(v) ? v.join(", ") : String(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function OngletPhotos({ photos }: { photos: Photo[] }) {
  if (photos.length === 0)
    return <VideOnglet texte="Aucune photo. La galerie avant/après arrive avec le PMU." />;
  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.id}
          src={p.url}
          alt={p.type}
          className="aspect-square w-full rounded-[var(--radius-md)] object-cover"
        />
      ))}
    </div>
  );
}

function OngletNotes({
  cliente,
  onModifier,
}: {
  cliente: Cliente;
  onModifier: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-lg)] border border-perle bg-white p-4">
        <p className="whitespace-pre-wrap text-sm text-ink">
          {cliente.notes_privees || (
            <span className="text-ink/40">Aucune note privée.</span>
          )}
        </p>
      </div>
      <Button variante="secondaire" taille="sm" onClick={onModifier}>
        <Pencil size={15} /> Modifier les notes
      </Button>
    </div>
  );
}

function VideOnglet({ texte }: { texte: string }) {
  return <p className="py-8 text-center text-sm text-ink/50">{texte}</p>;
}

// ---------------------------------------------------------------------
// Édition de la fiche (enrichissement progressif)
// ---------------------------------------------------------------------
function SheetEdition({
  cliente,
  ouvert,
  onFermer,
  onEnregistre,
}: {
  cliente: Cliente;
  ouvert: boolean;
  onFermer: () => void;
  onEnregistre: () => void;
}) {
  const [form, setForm] = useState({
    civilite: cliente.civilite ?? "",
    nom: cliente.nom,
    prenom: cliente.prenom ?? "",
    telephone_mobile: formaterTelephone(cliente.telephone_mobile),
    email: cliente.email ?? "",
    date_naissance: cliente.date_naissance ?? "",
    adresse: cliente.adresse ?? "",
    code_postal: cliente.code_postal ?? "",
    ville: cliente.ville ?? "",
    source: cliente.source ?? "",
    allergies: cliente.allergies ?? "",
    contre_indications: cliente.contre_indications ?? "",
    notes_privees: cliente.notes_privees ?? "",
  });
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function champ(cle: keyof typeof form) {
    return {
      value: form[cle],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({ ...f, [cle]: e.target.value })),
    };
  }

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await majCliente(cliente.id, form);
    setChargement(false);
    if (res.ok) onEnregistre();
    else setErreur(res.erreur ?? "Erreur.");
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre="Modifier la fiche">
      <form onSubmit={enregistrer} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" {...champ("prenom")} />
          <Input label="Nom" {...champ("nom")} required />
        </div>
        <Input label="Mobile" type="tel" {...champ("telephone_mobile")} />
        <Input label="E-mail" type="email" {...champ("email")} />
        <Input label="Date de naissance" type="date" {...champ("date_naissance")} />
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Input label="Adresse" {...champ("adresse")} />
          </div>
          <Input label="CP" {...champ("code_postal")} />
        </div>
        <Input label="Ville" {...champ("ville")} />
        <ChampTexte label="Allergies (mis en avant)" {...champ("allergies")} />
        <ChampTexte label="Contre-indications" {...champ("contre_indications")} />
        <ChampTexte label="Notes privées" {...champ("notes_privees")} />
        {erreur && <p className="text-sm text-red-600">{erreur}</p>}
        <Button type="submit" pleineLargeur disabled={chargement}>
          {chargement ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </Sheet>
  );
}

function ChampTexte({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={2}
        className="w-full rounded-[var(--radius-md)] border border-perle bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      />
    </label>
  );
}
