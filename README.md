# Revora

**Le logiciel adapté à tous les professionnels de la beauté.**

SaaS de gestion pour professionnels de la beauté en France : rendez-vous,
clientes, caisse, stock et traçabilité technique (PMU). Marché français
uniquement, interface en français. Différenciateur principal : un système
**anti no-show** complet.

> Le contexte permanent du projet est dans [`CLAUDE.md`](./CLAUDE.md) et les
> spécifications détaillées dans [`specs/`](./specs). À lire avant toute
> contribution.

---

## Stack

| Rôle | Choix |
|---|---|
| Front | **Next.js 16** (App Router) + TypeScript, déployé sur **Vercel** (UE) |
| Style | **Tailwind CSS v4** (config CSS dans `src/app/globals.css`) |
| API / tâches de fond | **Railway** (UE) — cron des rappels, webhooks |
| Base / auth / storage | **Supabase** (UE), PostgreSQL + RLS |
| Paiements | **Stripe** · E-mails **Brevo** · SMS/WhatsApp **Twilio** |
| Médias | **Cloudinary** (non sensible) — photos clientes dans Supabase Storage |
| Type d'app | **PWA installable, mobile-first** |

---

## Prérequis

- Node.js 20+ (testé sous Node 22)
- npm

## Installation

```bash
npm install
cp .env.example .env.local   # puis renseigner les vraies valeurs
```

## Lancer en local

```bash
npm run dev
```

L'application est servie sur **http://localhost:3000**.

- `/` — site vitrine (groupe `(marketing)`)
- `/tableau-de-bord` — application authentifiée (groupe `(app)`)
- `/<slug>` — page de réservation publique d'un établissement (groupe `(public)`)

## Autres commandes

```bash
npm run build   # build de production
npm run start   # sert le build de production
npm run lint    # ESLint
```

---

## Arborescence

```
src/
  app/
    (marketing)/      Site vitrine public
    (app)/            Application authentifiée (agenda, clientes, caisse…)
    (public)/         Pages de réservation clientes (sans compte)
    layout.tsx        Layout racine (polices Poppins + Inter, fr)
    globals.css       Design system Tailwind v4 (@theme)
  components/
    ui/               Composants de base : Button, Input, Card, Badge, Modal, Sheet
  lib/
    supabase/         Clients Supabase (navigateur + serveur)
    agenda/           Moteur de créneaux — isolé et testable (prompt 06)
    utils.ts          Utilitaires (cn…)
specs/                Spécifications de référence (règles R, M, C + schéma SQL)
```

---

## Conventions

- **Mobile-first**, interface **en français** uniquement.
- **Aucune valeur métier en dur** : les délais, seuils et battements vivent
  dans la table `reglages` (voir specs, règle R16).
- **Toutes les dates en UTC** (`timestamptz`), converties à l'affichage.
- **RLS obligatoire** sur chaque table portant `etablissement_id`.

Voir [`CLAUDE.md`](./CLAUDE.md) pour les 10 règles non négociables.
