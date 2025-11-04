import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service pour gérer les demandes d'upgrade des comptes démo
 */
export const upgradeService = {
  /**
   * Soumettre une demande d'upgrade
   * @param {Object} upgradeData - Données de la demande d'upgrade
   * @returns {Promise<string>} - ID du document créé
   */
  async submitUpgradeRequest(upgradeData) {
    try {
      const requestData = {
        ...upgradeData,
        status: 'pending', // pending, contacted, converted, rejected
        submittedAt: serverTimestamp(),
        source: 'demo_upgrade',
        priority: upgradeData.selectedPlan === 'enterprise' ? 'high' : 'medium',
        notes: '',
        followUpDate: null,
        convertedAt: null
      };

      const docRef = await addDoc(collection(db, 'upgrade_requests'), requestData);
      
      // Log pour le suivi
      console.log('Demande d\'upgrade soumise:', {
        id: docRef.id,
        company: upgradeData.companyName,
        plan: upgradeData.selectedPlan,
        email: upgradeData.email
      });

      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la soumission de la demande d\'upgrade:', error);
      throw new Error('Impossible de soumettre la demande. Veuillez réessayer.');
    }
  },

  /**
   * Envoyer une notification email (à implémenter avec votre service d'email)
   * @param {Object} upgradeData - Données de la demande
   */
  async sendNotificationEmail(upgradeData) {
    try {
      // Ici vous pouvez intégrer votre service d'email (SendGrid, Mailgun, etc.)
      // Pour l'instant, on simule l'envoi
      console.log('Email de notification envoyé:', {
        to: 'admin@prhm.com',
        subject: `Nouvelle demande d'upgrade - ${upgradeData.companyName}`,
        data: upgradeData
      });

      // Exemple d'intégration avec une fonction Cloud Functions
      // await fetch('/api/send-upgrade-notification', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(upgradeData)
      // });

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      // Ne pas faire échouer la demande si l'email ne peut pas être envoyé
      return false;
    }
  },

  /**
   * Créer un lead dans le CRM (à implémenter selon votre CRM)
   * @param {Object} upgradeData - Données de la demande
   */
  async createCRMLead(upgradeData) {
    try {
      // Exemple d'intégration avec un CRM
      const leadData = {
        company: upgradeData.companyName,
        contact_name: upgradeData.contactName,
        email: upgradeData.email,
        phone: upgradeData.phone,
        employee_count: upgradeData.employeeCount,
        selected_plan: upgradeData.selectedPlan,
        current_software: upgradeData.currentSoftware,
        specific_needs: upgradeData.specificNeeds,
        preferred_start_date: upgradeData.preferredStartDate,
        source: 'PRHM Demo',
        status: 'New Lead',
        priority: upgradeData.selectedPlan === 'enterprise' ? 'High' : 'Medium'
      };

      console.log('Lead CRM créé:', leadData);

      // Ici vous pouvez intégrer votre CRM (HubSpot, Salesforce, etc.)
      // await fetch('/api/crm/create-lead', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(leadData)
      // });

      return true;
    } catch (error) {
      console.error('Erreur lors de la création du lead CRM:', error);
      return false;
    }
  },

  /**
   * Traitement complet d'une demande d'upgrade
   * @param {Object} upgradeData - Données de la demande
   */
  async processUpgradeRequest(upgradeData) {
    try {
      // 1. Sauvegarder la demande dans Firestore
      const requestId = await this.submitUpgradeRequest(upgradeData);

      // 2. Envoyer notification email (en arrière-plan)
      this.sendNotificationEmail(upgradeData).catch(console.error);

      // 3. Créer lead dans le CRM (en arrière-plan)
      this.createCRMLead(upgradeData).catch(console.error);

      return {
        success: true,
        requestId,
        message: 'Demande d\'upgrade soumise avec succès'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erreur lors de la soumission de la demande'
      };
    }
  }
};

export default upgradeService;
