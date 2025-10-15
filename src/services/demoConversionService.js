import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Service de conversion de compte démo vers compte client
 */
export const demoConversionService = {
  /**
   * Convertit un compte démo en compte client réel
   * @param {Object} demoData - Données du compte démo
   * @param {Object} conversionData - Données de conversion saisies par l'utilisateur
   * @param {string} userId - UID de l'utilisateur Firebase
   * @returns {Promise<string>} ID du nouveau client créé
   */
  async convertDemoToClient(demoData, conversionData, userId) {
    try {
      // Créer le document client réel
      const clientData = {
        // Informations de base
        name: conversionData.companyName,
        address: conversionData.companyAddress,
        phone: conversionData.companyPhone,
        email: conversionData.companyEmail,

        // Informations légales
        taxId: conversionData.taxId,
        cnpsNumber: conversionData.cnpsNumber,
        sector: conversionData.sector,
        employeeCount: parseInt(conversionData.employeeCount),

        // Métadonnées administrateur
        adminUid: userId,
        adminName: `${demoData.firstName} ${demoData.lastName}`,
        adminEmail: demoData.originalEmail,

        // Statut et plan
        isActive: true,
        planType: conversionData.planType,
        licenseExpiry: null, // À définir par l'administration

        // Métadonnées de conversion
        convertedFromDemo: true,
        demoConvertedAt: serverTimestamp(),
        createdAt: serverTimestamp(),

        // Statistiques de connexion
        lastLogin: new Date().toISOString(),
        loginCount: 1,

        // Configuration par défaut
        settings: {
          currency: 'FCFA',
          language: 'fr',
          timezone: 'Africa/Douala',
          fiscalYearStart: '01-01',
          payrollFrequency: 'monthly',
          autoBackup: true,
          notifications: {
            email: true,
            sms: false,
            push: true
          }
        },

        // Métriques initiales
        metrics: {
          totalEmployees: 0,
          activeEmployees: 0,
          totalPayrolls: 0,
          complianceRate: 100,
          lastPayrollDate: null
        }
      };

      // Créer le document client
      const clientRef = await addDoc(collection(db, 'clients'), clientData);

      console.log('Client converti créé avec succès:', clientRef.id);

      return clientRef.id;

    } catch (error) {
      console.error('Erreur lors de la conversion du compte démo:', error);
      throw new Error(`Échec de la conversion: ${error.message}`);
    }
  },

  /**
   * Valide les données de conversion
   * @param {Object} conversionData - Données à valider
   * @returns {Object} {isValid: boolean, errors: string[]}
   */
  validateConversionData(conversionData) {
    const errors = [];

    // Validation des champs requis
    if (!conversionData.companyName?.trim()) {
      errors.push('Le nom de l\'entreprise est requis');
    }

    if (!conversionData.companyAddress?.trim()) {
      errors.push('L\'adresse de l\'entreprise est requise');
    }

    if (!conversionData.companyPhone?.trim()) {
      errors.push('Le téléphone de l\'entreprise est requis');
    }

    if (!conversionData.companyEmail?.includes('@')) {
      errors.push('L\'email de l\'entreprise doit être valide');
    }

    if (!conversionData.taxId?.trim()) {
      errors.push('L\'identifiant fiscal est requis');
    }

    if (!conversionData.cnpsNumber?.trim()) {
      errors.push('Le numéro CNPS de l\'entreprise est requis');
    }

    if (!conversionData.sector?.trim()) {
      errors.push('Le secteur d\'activité est requis');
    }

    if (!conversionData.employeeCount || conversionData.employeeCount < 1) {
      errors.push('Le nombre d\'employés doit être supérieur à 0');
    }

    // Validation du format téléphone (Cameroun)
    const phoneRegex = /^(\+237|237)?[6-9]\d{8}$/;
    if (conversionData.companyPhone && !phoneRegex.test(conversionData.companyPhone.replace(/\s/g, ''))) {
      errors.push('Le format du téléphone n\'est pas valide pour le Cameroun');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Génère une configuration par défaut pour un nouveau client
   * @param {string} planType - Type de plan choisi
   * @returns {Object} Configuration par défaut
   */
  generateDefaultConfig(planType) {
    const baseConfig = {
      maxEmployees: planType === 'starter' ? 50 : planType === 'professional' ? 200 : 1000,
      features: {
        basicPayroll: true,
        advancedReporting: planType !== 'starter',
        multiCompany: planType === 'enterprise',
        apiAccess: planType === 'enterprise',
        prioritySupport: planType !== 'starter'
      },
      limits: {
        monthlyPayrolls: planType === 'starter' ? 100 : planType === 'professional' ? 500 : 2000,
        storageGB: planType === 'starter' ? 5 : planType === 'professional' ? 25 : 100
      }
    };

    return baseConfig;
  },

  /**
   * Envoie une notification de conversion réussie
   * @param {string} clientId - ID du nouveau client
   * @param {Object} conversionData - Données de conversion
   */
  async sendConversionNotification(clientId, conversionData) {
    // Ici on pourrait intégrer un service de notification par email
    // Pour l'instant, on log simplement
    console.log('Notification de conversion à envoyer:', {
      clientId,
      companyName: conversionData.companyName,
      adminEmail: conversionData.companyEmail,
      planType: conversionData.planType
    });

    // TODO: Intégrer un service d'email (SendGrid, Mailgun, etc.)
    // await emailService.sendConversionConfirmation(clientId, conversionData);
  }
};
