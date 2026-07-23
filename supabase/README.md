# Base de données Revora (Supabase)

Migrations SQL ordonnées dérivées de [`../specs/revora-schema.sql`](../specs/revora-schema.sql).
Toutes ont été testées sur PostgreSQL 16 (application intégrale + RLS + déclencheurs).

## Contenu de `migrations/`

| Fichier | Contenu |
|---|---|
| `…120100_schema_etablissements` | Établissements, profils, membres, métiers |
| `…120200_schema_catalogue` | Prestations, durées, segments (temps de pose), ressources |
| `…120300_schema_disponibilites` | Horaires, indisponibilités |
| `…120400_schema_clients` | Fiche cliente, étiquettes, consentements |
| `…120500_schema_rendez_vous` | RDV, `occupations` (anti-collision `EXCLUDE`), liste d'attente, fiabilité |
| `…120600_schema_fiches_photos` | Fiches techniques (JSONB), photos |
| `…120700_schema_stock` | Produits, lots + péremption, mouvements |
| `…120800_schema_caisse` | Encaissements, paiements fractionnés, dépenses |
| `…120900_schema_messages` | Modèles, journal des envois |
| `…121000_schema_abonnement_reglages_audit` | Abonnements, réglages (R16), journal d'activité |
| `…121100_rls` | **RLS sur les 37 tables** + `mes_etablissements()` |
| `…121200_triggers` | Onboarding, score de fiabilité, stats clientes, statut, journalisation |
| `…121300_seed_metiers` | Les 9 profils métier (config JSONB) |
| `…121400_seed_demo` | Jeu de test (⚠️ démo uniquement, pas en production) |

## Appliquer les migrations

### Option A — CLI Supabase (recommandé)

```bash
supabase init            # si pas déjà fait (crée config.toml, ne touche pas aux migrations)
supabase link --project-ref <votre-ref-projet>
supabase db push         # applique toutes les migrations dans l'ordre
```

Ne pas appliquer `…121400_seed_demo` en production (données fictives).

### Option B — Éditeur SQL du dashboard

Copier-coller le contenu de chaque fichier **dans l'ordre** des noms, un par un,
dans l'éditeur SQL de Supabase (SQL Editor → New query → Run).

## Vérifier l'isolation entre établissements

Après application, chaque table portant `etablissement_id` est protégée par RLS.
Un utilisateur ne voit que les données des établissements dont il est membre
(`membres.user_id = auth.uid()`). Pour contrôler :

```sql
-- Doit renvoyer 0 ligne : aucune table du schéma public sans RLS.
select tablename from pg_tables
where schemaname = 'public' and rowsecurity = false;
```

Connecté en tant qu'utilisateur, `select * from clients` ne renvoie que
les clientes de ses établissements ; toute écriture visant un autre
établissement est rejetée par la policy (`new row violates row-level
security policy`).

## Régénérer les types TypeScript

Après toute modification du schéma :

```bash
supabase gen types typescript --project-id <ref> --schema public \
  > src/lib/database.types.ts
```
