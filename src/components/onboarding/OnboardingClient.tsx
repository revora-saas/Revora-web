"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PenTool,
  Hand,
  Eye,
  Scissors,
  Flower2,
  Palette,
  Droplets,
  Sparkles,
  Users,
  User,
  Home,
  Store,
  MapPin,
  Check,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { finaliserOnboarding } from "@/app/(onboarding)/actions";

const ICONES: Record<string, LucideIcon> = {
  pmu: PenTool,
  ongles: Hand,
  cils: Eye,
  coiffure_f: Scissors,
  barbier: Scissors,
  esthetique: Flower2,
  maquillage: Palette,
  spa: Droplets,
  autre: Sparkles,
};

type MetierChoix = { code: string; libelle: string };

const JOURS = [
  { jour: 1, label: "Lundi" },
  { jour: 2, label: "Mardi" },
  { jour: 3, label: "Mercredi" },
  { jour: 4, label: "Jeudi" },
  { jour: 5, label: "Vendredi" },
  { jour: 6, label: "Samedi" },
  { jour: 0, label: "Dimanche" },
];

interface LigneHoraire {
  jour: number;
  actif: boolean;
  debut: string;
  fin: string;
}

const HORAIRES_DEFAUT: LigneHoraire[] = JOURS.map((j) => ({
  jour: j.jour,
  actif: j.jour >= 2 && j.jour <= 6, // mardi → samedi par défaut
  debut: "09:00",
  fin: "19:00",
}));

const NB_ETAPES = 5;

export function OnboardingClient({ metiers }: { metiers: MetierChoix[] }) {
  const router = useRouter();
  const [etape, setEtape] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [principal, setPrincipal] = useState<string | null>(null);
  const [complementaires, setComplementaires] = useState<Set<string>>(new Set());
  const [solo, setSolo] = useState<boolean | null>(null);
  const [lieu, setLieu] = useState<"salon" | "domicile" | "les_deux" | null>(null);
  const [horaires, setHoraires] = useState<LigneHoraire[]>(HORAIRES_DEFAUT);

  function basculerComplementaire(code: string) {
    setComplementaires((prec) => {
      const suivant = new Set(prec);
      if (suivant.has(code)) suivant.delete(code);
      else suivant.add(code);
      return suivant;
    });
  }

  function majHoraire(jour: number, champ: Partial<LigneHoraire>) {
    setHoraires((prec) =>
      prec.map((h) => (h.jour === jour ? { ...h, ...champ } : h)),
    );
  }

  const peutContinuer =
    (etape === 0 && principal !== null) ||
    (etape === 1) ||
    (etape === 2 && solo !== null) ||
    (etape === 3 && lieu !== null) ||
    etape === 4;

  async function finaliser() {
    if (!principal || solo === null || !lieu) return;
    setErreur(null);
    setChargement(true);
    const res = await finaliserOnboarding({
      principal,
      complementaires: [...complementaires].filter((c) => c !== principal),
      solo,
      lieu,
      horaires: horaires
        .filter((h) => h.actif)
        .map((h) => ({ jour: h.jour, debut: h.debut, fin: h.fin })),
    });
    if (res.ok) {
      router.push("/tableau-de-bord");
      router.refresh();
    } else {
      setErreur(res.erreur);
      setChargement(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-6">
      {/* Progression */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: NB_ETAPES }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= etape ? "bg-primary" : "bg-perle",
            )}
          />
        ))}
      </div>

      <div className="flex-1">
        {etape === 0 && (
          <Etape
            titre="Quelle est votre activité principale ?"
            sousTitre="Votre espace se configure selon votre métier."
          >
            <GrilleCartes>
              {metiers.map((m) => (
                <CarteMetier
                  key={m.code}
                  metier={m}
                  selectionne={principal === m.code}
                  onClick={() => setPrincipal(m.code)}
                />
              ))}
            </GrilleCartes>
          </Etape>
        )}

        {etape === 1 && (
          <Etape
            titre="Proposez-vous aussi… ?"
            sousTitre="Ajoutez vos activités complémentaires (facultatif). Les modules se cumulent."
          >
            <GrilleCartes>
              {metiers
                .filter((m) => m.code !== principal && m.code !== "autre")
                .map((m) => (
                  <CarteMetier
                    key={m.code}
                    metier={m}
                    selectionne={complementaires.has(m.code)}
                    onClick={() => basculerComplementaire(m.code)}
                    coche
                  />
                ))}
            </GrilleCartes>
          </Etape>
        )}

        {etape === 2 && (
          <Etape
            titre="Travaillez-vous seule ou en équipe ?"
            sousTitre="Vous pourrez ajouter des collaboratrices plus tard."
          >
            <div className="grid grid-cols-2 gap-3">
              <CarteChoix
                icone={User}
                label="Seule"
                selectionne={solo === true}
                onClick={() => setSolo(true)}
              />
              <CarteChoix
                icone={Users}
                label="En équipe"
                selectionne={solo === false}
                onClick={() => setSolo(false)}
              />
            </div>
          </Etape>
        )}

        {etape === 3 && (
          <Etape
            titre="Où recevez-vous vos clientes ?"
            sousTitre="Le domicile active les zones et frais de déplacement."
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CarteChoix
                icone={Store}
                label="En salon"
                selectionne={lieu === "salon"}
                onClick={() => setLieu("salon")}
              />
              <CarteChoix
                icone={Home}
                label="À domicile"
                selectionne={lieu === "domicile"}
                onClick={() => setLieu("domicile")}
              />
              <CarteChoix
                icone={MapPin}
                label="Les deux"
                selectionne={lieu === "les_deux"}
                onClick={() => setLieu("les_deux")}
              />
            </div>
          </Etape>
        )}

        {etape === 4 && (
          <Etape
            titre="Vos horaires d'ouverture"
            sousTitre="Des valeurs de départ, ajustables à tout moment."
          >
            <div className="flex flex-col gap-2">
              {horaires.map((h) => {
                const label = JOURS.find((j) => j.jour === h.jour)!.label;
                return (
                  <div
                    key={h.jour}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-perle bg-white px-3 py-2"
                  >
                    <label className="flex w-28 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={h.actif}
                        onChange={(e) => majHoraire(h.jour, { actif: e.target.checked })}
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium text-ink">{label}</span>
                    </label>
                    {h.actif ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="time"
                          value={h.debut}
                          onChange={(e) => majHoraire(h.jour, { debut: e.target.value })}
                          className="rounded-[var(--radius-sm)] border border-perle px-2 py-1 text-sm"
                        />
                        <span className="text-ink/40">–</span>
                        <input
                          type="time"
                          value={h.fin}
                          onChange={(e) => majHoraire(h.jour, { fin: e.target.value })}
                          className="rounded-[var(--radius-sm)] border border-perle px-2 py-1 text-sm"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-ink/40">Fermé</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Etape>
        )}
      </div>

      {erreur && <p className="mt-4 text-sm text-red-600">{erreur}</p>}

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-3">
        {etape > 0 && (
          <Button
            variante="secondaire"
            onClick={() => {
              setErreur(null);
              setEtape((e) => e - 1);
            }}
            disabled={chargement}
          >
            Retour
          </Button>
        )}
        {etape < NB_ETAPES - 1 ? (
          <Button
            pleineLargeur
            disabled={!peutContinuer}
            onClick={() => setEtape((e) => e + 1)}
          >
            Continuer
          </Button>
        ) : (
          <Button pleineLargeur disabled={chargement} onClick={finaliser}>
            {chargement ? "Configuration de votre espace…" : "Terminer et créer mon espace"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Etape({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">{titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-ink/60">{sousTitre}</p>}
      </div>
      {children}
    </div>
  );
}

function GrilleCartes({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>;
}

function CarteMetier({
  metier,
  selectionne,
  onClick,
  coche,
}: {
  metier: MetierChoix;
  selectionne: boolean;
  onClick: () => void;
  coche?: boolean;
}) {
  const Icone = ICONES[metier.code] ?? Sparkles;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 bg-white p-4 text-center transition-colors",
        selectionne
          ? "border-primary bg-primary-50"
          : "border-perle hover:border-lavande",
      )}
    >
      {selectionne && coche && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
          <Check size={13} />
        </span>
      )}
      <Icone
        size={26}
        className={selectionne ? "text-primary" : "text-ink/60"}
      />
      <span className="text-sm font-medium text-ink">{metier.libelle}</span>
    </button>
  );
}

function CarteChoix({
  icone: Icone,
  label,
  selectionne,
  onClick,
}: {
  icone: LucideIcon;
  label: string;
  selectionne: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 bg-white p-5 transition-colors",
        selectionne ? "border-primary bg-primary-50" : "border-perle hover:border-lavande",
      )}
    >
      <Icone size={26} className={selectionne ? "text-primary" : "text-ink/60"} />
      <span className="text-sm font-medium text-ink">{label}</span>
    </button>
  );
}
