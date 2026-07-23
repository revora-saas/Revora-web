# Revora — Base de données clientes

Structure, maîtrise et conformité du fichier client.

> **Suite des documents « Règles métier » et « Adaptation par métier ». Règles numérotées C1, C2… pour être citées pendant la construction.**

---

## 1. Principe : la base appartient à la professionnelle

**C1.1** — Les données clientes appartiennent à la **professionnelle**, pas à Revora. Juridiquement : elle est **responsable de traitement**, Revora est **sous-traitant**. Cela impose un contrat de sous-traitance (DPA) accepté à l'inscription.

**C1.2** — Conséquence commerciale : **l'export doit être libre, complet et à tout moment**. C'est un argument de vente face aux plateformes qui retiennent les données — et un puissant réducteur de friction à l'inscription (« tu peux repartir avec ton fichier quand tu veux »).

**C1.3** — **Aucun partage entre comptes.** Si une même personne fréquente deux salons utilisant Revora, ce sont **deux fiches indépendantes**, jamais reliées. C'est exigé par le RGPD et cohérent avec le refus de la marketplace.

**C1.4** — Revora n'exploite **jamais** les fichiers clients à des fins commerciales propres. À écrire noir sur blanc dans les CGU : c'est un argument de confiance.

---

## 2. Structure de la fiche cliente

### 2.1 Identité

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `civilite` | liste | non | Mme, M., non précisé |
| `nom` | texte | **oui** | |
| `prenom` | texte | non | |
| `date_naissance` | date | non | Alimente les offres anniversaire |
| `photo` | image | non | Reconnaissance rapide |

### 2.2 Contact

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `telephone_mobile` | téléphone | **oui** | **Clé d'identification** — indispensable aux rappels |
| `telephone_fixe` | téléphone | non | |
| `email` | email | non | Requis si envoi de factures ou confirmations par mail |
| `canal_prefere` | liste | non | SMS · WhatsApp · Email |

**C2.1** — Le **mobile est la clé d'identification** d'une cliente. Sans lui, ni rappel ni anti no-show : c'est le seul champ vraiment indispensable avec le nom.

### 2.3 Adresse

| Champ | Type | Obligatoire | Notes |
|---|---|---|---|
| `adresse`, `complement`, `code_postal`, `ville` | texte | non | **Obligatoires si prestation à domicile** |
| `zone_deplacement` | liste | auto | Déduite du code postal, détermine les frais |
| `notes_acces` | texte | non | Étage, code, stationnement — très utile en domicile |

### 2.4 Données techniques et de santé

**C2.2** — Ces champs relèvent de la **catégorie sensible** au sens du RGPD. Ils exigent un consentement explicite, un affichage protégé et une traçabilité des accès.

| Champ | Type | Notes |
|---|---|---|
| `allergies` | texte + étiquettes | **Affiché en haut de fiche, en alerte** |
| `contre_indications` | texte + étiquettes | Grossesse, traitement, pathologie |
| `fiche_technique` | bloc par métier | Historisé par séance (voir M4.2) |

### 2.5 Suivi commercial (calculé, non saisi)

| Champ | Calcul |
|---|---|
| `nombre_visites` | RDV honorés |
| `total_depense` | Somme des encaissements |
| `panier_moyen` | Total ÷ visites |
| `derniere_visite` | Date du dernier RDV honoré |
| `frequence_moyenne` | Intervalle moyen entre visites |
| `prochaine_visite_estimee` | Dernière visite + fréquence moyenne |
| `score_fiabilite` | Voir R9 |
| `praticienne_habituelle` | La plus fréquente |

**C2.3** — `prochaine_visite_estimee` alimente automatiquement les relances : une cliente qui vient tous les 28 jours et qu'on n'a pas vue depuis 45 jours **remonte en liste de relance**.

### 2.6 Segmentation

| Champ | Type | Notes |
|---|---|---|
| `statut` | auto | Nouvelle · Régulière · Fidèle · Inactive · À risque |
| `etiquettes` | libres | Créées par la pro (« VIP », « mariage », « sensible ») |
| `source` | liste | Instagram · bouche-à-oreille · passage · réservation en ligne · import |
| `notes_privees` | texte | Jamais visible par la cliente |

**C2.4** — Règles de statut automatique : **Nouvelle** (< 2 visites) · **Régulière** (2 à 5) · **Fidèle** (> 5) · **Inactive** (aucune visite depuis 2 × sa fréquence moyenne, ou 6 mois par défaut) · **À risque** (fiabilité < 50).

### 2.7 Consentements

| Champ | Type | Notes |
|---|---|---|
| `consentement_sms` | booléen + date | Rappels transactionnels : légitimes sans opt-in |
| `consentement_marketing` | booléen + date | **Opt-in obligatoire** pour toute promotion |
| `consentement_image` | booléen + date | Usage des photos en communication |
| `consentement_donnees_sante` | booléen + date | Requis pour allergies et contre-indications |

**C2.5** — Distinction juridique à respecter absolument : un **rappel de rendez-vous** est transactionnel (pas d'opt-in requis), une **promotion** est du marketing (opt-in obligatoire + mention STOP). Ce sont deux flux séparés.

---

## 3. Saisie, normalisation, validation

**C3.1** — **Création rapide** : lors de la prise de rendez-vous, deux champs suffisent — **nom + mobile**. Un formulaire complet à ce moment casserait le rythme de travail.

**C3.2** — **Enrichissement progressif** : la fiche se complète ensuite, avec un indicateur de complétude (« fiche remplie à 60 % »).

**C3.3** — **Normalisation automatique** :
- Téléphone stocké au format international (`+33…`), mais **recherchable dans tous les formats** (`06…`, `+336…`, avec ou sans espaces) ;
- Email en minuscules, sans espaces ;
- Nom et prénom avec majuscule initiale.

**C3.4** — **Validation à la saisie** : format du téléphone vérifié, email contrôlé. Un numéro invalide est signalé **immédiatement** — sinon les rappels échouent en silence (voir R15.7).

---

## 4. Doublons et fusion

**C4.1** — Détection automatique à la création : même mobile, même email, ou nom très proche + même code postal.

**C4.2** — Alerte non bloquante : deux personnes peuvent légitimement partager un numéro (mère et fille, voir R15.6).

**C4.3** — **Fusion** de deux fiches : les historiques de rendez-vous, encaissements, photos et fiches techniques sont **conservés et cumulés**. En cas de conflit sur un champ, la pro choisit la valeur à garder.

**C4.4** — La fusion est **journalisée et réversible pendant 30 jours**.

---

## 5. Recherche, filtres, listes

**C5.1** — **Recherche instantanée** dès 2 caractères, portant sur nom, prénom, téléphone et email. Cas d'usage prioritaire : la cliente appelle, la pro tape les 4 derniers chiffres du numéro.

**C5.2** — Recherche **tolérante aux fautes** (« Dubois » trouve « Duboit »).

**C5.3** — Filtres combinables : statut · étiquette · praticienne habituelle · dernière visite · prestation déjà réalisée · fiabilité · consentement marketing · code postal.

**C5.4** — Tris : alphabétique · dernière visite · total dépensé · nombre de visites · fiabilité.

**C5.5** — **Vues enregistrées** : une combinaison de filtres peut être sauvegardée (« Mes fidèles inactives depuis 3 mois ») et devient une cible de relance en un clic.

---

## 6. Import et export

**C6.1** — **Import** depuis CSV/Excel et depuis les contacts du téléphone, avec :
- correspondance manuelle des colonnes ;
- **aperçu avant validation** ;
- détection des doublons ;
- rapport de fin (importées / ignorées / en erreur) ;
- **annulation possible** de l'import entier.

**C6.2** — L'import est déterminant pour la conversion de l'essai : si la pro ne migre pas ses clientes, elle ne restera pas.

**C6.3** — **Export** complet en CSV/Excel, incluant l'historique. Disponible sans condition, y compris après résiliation (délai de récupération de 30 jours).

**C6.4** — **Export individuel** d'une fiche en PDF (droit d'accès RGPD).

---

## 7. Actions groupées

**C7.1** — Sur une sélection ou une vue enregistrée : ajouter ou retirer une étiquette · exporter · lancer une campagne (V2) · archiver.

**C7.2** — La **suppression groupée est interdite**. Trop dangereuse, aucun bénéfice réel.

---

## 8. Historique et traçabilité

**C8.1** — Toute modification d'une fiche est **journalisée** : qui, quand, quel champ, ancienne et nouvelle valeur.

**C8.2** — Les accès aux **données de santé** sont journalisés séparément (exigence de protection renforcée).

**C8.3** — L'historique est consultable par la pro, non modifiable.

---

## 9. RGPD : conservation, effacement, anonymisation

C'est le point le plus délicat, et il faut le trancher maintenant.

**C9.1** — **Le conflit :** une cliente demande l'effacement de ses données, mais la traçabilité PMU (consentement, pigment, lot) constitue une **preuve légale** qui doit être conservée. Effacer détruirait la protection juridique de la praticienne.

**C9.2** — **La solution : anonymiser, ne pas supprimer.** Sur demande d'effacement :
- identité, contact et adresse sont **effacés définitivement** ;
- l'historique technique et comptable est **conservé sous forme anonymisée** (rattaché à un identifiant, sans nom) ;
- les **photos sont supprimées** (données biométriques, aucune obligation de conservation) ;
- une **attestation d'effacement** est générée pour la cliente.

**C9.3** — Les données comptables (factures, encaissements) relèvent d'une **obligation légale de conservation** et ne peuvent pas être effacées sur simple demande. À expliquer clairement dans la politique de confidentialité.

**C9.4** — **Durées de conservation** paramétrées : fiches inactives signalées après 3 ans sans contact, avec proposition d'archivage ou d'anonymisation. La CNIL retient le principe du « dernier contact actif ».

**C9.5** — **Archiver ≠ supprimer.** Une fiche archivée sort des listes actives mais conserve son historique, et peut être réactivée.

**C9.6** — Un **registre des traitements** et une politique de confidentialité type sont fournis à la pro : elle est responsable de traitement, la plupart ignorent leurs obligations. C'est un service à forte valeur perçue.

---

## 10. Sécurité

**C10.1** — **Isolation stricte par compte** (sécurité au niveau des lignes en base) : aucune requête ne peut atteindre les données d'un autre établissement. C'est la règle de sécurité la plus critique du produit.

**C10.2** — Chiffrement au repos et en transit. Photos servies par **URL signée à durée limitée**, jamais par lien public devinable.

**C10.3** — En équipe (V2), l'accès aux données de santé et aux notes privées est **restreint par rôle**.

**C10.4** — Sauvegardes quotidiennes, restaurables sur 30 jours.

---

## 11. Écrans

**C11.1** — **Liste clientes** : recherche en haut, filtres rapides, ligne = photo, nom, téléphone, dernière visite, étiquette de statut.

**C11.2** — **Fiche cliente** en onglets : *Profil* · *Historique* · *Fiche technique* · *Photos* · *Notes*.

**C11.3** — **Bandeau d'alerte permanent** en haut de fiche si allergie, contre-indication ou fiabilité faible. Jamais dissimulé dans un onglet.

**C11.4** — **Actions rapides** depuis la fiche : appeler · envoyer un message · prendre rendez-vous · encaisser.

**C11.5** — Sur mobile, la liste doit rester fluide avec plusieurs milliers de fiches (chargement progressif).
