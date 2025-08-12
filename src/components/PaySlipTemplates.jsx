import React from 'react';
import { Card, Button } from '@mui/material';
import { FileText, Download, Eye } from 'lucide-react';

// Modèles de fiches de paie prédéfinis avec tous les éléments requis
const PAYSLIP_TEMPLATES = [
  {
    id: 'template1',
    name: 'Modèle Standard Camerounais',
    description: 'Fiche de paie conforme aux normes camerounaises avec logo',
    preview: '/templates/payslip-standard.png',
    features: [
      'Logo entreprise en en-tête',
      'Informations employeur complètes (CNPS, adresse)',
      'Données employé détaillées (matricule, catégorie, échelon)',
      'Calculs CNPS, IRPP, CAC, CFC',
      'Heures supplémentaires (normales, dimanche, nuit)',
      'Primes et indemnités',
      'Signature et cachet obligatoires'
    ],
    layout: 'classic',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'signature']
  },
  {
    id: 'template2',
    name: 'Modèle Simplifié Moderne',
    description: 'Design épuré avec mise en page moderne et QR code',
    preview: '/templates/payslip-simple.png',
    features: [
      'Design moderne et épuré',
      'Logo entreprise intégré',
      'Code QR pour vérification',
      'Informations essentielles uniquement',
      'Mise en page claire et lisible',
      'Couleurs professionnelles'
    ],
    layout: 'modern',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'summary', 'qr']
  },
  {
    id: 'template3',
    name: 'Modèle Détaillé Complet',
    description: 'Fiche de paie avec tous les détails et calculs',
    preview: '/templates/payslip-detailed.png',
    features: [
      'Toutes les informations légales',
      'Historique des primes et indemnités',
      'Calculs détaillés CNPS et fiscaux',
      'Notes et commentaires',
      'Ancienneté et congés',
      'Supervision et validation'
    ],
    layout: 'detailed',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'history', 'notes', 'signature']
  },
  {
    id: 'template4',
    name: 'Modèle Entreprise Premium',
    description: 'Fiche de paie professionnelle avec branding complet',
    preview: '/templates/payslip-business.png',
    features: [
      'Logo et branding entreprise',
      'Design professionnel premium',
      'Informations complètes et structurées',
      'Signature digitale intégrée',
      'Filigrane de sécurité',
      'Format haute qualité'
    ],
    layout: 'premium',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'deductions', 'summary', 'security', 'signature']
  },
  {
    id: 'template5',
    name: 'Modèle CNPS Officiel',
    description: 'Format conforme aux exigences CNPS camerounaises',
    preview: '/templates/payslip-cnps.png',
    features: [
      'Format officiel CNPS',
      'Tous les champs obligatoires',
      'Calculs CNPS précis',
      'Validation automatique',
      'Conformité légale',
      'Traçabilité complète'
    ],
    layout: 'official',
    hasLogo: true,
    sections: ['header', 'employee', 'salary', 'cnps', 'deductions', 'validation', 'signature']
  }
];

const PaySlipTemplates = ({ onSelectTemplate, selectedTemplate, onPreview, onDownload }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Modèles de Fiches de Paie</h2>
        <p className="text-gray-600">Choisissez un modèle pour votre fiche de paie</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {PAYSLIP_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedTemplate === template.id
                  ? 'bg-blue-500 border-blue-500'
                  : 'border-gray-300'
              }`}>
                {selectedTemplate === template.id && (
                  <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu du modèle */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-500 ml-2">Aperçu du modèle</span>
            </div>

            {/* Fonctionnalités */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fonctionnalités :</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {template.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="small"
                variant="outlined"
                startIcon={<Eye className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(template);
                }}
                className="flex-1"
              >
                Aperçu
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Download className="w-4 h-4" />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(template);
                }}
                className="flex-1"
              >
                Télécharger
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 mb-2">
            Modèle sélectionné : <span className="font-medium text-blue-600">
              {PAYSLIP_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PaySlipTemplates; 