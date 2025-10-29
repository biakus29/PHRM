// src/utils/pdfGenerators.js
// Mapping centralisé des générateurs PDF

import { generateOfferLetterPDF } from './pdfTemplates/offerTemplateCameroon';
import { generateAttestationPDFCameroon } from './pdfTemplates/attestationTemplateCameroon';
import { generateCertificatePDFCameroon } from './pdfTemplates/certificateTemplateCameroon';
import { generateContractPDFCameroon } from './pdfTemplates/contractTemplateCameroon';
import { generateContractAmendmentPDFCameroon } from './pdfTemplates/contractAmendmentTemplateCameroon';
import { exportDocumentContract } from './exportContractPDF';

/**
 * Générateurs PDF par type de document
 */
const PDF_GENERATORS = {
  offers: (data, options) => {
    const offerOptions = {
      version: data.templateVersion || 'v2'
    };
    return generateOfferLetterPDF(data, offerOptions);
  },
  attestations: (data) => generateAttestationPDFCameroon(data),
  certificates: (data) => generateCertificatePDFCameroon(data),
  contracts: (data) => exportDocumentContract(data),
  amendments: (data) => generateContractAmendmentPDFCameroon(data)
};

/**
 * Génère un PDF pour un document donné
 * @param {Object} documentData - Données du document
 * @param {string} documentType - Type de document (offers, attestations, etc.)
 * @param {Object} options - Options supplémentaires
 * @returns {void}
 * @throws {Error} Si le type de document n'est pas supporté
 */
export const generateDocumentPDF = (documentData, documentType, options = {}) => {
  const generator = PDF_GENERATORS[documentType];
  
  if (!generator) {
    throw new Error(`Type de document non supporté: ${documentType}`);
  }
  
  try {
    generator(documentData, options);
  } catch (error) {
    console.error('Erreur lors de la génération PDF:', error);
    throw error;
  }
};

export default PDF_GENERATORS;
