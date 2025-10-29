// src/config/documentConfig.js
// Configuration centralisée des types de documents

import { FiFileText } from 'react-icons/fi';
import { DOCUMENT_FIELDS } from './documentFields';

export const DOCUMENT_TYPES = {
  offers: {
    title: 'Offres d\'emploi',
    icon: FiFileText,
    color: 'blue',
    collection: 'documents',
    pdfGenerator: 'generateOfferLetterPDF',
    fields: DOCUMENT_FIELDS.offers
  },
  attestations: {
    title: 'Attestations de virement',
    icon: FiFileText,
    color: 'green',
    collection: 'documents',
    pdfGenerator: 'generateAttestationPDFCameroon',
    fields: DOCUMENT_FIELDS.attestations
  },
  certificates: {
    title: 'Certificats de travail',
    icon: FiFileText,
    color: 'purple',
    collection: 'documents',
    pdfGenerator: 'generateCertificatePDFCameroon',
    fields: DOCUMENT_FIELDS.certificates
  },
  contracts: {
    title: 'Contrats de travail',
    icon: FiFileText,
    color: 'orange',
    collection: 'documents',
    pdfGenerator: 'generateContractPDFCameroon',
    fields: DOCUMENT_FIELDS.contracts
  },
  amendments: {
    title: 'Avenants au contrat',
    icon: FiFileText,
    color: 'indigo',
    collection: 'documents',
    pdfGenerator: 'generateContractAmendmentPDFCameroon',
    fields: DOCUMENT_FIELDS.amendments
  }
};

// Mapping des générateurs PDF
export const PDF_GENERATORS = {
  offers: 'generateOfferLetterPDF',
  attestations: 'generateAttestationPDFCameroon',
  certificates: 'generateCertificatePDFCameroon',
  contracts: 'exportDocumentContract',
  amendments: 'generateContractAmendmentPDFCameroon'
};
