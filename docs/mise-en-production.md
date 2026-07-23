# Checklist de mise en production — Revora

À suivre point par point. Tout est en région **UE**.

## 1. Base de données (Supabase, UE)

- [ ] Créer le projet Supabase en région UE.
- [ ] Appliquer les migrations : `supabase link --project-ref <ref>` puis `supabase db push`.
      **Ne pas** appliquer `…121400_seed_demo` en production.
- [ ] Créer le bucket **privé** `photos-clientes` (Storage → New bucket, Public : non).
- [ ] Vérifier la sécurité :
  ```sql
  -- Doit renvoyer 0 ligne.
  select tablename from pg_tables where schemaname='public' and rowsecurity=false;
  ```
- [ ] Sauvegardes quotidiennes activées (Supabase les fournit) et testées (restauration sur 30 jours).

## 2. Authentification (Supabase Auth)

- [ ] URL Configuration : `Site URL` = `https://app.revora.fr`, Redirect URLs :
      `https://app.revora.fr/auth/callback`, `https://app.revora.fr/auth/confirmer`.
- [ ] Provider **Phone** : brancher Twilio (SID, Auth Token, Message Service).
- [ ] Providers **Google** et **Apple** (voir prompt 02 — redirect
      `https://<ref>.supabase.co/auth/v1/callback`).
- [ ] **SMTP Brevo** pour les e-mails d'auth ; templates pointant vers
      `{{ .SiteURL }}/auth/confirmer?token_hash={{ .TokenHash }}&type={{ .Type }}`.

## 3. Front (Vercel, UE)

- [ ] Importer le dépôt, région de déploiement **UE**.
- [ ] Renseigner toutes les variables de `.env.example` (valeurs de production).
- [ ] Domaines : `revora.fr` (vitrine) et `app.revora.fr` (application).
      `NEXT_PUBLIC_SITE_URL=https://revora.fr`.
- [ ] Build : `next build` (déjà validé).

## 4. Tâches de fond (Railway, UE)

- [ ] Planifier un appel **`POST https://app.revora.fr/api/cron/rappels`** toutes les ~5 min,
      en-tête `x-cron-secret: $RAILWAY_CRON_SECRET`.
- [ ] Configurer le **webhook Twilio** du numéro entrant vers
      `https://app.revora.fr/api/webhooks/twilio`.

## 5. Intégrations

- [ ] **Stripe** : clés live, produit d'abonnement, webhook (acomptes, abonnement).
      *(Le paiement réel reste à brancher — voir différés.)*
- [ ] **Twilio** : expéditeur `REVORA` déclaré au registre **AF2M** ; flux
      transactionnel et **promotionnel séparés** (`TWILIO_SMS_SENDER` /
      `TWILIO_SMS_SENDER_PROMO`).
- [ ] **Brevo** : SPF, DKIM, DMARC configurés dans la zone DNS (sinon spam).
- [ ] **Push PWA** : générer une paire de clés VAPID, renseigner
      `NEXT_PUBLIC_VAPID_PUBLIC_KEY` et `VAPID_PRIVATE_KEY`.

## 6. Vérification finale de sécurité

- [ ] RLS active sur **toutes** les tables (vérifié : 37/37, 0 sans policy).
- [ ] Aucune donnée sensible hors UE (photos et données de santé dans Supabase UE).
- [ ] Photos servies **uniquement** par URL signée (jamais de lien public).
- [ ] Journalisation opérationnelle : modifications clientes, accès aux données de
      santé (C8.2), annulations/modifications de RDV (R15.10).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` et clés secrètes **jamais** exposées au client.

## 7. Qualité et suivi

- [ ] Suivi des erreurs (Sentry ou équivalent) branché sur le front et les crons.
- [ ] Vérifier Lighthouse sur la vitrine (perf, accessibilité, SEO).
- [ ] Tester le parcours complet : inscription → onboarding → prestation →
      réservation publique → rappel (cron) → réponse SMS (webhook) → encaissement.

## Démarches externes (à lancer tôt — hors code)

- [ ] Déclaration de l'expéditeur SMS **REVORA** au registre AF2M.
- [ ] Vérification Meta pour l'API WhatsApp Business (V1.1) et validation des modèles.
- [ ] Dépôt INPI de la marque Revora.
- [ ] Faire valider les textes légaux (CGU, CGV, confidentialité, DPA) par un juriste.
