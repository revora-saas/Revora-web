"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Plus, Ban, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { deplacerRdv } from "@/app/(app)/agenda/actions";
import { SheetCreationRdv } from "./SheetCreationRdv";
import { SheetRdv } from "./SheetRdv";
import { SheetBlocage } from "./SheetBlocage";
import { STATUTS_RDV, type RdvVue, type BlocVue, type IntervalleVue } from "./types";

const PX = 1; // pixels par minute
const GRAN = 15; // granularité de dépôt (minutes)

export function AgendaClient({
  dateStr,
  vue,
  motPrestation,
  ferie,
  ouvertures,
  rdvs,
  blocs,
  fuseau,
}: {
  dateStr: string;
  vue: "jour" | "semaine";
  motPrestation: string;
  ferie: boolean;
  ouvertures: IntervalleVue[];
  rdvs: RdvVue[];
  blocs: BlocVue[];
  fuseau: string;
}) {
  const router = useRouter();
  const [creation, setCreation] = useState<{ ouvert: boolean; iso: string | null }>({
    ouvert: false,
    iso: null,
  });
  const [nonce, setNonce] = useState(0);
  const [rdvSel, setRdvSel] = useState<RdvVue | null>(null);
  const [blocage, setBlocage] = useState(false);
  const [deplacement, setDeplacement] = useState<string | null>(null);

  // Chaque ouverture remonte la feuille de création (réinitialisation propre).
  function ouvrirCreation(iso: string) {
    setNonce((n) => n + 1);
    setCreation({ ouvert: true, iso });
  }

  function naviguer(delta: number) {
    const pas = vue === "semaine" ? 7 : 1;
    router.push(`/agenda?date=${decaler(dateStr, delta * pas)}&vue=${vue}`);
  }
  function allerAujourdhui() {
    const auj = toZonedTime(new Date(), fuseau).toISOString().slice(0, 10);
    router.push(`/agenda?date=${auj}&vue=${vue}`);
  }
  function changerVue(v: "jour" | "semaine") {
    router.push(`/agenda?date=${dateStr}&vue=${v}`);
  }
  function rafraichir() {
    router.refresh();
  }

  async function surCreneauVide(iso: string) {
    if (deplacement) {
      const res = await deplacerRdv(deplacement, iso);
      setDeplacement(null);
      if (!res.ok) alert(res.erreur);
      rafraichir();
    } else {
      ouvrirCreation(iso);
    }
  }

  const titre = formaterTitre(dateStr, vue, fuseau);

  return (
    <div className="flex flex-col">
      {/* Barre de navigation */}
      <div className="sticky top-[57px] z-10 flex flex-col gap-2 border-b border-perle bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => naviguer(-1)} className="rounded-full p-1.5 hover:bg-surface-muted" aria-label="Précédent">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => naviguer(1)} className="rounded-full p-1.5 hover:bg-surface-muted" aria-label="Suivant">
              <ChevronRight size={20} />
            </button>
            <span className="ml-1 font-heading text-base font-semibold capitalize text-ink">
              {titre}
            </span>
          </div>
          <div className="flex overflow-hidden rounded-[var(--radius-md)] border border-perle text-sm">
            {(["jour", "semaine"] as const).map((v) => (
              <button
                key={v}
                onClick={() => changerVue(v)}
                className={cn("px-3 py-1 capitalize", vue === v ? "bg-primary text-white" : "bg-white text-ink/70")}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={allerAujourdhui} className="text-sm font-medium text-primary hover:underline">
            Aujourd&apos;hui
          </button>
          {vue === "jour" && (
            <button
              onClick={() => setBlocage(true)}
              className="inline-flex items-center gap-1 text-sm font-medium text-ink/60 hover:text-ink"
            >
              <Ban size={15} /> Bloquer
            </button>
          )}
        </div>
      </div>

      {/* Bandeau mode déplacement */}
      {deplacement && (
        <div className="flex items-center justify-between gap-2 bg-primary px-4 py-2 text-sm text-white">
          <span>Touchez un créneau libre pour déplacer le rendez-vous.</span>
          <button onClick={() => setDeplacement(null)} aria-label="Annuler">
            <X size={18} />
          </button>
        </div>
      )}

      {ferie && vue === "jour" && (
        <div className="bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
          Jour férié — fermé par défaut.
        </div>
      )}

      {vue === "jour" ? (
        <VueJour
          dateStr={dateStr}
          ouvertures={ouvertures}
          rdvs={rdvs}
          blocs={blocs}
          fuseau={fuseau}
          onCreneauVide={surCreneauVide}
          onRdv={setRdvSel}
          onRemplirPose={ouvrirCreation}
        />
      ) : (
        <VueSemaine dateStr={dateStr} rdvs={rdvs} fuseau={fuseau} onRdv={setRdvSel} />
      )}

      {/* Bouton flottant de création */}
      {vue === "jour" && !deplacement && (
        <button
          onClick={() =>
            ouvrirCreation(fromZonedTime(`${dateStr}T10:00:00`, fuseau).toISOString())
          }
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-douce sm:bottom-8"
          aria-label={`Nouveau ${motPrestation}`}
        >
          <Plus size={24} />
        </button>
      )}

      <SheetCreationRdv
        key={nonce}
        ouvert={creation.ouvert}
        debutExecutionIso={creation.iso}
        fuseau={fuseau}
        onFermer={() => setCreation({ ouvert: false, iso: null })}
        onCree={() => {
          setCreation({ ouvert: false, iso: null });
          rafraichir();
        }}
      />
      <SheetRdv
        rdv={rdvSel}
        fuseau={fuseau}
        onFermer={() => setRdvSel(null)}
        onDeplacer={(id) => setDeplacement(id)}
        onChange={rafraichir}
      />
      <SheetBlocage
        ouvert={blocage}
        dateStr={dateStr}
        fuseau={fuseau}
        onFermer={() => setBlocage(false)}
        onCree={() => {
          setBlocage(false);
          rafraichir();
        }}
      />
    </div>
  );
}

// =====================================================================
// Vue jour : grille horaire
// =====================================================================
function VueJour({
  dateStr,
  ouvertures,
  rdvs,
  blocs,
  fuseau,
  onCreneauVide,
  onRdv,
  onRemplirPose,
}: {
  dateStr: string;
  ouvertures: IntervalleVue[];
  rdvs: RdvVue[];
  blocs: BlocVue[];
  fuseau: string;
  onCreneauVide: (iso: string) => void;
  onRdv: (r: RdvVue) => void;
  onRemplirPose: (iso: string) => void;
}) {
  const min = (iso: string) => minutesJour(iso, fuseau);

  // Bornes de la grille.
  const points: number[] = [];
  ouvertures.forEach((o) => points.push(min(o.debut), min(o.fin)));
  rdvs.forEach((r) => points.push(min(r.debutBloque), min(r.finBloque)));
  blocs.forEach((b) => points.push(min(b.debut), min(b.fin)));
  let gridStart = points.length ? Math.min(...points) : 8 * 60;
  let gridEnd = points.length ? Math.max(...points) : 20 * 60;
  gridStart = Math.max(0, Math.floor(gridStart / 60) * 60 - 0);
  gridEnd = Math.min(1440, Math.ceil(gridEnd / 60) * 60);
  if (gridEnd - gridStart < 240) gridEnd = gridStart + 240;
  const hauteur = (gridEnd - gridStart) * PX;

  const heures: number[] = [];
  for (let h = gridStart; h <= gridEnd; h += 60) heures.push(h);

  function clicFond(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let m = gridStart + Math.round(y / PX / GRAN) * GRAN;
    m = Math.max(gridStart, Math.min(gridEnd - GRAN, m));
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    onCreneauVide(fromZonedTime(`${dateStr}T${hh}:${mm}:00`, fuseau).toISOString());
  }

  return (
    <div className="relative flex px-4 py-2">
      {/* Colonne des heures */}
      <div className="w-12 shrink-0" style={{ height: hauteur }}>
        {heures.map((h) => (
          <div
            key={h}
            className="absolute -translate-y-1/2 text-xs text-ink/40"
            style={{ top: (h - gridStart) * PX }}
          >
            {String(Math.floor(h / 60)).padStart(2, "0")}h
          </div>
        ))}
      </div>

      {/* Colonne des créneaux */}
      <div className="relative flex-1" style={{ height: hauteur }}>
        {/* Fond cliquable */}
        <div className="absolute inset-0 cursor-pointer" onClick={clicFond} />

        {/* Bandes d'ouverture */}
        {ouvertures.map((o, i) => (
          <div
            key={`ouv${i}`}
            className="pointer-events-none absolute inset-x-0 bg-white"
            style={{ top: (min(o.debut) - gridStart) * PX, height: (min(o.fin) - min(o.debut)) * PX }}
          />
        ))}

        {/* Lignes horaires */}
        {heures.map((h) => (
          <div
            key={`l${h}`}
            className="pointer-events-none absolute inset-x-0 border-t border-perle"
            style={{ top: (h - gridStart) * PX }}
          />
        ))}

        {/* Blocages */}
        {blocs.map((b) => (
          <div
            key={b.id}
            className="pointer-events-none absolute inset-x-0 rounded-[var(--radius-sm)] border border-ink/10 bg-ink/5 px-2 py-1 text-xs text-ink/50"
            style={{ top: (min(b.debut) - gridStart) * PX, height: (min(b.fin) - min(b.debut)) * PX }}
          >
            {b.motif ?? "Bloqué"}
          </div>
        ))}

        {/* Rendez-vous */}
        {rdvs.map((r) => (
          <BlocRdv
            key={r.id}
            rdv={r}
            gridStart={gridStart}
            fuseau={fuseau}
            onClick={() => onRdv(r)}
            onRemplirPose={onRemplirPose}
          />
        ))}
      </div>
    </div>
  );
}

function BlocRdv({
  rdv,
  gridStart,
  fuseau,
  onClick,
  onRemplirPose,
}: {
  rdv: RdvVue;
  gridStart: number;
  fuseau: string;
  onClick: () => void;
  onRemplirPose: (iso: string) => void;
}) {
  const min = (iso: string) => minutesJour(iso, fuseau);
  const top = (min(rdv.debutBloque) - gridStart) * PX;
  const hauteur = (min(rdv.finBloque) - min(rdv.debutBloque)) * PX;
  const execTop = (min(rdv.debutExecution) - min(rdv.debutBloque)) * PX;
  const execH = (min(rdv.finExecution) - min(rdv.debutExecution)) * PX;
  const statut = STATUTS_RDV[rdv.statut] ?? STATUTS_RDV.confirme;

  return (
    <div className="absolute inset-x-0" style={{ top, height: hauteur }}>
      {/* Fenêtre bloquée (préparation + nettoyage) : hachurée */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[var(--radius-md)] border",
          statut.classe,
          rdv.horsPlage && "ring-2 ring-red-400",
        )}
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 6px, transparent 6px 12px)",
        }}
        onClick={onClick}
      >
        {/* Exécution : plein */}
        <div
          className="absolute inset-x-0 bg-white/70"
          style={{ top: execTop, height: execH }}
        >
          <div className="px-2 py-0.5 text-xs font-semibold leading-tight text-ink">
            {rdv.clientNom}
          </div>
          <div className="truncate px-2 text-[11px] text-ink/60">
            {rdv.prestations.join(", ")}
          </div>
        </div>
      </div>

      {/* Temps de pose exploitables */}
      {rdv.poses.map((p, i) => {
        const pt = (min(p.debut) - min(rdv.debutBloque)) * PX;
        const ph = (min(p.fin) - min(p.debut)) * PX;
        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              onRemplirPose(p.debut);
            }}
            className="absolute inset-x-0 flex items-center justify-center rounded-[var(--radius-sm)] border border-dashed border-green-400 bg-green-50 text-[11px] font-medium text-green-700"
            style={{ top: pt, height: ph }}
          >
            Libre — remplir
          </button>
        );
      })}
    </div>
  );
}

// =====================================================================
// Vue semaine
// =====================================================================
function VueSemaine({
  dateStr,
  rdvs,
  fuseau,
  onRdv,
}: {
  dateStr: string;
  rdvs: RdvVue[];
  fuseau: string;
  onRdv: (r: RdvVue) => void;
}) {
  const router = useRouter();
  const [a, m, j] = dateStr.split("-").map(Number);
  const jourSem = new Date(Date.UTC(a, m - 1, j)).getUTCDay();
  const lundi = decaler(dateStr, -((jourSem + 6) % 7));
  const jours = Array.from({ length: 7 }, (_, i) => decaler(lundi, i));

  const parJour = new Map<string, RdvVue[]>();
  for (const r of rdvs) {
    const d = toZonedTime(new Date(r.debutExecution), fuseau).toISOString().slice(0, 10);
    const l = parJour.get(d) ?? [];
    l.push(r);
    parJour.set(d, l);
  }

  const noms = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="grid grid-cols-7 gap-1 px-2 py-3">
      {jours.map((jour, i) => {
        const liste = (parJour.get(jour) ?? []).sort(
          (x, y) => new Date(x.debutExecution).getTime() - new Date(y.debutExecution).getTime(),
        );
        return (
          <div key={jour} className="flex flex-col gap-1">
            <button
              onClick={() => router.push(`/agenda?date=${jour}&vue=jour`)}
              className="rounded-[var(--radius-sm)] py-1 text-center text-xs font-medium text-ink/60 hover:bg-surface-muted"
            >
              {noms[i]} {Number(jour.slice(8))}
            </button>
            {liste.map((r) => (
              <button
                key={r.id}
                onClick={() => onRdv(r)}
                className="truncate rounded-[var(--radius-sm)] bg-primary-50 px-1 py-0.5 text-[10px] text-primary-700"
              >
                {toZonedTime(new Date(r.debutExecution), fuseau).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {r.clientNom.split(" ")[0]}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// --- Utilitaires ---
function minutesJour(iso: string, fuseau: string): number {
  const d = toZonedTime(new Date(iso), fuseau);
  return d.getHours() * 60 + d.getMinutes();
}
function decaler(dateStr: string, delta: number): string {
  const [a, m, j] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j + delta)).toISOString().slice(0, 10);
}
function formaterTitre(dateStr: string, vue: "jour" | "semaine", fuseau: string): string {
  const d = fromZonedTime(`${dateStr}T12:00:00`, fuseau);
  if (vue === "semaine") {
    const [a, m, j] = dateStr.split("-").map(Number);
    const jourSem = new Date(Date.UTC(a, m - 1, j)).getUTCDay();
    const lundi = decaler(dateStr, -((jourSem + 6) % 7));
    const dLundi = fromZonedTime(`${lundi}T12:00:00`, fuseau);
    return `Sem. du ${dLundi.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  }
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}
