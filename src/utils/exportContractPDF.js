// src/utils/exportContractPDF.js
// Fonction unique d'export de contrat PDF - utilise UNIQUEMENT generateContractPDFCameroon

import { generateContractPDFCameroon } from './pdfTemplates/contractTemplateCameroon';
import { toCameroonTemplateData, validateContractData } from './contractAdapter';
import { toast } from 'react-toastify';

/**
 * Fonction unique pour exporter un contrat PDF
 * Utilise UNIQUEMENT le générateur de la section Documents (generateContractPDFCameroon)
 * 
 * @param {Object} employee - Données de l'employé
 * @param {Object} companyData - Données de l'entreprise  
 * @param {Object} contract - Données du contrat
 * @param {Object} options - Options d'export (optionnel)
 * @returns {Promise<Object>} Résultat de l'export { success: boolean, fileName?: string, error?: string }
 */
export async function exportContractPDF(employee, companyData, contract, options = {}) {
  try {
    console.log('[exportContractPDF] Début export contrat PDF unifié');
    console.log('[exportContractPDF] Employee:', employee?.name);
    console.log('[exportContractPDF] Contract type:', contract?.type);

    // Validation des données
    const validation = validateContractData(employee, companyData, contract);
    if (!validation.isValid) {
      const errorMessage = `Données manquantes pour générer le contrat: ${validation.errors.join(', ')}`;
      console.error('[exportContractPDF]', errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    // Conversion vers le format attendu par generateContractPDFCameroon
    const contractData = toCameroonTemplateData(employee, companyData, contract);
    
    console.log('[exportContractPDF] Données converties pour générateur Cameroun:', contractData);

    // Génération du PDF via le générateur unique (section Documents)
    const result = await generateContractPDFCameroon(contractData);
    
    if (result && result.completed) {
      const successMessage = `Contrat ${contract.type} généré avec succès pour ${employee.name}`;
      console.log('[exportContractPDF]', successMessage);
      toast.success(successMessage);
      
      return { 
        success: true, 
        fileName: result.fileName,
        contractData: contractData 
      };
    } else {
      throw new Error('Échec de la génération du PDF');
    }

  } catch (error) {
    const errorMessage = `Erreur lors de l'export du contrat: ${error.message}`;
    console.error('[exportContractPDF]', errorMessage, error);
    toast.error(errorMessage);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Fonction d'export spécialisée pour les contrats depuis la gestion des employés
 * @param {Object} employee - Employé avec employee.contract
 * @param {Object} companyData - Données entreprise
 * @returns {Promise<Object>} Résultat de l'export
 */
export async function exportEmployeeContract(employee, companyData) {
  if (!employee.contract) {
    const error = 'Aucun contrat trouvé pour cet employé';
    toast.error(error);
    return { success: false, error };
  }

  return exportContractPDF(employee, companyData, employee.contract);
}

/**
 * Fonction d'export pour les contrats créés via DocumentsManager
 * (les données sont déjà au bon format)
 * @param {Object} contractDocumentData - Données du document contrat
 * @returns {Promise<Object>} Résultat de l'export
 */
export async function exportDocumentContract(contractDocumentData) {
  try {
    console.log('[exportDocumentContract] Export contrat depuis Documents');
    
    // Les données viennent de DocumentsManager, elles sont déjà au bon format
    const result = await generateContractPDFCameroon(contractDocumentData);
    
    if (result && result.completed) {
      const successMessage = 'Contrat généré avec succès depuis Documents';
      console.log('[exportDocumentContract]', successMessage);
      toast.success(successMessage);
      
      return { 
        success: true, 
        fileName: result.fileName 
      };
    } else {
      throw new Error('Échec de la génération du PDF');
    }

  } catch (error) {
    const errorMessage = `Erreur lors de l'export du contrat: ${error.message}`;
    console.error('[exportDocumentContract]', errorMessage, error);
    toast.error(errorMessage);
    
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

export default exportContractPDF;
