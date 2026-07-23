# Revora — Cahier des fonctionnalités

*Le logiciel adapté à tous les professionnels de la beauté.*

Inventaire complet des fonctions de la plateforme, avec priorisation.

**Légende :** `V1` = indispensable au lancement · `V2` = après les premiers clients payants · `V3` = passage à l'échelle

> **Règle de survie :** cette liste est exhaustive, mais on ne construit que la colonne V1. Tout ce qui est V2/V3 est documenté pour ne pas être oublié — pas pour être développé maintenant. Une fonction ne monte en priorité que lorsqu'un client payant la réclame.

---

## 1. Principes de conception

- **Mobile-first.** Tout doit être utilisable d'une main, entre deux clientes.
- **Adapté au métier.** L'espace se configure selon l'activité déclarée : c'est la promesse de la marque, donc une fonction centrale, pas un gadget.
- **Fiabilité avant richesse.** Un agenda qui double-booke ou perd une réservation tue le produit. La solidité prime sur le nombre de fonctions.
- **Zéro friction pour la cliente finale.** Elle réserve sans créer de compte.
- **Français uniquement.** Pas de multilingue.

---

## 2. Le site public (vitrine)

| Fonction | Détail | Prio |
|---|---|---|
| Page d'accueil | Promesse, bénéfices, captures d'écran, preuve sociale | V1 |
| Page fonctionnalités | Détail par module | V1 |
| Page tarifs | Offre + essai gratuit, FAQ prix | V1 |
| Page métiers | Une page par métier (PMU, ongles, cils, coiffure…) — clé pour le SEO et la promesse « adapté » | V1 |
| Inscription / connexion | Création de compte, mot de passe oublié | V1 |
| Blog / ressources | Contenu SEO : réglementation PMU, gestion des no-shows | V2 |
| Page démo / vidéo | Démo produit interactive | V2 |
| Espace d'aide | Base de connaissances, tutoriels | V2 |
| Mentions légales | CGU, CGV, politique de confidentialité, cookies | V1 |

---

## 3. Inscription & onboarding intelligent

C'est ici que se joue la conversion : la pro doit atteindre son premier vrai usage en moins de 10 minutes.

| Fonction | Détail | Prio |
|---|---|---|
| Choix de l'activité principale | Configure l'espace, le vocabulaire et les modules | V1 |
| Activités complémentaires | Ex. une coiffeuse ajoute maquillage + domicile | V1 |
| Prestations pré-remplies | Catalogue type proposé selon le métier, modifiable | V1 |
| Horaires d'ouverture | Jours, plages, pauses | V1 |
| Import des clientes | Depuis contacts téléphone ou fichier CSV/Excel | V1 |
| Profil professionnel | Nom commercial, logo, adresse, téléphone | V1 |
| Checklist de démarrage | Progression visible : « 3 étapes avant votre premier RDV » | V1 |
| Onboarding assisté | Accompagnement humain à la configuration (option payante) | V2 |

---

## 4. Agenda & rendez-vous

| Fonction | Détail | Prio |
|---|---|---|
| Vue jour | Écran par défaut, colonne horaire | V1 |
| Vue semaine | Vision de la charge | V1 |
| Vue mois | Vue d'ensemble | V2 |
| Création de RDV | Cliente + prestation + heure, en moins de 30 secondes | V1 |
| Durée automatique | Calculée depuis la prestation choisie | V1 |
| Plusieurs prestations par RDV | Cumul des durées et des prix | V1 |
| Temps de battement | Marge automatique entre deux RDV | V1 |
| Blocage de créneaux | Pause déjeuner, perso, formation | V1 |
| Déplacer / annuler | Glisser-déposer ou édition, avec notification cliente | V1 |
| Statuts de RDV | À venir, confirmé, honoré, annulé, absent | V1 |
| Congés & absences | Fermeture sur une période | V1 |
| RDV à domicile | Adresse, temps de trajet, frais de déplacement | V1 |
| RDV récurrents | Cliente qui revient toutes les 4 semaines | V2 |
| Synchronisation calendrier | Google Agenda, Apple Calendrier | V2 |
| Vue multi-praticiennes | Colonnes par employée | V2 |

---

## 5. Réservation en ligne (page publique)

| Fonction | Détail | Prio |
|---|---|---|
| Page de réservation publique | Lien partageable + QR code, sans compte pour la cliente | V1 |
| Vitrine du professionnel | Photo, présentation, prestations, tarifs, avis | V1 |
| Choix prestation → créneau | Créneaux réels en temps réel | V1 |
| Formulaire cliente | Nom, téléphone, email, message | V1 |
| Validation manuelle ou auto | La pro choisit son mode | V1 |
| Activer / désactiver la résa | Pour fermer quand on est complet | V1 |
| Questionnaire préalable | Contre-indications avant certaines prestations (PMU) | V1 |
| Acompte à la réservation | Paiement en ligne pour bloquer le créneau | V1 |
| Choix de la praticienne | Quand il y a une équipe | V2 |
| Réservation de forfaits | Plusieurs séances d'un coup | V2 |

---

## 6. Anti no-show (le cœur du produit)

| Fonction | Détail | Prio |
|---|---|---|
| Rappels automatiques | SMS + email, programmables (ex. 24 h et 2 h avant) | V1 |
| Rappels bidirectionnels | La cliente confirme, annule ou demande à décaler en répondant | V1 |
| Confirmation de réservation | Message immédiat après la prise de RDV | V1 |
| Acompte | Montant fixe ou pourcentage, par prestation | V1 |
| Politique d'annulation | Délai, conditions, acompte conservé ou remboursé | V1 |
| Score de fiabilité cliente | Calculé sur présences, annulations tardives, retards | V1 |
| Historique des no-shows | Visible sur la fiche cliente | V1 |
| Liste d'attente | Clientes en attente d'un créneau | V1 |
| Remplissage automatique | Un créneau libéré est proposé automatiquement aux personnes en attente | V1 |
| Rappels WhatsApp | Via l'API officielle (prestataire, templates validés) | V1.1 |
| Acompte obligatoire conditionnel | Exigé automatiquement au-delà d'un certain risque | V2 |

---

## 7. Clients

| Fonction | Détail | Prio |
|---|---|---|
| Fiche cliente | Coordonnées, date de naissance, source | V1 |
| Historique des RDV | Passés et à venir, avec prestations et montants | V1 |
| Notes privées | Remarques de la praticienne | V1 |
| Allergies & contre-indications | Champ mis en évidence, alerte avant le RDV | V1 |
| Photos avant / après | Galerie par prestation, avec consentement | V1 |
| Préférences | Produits, teintes, habitudes | V1 |
| Total dépensé | Valeur de la cliente | V1 |
| Recherche & filtres | Par nom, téléphone, statut (fidèle, nouvelle, inactive) | V1 |
| Fusion de doublons | Nettoyage de la base | V2 |
| Export / suppression RGPD | Droit d'accès et à l'effacement | V1 |
| Points de fidélité | Cumul et paliers | V2 |
| Anniversaires | Liste + message automatique | V2 |

---

## 8. Dossier technique & conformité PMU (le moat)

C'est la profondeur métier que les généralistes n'ont pas. À traiter avec sérieux : ce sont des données sensibles et une obligation légale.

| Fonction | Détail | Prio |
|---|---|---|
| Consentement éclairé | Généré, signé sur écran, horodaté, archivé | V1 |
| Consentement à l'image | Autorisation distincte pour l'usage des photos | V1 |
| Fiche technique de séance | Zone traitée, technique, profondeur, remarques | V1 |
| Traçabilité pigment | Marque, teinte, numéro de lot, péremption, conformité REACH | V1 |
| Traçabilité matériel | Aiguilles, usage unique, référence | V1 |
| Suivi des retouches | Date recommandée + rappel automatique | V1 |
| Dossier « prêt contrôle » | Export PDF complet par cliente | V1 |
| Attestation de formation | Stockage du certificat hygiène & salubrité de la pro | V1 |
| Registre d'hygiène | Suivi des procédures et DASRI | V2 |
| Signalement d'effets indésirables | Aide à la déclaration | V2 |

---

## 9. Prestations & catalogue

| Fonction | Détail | Prio |
|---|---|---|
| Création de prestations | Nom, durée, prix, description, photo | V1 |
| Catégories | Regroupement par famille | V1 |
| Options / suppléments | Ajouts facturés | V1 |
| Frais de déplacement | Pour le domicile, fixe ou par zone | V1 |
| Prestations sur devis | Prix variable, à confirmer | V2 |
| Promotions & codes promo | Réduction ponctuelle | V2 |
| Forfaits multi-séances | Carnet de séances prépayées | V2 |
| Cartes cadeaux | Vente et suivi du solde | V2 |
| Abonnements clientes | Formule mensuelle | V3 |

---

## 10. Caisse & paiements

| Fonction | Détail | Prio |
|---|---|---|
| Encaissement | Sélection prestations + produits, total automatique | V1 |
| Moyens de paiement | Espèces, carte, virement, lien de paiement | V1 |
| Paiement en ligne | Stripe (acomptes et soldes) | V1 |
| Paiement partiel | Acompte déjà versé déduit du solde | V1 |
| Reçu / facture | Génération et envoi | V1 |
| Remboursements | Total ou partiel | V1 |
| Historique des encaissements | Journal par jour | V1 |
| Clôture de caisse | Total du jour, écarts | V2 |
| Terminal de paiement | Lecteur physique | V3 |

---

## 11. Finance & pilotage

| Fonction | Détail | Prio |
|---|---|---|
| Chiffre d'affaires | Jour, semaine, mois | V1 |
| Dépenses | Saisie simple avec catégories | V1 |
| Rapports | Journalier, hebdomadaire, mensuel | V1 |
| Export comptable | CSV / Excel pour le comptable | V1 |
| Préparation e-reporting | Export des ventes B2C (échéance 2027) | V1 |
| Statistiques d'activité | Taux de remplissage, nouvelles clientes, prestations populaires | V1 |
| Taux de rétention | Clientes qui reviennent | V2 |
| Bénéfice estimé | Recettes moins dépenses | V2 |
| Objectifs mensuels | Suivi vs objectif | V2 |
| Gestion TVA | Franchise en base ou assujetti | V2 |

---

## 12. Stock

| Fonction | Détail | Prio |
|---|---|---|
| Catalogue produits | Consommables, pigments, revente | V1 |
| Quantités & mouvements | Entrées et sorties manuelles | V1 |
| Alertes de stock faible | Seuil paramétrable, notification | V1 |
| Lots & péremption | Lié à la traçabilité PMU | V1 |
| Fournisseurs | Coordonnées et historique d'achat | V2 |
| Prix d'achat & marges | Rentabilité par produit | V2 |
| Déduction automatique | Le stock baisse quand une prestation est réalisée | V2 |
| Inventaire | Comptage périodique, écarts | V2 |
| Pertes & périmés | Motifs de sortie | V2 |
| Commandes fournisseurs | Bons de commande | V3 |

---

## 13. Vente de produits

| Fonction | Détail | Prio |
|---|---|---|
| Vente en caisse | Ajout d'un produit à l'encaissement | V1 |
| Historique d'achat cliente | Sur la fiche | V2 |
| Boutique en ligne | Vente à distance ou retrait au salon | V3 |

---

## 14. Marketing & fidélisation

| Fonction | Détail | Prio |
|---|---|---|
| Lien de réservation partageable | Instagram, WhatsApp, QR code | V1 |
| Demande d'avis | Message automatique après le RDV | V2 |
| Relance des inactives | Clientes sans RDV depuis X mois | V2 |
| Campagnes SMS / WhatsApp | Envoi groupé segmenté | V2 |
| Programme de fidélité | Points, paliers, récompenses | V2 |
| Offres anniversaire | Automatique | V2 |
| Parrainage | Cliente qui en amène une autre | V3 |

---

## 15. Équipe (V2) & multi-établissement (V3)

| Fonction | Détail | Prio |
|---|---|---|
| Profils employées | Fiche, prestations autorisées | V2 |
| Planning & horaires | Par employée | V2 |
| Absences & congés | Demandes et validation | V2 |
| Commissions | Calcul par prestation ou pourcentage | V2 |
| CA par employée | Performance individuelle | V2 |
| Droits d'accès | Rôles : propriétaire, employée, réceptionniste | V2 |
| Pointage | Arrivées / départs | V3 |
| Objectifs individuels | Suivi mensuel | V3 |
| Multi-établissements | Plusieurs salons sur un compte | V3 |
| Vue globale propriétaire | Consolidation de tous les établissements | V3 |
| Rôles avancés | Administrateur, responsable, comptable, permissions fines | V3 |

---

## 16. IA Revora

L'IA est un **accélérateur**, pas la promesse principale. Ce qui fait signer une pro, c'est de ne plus subir les lapins ; l'IA rend ensuite le quotidien plus fluide.

| Fonction | Détail | Prio |
|---|---|---|
| Rédaction de messages | Rappels, relances, promos — la pro valide | V1.1 |
| Résumé de fiche cliente | Avant le RDV : historique, préférences, alertes | V2 |
| Suggestion de créneau | Pour recaler un désistement au mieux | V2 |
| Bot de support intégré | Répond aux questions d'usage dans l'app | V2 |
| Analyse d'activité | Conseils : heures creuses, prestations rentables | V2 |
| Bot de réservation cliente | Prend les RDV en conversation (WhatsApp) | V3 |

---

## 17. Fonctions transverses

| Fonction | Détail | Prio |
|---|---|---|
| Compte & authentification | Inscription, connexion, mot de passe oublié | V1 |
| Paramètres du profil | Coordonnées, logo, horaires, politique d'annulation | V1 |
| Notifications internes | Nouveau RDV, annulation, stock faible | V1 |
| Notifications push | Via la PWA | V1 |
| Gestion de l'abonnement | Essai, facturation, changement de formule, résiliation | V1 |
| Crédits SMS | Quota inclus + achat de crédits | V1 |
| Mode hors-ligne | Consultation de l'agenda sans réseau, synchro au retour | V1 |
| Sauvegardes | Automatiques et restaurables | V1 |
| Sécurité des données | Isolation par compte, chiffrement, journaux d'accès | V1 |
| Conformité RGPD | Consentements, export, suppression, registre | V1 |
| Support | Contact, base d'aide | V1 |
| Authentification à deux facteurs | Sécurité renforcée | V2 |
| Journal d'activité | Historique des actions du compte | V2 |
| Application native | iOS / Android, si un besoin l'impose | V3 |

---

## 18. Ce qu'on ne fait PAS (garde-fou)

Décisions assumées, à ne pas remettre en question sans raison forte :

- **Pas de marketplace** (annuaire public où les clientes cherchent un pro). C'est le modèle de Planity/Treatwell, il exige une masse critique que tu n'auras pas, et il crée des commissions.
- **Pas de comptabilité légale complète.** Pré-compta + export au comptable, rien de plus.
- **Pas d'application native au lancement.** PWA uniquement.
- **Pas de multilingue.** Français seul.
- **Pas de gestion d'équipe en V1.** Cela reste le principal accélérateur de la V1.

---

## 19. Le périmètre V1 en une phrase

> Une pro s'inscrit, son espace se configure selon son métier, elle crée ses prestations, importe ses clientes, partage son lien de réservation, remplit son agenda, ses clientes reçoivent des rappels auxquels elles répondent, les désistements se remplacent tout seuls, elle encaisse, suit son chiffre d'affaires et son stock — et pour le PMU, elle constitue un dossier conforme prêt à présenter.

Tout le reste peut attendre.
