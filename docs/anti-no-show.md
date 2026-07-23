# Anti no-show — fonctionnement et test local

Le cœur différenciant de Revora. Objectif : **rien ne doit échouer en silence.**

## Composants

| Élément | Emplacement |
|---|---|
| Planification + envoi des rappels | `src/lib/messagerie/rappels.ts` |
| Fenêtre de silence 21 h–8 h (R14.3) | `src/lib/messagerie/quiet.ts` |
| Sélection liste d'attente (R10) | `src/lib/messagerie/liste-attente.ts` |
| Providers Twilio / Brevo (dev-safe) | `src/lib/messagerie/providers.ts` |
| Cron des rappels (Railway) | `POST /api/cron/rappels` |
| Webhook réponses SMS (OUI/NON/STOP) | `POST /api/webhooks/twilio` |
| Modèles de messages système | migration `…122000_modeles_messages` |

## Séparation stricte des flux (obligation FR)

- **Transactionnel** (rappels, confirmations) : expéditeur `TWILIO_SMS_SENDER`.
- **Promotionnel** (campagnes) : expéditeur `TWILIO_SMS_SENDER_PROMO` — opt-in +
  mention STOP obligatoires.

## Tester le cycle complet en local, **sans envoyer de vrais SMS**

Le mode simulation s'active automatiquement quand les clés Twilio/Brevo sont
absentes : chaque envoi est **journalisé dans la console** et le message passe à
`envoye` (`simule: true`). Aucun SMS réel n'est émis.

1. **Créer des données** : un RDV `confirme` à ~24 h et un autre à ~2 h, avec une
   cliente ayant un mobile (le jeu de démo en fournit).

2. **Lancer le cron** (planifie les rappels dus puis les envoie) :
   ```bash
   curl -X POST http://localhost:3000/api/cron/rappels \
     -H "x-cron-secret: $RAILWAY_CRON_SECRET"
   ```
   Réponse JSON : `{ rappels_planifies, envoyes, echecs, simules }`.
   Les envois simulés apparaissent dans la console (`[sms:transactionnel:SIMULÉ] …`).
   Vérifier dans la table `messages` : les rappels passent de `en_file` à `envoye`.

3. **Simuler une réponse cliente** (webhook Twilio) :
   ```bash
   # Confirmation
   curl -X POST http://localhost:3000/api/webhooks/twilio \
     -d "From=+33612345678" -d "Body=OUI"
   # Annulation (libère le créneau + déclenche la liste d'attente)
   curl -X POST http://localhost:3000/api/webhooks/twilio \
     -d "From=+33612345678" -d "Body=NON"
   # Désinscription promotionnelle
   curl -X POST http://localhost:3000/api/webhooks/twilio \
     -d "From=+33612345678" -d "Body=STOP"
   ```
   La réponse est un TwiML (`<Response><Message>…`). Vérifier le nouveau statut du
   RDV dans `rendez_vous`.

4. **Fenêtre de silence** : un rappel calculé la nuit est reporté à 8 h — visible
   dans `messages.planifie_le`.

5. **Quota** : mettre `abonnements.credits_restants = 0` → le cron bascule les SMS
   en e-mail (si dispo), sinon marque `echec` avec le motif. Les échecs remontent
   sur le **tableau de bord** de la pro (R15.7).

## Passage en production

- Renseigner les clés `TWILIO_*` et `BREVO_*` : l'envoi devient réel.
- Sur **Railway**, planifier un appel `POST /api/cron/rappels` toutes les ~5 min
  avec l'en-tête `x-cron-secret`.
- Configurer le **webhook Twilio** du numéro entrant vers
  `https://<domaine>/api/webhooks/twilio`.

## Différé (à brancher)

- Paiement d'acompte **Stripe** réel (montant déjà calculé et affiché ; lien de
  paiement + webhook à ajouter).
- Vagues 2 et 3 de la liste d'attente échelonnées côté cron (V1 : première vague
  + lien de réservation, « premier arrivé » garanti par le verrou).
- Canal **WhatsApp** (templates Meta à valider).
