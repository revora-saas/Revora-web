# Revora — Règles métier détaillées (V1)

Document de conception destiné à la construction. Chaque règle est numérotée pour pouvoir être citée pendant le développement.

> **But :** que rien ne reste à décider pendant le code. Si une règle manque ici, elle sera improvisée — et donc mal faite.

---

## 1. Modèle de durée d'une prestation

C'est le socle de tout l'agenda. Une prestation n'est **pas** une simple durée.

### 1.1 Décomposition

Chaque prestation se définit par quatre temps paramétrables :

| Temps | Rôle | Exemple |
|---|---|---|
| `preparation` | Mise en place de la salle, du matériel | 10 min |
| `execution` | La prestation vécue par la cliente | 2 h |
| `nettoyage` | Désinfection, rangement, DASRI | 20 min |
| `battement` | Marge de sécurité (réglage global, surchargeable) | 0–10 min |

**R1.1** — La **cliente voit uniquement `execution`**. Sur la page de réservation, la prestation affiche « 2 h ».

**R1.2** — L'**agenda bloque la totalité** : `preparation + execution + nettoyage + battement`.

**R1.3** — L'heure du rendez-vous communiquée à la cliente est le **début de `execution`**.

> **Exemple (le cas cité) :** microblading, exécution 2 h, préparation 10 min, nettoyage 20 min.
> La cliente réserve à 10:00 et voit « 10:00 – 12:00, durée 2 h ».
> L'agenda bloque **09:50 → 12:20** (2 h 30).
> Aucune autre réservation ne peut commencer avant 12:20.

**R1.4** — Ces temps sont définis **par prestation**, avec des valeurs par défaut proposées selon le métier lors de l'onboarding (le PMU a plus de nettoyage qu'un brushing).

### 1.2 Temps de pose (créneau libérable)

Indispensable en coiffure et en coloration : pendant la pose, la praticienne est **disponible**.

**R1.5** — Une prestation peut être décrite comme une **suite de segments**, chacun marqué `occupé` ou `libre` :

> **Exemple — coloration :**
> `[occupé 20 min : application]` → `[libre 30 min : pose]` → `[occupé 40 min : rinçage + coiffage]`
> Durée totale bloquée : 1 h 30. Mais les 30 min de pose sont **réutilisables** pour une autre cliente.

**R1.6** — Un segment `libre` peut accueillir une autre prestation si celle-ci tient **entièrement** dedans (durée totale bloquée comprise).

**R1.7** — La salle ou le poste, lui, **reste occupé** pendant la pose (la cliente est physiquement là). Seule la **praticienne** se libère. Voir §2.

**R1.8** — Le remplissage d'un temps de pose est **proposé, jamais imposé** : la pro peut désactiver cette optimisation prestation par prestation.

---

## 2. Ressources

**R2.1** — Trois types de ressources peuvent être requises par une prestation :
- **Praticienne** (toujours) ;
- **Poste / cabine / salle** (fauteuil, cabine de soin, poste PMU) ;
- **Équipement** (bac à shampoing, lampe UV, appareil).

**R2.2** — Une prestation déclare les ressources dont elle a besoin. Un créneau n'est proposé que si **toutes** sont libres simultanément.

**R2.3** — En V1, une pro seule sans salles multiples n'a qu'une ressource implicite (elle-même). Le module ressources ne s'affiche que si le compte en déclare — **on ne complexifie pas l'écran d'une pro solo**.

---

## 3. Compétences & affectation

**R3.1** — Chaque employée déclare les prestations qu'elle est **autorisée à réaliser**.

**R3.2** — Une prestation ne propose que les employées compétentes. Une employée non habilitée n'apparaît jamais comme option.

**R3.3** — Une durée peut être **surchargée par employée** (une débutante met 2 h 30 là où une confirmée met 2 h). À défaut, la durée par défaut de la prestation s'applique.

---

## 4. Disponibilités

**R4.1** — Hiérarchie des contraintes, de la plus large à la plus fine :
1. Horaires d'ouverture de l'établissement ;
2. Horaires de l'employée (peuvent être plus restreints) ;
3. Pauses récurrentes (déjeuner) ;
4. Absences et congés ponctuels ;
5. Rendez-vous déjà pris ;
6. Blocages manuels.

**R4.2** — Les **jours fériés français** sont pré-chargés et fermés par défaut, débloquables individuellement.

**R4.3** — **Délai minimum de réservation** (défaut : 2 h). Aucune réservation en ligne à moins de X heures du créneau.

**R4.4** — **Horizon maximum** (défaut : 3 mois). Empêche les réservations trop lointaines.

**R4.5** — **Granularité des créneaux proposés** : 15 min par défaut (paramétrable : 5, 10, 15, 30).

**R4.6** — Une prestation ne peut pas **déborder de l'horaire de fermeture**, temps de nettoyage compris. Un créneau de 2 h 30 total ne sera pas proposé à 17:00 si la fermeture est à 19:00 et qu'il reste du nettoyage — le calcul porte sur la durée **bloquée**, pas la durée vue par la cliente.

---

## 5. Moteur de créneaux (l'intelligence de l'agenda)

**R5.1** — Algorithme de recherche d'un créneau, pour une prestation donnée :
1. Calculer la **durée bloquée totale** (§1) ;
2. Lister les employées compétentes (§3) et disponibles (§4) ;
3. Pour chacune, parcourir les plages libres ;
4. Retenir les débuts possibles selon la granularité (§4.5) ;
5. Vérifier la disponibilité des ressources (§2) ;
6. Trier selon les règles d'optimisation ci-dessous.

### 5.2 Optimisation anti-trou

**R5.2** — À l'affichage, les créneaux sont priorisés dans cet ordre :
1. Ceux **accolés** à un rendez-vous existant (avant ou après) — ils ne créent pas de trou ;
2. Ceux en **début ou fin de journée** ;
3. Les autres.

**R5.3** — Un créneau est **déconseillé** (proposé en dernier, ou masqué selon réglage) s'il laisse derrière lui un trou **inférieur à la plus courte prestation du catalogue** — donc un trou invendable.

**R5.4** — Réglage par la pro : `Optimiser mon planning` (regrouper les RDV, quitte à proposer moins de choix) ou `Laisser le choix à la cliente` (tous les créneaux, triés par heure).

### 5.3 Affectation entre employées

**R5.5** — Quand la cliente **choisit** une praticienne, ce choix prime toujours.

**R5.6** — Quand la cliente n'exprime **aucune préférence**, l'affectation suit cet ordre :
1. La praticienne **habituelle** de cette cliente (celle de son dernier RDV pour cette prestation) ;
2. Celle dont la journée est la **plus fragmentée** (on comble ses trous en priorité) ;
3. Celle qui a la **charge la plus faible** sur la période (équilibrage).

**R5.7** — Mode alternatif paramétrable : `Concentrer` — remplir au maximum les journées de certaines employées pour en libérer d'autres complètement (utile pour réduire les coûts sur les jours creux).

**R5.8** — Le planning multi-employées se lit en **colonnes parallèles**, une par praticienne, sur une même échelle horaire.

---

## 6. Prestations à domicile

**R6.1** — Une prestation peut être marquée `domicile`, `en salon`, ou `les deux`.

**R6.2** — Un rendez-vous à domicile bloque en plus un **temps de trajet aller et retour**, invisible pour la cliente.

**R6.3** — Le trajet est estimé par **zone géographique** déclarée (ex. « ma commune : 15 min », « communes limitrophes : 30 min »). Pas de calcul d'itinéraire en V1 — trop de complexité pour le gain.

**R6.4** — Les **frais de déplacement** sont automatiquement ajoutés au montant, selon la zone.

**R6.5** — Deux rendez-vous à domicile consécutifs doivent respecter le trajet **entre les deux adresses**, pas seulement le retour au salon.

---

## 7. Réservation : règles de gestion

**R7.1** — La cliente ne crée **jamais de compte**. Identification par téléphone + nom.

**R7.2** — Si le téléphone correspond à une cliente existante, le rendez-vous est **rattaché à sa fiche** (pas de doublon créé).

**R7.3** — **Verrouillage anti-collision** : un créneau sélectionné est réservé temporairement pendant 10 minutes le temps de finaliser. Deux clientes ne peuvent pas confirmer le même créneau. Règle critique : un double-booking détruit la confiance.

**R7.4** — Mode de validation paramétrable : **automatique** (confirmé immédiatement) ou **manuel** (la pro accepte ou refuse sous X heures, sinon la demande expire).

**R7.5** — Un **questionnaire de contre-indications** peut être exigé avant certaines prestations (PMU). Tant qu'il n'est pas rempli, le rendez-vous reste en attente.

**R7.6** — Cumul de prestations : les durées bloquées s'**additionnent**, les temps de préparation et nettaoyage intermédiaires ne se cumulent qu'une fois si les prestations s'enchaînent dans la même salle.

---

## 8. Acomptes, annulations, modifications

**R8.1** — L'acompte se règle **par prestation** : aucun, montant fixe, ou pourcentage.

**R8.2** — Un acompte peut être rendu **obligatoire selon le score de fiabilité** de la cliente (§9).

**R8.3** — **Délai d'annulation libre** paramétrable (défaut : 24 h). Au-delà, l'acompte est conservé selon la politique affichée.

**R8.4** — Toute annulation libère le créneau et **déclenche automatiquement la liste d'attente** (§10).

**R8.5** — Une modification par la cliente est traitée comme *annulation + nouvelle réservation*, en conservant l'acompte.

**R8.6** — Un rendez-vous non pointé après son heure passe automatiquement en `à qualifier` : la pro indique *honoré*, *annulé* ou *absente*. Cette qualification alimente le score de fiabilité.

---

## 9. Score de fiabilité cliente

**R9.1** — Score sur 100. Une nouvelle cliente démarre à **80** (neutre).

**R9.2** — Barème :

| Événement | Impact |
|---|---|
| Rendez-vous honoré | +3 (plafonné à 100) |
| Retard supérieur à 15 min | −5 |
| Annulation dans les délais | 0 |
| Annulation hors délai | −10 |
| Absence non prévenue (no-show) | −25 |

**R9.3** — Seuils d'usage :
- **> 75** — aucune contrainte ;
- **50 à 75** — acompte recommandé (suggéré à la pro) ;
- **< 50** — acompte **obligatoire** à la réservation en ligne.

**R9.4** — Le score est **visible par la pro uniquement**, jamais par la cliente.

**R9.5** — La pro peut **corriger manuellement** un événement (une annulation justifiée ne doit pas pénaliser injustement).

---

## 10. Liste d'attente & remplissage automatique

**R10.1** — Une cliente s'inscrit en liste d'attente avec : prestation souhaitée + **plages de disponibilité** (jours et tranches horaires) + horizon.

**R10.2** — À la libération d'un créneau, le système sélectionne les candidates dont la prestation **tient dans le créneau** et dont les disponibilités **couvrent** le créneau.

**R10.3** — Tri des candidates : score de fiabilité décroissant, puis ancienneté d'inscription en liste.

**R10.4** — Envoi **par vagues de 3**, avec un délai de 15 min entre chaque vague. La première qui confirme obtient le créneau ; les autres reçoivent un message neutre (« le créneau vient d'être pris »).

**R10.5** — Le créneau est **verrouillé** dès la première confirmation (même règle qu'en R7.3).

**R10.6** — Si personne ne confirme, le créneau redevient simplement disponible en ligne.

**R10.7** — La pro peut désactiver le remplissage automatique et **proposer manuellement**.

---

## 11. PMU & traçabilité

**R11.1** — Une prestation peut être marquée `PMU`, ce qui rend obligatoires : consentement signé, questionnaire de contre-indications, et fiche de traçabilité.

**R11.2** — Le rendez-vous **ne peut pas être clôturé** tant que la fiche de traçabilité n'est pas complétée (pigment, lot, péremption, matériel).

**R11.3** — **Alerte bloquante** si un pigment sélectionné est **périmé** ou si son lot n'est pas renseigné.

**R11.4** — La retouche est planifiée automatiquement dans une **fenêtre recommandée** définie par prestation (ex. 4 à 8 semaines). Un rappel part à l'ouverture de la fenêtre.

**R11.5** — Le **consentement à l'image** est distinct du consentement aux soins. Sans lui, les photos sont stockées mais **non utilisables** en communication (marquage automatique).

**R11.6** — Les photos avant/après sont **horodatées** et rattachées à la séance, non modifiables après clôture.

---

## 12. Stock

**R12.1** — Chaque produit a : quantité, unité, seuil d'alerte, et pour les pigments : lot + date de péremption.

**R12.2** — Alerte automatique quand `quantité ≤ seuil`, affichée en notification et sur le tableau de bord.

**R12.3** — Alerte de péremption à **30 jours** de l'échéance.

**R12.4** — Un produit périmé ne peut plus être sélectionné dans une fiche de traçabilité (§11.3).

**R12.5** — La déduction automatique du stock à la réalisation d'une prestation est **V2** : elle nécessite de lier chaque prestation à ses consommables et à leurs quantités.

---

## 13. Caisse

**R13.1** — L'encaissement reprend automatiquement les prestations du rendez-vous, modifiables.

**R13.2** — L'**acompte déjà versé est déduit** du solde à payer.

**R13.3** — Paiement **fractionnable** en plusieurs moyens (ex. 30 € espèces + 70 € carte).

**R13.4** — Toute vente génère un **reçu** ; la facture est disponible sur demande.

**R13.5** — Un encaissement clôture le rendez-vous et le marque `honoré` (alimente le score de fiabilité).

---

## 14. Matrice des notifications

| Événement | Cliente | Pro |
|---|---|---|
| Réservation confirmée | SMS + email | Notification |
| Demande en attente de validation | Email | Notification |
| Rappel J-1 (24 h) | SMS | — |
| Rappel J-0 (2 h) | SMS | — |
| Annulation par la cliente | Email de confirmation | Notification |
| Annulation par la pro | SMS + email | — |
| Créneau proposé (liste d'attente) | SMS | — |
| Retouche PMU à planifier | SMS | Notification |
| Stock faible / péremption | — | Notification |
| Acompte reçu | Email | Notification |

**R14.1** — Les rappels sont **bidirectionnels** : réponses `OUI` (confirme), `NON` (annule), `STOP` (désinscription obligatoire sur le promotionnel).

**R14.2** — Les délais de rappel sont **paramétrables par la pro** (24 h et 2 h par défaut).

**R14.3** — Aucun envoi automatique entre **21 h et 8 h** : les messages sont mis en file et partent à l'ouverture.

**R14.4** — Chaque message décompte le **quota** ; à quota épuisé, la pro est alertée et les rappels basculent en email seul jusqu'à rechargement.

---

## 15. Cas limites à traiter dès la conception

Ce sont les oublis classiques qui coûtent des jours de correction :

**R15.1** — Prestation **plus longue que la journée d'ouverture** → refusée à la création.

**R15.2** — **Changement d'horaires** alors que des RDV existent hors des nouvelles plages → ils sont conservés et signalés en conflit, jamais supprimés silencieusement.

**R15.3** — **Suppression d'une prestation** encore utilisée par des RDV futurs → archivage, pas suppression.

**R15.4** — **Suppression d'une employée** avec des RDV à venir → réaffectation obligatoire avant désactivation.

**R15.5** — **Changement d'heure** (mars et octobre) → tout stocker en UTC, afficher en heure locale française.

**R15.6** — **Deux clientes, même numéro** (mère et fille) → autorisé, avec avertissement de doublon potentiel.

**R15.7** — **Numéro invalide** → détecté au format à la saisie ; échec d'envoi SMS remonté à la pro (sinon les rappels échouent en silence).

**R15.8** — **RDV chevauchant deux jours** (rare, soin de nuit) → interdit en V1.

**R15.9** — **Réservation pendant une modification d'agenda** → le verrou R7.3 s'applique aussi aux blocages manuels.

**R15.10** — **Retour arrière** : toute annulation, suppression ou modification est **journalisée** (qui, quand, quoi) pour pouvoir expliquer un litige.

---

## 16. Réglages exposés à la pro

Pour éviter de tout coder en dur — ces valeurs doivent être modifiables sans redéploiement :

- Battement par défaut entre rendez-vous ;
- Granularité des créneaux ;
- Délai minimum et horizon maximum de réservation ;
- Mode de validation (auto / manuel) ;
- Politique et délai d'annulation ;
- Montants d'acompte par prestation ;
- Seuils du score de fiabilité ;
- Délais et canaux des rappels ;
- Stratégie d'optimisation du planning (`optimiser` / `laisser le choix` / `concentrer`) ;
- Zones et frais de déplacement ;
- Seuils d'alerte de stock.
