"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2, Undo2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import {
  importerClientes,
  annulerImport,
  type LigneImport,
  type RapportImport,
} from "@/app/(app)/clientes/actions";

type Champ = "ignorer" | "nom" | "prenom" | "telephone" | "email";

const CHAMPS: { cle: Champ; label: string }[] = [
  { cle: "ignorer", label: "— Ignorer —" },
  { cle: "nom", label: "Nom" },
  { cle: "prenom", label: "Prénom" },
  { cle: "telephone", label: "Mobile" },
  { cle: "email", label: "E-mail" },
];

/** Parseur CSV minimal gérant les guillemets et les virgules échappées. */
function parserCsv(texte: string): string[][] {
  const lignes: string[][] = [];
  let champ = "";
  let ligne: string[] = [];
  let dansGuillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (dansGuillemets) {
      if (c === '"' && texte[i + 1] === '"') {
        champ += '"';
        i++;
      } else if (c === '"') {
        dansGuillemets = false;
      } else {
        champ += c;
      }
    } else if (c === '"') {
      dansGuillemets = true;
    } else if (c === "," || c === ";") {
      ligne.push(champ);
      champ = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texte[i + 1] === "\n") i++;
      ligne.push(champ);
      lignes.push(ligne);
      ligne = [];
      champ = "";
    } else {
      champ += c;
    }
  }
  if (champ !== "" || ligne.length > 0) {
    ligne.push(champ);
    lignes.push(ligne);
  }
  return lignes.filter((l) => l.some((v) => v.trim() !== ""));
}

/** Devine le mapping d'une colonne d'après son en-tête. */
function deviner(entete: string): Champ {
  const e = entete.toLowerCase();
  if (/(t[ée]l|mobile|portable|phone|gsm)/.test(e)) return "telephone";
  if (/(mail|courriel|email)/.test(e)) return "email";
  if (/(pr[ée]nom|firstname)/.test(e)) return "prenom";
  if (/(nom|lastname|name)/.test(e)) return "nom";
  return "ignorer";
}

export function ImportClientes({ motClient }: { motClient: string }) {
  const router = useRouter();
  const [etape, setEtape] = useState<"depot" | "mapping" | "rapport">("depot");
  const [entetes, setEntetes] = useState<string[]>([]);
  const [lignes, setLignes] = useState<string[][]>([]);
  const [avecEntete, setAvecEntete] = useState(true);
  const [mapping, setMapping] = useState<Champ[]>([]);
  const [chargement, setChargement] = useState(false);
  const [rapport, setRapport] = useState<RapportImport | null>(null);

  function surFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const grille = parserCsv(String(lecteur.result));
      if (grille.length === 0) return;
      setEntetes(grille[0]);
      setLignes(grille);
      setMapping(grille[0].map(deviner));
      setEtape("mapping");
    };
    lecteur.readAsText(fichier, "utf-8");
  }

  function construireLignes(): LigneImport[] {
    const donnees = avecEntete ? lignes.slice(1) : lignes;
    return donnees.map((l) => {
      const obj: LigneImport = { nom: "" };
      mapping.forEach((champ, i) => {
        if (champ === "ignorer") return;
        obj[champ] = (l[i] ?? "").trim();
      });
      return obj;
    });
  }

  async function lancerImport() {
    setChargement(true);
    const res = await importerClientes(construireLignes());
    setChargement(false);
    if (res.ok && res.rapport) {
      setRapport(res.rapport);
      setEtape("rapport");
    }
  }

  async function annuler() {
    if (!rapport) return;
    setChargement(true);
    await annulerImport(rapport.ids);
    setChargement(false);
    router.push("/clientes");
    router.refresh();
  }

  const apercu = (avecEntete ? lignes.slice(1) : lignes).slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={16} /> Retour
      </Link>
      <h1 className="font-heading text-2xl font-bold text-ink">
        Importer mes {motClient}
      </h1>

      {etape === "depot" && (
        <Card>
          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed border-perle p-8 text-center hover:border-lavande">
            <Upload className="text-primary" />
            <span className="text-sm font-medium text-ink">
              Choisir un fichier CSV
            </span>
            <span className="text-xs text-ink/50">
              Depuis Excel : Fichier → Enregistrer sous → CSV. Colonnes attendues :
              nom, prénom, mobile, e-mail.
            </span>
            <input type="file" accept=".csv,text/csv" onChange={surFichier} className="hidden" />
          </label>
        </Card>
      )}

      {etape === "mapping" && (
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={avecEntete}
              onChange={(e) => setAvecEntete(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            La première ligne contient les titres de colonnes
          </label>

          <Card>
            <p className="mb-3 text-sm font-medium text-ink">
              Faites correspondre vos colonnes
            </p>
            <div className="flex flex-col gap-2">
              {entetes.map((entete, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-1/2 truncate text-sm text-ink/60">
                    {avecEntete ? entete : `Colonne ${i + 1}`}
                    <span className="ml-1 text-ink/30">
                      ({(lignes[avecEntete ? 1 : 0] ?? [])[i] ?? ""})
                    </span>
                  </span>
                  <select
                    value={mapping[i]}
                    onChange={(e) => {
                      const m = [...mapping];
                      m[i] = e.target.value as Champ;
                      setMapping(m);
                    }}
                    className="w-1/2 rounded-[var(--radius-md)] border border-perle bg-white px-2 py-1.5 text-sm"
                  >
                    {CHAMPS.map((c) => (
                      <option key={c.cle} value={c.cle}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-sm font-medium text-ink">Aperçu (5 lignes)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink/50">
                    <th className="pr-3">Nom</th>
                    <th className="pr-3">Prénom</th>
                    <th className="pr-3">Mobile</th>
                    <th>E-mail</th>
                  </tr>
                </thead>
                <tbody>
                  {apercu.map((l, r) => {
                    const val = (champ: Champ) => {
                      const idx = mapping.indexOf(champ);
                      return idx === -1 ? "" : (l[idx] ?? "").trim();
                    };
                    return (
                      <tr key={r} className="border-t border-perle">
                        <td className="pr-3 py-1">{val("nom")}</td>
                        <td className="pr-3 py-1">{val("prenom")}</td>
                        <td className="pr-3 py-1">{val("telephone")}</td>
                        <td className="py-1">{val("email")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-2">
            <Button variante="secondaire" onClick={() => setEtape("depot")}>
              Changer de fichier
            </Button>
            <Button
              pleineLargeur
              onClick={lancerImport}
              disabled={chargement || !mapping.includes("nom")}
            >
              {chargement ? "Import…" : "Importer"}
            </Button>
          </div>
          {!mapping.includes("nom") && (
            <p className="text-sm text-amber-700">
              Associez au moins une colonne au champ « Nom ».
            </p>
          )}
        </div>
      )}

      {etape === "rapport" && rapport && (
        <Card>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="text-green-600" size={40} />
            <h2 className="font-heading text-lg font-semibold text-ink">
              Import terminé
            </h2>
            <div className="text-sm text-ink/70">
              <p>
                <strong>{rapport.importees}</strong> fiches importées
              </p>
              {rapport.ignorees > 0 && (
                <p>{rapport.ignorees} ignorées (doublons)</p>
              )}
              {rapport.erreurs > 0 && (
                <p>{rapport.erreurs} en erreur (nom ou numéro invalide)</p>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              {rapport.importees > 0 && (
                <Button variante="secondaire" onClick={annuler} disabled={chargement}>
                  <Undo2 size={15} /> Annuler l&apos;import
                </Button>
              )}
              <Link href="/clientes">
                <Button>Voir mes fiches</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
