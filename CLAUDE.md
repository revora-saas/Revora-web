# CLAUDE.md — Contexte permanent du projet Revora

> Ce fichier est lu automatiquement à chaque session. Il contient les règles qui ne changent jamais.
> **Ne jamais dévier de ces règles sans validation explicite de ma part.**

---

## Le produit

**Revora — le logiciel adapté à tous les professionnels de la beauté.**

SaaS de gestion pour professionnels de la beauté en France : rendez-vous, clientes, caisse, stock, et traçabilité technique (PMU). Marché français uniquement, interface en français uniquement.

**Différenciateur n°1 :** un système anti no-show complet (rappels bidirectionnels, acompte, score de fiabilité, liste d'attente auto-remplissante).
**Différenciateur n°2 :** la profondeur métier et la conformité française (traçabilité pigments, consentements, dossier ARS) que les généralistes n'ont pas.

---

## Stack imposée

| Rôle | Choix |
|---|---|
| Front | Next.js (App Router) + TypeScript, déployé sur **Vercel** (région UE) |
| API / tâches de fond | **Railway** (région UE) — cron des rappels, webhooks, traitements longs |
| Base / auth / storage | **Supabase** (région UE), PostgreSQL + RLS |
| Paiements | **Stripe** |
| E-mails | **Brevo** |
| SMS / WhatsApp | **Twilio** |
| Médias | **Cloudinary** (visuels non sensibles) — photos clientes dans Supabase Storage |
| Style | **Tailwind CSS** |
| Type d'app | **PWA installable, mobile-first**. Pas d'application native. |

---

## Identité visuelle

```
Violet principal   #6D4CFF   accent, boutons, liens
Violet profond     #4B1D8C   dégradés, éléments forts
Lavande            #B794F6   accents doux
Bleu nuit          #0B1020   texte principal, fonds sombres (marque)
Blanc              #FFFFFF   fonds d'écran de travail
Gris perle         #E6E8EF   bordures, séparateurs
```

- **Titres et interface :** Poppins · **Textes :** Inter
- L'identité de marque est sombre et premium ; **les écrans de travail sont clairs** (lisibilité en institut, en plein jour).
- Style : épuré, beaucoup d'air, bords arrondis, ombres douces. Jamais chargé.

---

## Règles de développement non négociables

1. **Mobile-first.** Tout doit être utilisable d'une main. Concevoir l'écran mobile d'abord, l'élargir ensuite.
2. **Français uniquement.** Aucune internationalisation, aucun texte en anglais dans l'interface.
3. **Rien en dur.** Les valeurs métier (délais, battements, seuils) vont dans la table `reglages`. Voir R16.
4. **Un seul code, des profils métier.** Jamais d'écran spécifique à un métier : le métier est une **configuration** (voir `specs/revora-adaptation-metier.md`, règle M7.2).
5. **La base garantit l'intégrité.** Le double-booking est empêché par les contraintes `EXCLUDE` sur `occupations`, pas par du code applicatif.
6. **Toutes les dates en UTC** (`timestamptz`), converties à l'affichage. Sinon décalage au changement d'heure.
7. **RLS obligatoire sur chaque table** portant `etablissement_id`. Une table sans RLS = fuite entre établissements.
8. **Jamais de suppression destructive.** Archivage (`archive_le`) ou anonymisation (`anonymise_le`). Voir C9.2.
9. **Les créneaux libres ne sont jamais stockés**, toujours calculés à la demande.
10. **Aucune donnée sensible hors UE.** Photos clientes, allergies, consentements → Supabase Storage (UE).

---

## Documents de référence (dans `specs/`)

| Fichier | Contenu | Préfixe des règles |
|---|---|---|
| `revora-schema.sql` | Modèle de données complet | — |
| `revora-regles-metier.md` | Durées, moteur de créneaux, fiabilité, no-show | **R** |
| `revora-adaptation-metier.md` | Profils métier et configuration | **M** |
| `revora-base-clientes.md` | Fiche cliente, RGPD, import/export | **C** |
| `revora-fonctionnalites.md` | Périmètre V1 / V2 / V3 | — |

**Les règles sont numérotées.** Quand je dis « applique R5.2 », va lire la règle dans le document correspondant. Si une règle semble absente ou contradictoire, **demande-moi avant d'improviser**.

---

## Périmètre V1 — ce qu'on construit

Une pro s'inscrit, son espace se configure selon son métier, elle crée ses prestations, importe ses clientes, partage son lien de réservation, remplit son agenda, ses clientes reçoivent des rappels auxquels elles répondent, les désistements se remplacent automatiquement, elle encaisse, suit son chiffre d'affaires et son stock — et pour le PMU, elle constitue un dossier conforme.

## Ce qu'on ne construit PAS en V1

- Pas de gestion d'équipe (compte solo uniquement — le schéma la prévoit, l'interface ne l'expose pas)
- Pas de multi-établissement
- Pas de marketplace ni d'annuaire public
- Pas de comptabilité légale complète
- Pas d'application native
- Pas de programme de fidélité, de campagnes marketing, de boutique en ligne

Si une demande sort de ce périmètre, **signale-le-moi** au lieu de la construire.

---

## Méthode de travail attendue

- **Avance par étapes courtes et vérifiables.** Ne génère jamais dix fichiers d'un coup sans que je puisse tester.
- **Explique brièvement tes choix** avant de coder quand ils engagent l'architecture.
- **Pose une question plutôt que de deviner** si une spec est ambiguë.
- Écris du code **lisible et commenté en français** pour la logique métier.
- Après chaque étape : indique **comment tester** ce qui vient d'être construit.

---

## Note technique (voir aussi `AGENTS.md`)

- **Next.js 16 (App Router) + Tailwind CSS v4.** Tailwind v4 se configure en CSS via `@theme` dans `src/app/globals.css` (il n'y a pas de `tailwind.config.js`).
- Le design system (couleurs, polices) est défini dans `globals.css` sous forme de variables `@theme` réutilisables (`primary`, `ink`, `lavande`…).
- Polices chargées via `next/font` : **Poppins** (titres/UI) et **Inter** (textes).
