"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Check } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  majReglages,
  majHoraires,
  majMetiers,
  majAttestation,
} from "@/app/(app)/reglages/actions";

const JOURS = [
  { jour: 1, label: "Lundi" },
  { jour: 2, label: "Mardi" },
  { jour: 3, label: "Mercredi" },
  { jour: 4, label: "Jeudi" },
  { jour: 5, label: "Vendredi" },
  { jour: 6, label: "Samedi" },
  { jour: 0, label: "Dimanche" },
];

interface ReglagesData {
  battement_defaut: number;
  granularite_creneaux: number;
  delai_min_reservation: number;
  horizon_max_jours: number;
  validation_auto: boolean;
  delai_annulation_h: number;
  strategie_planning: "optimiser" | "libre" | "concentrer";
  seuil_acompte_obligatoire: number;
  rappels: { heures: number; canal: string }[];
  zones_deplacement: { nom: string; codes_postaux: string[]; frais: number; minutes: number }[];
}

export function ReglagesClient({
  reglages,
  horaires,
  metiers,
  principal,
  complementaires,
  abonnement,
  attestation,
  maintenantMs,
}: {
  reglages: ReglagesData;
  horaires: { jour: number; debut: string; fin: string }[];
  metiers: { code: string; libelle: string }[];
  principal: string | null;
  complementaires: string[];
  abonnement: { statut: string; essaiFinLe: string | null; formule: string; credits: number; quota: number };
  attestation: { date_obtention?: string } | null;
  maintenantMs: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-heading text-2xl font-bold text-ink">Réglages</h1>
      <SectionHoraires initial={horaires} />
      <SectionAgenda initial={reglages} />
      <SectionRappels initial={reglages.rappels} />
      <SectionZones initial={reglages.zones_deplacement} />
      <SectionMetier metiers={metiers} principal={principal} complementaires={complementaires} />
      <SectionAttestation initial={attestation} maintenantMs={maintenantMs} />
      <SectionAbonnement abonnement={abonnement} maintenantMs={maintenantMs} />
    </div>
  );
}

function Section({ titre, sousTitre, children }: { titre: string; sousTitre?: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <h2 className="font-heading font-semibold text-ink">{titre}</h2>
        {sousTitre && <p className="text-sm text-ink/60">{sousTitre}</p>}
      </div>
      {children}
    </Card>
  );
}

function BoutonSauver({ onClick, sauve }: { onClick: () => void; sauve: boolean }) {
  return (
    <Button taille="sm" onClick={onClick} className="self-start">
      {sauve ? (
        <>
          <Check size={15} /> Enregistré
        </>
      ) : (
        "Enregistrer"
      )}
    </Button>
  );
}

function useSauver(fn: () => Promise<{ ok: boolean }>) {
  const router = useRouter();
  const [sauve, setSauve] = useState(false);
  async function sauver() {
    const res = await fn();
    if (res.ok) {
      setSauve(true);
      setTimeout(() => setSauve(false), 1500);
      router.refresh();
    }
  }
  return { sauver, sauve };
}

function SectionHoraires({ initial }: { initial: { jour: number; debut: string; fin: string }[] }) {
  const [lignes, setLignes] = useState(
    JOURS.map((j) => {
      const h = initial.find((x) => x.jour === j.jour);
      return { jour: j.jour, actif: !!h, debut: h?.debut ?? "09:00", fin: h?.fin ?? "19:00" };
    }),
  );
  const { sauver, sauve } = useSauver(() =>
    majHoraires(lignes.filter((l) => l.actif).map((l) => ({ jour: l.jour, debut: l.debut, fin: l.fin }))),
  );

  return (
    <Section titre="Horaires d'ouverture">
      <div className="flex flex-col gap-2">
        {lignes.map((l, i) => (
          <div key={l.jour} className="flex items-center gap-3">
            <label className="flex w-28 items-center gap-2">
              <input
                type="checkbox"
                checked={l.actif}
                onChange={(e) => setLignes((p) => p.map((x, j) => (j === i ? { ...x, actif: e.target.checked } : x)))}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              <span className="text-sm text-ink">{JOURS[i].label}</span>
            </label>
            {l.actif ? (
              <div className="flex flex-1 items-center gap-2">
                <input type="time" value={l.debut} onChange={(e) => setLignes((p) => p.map((x, j) => (j === i ? { ...x, debut: e.target.value } : x)))} className="rounded-[var(--radius-sm)] border border-perle px-2 py-1 text-sm" />
                <span className="text-ink/40">–</span>
                <input type="time" value={l.fin} onChange={(e) => setLignes((p) => p.map((x, j) => (j === i ? { ...x, fin: e.target.value } : x)))} className="rounded-[var(--radius-sm)] border border-perle px-2 py-1 text-sm" />
              </div>
            ) : (
              <span className="text-sm text-ink/40">Fermé</span>
            )}
          </div>
        ))}
      </div>
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionAgenda({ initial }: { initial: ReglagesData }) {
  const [f, setF] = useState(initial);
  const { sauver, sauve } = useSauver(() =>
    majReglages({
      battement_defaut: f.battement_defaut,
      granularite_creneaux: f.granularite_creneaux,
      delai_min_reservation: f.delai_min_reservation,
      horizon_max_jours: f.horizon_max_jours,
      validation_auto: f.validation_auto,
      delai_annulation_h: f.delai_annulation_h,
      strategie_planning: f.strategie_planning,
      seuil_acompte_obligatoire: f.seuil_acompte_obligatoire,
    }),
  );
  const n = (k: keyof ReglagesData) => ({
    value: String(f[k] as number),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) }),
  });

  return (
    <Section titre="Réservation et agenda" sousTitre="Ces valeurs pilotent le moteur de créneaux.">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Battement (min)" type="number" {...n("battement_defaut")} />
        <Input label="Granularité (min)" type="number" {...n("granularite_creneaux")} />
        <Input label="Délai min. résa (min)" type="number" {...n("delai_min_reservation")} />
        <Input label="Horizon max. (jours)" type="number" {...n("horizon_max_jours")} />
        <Input label="Délai d'annulation (h)" type="number" {...n("delai_annulation_h")} />
        <Input label="Seuil acompte obligatoire" type="number" {...n("seuil_acompte_obligatoire")} />
      </div>
      <label className="flex items-center justify-between">
        <span className="text-sm text-ink">Validation automatique des réservations</span>
        <input type="checkbox" checked={f.validation_auto} onChange={(e) => setF({ ...f, validation_auto: e.target.checked })} className="h-5 w-5 accent-[var(--color-primary)]" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Stratégie de planning</span>
        <select value={f.strategie_planning} onChange={(e) => setF({ ...f, strategie_planning: e.target.value as ReglagesData["strategie_planning"] })} className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm">
          <option value="optimiser">Optimiser (regrouper les RDV)</option>
          <option value="libre">Laisser le choix à la cliente</option>
          <option value="concentrer">Concentrer certaines journées</option>
        </select>
      </label>
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionRappels({ initial }: { initial: { heures: number; canal: string }[] }) {
  const [rappels, setRappels] = useState(initial);
  const { sauver, sauve } = useSauver(() => majReglages({ rappels }));
  return (
    <Section titre="Rappels" sousTitre="Aucun envoi automatique entre 21 h et 8 h.">
      {rappels.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="number" value={r.heures} onChange={(e) => setRappels((p) => p.map((x, j) => (j === i ? { ...x, heures: Number(e.target.value) } : x)))} className="h-10 w-20 rounded-[var(--radius-md)] border border-perle px-2 text-sm" />
          <span className="text-sm text-ink/60">h avant, par</span>
          <select value={r.canal} onChange={(e) => setRappels((p) => p.map((x, j) => (j === i ? { ...x, canal: e.target.value } : x)))} className="h-10 rounded-[var(--radius-md)] border border-perle bg-white px-2 text-sm">
            <option value="sms">SMS</option>
            <option value="email">E-mail</option>
          </select>
          <button onClick={() => setRappels((p) => p.filter((_, j) => j !== i))} className="text-ink/40 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={() => setRappels((p) => [...p, { heures: 24, canal: "sms" }])} className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary">
        <Plus size={15} /> Ajouter un rappel
      </button>
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionZones({ initial }: { initial: ReglagesData["zones_deplacement"] }) {
  const [zones, setZones] = useState(initial);
  const { sauver, sauve } = useSauver(() => majReglages({ zones_deplacement: zones }));
  return (
    <Section titre="Zones de déplacement" sousTitre="Frais ajoutés automatiquement selon le code postal.">
      {zones.map((z, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-surface-muted p-2">
          <div className="flex items-center gap-2">
            <input value={z.nom} placeholder="Nom de la zone" onChange={(e) => setZones((p) => p.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))} className="h-9 flex-1 rounded-[var(--radius-sm)] border border-perle px-2 text-sm" />
            <button onClick={() => setZones((p) => p.filter((_, j) => j !== i))} className="text-ink/40 hover:text-red-600">
              <Trash2 size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input value={z.codes_postaux.join(", ")} placeholder="Codes postaux" onChange={(e) => setZones((p) => p.map((x, j) => (j === i ? { ...x, codes_postaux: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) } : x)))} className="h-9 flex-1 rounded-[var(--radius-sm)] border border-perle px-2 text-sm" />
            <input type="number" value={z.frais} placeholder="Frais €" onChange={(e) => setZones((p) => p.map((x, j) => (j === i ? { ...x, frais: Number(e.target.value) } : x)))} className="h-9 w-20 rounded-[var(--radius-sm)] border border-perle px-2 text-sm" />
          </div>
        </div>
      ))}
      <button onClick={() => setZones((p) => [...p, { nom: "", codes_postaux: [], frais: 0, minutes: 15 }])} className="inline-flex items-center gap-1 self-start text-sm font-medium text-primary">
        <Plus size={15} /> Ajouter une zone
      </button>
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionMetier({
  metiers,
  principal,
  complementaires,
}: {
  metiers: { code: string; libelle: string }[];
  principal: string | null;
  complementaires: string[];
}) {
  const [princ, setPrinc] = useState(principal ?? "");
  const [compl, setCompl] = useState<string[]>(complementaires);
  const { sauver, sauve } = useSauver(() => majMetiers(princ, compl.filter((c) => c !== princ)));
  return (
    <Section titre="Profil métier" sousTitre="Modifiable sans perte de données.">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Activité principale</span>
        <select value={princ} onChange={(e) => setPrinc(e.target.value)} className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm">
          {metiers.map((m) => (
            <option key={m.code} value={m.code}>
              {m.libelle}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm font-medium text-ink">Activités complémentaires</p>
      <div className="flex flex-wrap gap-2">
        {metiers
          .filter((m) => m.code !== princ && m.code !== "autre")
          .map((m) => {
            const actif = compl.includes(m.code);
            return (
              <button
                key={m.code}
                onClick={() => setCompl((p) => (actif ? p.filter((x) => x !== m.code) : [...p, m.code]))}
                className={cn("rounded-full px-3 py-1.5 text-sm font-medium", actif ? "bg-primary text-white" : "border border-perle text-ink/70")}
              >
                {m.libelle}
              </button>
            );
          })}
      </div>
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionAttestation({ initial, maintenantMs }: { initial: { date_obtention?: string } | null; maintenantMs: number }) {
  const [date, setDate] = useState(initial?.date_obtention ?? "");
  const { sauver, sauve } = useSauver(() => majAttestation(date));
  const echeance = date ? new Date(new Date(date).getTime()) : null;
  if (echeance) echeance.setFullYear(echeance.getFullYear() + 5);
  const expire = echeance && echeance.getTime() < maintenantMs;

  return (
    <Section titre="Attestation hygiène & salubrité" sousTitre="Validité 5 ans (obligation PMU).">
      <Input label="Date d'obtention" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      {echeance && (
        <p className={cn("text-sm", expire ? "text-red-600" : "text-ink/60")}>
          Valable jusqu&apos;au {echeance.toLocaleDateString("fr-FR")}
          {expire ? " — expirée, à renouveler" : ""}
        </p>
      )}
      <BoutonSauver onClick={sauver} sauve={sauve} />
    </Section>
  );
}

function SectionAbonnement({
  abonnement,
  maintenantMs,
}: {
  abonnement: { statut: string; essaiFinLe: string | null; formule: string; credits: number; quota: number };
  maintenantMs: number;
}) {
  const joursEssai = abonnement.essaiFinLe
    ? Math.max(0, Math.ceil((new Date(abonnement.essaiFinLe).getTime() - maintenantMs) / 86400000))
    : null;
  return (
    <Section titre="Abonnement">
      {abonnement.statut === "essai" && joursEssai !== null && (
        <p className="rounded-[var(--radius-md)] bg-primary-50 p-3 text-sm text-primary-700">
          Essai gratuit — {joursEssai} jour{joursEssai > 1 ? "s" : ""} restant{joursEssai > 1 ? "s" : ""}.
        </p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/60">Formule</span>
        <span className="font-medium capitalize text-ink">{abonnement.formule}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink/60">Crédits SMS restants</span>
        <span className="font-medium text-ink">
          {abonnement.credits} / {abonnement.quota}
        </span>
      </div>
      <div className="flex gap-2">
        <Button taille="sm" disabled>Gérer l&apos;abonnement</Button>
        <Button taille="sm" variante="secondaire" disabled>Acheter des crédits</Button>
      </div>
      <p className="text-xs text-ink/40">Paiement Stripe à activer (clés à renseigner).</p>
    </Section>
  );
}
