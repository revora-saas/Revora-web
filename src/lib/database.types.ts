// =====================================================================
// REVORA — Types TypeScript de la base (schéma public)
// Généré par introspection depuis specs/revora-schema.sql + migrations.
// Régénérable via `supabase gen types typescript` une fois le projet lié.
// Ne pas éditer à la main : refléter les changements dans les migrations.
// =====================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      abonnements: {
        Row: {
          id: string
          etablissement_id: string
          formule: string
          statut: string
          essai_fin_le: string | null
          periode: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          quota_messages: number
          credits_restants: number
          renouvelle_le: string | null
        };
        Insert: {
          id?: string
          etablissement_id: string
          formule?: string
          statut?: string
          essai_fin_le?: string | null
          periode?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          quota_messages?: number
          credits_restants?: number
          renouvelle_le?: string | null
        };
        Update: {
          id?: string
          etablissement_id?: string
          formule?: string
          statut?: string
          essai_fin_le?: string | null
          periode?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          quota_messages?: number
          credits_restants?: number
          renouvelle_le?: string | null
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string
          etablissement_id: string
          nom: string
          ordre: number
        };
        Insert: {
          id?: string
          etablissement_id: string
          nom: string
          ordre?: number
        };
        Update: {
          id?: string
          etablissement_id?: string
          nom?: string
          ordre?: number
        };
        Relationships: [];
      };
      client_etiquettes: {
        Row: {
          client_id: string
          etiquette_id: string
        };
        Insert: {
          client_id: string
          etiquette_id: string
        };
        Update: {
          client_id?: string
          etiquette_id?: string
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string
          etablissement_id: string
          civilite: string | null
          nom: string
          prenom: string | null
          date_naissance: string | null
          photo_url: string | null
          telephone_mobile: string | null
          telephone_fixe: string | null
          email: string | null
          canal_prefere: string | null
          adresse: string | null
          complement: string | null
          code_postal: string | null
          ville: string | null
          notes_acces: string | null
          zone_deplacement_id: string | null
          allergies: string | null
          contre_indications: string | null
          nombre_visites: number
          total_depense: number
          derniere_visite: string | null
          frequence_moyenne_j: number | null
          score_fiabilite: number
          membre_habituel_id: string | null
          statut: string
          source: string | null
          notes_privees: string | null
          cree_le: string
          archive_le: string | null
          anonymise_le: string | null
        };
        Insert: {
          id?: string
          etablissement_id: string
          civilite?: string | null
          nom: string
          prenom?: string | null
          date_naissance?: string | null
          photo_url?: string | null
          telephone_mobile?: string | null
          telephone_fixe?: string | null
          email?: string | null
          canal_prefere?: string | null
          adresse?: string | null
          complement?: string | null
          code_postal?: string | null
          ville?: string | null
          notes_acces?: string | null
          zone_deplacement_id?: string | null
          allergies?: string | null
          contre_indications?: string | null
          nombre_visites?: number
          total_depense?: number
          derniere_visite?: string | null
          frequence_moyenne_j?: number | null
          score_fiabilite?: number
          membre_habituel_id?: string | null
          statut?: string
          source?: string | null
          notes_privees?: string | null
          cree_le?: string
          archive_le?: string | null
          anonymise_le?: string | null
        };
        Update: {
          id?: string
          etablissement_id?: string
          civilite?: string | null
          nom?: string
          prenom?: string | null
          date_naissance?: string | null
          photo_url?: string | null
          telephone_mobile?: string | null
          telephone_fixe?: string | null
          email?: string | null
          canal_prefere?: string | null
          adresse?: string | null
          complement?: string | null
          code_postal?: string | null
          ville?: string | null
          notes_acces?: string | null
          zone_deplacement_id?: string | null
          allergies?: string | null
          contre_indications?: string | null
          nombre_visites?: number
          total_depense?: number
          derniere_visite?: string | null
          frequence_moyenne_j?: number | null
          score_fiabilite?: number
          membre_habituel_id?: string | null
          statut?: string
          source?: string | null
          notes_privees?: string | null
          cree_le?: string
          archive_le?: string | null
          anonymise_le?: string | null
        };
        Relationships: [];
      };
      consentements: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string
          type: string
          accorde: boolean
          document_version: string | null
          document_url: string | null
          signature_url: string | null
          adresse_ip: string | null
          date_consentement: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id: string
          type: string
          accorde: boolean
          document_version?: string | null
          document_url?: string | null
          signature_url?: string | null
          adresse_ip?: string | null
          date_consentement?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string
          type?: string
          accorde?: boolean
          document_version?: string | null
          document_url?: string | null
          signature_url?: string | null
          adresse_ip?: string | null
          date_consentement?: string
        };
        Relationships: [];
      };
      depenses: {
        Row: {
          id: string
          etablissement_id: string
          libelle: string
          categorie: string | null
          montant: number
          date_depense: string
          justificatif_url: string | null
        };
        Insert: {
          id?: string
          etablissement_id: string
          libelle: string
          categorie?: string | null
          montant: number
          date_depense?: string
          justificatif_url?: string | null
        };
        Update: {
          id?: string
          etablissement_id?: string
          libelle?: string
          categorie?: string | null
          montant?: number
          date_depense?: string
          justificatif_url?: string | null
        };
        Relationships: [];
      };
      encaissement_lignes: {
        Row: {
          id: string
          encaissement_id: string
          type: string
          libelle: string
          quantite: number
          prix_unitaire: number
          produit_id: string | null
          prestation_id: string | null
        };
        Insert: {
          id?: string
          encaissement_id: string
          type: string
          libelle: string
          quantite?: number
          prix_unitaire?: number
          produit_id?: string | null
          prestation_id?: string | null
        };
        Update: {
          id?: string
          encaissement_id?: string
          type?: string
          libelle?: string
          quantite?: number
          prix_unitaire?: number
          produit_id?: string | null
          prestation_id?: string | null
        };
        Relationships: [];
      };
      encaissements: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string | null
          rendez_vous_id: string | null
          numero: string
          total_ht: number | null
          total_ttc: number
          acompte_deduit: number
          statut: string
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id?: string | null
          rendez_vous_id?: string | null
          numero: string
          total_ht?: number | null
          total_ttc?: number
          acompte_deduit?: number
          statut?: string
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string | null
          rendez_vous_id?: string | null
          numero?: string
          total_ht?: number | null
          total_ttc?: number
          acompte_deduit?: number
          statut?: string
          cree_le?: string
        };
        Relationships: [];
      };
      etablissement_metiers: {
        Row: {
          etablissement_id: string
          metier_code: string
          principal: boolean
        };
        Insert: {
          etablissement_id: string
          metier_code: string
          principal?: boolean
        };
        Update: {
          etablissement_id?: string
          metier_code?: string
          principal?: boolean
        };
        Relationships: [];
      };
      etablissements: {
        Row: {
          id: string
          nom: string
          slug: string
          telephone: string | null
          email: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          logo_url: string | null
          fuseau: string
          solo: boolean
          domicile: boolean
          cree_le: string
          archive_le: string | null
        };
        Insert: {
          id?: string
          nom: string
          slug: string
          telephone?: string | null
          email?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          logo_url?: string | null
          fuseau?: string
          solo?: boolean
          domicile?: boolean
          cree_le?: string
          archive_le?: string | null
        };
        Update: {
          id?: string
          nom?: string
          slug?: string
          telephone?: string | null
          email?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          logo_url?: string | null
          fuseau?: string
          solo?: boolean
          domicile?: boolean
          cree_le?: string
          archive_le?: string | null
        };
        Relationships: [];
      };
      etiquettes: {
        Row: {
          id: string
          etablissement_id: string
          nom: string
          couleur: string | null
        };
        Insert: {
          id?: string
          etablissement_id: string
          nom: string
          couleur?: string | null
        };
        Update: {
          id?: string
          etablissement_id?: string
          nom?: string
          couleur?: string | null
        };
        Relationships: [];
      };
      evenements_fiabilite: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string
          rendez_vous_id: string | null
          type: string
          impact: number
          commentaire: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id: string
          rendez_vous_id?: string | null
          type: string
          impact: number
          commentaire?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string
          rendez_vous_id?: string | null
          type?: string
          impact?: number
          commentaire?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      fiches_techniques: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string
          rendez_vous_id: string | null
          metier_code: string | null
          donnees: Json
          lot_id: string | null
          materiel: string | null
          zone: string | null
          numero_seance: number | null
          cloturee_le: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id: string
          rendez_vous_id?: string | null
          metier_code?: string | null
          donnees?: Json
          lot_id?: string | null
          materiel?: string | null
          zone?: string | null
          numero_seance?: number | null
          cloturee_le?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string
          rendez_vous_id?: string | null
          metier_code?: string | null
          donnees?: Json
          lot_id?: string | null
          materiel?: string | null
          zone?: string | null
          numero_seance?: number | null
          cloturee_le?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      horaires: {
        Row: {
          id: string
          etablissement_id: string
          membre_id: string | null
          jour_semaine: number
          heure_debut: string
          heure_fin: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          membre_id?: string | null
          jour_semaine: number
          heure_debut: string
          heure_fin: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          membre_id?: string | null
          jour_semaine?: number
          heure_debut?: string
          heure_fin?: string
        };
        Relationships: [];
      };
      indisponibilites: {
        Row: {
          id: string
          etablissement_id: string
          membre_id: string | null
          ressource_id: string | null
          motif: string | null
          type: string
          periode: string
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          membre_id?: string | null
          ressource_id?: string | null
          motif?: string | null
          type?: string
          periode: string
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          membre_id?: string | null
          ressource_id?: string | null
          motif?: string | null
          type?: string
          periode?: string
          cree_le?: string
        };
        Relationships: [];
      };
      journal_activite: {
        Row: {
          id: number
          etablissement_id: string
          user_id: string | null
          action: string
          entite: string
          entite_id: string | null
          avant: Json | null
          apres: Json | null
          cree_le: string
        };
        Insert: {
          id?: number
          etablissement_id: string
          user_id?: string | null
          action: string
          entite: string
          entite_id?: string | null
          avant?: Json | null
          apres?: Json | null
          cree_le?: string
        };
        Update: {
          id?: number
          etablissement_id?: string
          user_id?: string | null
          action?: string
          entite?: string
          entite_id?: string | null
          avant?: Json | null
          apres?: Json | null
          cree_le?: string
        };
        Relationships: [];
      };
      liste_attente: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string
          prestation_id: string
          membre_id: string | null
          disponibilites: Json
          horizon_le: string | null
          statut: string
          propose_le: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id: string
          prestation_id: string
          membre_id?: string | null
          disponibilites: Json
          horizon_le?: string | null
          statut?: string
          propose_le?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string
          prestation_id?: string
          membre_id?: string | null
          disponibilites?: Json
          horizon_le?: string | null
          statut?: string
          propose_le?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      lots: {
        Row: {
          id: string
          etablissement_id: string
          produit_id: string
          numero_lot: string
          date_peremption: string | null
          conforme_reach: boolean | null
          quantite: number
        };
        Insert: {
          id?: string
          etablissement_id: string
          produit_id: string
          numero_lot: string
          date_peremption?: string | null
          conforme_reach?: boolean | null
          quantite?: number
        };
        Update: {
          id?: string
          etablissement_id?: string
          produit_id?: string
          numero_lot?: string
          date_peremption?: string | null
          conforme_reach?: boolean | null
          quantite?: number
        };
        Relationships: [];
      };
      membre_prestations: {
        Row: {
          membre_id: string
          prestation_id: string
          duree_execution: number | null
        };
        Insert: {
          membre_id: string
          prestation_id: string
          duree_execution?: number | null
        };
        Update: {
          membre_id?: string
          prestation_id?: string
          duree_execution?: number | null
        };
        Relationships: [];
      };
      membres: {
        Row: {
          id: string
          etablissement_id: string
          user_id: string | null
          nom_affiche: string
          couleur: string | null
          role: Database["public"]["Enums"]["role_membre"]
          actif: boolean
        };
        Insert: {
          id?: string
          etablissement_id: string
          user_id?: string | null
          nom_affiche: string
          couleur?: string | null
          role?: Database["public"]["Enums"]["role_membre"]
          actif?: boolean
        };
        Update: {
          id?: string
          etablissement_id?: string
          user_id?: string | null
          nom_affiche?: string
          couleur?: string | null
          role?: Database["public"]["Enums"]["role_membre"]
          actif?: boolean
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string | null
          rendez_vous_id: string | null
          canal: string
          categorie: string
          destinataire: string
          contenu: string | null
          statut: string
          reponse: string | null
          cout_credits: number
          erreur: string | null
          planifie_le: string | null
          envoye_le: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id?: string | null
          rendez_vous_id?: string | null
          canal: string
          categorie: string
          destinataire: string
          contenu?: string | null
          statut?: string
          reponse?: string | null
          cout_credits?: number
          erreur?: string | null
          planifie_le?: string | null
          envoye_le?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string | null
          rendez_vous_id?: string | null
          canal?: string
          categorie?: string
          destinataire?: string
          contenu?: string | null
          statut?: string
          reponse?: string | null
          cout_credits?: number
          erreur?: string | null
          planifie_le?: string | null
          envoye_le?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      metiers: {
        Row: {
          code: string
          libelle: string
          configuration: Json
        };
        Insert: {
          code: string
          libelle: string
          configuration: Json
        };
        Update: {
          code?: string
          libelle?: string
          configuration?: Json
        };
        Relationships: [];
      };
      modeles_messages: {
        Row: {
          id: string
          etablissement_id: string | null
          code: string
          canal: string
          objet: string | null
          contenu: string
          actif: boolean
        };
        Insert: {
          id?: string
          etablissement_id?: string | null
          code: string
          canal: string
          objet?: string | null
          contenu: string
          actif?: boolean
        };
        Update: {
          id?: string
          etablissement_id?: string | null
          code?: string
          canal?: string
          objet?: string | null
          contenu?: string
          actif?: boolean
        };
        Relationships: [];
      };
      mouvements_stock: {
        Row: {
          id: string
          etablissement_id: string
          produit_id: string
          lot_id: string | null
          quantite: number
          motif: string
          rendez_vous_id: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          produit_id: string
          lot_id?: string | null
          quantite: number
          motif: string
          rendez_vous_id?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          produit_id?: string
          lot_id?: string | null
          quantite?: number
          motif?: string
          rendez_vous_id?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      occupations: {
        Row: {
          id: string
          etablissement_id: string
          rendez_vous_id: string | null
          indisponibilite_id: string | null
          membre_id: string | null
          ressource_id: string | null
          periode: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          rendez_vous_id?: string | null
          indisponibilite_id?: string | null
          membre_id?: string | null
          ressource_id?: string | null
          periode: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          rendez_vous_id?: string | null
          indisponibilite_id?: string | null
          membre_id?: string | null
          ressource_id?: string | null
          periode?: string
        };
        Relationships: [];
      };
      options_prestation: {
        Row: {
          id: string
          prestation_id: string
          nom: string
          prix: number
          duree_sup: number
        };
        Insert: {
          id?: string
          prestation_id: string
          nom: string
          prix?: number
          duree_sup?: number
        };
        Update: {
          id?: string
          prestation_id?: string
          nom?: string
          prix?: number
          duree_sup?: number
        };
        Relationships: [];
      };
      paiements: {
        Row: {
          id: string
          etablissement_id: string
          encaissement_id: string | null
          rendez_vous_id: string | null
          montant: number
          moyen: string
          type: string
          reference_externe: string | null
          cree_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          encaissement_id?: string | null
          rendez_vous_id?: string | null
          montant: number
          moyen: string
          type?: string
          reference_externe?: string | null
          cree_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          encaissement_id?: string | null
          rendez_vous_id?: string | null
          montant?: number
          moyen?: string
          type?: string
          reference_externe?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string
          fiche_technique_id: string | null
          type: string
          url: string
          utilisable_communication: boolean
          prise_le: string
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id: string
          fiche_technique_id?: string | null
          type: string
          url: string
          utilisable_communication?: boolean
          prise_le?: string
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string
          fiche_technique_id?: string | null
          type?: string
          url?: string
          utilisable_communication?: boolean
          prise_le?: string
        };
        Relationships: [];
      };
      prestation_ressources: {
        Row: {
          prestation_id: string
          ressource_id: string
        };
        Insert: {
          prestation_id: string
          ressource_id: string
        };
        Update: {
          prestation_id?: string
          ressource_id?: string
        };
        Relationships: [];
      };
      prestation_segments: {
        Row: {
          id: string
          prestation_id: string
          ordre: number
          libelle: string | null
          duree: number
          praticienne_occupee: boolean
        };
        Insert: {
          id?: string
          prestation_id: string
          ordre: number
          libelle?: string | null
          duree: number
          praticienne_occupee?: boolean
        };
        Update: {
          id?: string
          prestation_id?: string
          ordre?: number
          libelle?: string | null
          duree?: number
          praticienne_occupee?: boolean
        };
        Relationships: [];
      };
      prestations: {
        Row: {
          id: string
          etablissement_id: string
          categorie_id: string | null
          nom: string
          description: string | null
          photo_url: string | null
          prix: number
          duree_preparation: number
          duree_execution: number
          duree_nettoyage: number
          battement: number
          lieu: string
          pmu: boolean
          patch_test_requis: boolean
          cycle_rappel_jours: number | null
          reservable_en_ligne: boolean
          acompte_type: string | null
          acompte_valeur: number | null
          actif: boolean
          ordre: number
        };
        Insert: {
          id?: string
          etablissement_id: string
          categorie_id?: string | null
          nom: string
          description?: string | null
          photo_url?: string | null
          prix?: number
          duree_preparation?: number
          duree_execution?: number
          duree_nettoyage?: number
          battement?: number
          lieu?: string
          pmu?: boolean
          patch_test_requis?: boolean
          cycle_rappel_jours?: number | null
          reservable_en_ligne?: boolean
          acompte_type?: string | null
          acompte_valeur?: number | null
          actif?: boolean
          ordre?: number
        };
        Update: {
          id?: string
          etablissement_id?: string
          categorie_id?: string | null
          nom?: string
          description?: string | null
          photo_url?: string | null
          prix?: number
          duree_preparation?: number
          duree_execution?: number
          duree_nettoyage?: number
          battement?: number
          lieu?: string
          pmu?: boolean
          patch_test_requis?: boolean
          cycle_rappel_jours?: number | null
          reservable_en_ligne?: boolean
          acompte_type?: string | null
          acompte_valeur?: number | null
          actif?: boolean
          ordre?: number
        };
        Relationships: [];
      };
      produits: {
        Row: {
          id: string
          etablissement_id: string
          nom: string
          marque: string | null
          type: string
          unite: string | null
          seuil_alerte: number
          prix_achat: number | null
          prix_vente: number | null
          actif: boolean
        };
        Insert: {
          id?: string
          etablissement_id: string
          nom: string
          marque?: string | null
          type?: string
          unite?: string | null
          seuil_alerte?: number
          prix_achat?: number | null
          prix_vente?: number | null
          actif?: boolean
        };
        Update: {
          id?: string
          etablissement_id?: string
          nom?: string
          marque?: string | null
          type?: string
          unite?: string | null
          seuil_alerte?: number
          prix_achat?: number | null
          prix_vente?: number | null
          actif?: boolean
        };
        Relationships: [];
      };
      profils: {
        Row: {
          user_id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          telephone_verifie: boolean
          avatar_url: string | null
          cree_le: string
        };
        Insert: {
          user_id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          telephone_verifie?: boolean
          avatar_url?: string | null
          cree_le?: string
        };
        Update: {
          user_id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          telephone_verifie?: boolean
          avatar_url?: string | null
          cree_le?: string
        };
        Relationships: [];
      };
      rdv_prestations: {
        Row: {
          id: string
          rendez_vous_id: string
          prestation_id: string | null
          libelle: string
          prix: number
          duree_execution: number
          ordre: number
        };
        Insert: {
          id?: string
          rendez_vous_id: string
          prestation_id?: string | null
          libelle: string
          prix?: number
          duree_execution: number
          ordre?: number
        };
        Update: {
          id?: string
          rendez_vous_id?: string
          prestation_id?: string | null
          libelle?: string
          prix?: number
          duree_execution?: number
          ordre?: number
        };
        Relationships: [];
      };
      reglages: {
        Row: {
          etablissement_id: string
          battement_defaut: number
          granularite_creneaux: number
          delai_min_reservation: number
          horizon_max_jours: number
          validation_auto: boolean
          delai_annulation_h: number
          strategie_planning: string
          rappels: Json
          seuil_acompte_obligatoire: number
          zones_deplacement: Json
          autres: Json
        };
        Insert: {
          etablissement_id: string
          battement_defaut?: number
          granularite_creneaux?: number
          delai_min_reservation?: number
          horizon_max_jours?: number
          validation_auto?: boolean
          delai_annulation_h?: number
          strategie_planning?: string
          rappels?: Json
          seuil_acompte_obligatoire?: number
          zones_deplacement?: Json
          autres?: Json
        };
        Update: {
          etablissement_id?: string
          battement_defaut?: number
          granularite_creneaux?: number
          delai_min_reservation?: number
          horizon_max_jours?: number
          validation_auto?: boolean
          delai_annulation_h?: number
          strategie_planning?: string
          rappels?: Json
          seuil_acompte_obligatoire?: number
          zones_deplacement?: Json
          autres?: Json
        };
        Relationships: [];
      };
      rendez_vous: {
        Row: {
          id: string
          etablissement_id: string
          client_id: string | null
          membre_id: string | null
          debut_execution: string
          fin_execution: string
          debut_bloque: string
          fin_bloque: string
          statut: Database["public"]["Enums"]["statut_rdv"]
          origine: string
          a_domicile: boolean
          adresse_intervention: string | null
          montant_total: number
          acompte_du: number
          acompte_paye: number
          notes: string | null
          motif_annulation: string | null
          verrou_expire_le: string | null
          cree_le: string
          annule_le: string | null
        };
        Insert: {
          id?: string
          etablissement_id: string
          client_id?: string | null
          membre_id?: string | null
          debut_execution: string
          fin_execution: string
          debut_bloque: string
          fin_bloque: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
          origine?: string
          a_domicile?: boolean
          adresse_intervention?: string | null
          montant_total?: number
          acompte_du?: number
          acompte_paye?: number
          notes?: string | null
          motif_annulation?: string | null
          verrou_expire_le?: string | null
          cree_le?: string
          annule_le?: string | null
        };
        Update: {
          id?: string
          etablissement_id?: string
          client_id?: string | null
          membre_id?: string | null
          debut_execution?: string
          fin_execution?: string
          debut_bloque?: string
          fin_bloque?: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
          origine?: string
          a_domicile?: boolean
          adresse_intervention?: string | null
          montant_total?: number
          acompte_du?: number
          acompte_paye?: number
          notes?: string | null
          motif_annulation?: string | null
          verrou_expire_le?: string | null
          cree_le?: string
          annule_le?: string | null
        };
        Relationships: [];
      };
      ressources: {
        Row: {
          id: string
          etablissement_id: string
          nom: string
          type: string
          actif: boolean
        };
        Insert: {
          id?: string
          etablissement_id: string
          nom: string
          type: string
          actif?: boolean
        };
        Update: {
          id?: string
          etablissement_id?: string
          nom?: string
          type?: string
          actif?: boolean
        };
        Relationships: [];
      };

    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      mes_etablissements: {
        Args: Record<string, never>;
        Returns: string[];
      };
      creer_etablissement: {
        Args: { p_nom: string; p_slug: string; p_nom_affiche?: string };
        Returns: string;
      };
      logger_acces_sante: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      recalculer_stats_client: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      calculer_statut_client: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      rechercher_clients: {
        Args: {
          p_etablissement: string;
          p_recherche?: string;
          p_limit?: number;
          p_offset?: number;
        };
        Returns: Database["public"]["Tables"]["clients"]["Row"][];
      };
      anonymiser_cliente: {
        Args: { p_client_id: string };
        Returns: undefined;
      };
      fusionner_clientes: {
        Args: { p_garde: string; p_absorbe: string };
        Returns: undefined;
      };
      creer_rendez_vous: {
        Args: {
          p_etablissement: string;
          p_client_id: string | null;
          p_membre_id: string | null;
          p_debut_execution: string;
          p_fin_execution: string;
          p_debut_bloque: string;
          p_fin_bloque: string;
          p_occupations: Json;
          p_ressource_ids?: string[];
          p_statut?: string;
          p_origine?: string;
          p_montant_total?: number;
          p_acompte_du?: number;
          p_a_domicile?: boolean;
          p_adresse?: string | null;
          p_notes?: string | null;
          p_prestations?: Json;
        };
        Returns: string;
      };
    };
    Enums: {
      role_membre: "proprietaire" | "gestionnaire" | "employe" | "receptionniste"
      statut_rdv: "demande" | "confirme" | "a_qualifier" | "honore" | "annule" | "absent"

    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Raccourcis pratiques : type des lignes, insertions et mises à jour.
type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
