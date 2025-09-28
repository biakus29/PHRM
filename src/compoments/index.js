// Composants de base
export { default as PaySlipTemplateBase } from './PaySlipTemplateBase';

// Modèles de fiches de paie
export { default as PaySlipTemplateModern } from './PaySlipTemplateModern';
export { default as PaySlipTemplateClassic } from './PaySlipTemplateClassic';
export { default as PaySlipTemplateMinimal } from './PaySlipTemplateMinimal';

// Sélecteur de modèles
export { default as PaySlipTemplateSelector } from './PaySlipTemplateSelector';

// Composants existants (pour compatibilité)
export { default as ExportPaySlip } from './ExportPaySlip';
export { default as ExportContrat } from './ExportContrat';
export { default as PrimeIndemniteSelector } from './PrimeIndemniteSelector';

// Autres composants utilitaires
export { default as UserInfoDisplay } from './UserInfoDisplay';
export { default as EmployeeBadge } from './EmployeeBadge';
export { default as EmployeeBadgePinterest } from './EmployeeBadgePinterest';
export { default as EmployeeForm } from './EmployeeForm';
export { default as ExportBadgePDF } from './ExportBadgePDF';
export { default as QRCodeScanner } from './QRCodeScanner';
export { default as CotisationCNPS } from './CotisationCNPS';
export { default as Button } from './Button';
export { default as Card } from './card';

/**
 * Configuration des modèles de fiches de paie disponibles
 * Utile pour l'importation et la configuration externe
 */
export const PAYSLIP_TEMPLATES = {
  MODERN: 'modern',
  CLASSIC: 'classic', 
  MINIMAL: 'minimal',
  STANDARD: 'standard'
};

/**
 * Configuration des modèles avec leurs métadonnées
 */
export const TEMPLATE_CONFIGS = {
  [PAYSLIP_TEMPLATES.MODERN]: {
    name: 'Moderne',
    description: 'Design contemporain avec couleurs et mise en page attrayante',
    icon: '🎨',
    features: ['En-tête coloré', 'Design moderne', 'Couleurs distinctives']
  },
  [PAYSLIP_TEMPLATES.CLASSIC]: {
    name: 'Classique',
    description: 'Style traditionnel sobre et professionnel',
    icon: '📄',
    features: ['Design sobre', 'Police Times', 'Conformité réglementaire']
  },
  [PAYSLIP_TEMPLATES.MINIMAL]: {
    name: 'Minimaliste',
    description: 'Design épuré avec l\'essentiel uniquement',
    icon: '✨',
    features: ['Ultra épuré', 'Informations condensées', 'Économie papier']
  },
  [PAYSLIP_TEMPLATES.STANDARD]: {
    name: 'Standard',
    description: 'Modèle de base compatible avec l\'existant',
    icon: '📋',
    features: ['Compatible existant', 'Éprouvé', 'Rapide']
  }
};