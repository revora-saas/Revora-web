# Revora — Adaptation par métier

Comment l'interface se configure selon l'activité, sans multiplier les versions du produit.

> **Suite du document « Règles métier détaillées ». Règles numérotées M1, M2… pour être citées pendant la construction.**

---

## 1. Le principe : un noyau, des profils

**M1.1** — Il n'existe **qu'une seule application**. Le métier ne change pas le code, il change une **configuration**.

Construire une interface par métier serait fatal : chaque correction devrait être répétée huit fois, et chaque nouveau métier coûterait un développement complet. Le bon modèle :

```
NOYAU COMMUN  (identique pour tous)
   agenda · clients · prestations · caisse · stock · réglages
        +
PROFIL MÉTIER  (une configuration, pas du code)
   vocabulaire · modules activés · catalogue par défaut
   champs de fiche cliente · widgets d'accueil · durées types
```

**M1.2** — Un profil métier est un **objet de configuration** décrivant :

| Élément | Rôle |
|---|---|
| `vocabulaire` | Les mots affichés (cliente/client, cabine/fauteuil/poste) |
| `modules` | Les fonctions activées ou masquées |
| `catalogue_defaut` | Les prestations pré-remplies avec leurs durées |
| `fiche_technique` | Les champs métier de la fiche cliente |
| `widgets_accueil` | Ce qui s'affiche sur le tableau de bord |
| `reglages_defaut` | Battements, délais, cycles de rappel |

**M1.3** — Les profils sont **additifs**. Une coiffeuse qui fait aussi du PMU active les deux : elle obtient le temps de pose **et** la traçabilité des pigments.

**M1.4** — Tout reste **modifiable**. Le profil pose des valeurs de départ intelligentes, jamais des contraintes définitives. Un module masqué reste activable dans les réglages.

**M1.5** — Un module non activé est **totalement invisible** : ni menu, ni champ vide, ni onglet grisé. Une ongulaire ne doit jamais voir le mot « pigment ».

---

## 2. Ce qui ne varie jamais

Pour garder le produit cohérent et maintenable :

**M2.1** — La structure de navigation (barre d'onglets), l'identité visuelle, le moteur de créneaux, la caisse, le système anti no-show et la logique de fiabilité sont **identiques pour tous**.

**M2.2** — Ce qui varie : le **vocabulaire**, les **modules visibles**, les **champs de fiche technique**, les **contenus par défaut** et l'**ordre des priorités à l'écran**.

---

## 3. Les profils métier

### 3.1 Prothésiste ongulaire

| | |
|---|---|
| **Vocabulaire** | cliente · prestation · poste |
| **Modules clés** | Cycle de remplissage · Photos portfolio · Allergies |
| **Fiche technique** | Allergies (résine, méthacrylate) · Forme et longueur habituelles · Type de pose |
| **Catalogue type** | Pose complète gel · Remplissage · Dépose · Semi-permanent · Nail art |
| **Spécificité forte** | **Cycle de remplissage 3–4 semaines** : rappel automatique à l'approche de l'échéance |
| **Accueil** | RDV du jour · Remplissages à relancer · Stock (gels, capsules) |

### 3.2 Technicienne cils

| | |
|---|---|
| **Vocabulaire** | cliente · prestation · cabine |
| **Modules clés** | Fiche de mapping · Cycle de remplissage · Test d'allergie |
| **Fiche technique** | Courbure · Épaisseur · Longueurs · Mapping · **Date du patch test colle** |
| **Catalogue type** | Pose cil à cil · Volume russe · Remplissage · Dépose · Rehaussement |
| **Spécificité forte** | **Patch test obligatoire** avant une première pose : alerte bloquante si absent |
| **Accueil** | RDV du jour · Remplissages à venir · Premières poses sans patch test |

### 3.3 Brow Artist / PMU (dermographe)

| | |
|---|---|
| **Vocabulaire** | cliente · prestation · poste de travail |
| **Modules clés** | **Traçabilité pigments · Consentements · Dossier ARS · Retouches** |
| **Fiche technique** | Phototype · Contre-indications · Mapping · Pigment et lot · Séance n° |
| **Catalogue type** | Microblading · Poudré · Lèvres · Eyeliner · Retouche · Consultation |
| **Spécificité forte** | Prestation **non clôturable** sans fiche de traçabilité complète |
| **Accueil** | RDV du jour · Retouches à planifier · Consentements manquants · Pigments périmés |

### 3.4 Coiffure femme

| | |
|---|---|
| **Vocabulaire** | cliente · prestation · fauteuil / bac |
| **Modules clés** | **Temps de pose · Formule couleur · Forfaits** |
| **Fiche technique** | **Formule couleur (nuances, dosage, oxydant, temps)** · Longueur · Nature du cheveu · Historique des formules |
| **Catalogue type** | Coupe · Brushing · Couleur · Balayage · Mèches · Soin · Forfait coupe + couleur |
| **Spécificité forte** | **L'historique des formules couleur** — la fonction la plus réclamée du métier, et le temps de pose réutilisable |
| **Accueil** | RDV du jour · Taux de remplissage · Temps de pose exploitables |

### 3.5 Barbier / coiffeur homme

| | |
|---|---|
| **Vocabulaire** | **client** · prestation · fauteuil |
| **Modules clés** | **File d'attente sans rendez-vous** · Fidélité simple · Prestations courtes |
| **Fiche technique** | Coupe habituelle · Numéro de sabot · Préférences |
| **Catalogue type** | Coupe · Barbe · Coupe + barbe · Contours · Rasage traditionnel |
| **Spécificité forte** | **Le walk-in** : beaucoup de clients arrivent sans réserver. File d'attente avec temps estimé, en plus de l'agenda |
| **Accueil** | File d'attente en cours · RDV du jour · Recette du jour |
| **Modules masqués** | Photos avant/après, consentements, traçabilité |

### 3.6 Esthéticienne / institut

| | |
|---|---|
| **Vocabulaire** | cliente · soin · cabine |
| **Modules clés** | **Cabines (ressources) · Cures multi-séances · Diagnostic peau** |
| **Fiche technique** | Type de peau · Contre-indications (grossesse, traitements) · Zones · Cure en cours |
| **Catalogue type** | Soin visage · Épilation · Massage · Gommage · Cure amincissante |
| **Spécificité forte** | **Cures** : forfait de N séances, décompte automatique et relance |
| **Accueil** | RDV du jour · Cures en cours · Occupation des cabines |

### 3.7 Maquilleuse professionnelle

| | |
|---|---|
| **Vocabulaire** | cliente · prestation · déplacement |
| **Modules clés** | **Événementiel · Devis · Domicile · Essai + jour J** |
| **Fiche technique** | Type d'événement · Date de l'événement · Teint · Allergies · Photos d'inspiration |
| **Catalogue type** | Essai mariée · Maquillage mariée · Maquillage soirée · Groupe · Shooting |
| **Spécificité forte** | **Le couple essai / jour J** : deux rendez-vous liés, réservés ensemble, avec acompte élevé |
| **Accueil** | Prochains événements · Devis en attente · Essais à programmer |

### 3.8 Spa / centre de soins

| | |
|---|---|
| **Vocabulaire** | client · soin · cabine |
| **Modules clés** | **Cabines multiples · Soins en duo · Cures · Équipe** |
| **Fiche technique** | Contre-indications · Préférences (pression, huiles) · Cure en cours |
| **Catalogue type** | Massage · Soin corps · Duo · Accès spa · Forfait journée |
| **Spécificité forte** | **Soins en duo** : deux clients, deux praticiennes, une cabine, sur le même créneau |
| **Accueil** | Occupation des cabines · RDV du jour · Cures en cours |

---

## 4. La fiche cliente modulaire

C'est là que l'adaptation métier est la plus visible.

**M4.1** — La fiche cliente se compose d'un **tronc commun** (identité, historique, notes, dépenses, fiabilité) et de **blocs techniques** ajoutés par les profils actifs.

**M4.2** — Chaque bloc technique est **historisé par séance**, jamais écrasé. On doit pouvoir comparer la formule couleur d'il y a six mois avec celle d'aujourd'hui.

**M4.3** — Blocs par métier :

| Métier | Bloc technique historisé |
|---|---|
| Ongulaire | Type de pose, forme, longueur, produits |
| Cils | Courbure, épaisseur, mapping, patch test |
| PMU | Pigment, lot, péremption, profondeur, zone, séance |
| Coiffure | **Formule couleur, dosage, oxydant, temps de pose** |
| Esthétique | Diagnostic peau, zones, cure |
| Maquillage | Teint, produits, photos d'inspiration |

**M4.4** — Les **alertes santé** (allergies, contre-indications, patch test) remontent **en haut de fiche**, en évidence, quel que soit le métier. Une allergie enterrée dans un onglet est un risque réel.

---

## 5. L'accueil adaptatif

**M5.1** — Le tableau de bord affiche des **widgets pondérés par le profil métier**. Même bibliothèque de widgets, ordre différent.

**M5.2** — Bibliothèque commune : RDV du jour · Recette du jour · Taux de remplissage · Nouvelles clientes · Notifications · Stock faible · Relances à faire.

**M5.3** — Widgets spécifiques activés par profil : Retouches à planifier (PMU) · Remplissages à venir (ongles, cils) · File d'attente (barbier) · Cures en cours (esthétique, spa) · Temps de pose exploitables (coiffure) · Événements à venir (maquillage).

**M5.4** — La pro peut **réordonner ou masquer** ses widgets. Le profil ne fait que proposer un ordre pertinent au départ.

---

## 6. Onboarding : comment le profil se choisit

**M6.1** — Première question à l'inscription : **« Quelle est votre activité principale ? »** — choix visuel, une carte par métier.

**M6.2** — Deuxième question : **« Proposez-vous aussi… ? »** — activités complémentaires en cases à cocher. C'est ce qui active les modules additionnels.

**M6.3** — Troisième question : **« Travaillez-vous seule ou en équipe ? »** — masque toute la partie équipe si elle est seule (gain de simplicité majeur).

**M6.4** — Quatrième question : **« En salon, à domicile, ou les deux ? »** — active le module déplacement.

**M6.5** — À l'issue, l'espace est **pré-rempli** : catalogue type, durées réalistes, temps techniques, champs de fiche adaptés. La pro n'a plus qu'à ajuster ses prix.

**M6.6** — Le profil est **modifiable à tout moment** dans les réglages, sans perte de données. Changer de profil n'efface jamais l'historique.

---

## 7. Règles de construction

**M7.1** — Aucune règle métier ne doit être écrite **en dur** dans un écran. Tout passe par la configuration du profil.

**M7.2** — Ajouter un nouveau métier doit se limiter à **écrire une configuration**, sans toucher au code des écrans. C'est le test de validité de l'architecture.

**M7.3** — Les blocs de fiche technique sont **déclaratifs** : un schéma de champs (libellé, type, obligatoire) interprété par un composant unique. Pas un écran par métier.

**M7.4** — Le vocabulaire passe par une **table de libellés** par profil, jamais par des chaînes codées en dur.

**M7.5** — En cas de doute sur un module, la règle est : **masquer par défaut, activable ensuite**. La simplicité perçue est un argument de vente ; on peut toujours ajouter, on récupère mal une première impression de complexité.

---

## 8. Priorisation

**M8.1** — En V1, ne construire que **trois profils complets** : ceux de ta cible de lancement. Le mécanisme de configuration doit exister dès le départ, mais pas les huit profils.

**M8.2** — Les autres profils sont ajoutés **à la demande**, au fil des premiers clients — chacun ne coûtant alors qu'une configuration.

**M8.3** — Un profil « **Autre / généraliste** » sert de repli : noyau commun, sans module spécialisé. Il évite de bloquer une inscription hors cible.
