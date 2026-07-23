"use client";

import { useEffect, useState, useCallback } from "react";
import { toZonedTime } from "date-fns-tz";
import {
  Check,
  Clock,
  MapPin,
  Phone,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { formaterDuree, cn } from "@/lib/utils";
import {
  creneauxDisponibles,
  verrouillerCreneau,
  finaliserReservation,
  rejoindreListeAttente,
} from "@/app/(public)/[slug]/actions";

interface Presta {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  duree_execution: number;
  categorie_id: string | null;
  pmu: boolean;
  lieu: string;
}
interface Etab {
  nom: string;
  logoUrl: string | null;
  adresse: string;
  telephone: string | null;
  fuseau: string;
}

const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function PublicBooking({
  slug,
  etablissement,
  categories,
  prestations,
  horaires,
  motPrestation,
}: {
  slug: string;
  etablissement: Etab;
  categories: { id: string; nom: string }[];
  prestations: Presta[];
  horaires: { jour: number; debut: string; fin: string }[];
  motPrestation: string;
}) {
  const fuseau = etablissement.fuseau;
  const [etape, setEtape] = useState<"catalogue" | "creneau" | "coordonnees" | "fini">(
    "catalogue",
  );
  const [choisies, setChoisies] = useState<string[]>([]);
  const [jour, setJour] = useState(() => toZonedTime(new Date(), fuseau).toISOString().slice(0, 10));
  const [creneaux, setCreneaux] = useState<string[]>([]);
  const [chargeCreneaux, setChargeCreneaux] = useState(false);
  const [verrou, setVerrou] = useState<{ rdvId: string; expireLe: string } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<{ statut: string; acompteDu: number } | null>(null);

  // Coordonnées
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [questionnaire, setQuestionnaire] = useState("");
  const [adresse, setAdresse] = useState("");
  const [cp, setCp] = useState("");
  const [ville, setVille] = useState("");

  const prestasChoisies = prestations.filter((p) => choisies.includes(p.id));
  const totalDuree = prestasChoisies.reduce((s, p) => s + p.duree_execution, 0);
  const totalPrix = prestasChoisies.reduce((s, p) => s + p.prix, 0);
  const aPmu = prestasChoisies.some((p) => p.pmu);
  const aDomicile = prestasChoisies.some((p) => p.lieu === "domicile" || p.lieu === "les_deux");

  const chargerCreneaux = useCallback(async () => {
    if (choisies.length === 0) return;
    setChargeCreneaux(true);
    const c = await creneauxDisponibles(slug, choisies, jour);
    setCreneaux(c);
    setChargeCreneaux(false);
  }, [slug, choisies, jour]);

  useEffect(() => {
    // Chargement des créneaux au passage sur l'étape (fetch asynchrone légitime).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (etape === "creneau") chargerCreneaux();
  }, [etape, chargerCreneaux]);

  async function choisirCreneau(iso: string) {
    setErreur(null);
    setChargement(true);
    const res = await verrouillerCreneau(slug, choisies, iso);
    setChargement(false);
    if (res.ok) {
      setVerrou({ rdvId: res.rdvId, expireLe: res.expireLe });
      setEtape("coordonnees");
    } else {
      setErreur(res.erreur);
      chargerCreneaux(); // rafraîchit si le créneau vient d'être pris
    }
  }

  async function confirmer(e: React.FormEvent) {
    e.preventDefault();
    if (!verrou) return;
    setErreur(null);
    setChargement(true);
    const res = await finaliserReservation(slug, {
      rdvId: verrou.rdvId,
      prestationIds: choisies,
      nom,
      telephone: tel,
      email: email || "",
      questionnaire: aPmu ? questionnaire : undefined,
      adresse: aDomicile ? adresse : undefined,
      codePostal: aDomicile ? cp : undefined,
      ville: aDomicile ? ville : undefined,
    });
    setChargement(false);
    if (res.ok) {
      setResultat({ statut: res.statut, acompteDu: res.acompteDu });
      setEtape("fini");
    } else {
      setErreur(res.erreur);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-white">
      {/* En-tête établissement */}
      <header className="bg-ink px-5 py-6 text-white">
        <div className="flex items-center gap-3">
          {etablissement.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={etablissement.logoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold">
              {etablissement.nom[0]}
            </div>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold">{etablissement.nom}</h1>
            {etablissement.adresse && (
              <p className="flex items-center gap-1 text-sm text-white/60">
                <MapPin size={13} /> {etablissement.adresse}
              </p>
            )}
          </div>
        </div>
        {horaires.length > 0 && (
          <p className="mt-3 flex items-center gap-1 text-xs text-white/50">
            <Clock size={12} /> {resumerHoraires(horaires)}
          </p>
        )}
      </header>

      <main className="px-5 py-6">
        {etape === "catalogue" && (
          <EtapeCatalogue
            categories={categories}
            prestations={prestations}
            choisies={choisies}
            onToggle={(id) =>
              setChoisies((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
            }
            motPrestation={motPrestation}
          />
        )}

        {etape === "creneau" && (
          <>
            <EtapeCreneau
              jour={jour}
              fuseau={fuseau}
              creneaux={creneaux}
              chargement={chargeCreneaux}
              onJour={setJour}
              onChoisir={choisirCreneau}
            />
            {!chargeCreneaux && creneaux.length === 0 && choisies.length > 0 && (
              <ListeAttenteForm
                onRejoindre={(nom, tel) =>
                  rejoindreListeAttente(slug, choisies[0], nom, tel)
                }
              />
            )}
            {erreur && <p className="mt-3 text-sm text-red-600">{erreur}</p>}
          </>
        )}

        {etape === "coordonnees" && verrou && (
          <form onSubmit={confirmer} className="flex flex-col gap-4">
            <CompteARebours expireLe={verrou.expireLe} onExpire={() => setEtape("creneau")} />
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">Vos coordonnées</h2>
              <p className="text-sm text-ink/60">Aucun compte à créer.</p>
            </div>
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <Input
              label="Téléphone mobile"
              type="tel"
              placeholder="06 12 34 56 78"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              required
            />
            <Input label="E-mail (facultatif)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

            {aDomicile && (
              <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-surface-muted p-3">
                <p className="text-sm font-medium text-ink">Adresse de l&apos;intervention</p>
                <Input label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} required />
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Code postal" value={cp} onChange={(e) => setCp(e.target.value)} required />
                  <div className="col-span-2">
                    <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            {aPmu && (
              <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Questionnaire préalable (obligatoire)
                </p>
                <p className="text-xs text-amber-700">
                  Signalez toute contre-indication (grossesse, allaitement, traitement,
                  allergie, problème de peau…).
                </p>
                <textarea
                  value={questionnaire}
                  onChange={(e) => setQuestionnaire(e.target.value)}
                  rows={3}
                  placeholder="Aucune / précisez…"
                  className="rounded-[var(--radius-md)] border border-amber-200 bg-white px-3 py-2 text-sm"
                  required
                />
              </div>
            )}

            {erreur && <p className="text-sm text-red-600">{erreur}</p>}
            <Button type="submit" pleineLargeur disabled={chargement}>
              {chargement ? "Confirmation…" : "Confirmer ma réservation"}
            </Button>
          </form>
        )}

        {etape === "fini" && resultat && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CalendarCheck size={48} className="text-green-600" />
            <h2 className="font-heading text-xl font-bold text-ink">
              {resultat.statut === "confirme" ? "Rendez-vous confirmé !" : "Demande envoyée"}
            </h2>
            <p className="text-sm text-ink/60">
              {resultat.statut === "confirme"
                ? "Vous recevez une confirmation par SMS."
                : "Votre demande sera validée par le professionnel. Vous serez prévenue par SMS."}
            </p>
            {resultat.acompteDu > 0 && (
              <p className="rounded-[var(--radius-md)] bg-primary-50 p-3 text-sm text-primary-700">
                Un acompte de {resultat.acompteDu} € est demandé pour garantir ce créneau.
                Le professionnel vous transmettra le lien de paiement.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Barre de progression / action */}
      {etape === "catalogue" && (
        <BarreAction
          resume={choisies.length > 0 ? `${formaterDuree(totalDuree)} · ${totalPrix} €` : ""}
          libelle="Choisir un créneau"
          desactive={choisies.length === 0}
          onClick={() => setEtape("creneau")}
        />
      )}
      {etape === "creneau" && (
        <BarreAction libelle="Retour aux prestations" variante="secondaire" onClick={() => setEtape("catalogue")} />
      )}

      {etablissement.telephone && etape === "catalogue" && (
        <p className="pb-24 pt-2 text-center text-sm text-ink/50">
          <a href={`tel:${etablissement.telephone}`} className="inline-flex items-center gap-1">
            <Phone size={13} /> {etablissement.telephone}
          </a>
        </p>
      )}
    </div>
  );
}

// --- Étapes ---

function EtapeCatalogue({
  categories,
  prestations,
  choisies,
  onToggle,
  motPrestation,
}: {
  categories: { id: string; nom: string }[];
  prestations: Presta[];
  choisies: string[];
  onToggle: (id: string) => void;
  motPrestation: string;
}) {
  const groupes = [
    ...categories.map((c) => ({ id: c.id, nom: c.nom })),
    { id: "", nom: "Autres" },
  ].filter((g) => prestations.some((p) => (p.categorie_id ?? "") === g.id));

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-heading text-lg font-semibold text-ink">
        Choisissez votre {motPrestation}
      </h2>
      {groupes.map((g) => (
        <section key={g.id || "autres"} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/40">{g.nom}</h3>
          {prestations
            .filter((p) => (p.categorie_id ?? "") === g.id)
            .map((p) => {
              const active = choisies.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => onToggle(p.id)}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border-2 p-3 text-left transition-colors",
                    active ? "border-primary bg-primary-50" : "border-perle hover:border-lavande",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{p.nom}</p>
                    {p.description && (
                      <p className="text-sm text-ink/50">{p.description}</p>
                    )}
                    {/* R1.1 : la cliente ne voit QUE la durée d'exécution */}
                    <p className="mt-0.5 text-sm text-ink/60">{formaterDuree(p.duree_execution)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-ink">{p.prix} €</span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                        <Check size={13} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
        </section>
      ))}
    </div>
  );
}

function EtapeCreneau({
  jour,
  fuseau,
  creneaux,
  chargement,
  onJour,
  onChoisir,
}: {
  jour: string;
  fuseau: string;
  creneaux: string[];
  chargement: boolean;
  onJour: (j: string) => void;
  onChoisir: (iso: string) => void;
}) {
  const aujourdhui = toZonedTime(new Date(), fuseau).toISOString().slice(0, 10);
  const [a, m, j] = jour.split("-").map(Number);
  const dateObj = new Date(Date.UTC(a, m - 1, j));
  const label = dateObj.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

  function decaler(delta: number) {
    onJour(new Date(Date.UTC(a, m - 1, j + delta)).toISOString().slice(0, 10));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => decaler(-1)}
          disabled={jour <= aujourdhui}
          className="rounded-full p-2 disabled:opacity-30"
          aria-label="Jour précédent"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-heading font-semibold capitalize text-ink">{label}</span>
        <button onClick={() => decaler(1)} className="rounded-full p-2" aria-label="Jour suivant">
          <ChevronRight size={20} />
        </button>
      </div>

      {chargement ? (
        <p className="py-8 text-center text-sm text-ink/40">Recherche des disponibilités…</p>
      ) : creneaux.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/50">
          Aucun créneau ce jour. Essayez un autre jour.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {creneaux.map((iso) => (
            <button
              key={iso}
              onClick={() => onChoisir(iso)}
              className="rounded-[var(--radius-md)] border border-perle bg-white py-2.5 text-sm font-medium text-ink hover:border-primary hover:bg-primary-50"
            >
              {toZonedTime(new Date(iso), fuseau).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListeAttenteForm({
  onRejoindre,
}: {
  onRejoindre: (nom: string, tel: string) => Promise<{ ok: boolean; erreur?: string }>;
}) {
  const [nom, setNom] = useState("");
  const [tel, setTel] = useState("");
  const [fait, setFait] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const res = await onRejoindre(nom, tel);
    setChargement(false);
    if (res.ok) setFait(true);
    else setErreur(res.erreur ?? "Erreur.");
  }

  if (fait) {
    return (
      <p className="mt-4 rounded-[var(--radius-md)] bg-green-50 p-3 text-center text-sm text-green-700">
        Vous êtes inscrite en liste d&apos;attente. Nous vous préviendrons par SMS
        dès qu&apos;une place se libère.
      </p>
    );
  }

  return (
    <form onSubmit={envoyer} className="mt-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-perle p-4">
      <p className="text-sm font-medium text-ink">Être prévenue si une place se libère</p>
      <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
      <Input
        label="Téléphone mobile"
        type="tel"
        placeholder="06 12 34 56 78"
        value={tel}
        onChange={(e) => setTel(e.target.value)}
        required
      />
      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
      <Button type="submit" variante="secondaire" pleineLargeur disabled={chargement}>
        {chargement ? "Inscription…" : "M'inscrire en liste d'attente"}
      </Button>
    </form>
  );
}

function CompteARebours({ expireLe, onExpire }: { expireLe: string; onExpire: () => void }) {
  const [restant, setRestant] = useState(() =>
    Math.max(0, Math.floor((new Date(expireLe).getTime() - Date.now()) / 1000)),
  );
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, Math.floor((new Date(expireLe).getTime() - Date.now()) / 1000));
      setRestant(r);
      if (r <= 0) {
        clearInterval(t);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [expireLe, onExpire]);

  const mm = String(Math.floor(restant / 60)).padStart(2, "0");
  const ss = String(restant % 60).padStart(2, "0");
  return (
    <div className="flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-primary-50 py-2 text-sm text-primary-700">
      <Clock size={15} /> Créneau réservé encore {mm}:{ss}
    </div>
  );
}

function BarreAction({
  resume,
  libelle,
  desactive,
  variante = "primaire",
  onClick,
}: {
  resume?: string;
  libelle: string;
  desactive?: boolean;
  variante?: "primaire" | "secondaire";
  onClick: () => void;
}) {
  return (
    <div className="sticky bottom-0 border-t border-perle bg-white/95 p-4 backdrop-blur">
      {resume && <p className="mb-2 text-center text-sm text-ink/60">{resume}</p>}
      <Button pleineLargeur variante={variante} disabled={desactive} onClick={onClick}>
        {libelle}
      </Button>
    </div>
  );
}

function resumerHoraires(horaires: { jour: number; debut: string; fin: string }[]): string {
  const jours = [...new Set(horaires.map((h) => h.jour))].sort();
  const noms = jours.map((j) => JOURS_COURTS[j]).join(", ");
  const h = horaires[0];
  return `${noms} · ${h.debut}–${h.fin}`;
}
