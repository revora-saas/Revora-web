"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, Lock, Camera, Check, ShieldCheck } from "lucide-react";
import { Button, Input, Card, Badge, Modal } from "@/components/ui";
import { creerClientNavigateur } from "@/lib/supabase/client";
import type { ChampFiche } from "@/lib/metier-types";
import { ChampsDeclaratifs } from "./ChampsDeclaratifs";
import { SignaturePad } from "./SignaturePad";
import {
  majSeance,
  cloturerSeance,
  enregistrerConsentement,
  demanderUploadPhoto,
  confirmerPhoto,
} from "@/app/(app)/clientes/seance-actions";

const BUCKET = "photos-clientes";

interface Lot {
  id: string;
  numero: string;
  peremption: string | null;
  reach: boolean | null;
  perime: boolean;
}
interface Pigment {
  id: string;
  nom: string;
  marque: string | null;
  lots: Lot[];
}
interface FicheData {
  id: string;
  donnees: Record<string, unknown>;
  lotId: string | null;
  materiel: string | null;
  zone: string | null;
  numeroSeance: number | null;
  clotureeLe: string | null;
}

export function EditeurSeance({
  clientId,
  clientNom,
  fiche,
  schema,
  estPmu,
  pigments,
  consentements,
  photos,
}: {
  clientId: string;
  clientNom: string;
  fiche: FicheData;
  schema: ChampFiche[];
  estPmu: boolean;
  pigments: Pigment[];
  consentements: { soin: boolean; image: boolean };
  photos: { id: string; type: string; url: string; utilisable: boolean }[];
}) {
  const router = useRouter();
  const cloturee = Boolean(fiche.clotureeLe);

  const [donnees, setDonnees] = useState(fiche.donnees);
  const [lotId, setLotId] = useState(fiche.lotId);
  const [materiel, setMateriel] = useState(fiche.materiel ?? "");
  const [zone, setZone] = useState(fiche.zone ?? "");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [consentType, setConsentType] = useState<"soin_pmu" | "image" | null>(null);

  const lotChoisi = pigments.flatMap((p) => p.lots).find((l) => l.id === lotId);

  async function sauver() {
    setErreur(null);
    setChargement(true);
    const res = await majSeance(fiche.id, { donnees, lotId, materiel, zone });
    setChargement(false);
    if (!res.ok) setErreur(res.erreur);
    else router.refresh();
  }

  async function cloturer() {
    setErreur(null);
    setChargement(true);
    // On enregistre d'abord, puis on clôture (validation côté serveur).
    await majSeance(fiche.id, { donnees, lotId, materiel, zone });
    const res = await cloturerSeance(fiche.id);
    setChargement(false);
    if (!res.ok) setErreur(res.erreur);
    else router.refresh();
  }

  async function ajouterPhoto(type: "avant" | "apres", fichier: File) {
    setErreur(null);
    const prep = await demanderUploadPhoto(clientId, fiche.id, type);
    if (!prep.ok) {
      setErreur(prep.erreur);
      return;
    }
    const supa = creerClientNavigateur();
    const { error } = await supa.storage.from(BUCKET).uploadToSignedUrl(prep.path, prep.token, fichier);
    if (error) {
      setErreur("Envoi de la photo échoué.");
      return;
    }
    await confirmerPhoto(clientId, fiche.id, type, prep.path);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={`/clientes/${clientId}`}
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={16} /> Fiche cliente
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-ink">
            Séance {fiche.numeroSeance ? `n°${fiche.numeroSeance}` : ""}
          </h1>
          <p className="text-sm text-ink/60">{clientNom}</p>
        </div>
        {cloturee && (
          <Badge ton="succes">
            <Lock size={12} className="mr-1" /> Clôturée
          </Badge>
        )}
      </div>

      {/* Fiche technique déclarative */}
      {schema.length > 0 && (
        <Card>
          <h2 className="mb-3 font-heading font-semibold text-ink">Fiche technique</h2>
          <ChampsDeclaratifs schema={schema} valeurs={donnees} onChange={(cle, v) => setDonnees((d) => ({ ...d, [cle]: v }))} desactive={cloturee} />
        </Card>
      )}

      {/* Traçabilité PMU */}
      {estPmu && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-heading font-semibold text-ink">Traçabilité</h2>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Pigment et lot</span>
            <select
              value={lotId ?? ""}
              onChange={(e) => setLotId(e.target.value || null)}
              disabled={cloturee}
              className="h-11 rounded-[var(--radius-md)] border border-perle bg-white px-3 text-sm disabled:bg-surface-muted"
            >
              <option value="">— Sélectionner —</option>
              {pigments.map((p) => (
                <optgroup key={p.id} label={`${p.nom}${p.marque ? ` (${p.marque})` : ""}`}>
                  {p.lots.map((l) => (
                    <option key={l.id} value={l.id} disabled={l.perime}>
                      Lot {l.numero}
                      {l.peremption ? ` · exp. ${l.peremption}` : ""}
                      {l.perime ? " · PÉRIMÉ" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {/* Alerte bloquante pigment (R11.3) */}
          {lotChoisi?.perime && (
            <p className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-red-50 p-2 text-sm text-red-700">
              <AlertTriangle size={15} /> Ce pigment est périmé : la séance ne pourra pas être clôturée.
            </p>
          )}
          {lotChoisi && lotChoisi.reach === false && (
            <p className="text-sm text-amber-700">⚠ Lot non conforme REACH.</p>
          )}

          <Input label="Matériel (aiguilles, usage unique…)" value={materiel} onChange={(e) => setMateriel(e.target.value)} disabled={cloturee} />
          <Input label="Zone traitée" value={zone} onChange={(e) => setZone(e.target.value)} disabled={cloturee} />
        </Card>
      )}

      {/* Consentements */}
      {estPmu && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-heading font-semibold text-ink">Consentements</h2>
          <LigneConsent
            label="Consentement éclairé aux soins"
            donne={consentements.soin}
            onRecueillir={() => setConsentType("soin_pmu")}
            desactive={cloturee}
          />
          <LigneConsent
            label="Consentement à l'usage des photos"
            donne={consentements.image}
            onRecueillir={() => setConsentType("image")}
            desactive={cloturee}
          />
          <p className="text-xs text-ink/50">
            Sans consentement à l&apos;image, les photos sont conservées mais non
            utilisables en communication.
          </p>
        </Card>
      )}

      {/* Photos avant / après */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-heading font-semibold text-ink">Photos avant / après</h2>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph) => (
              <div key={ph.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ph.url} alt={ph.type} className="aspect-square w-full rounded-[var(--radius-md)] object-cover" />
                <span className="absolute left-1 top-1 rounded bg-ink/70 px-1 text-[10px] text-white">
                  {ph.type}
                </span>
                {!ph.utilisable && (
                  <span className="absolute bottom-1 left-1 rounded bg-amber-500/90 px-1 text-[10px] text-white">
                    non diffusable
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {!cloturee && (
          <div className="flex gap-2">
            <BoutonPhoto label="Avant" onFichier={(f) => ajouterPhoto("avant", f)} />
            <BoutonPhoto label="Après" onFichier={(f) => ajouterPhoto("apres", f)} />
          </div>
        )}
      </Card>

      {erreur && (
        <p className="flex items-center gap-1.5 text-sm text-red-600">
          <AlertTriangle size={15} /> {erreur}
        </p>
      )}

      {!cloturee && (
        <div className="sticky bottom-16 flex gap-2 sm:bottom-0">
          <Button variante="secondaire" pleineLargeur onClick={sauver} disabled={chargement}>
            Enregistrer
          </Button>
          <Button pleineLargeur onClick={cloturer} disabled={chargement}>
            <Lock size={16} /> Clôturer
          </Button>
        </div>
      )}

      {/* Modale de recueil de consentement signé */}
      <Modal
        ouvert={consentType !== null}
        onFermer={() => setConsentType(null)}
        titre={consentType === "image" ? "Consentement à l'image" : "Consentement aux soins"}
      >
        <ConsentementForm
          clientId={clientId}
          type={consentType ?? "soin_pmu"}
          onFait={() => {
            setConsentType(null);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}

function LigneConsent({
  label,
  donne,
  onRecueillir,
  desactive,
}: {
  label: string;
  donne: boolean;
  onRecueillir: () => void;
  desactive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      {donne ? (
        <Badge ton="succes">
          <Check size={12} className="mr-1" /> Recueilli
        </Badge>
      ) : (
        <Button taille="sm" variante="secondaire" onClick={onRecueillir} disabled={desactive}>
          <ShieldCheck size={14} /> Recueillir
        </Button>
      )}
    </div>
  );
}

function ConsentementForm({
  clientId,
  type,
  onFait,
}: {
  clientId: string;
  type: "soin_pmu" | "image";
  onFait: () => void;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function accepter() {
    setChargement(true);
    await enregistrerConsentement(clientId, type, true, signature ?? undefined);
    setChargement(false);
    onFait();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink/70">
        {type === "image"
          ? "J'autorise l'utilisation des photos réalisées à des fins de communication."
          : "Je consens à la réalisation de la prestation après information sur son déroulé, ses suites et ses contre-indications."}
      </p>
      <div>
        <p className="mb-1 text-sm font-medium text-ink">Signature de la cliente</p>
        <SignaturePad onSigne={setSignature} />
      </div>
      <div className="flex gap-2">
        <Button variante="secondaire" pleineLargeur onClick={onFait}>
          Annuler
        </Button>
        <Button pleineLargeur onClick={accepter} disabled={chargement || !signature}>
          {chargement ? "Enregistrement…" : "J'accepte et je signe"}
        </Button>
      </div>
    </div>
  );
}

function BoutonPhoto({ label, onFichier }: { label: string; onFichier: (f: File) => void }) {
  return (
    <label className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-[var(--radius-md)] border border-dashed border-perle py-3 text-sm text-ink/60 hover:border-primary">
      <Camera size={18} />
      {label}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFichier(f);
        }}
      />
    </label>
  );
}
