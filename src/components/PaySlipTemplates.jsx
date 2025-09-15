import React from 'react';
import { Card, Button } from '@mui/material';
import { FileText, Download, Eye } from 'lucide-react';

// Modèles de fiches de paie alignés avec les renderers PDF implémentés
const PAYSLIP_TEMPLATES = [
  {
    id: 'eneo',
    name: 'ENEO (officiel)',
    description: 'Format détaillé conforme ENEO Cameroun',
    preview: '/templates/payslip-eneo.png',
    features: [
      'Encadré principal ENEO',
      'Tableau gains/retentions détaillé',
      'Récapitulatif brut/SBT/SBC',
      'Net à payer en évidence',
    ],
  },
  {
    id: 'classic',
    name: 'Classique',
    description: 'Modèle compact en sections',
    preview: '/templates/payslip-classic.png',
    features: [
      'Sections claires',
      'Totaux visibles',
      'Tableaux simples',
    ],
  },
  {
    id: 'bulletin_paie',
    name: 'Bulletin de Paie',
    description: 'Style français avec en-tête jaune',
    preview: '/templates/payslip-bulletin.png',
    features: [
      'En-tête jaune',
      'Bloc entreprise + salarié',
      'Tableau récapitulatif',
    ],
  },
  {
    id: 'compta_online',
    name: 'Compta Online',
    description: 'Thème violet avec en-tête',
    preview: '/templates/payslip-compta.png',
    features: [
      'Header violet',
      'Bloc salarié à droite',
      'Tableau principal',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Thème bleu avec tableaux de résumé',
    preview: '/templates/payslip-enterprise.png',
    features: [
      'Header entreprise',
      'Bloc salarié bleu',
      'Résumé bas de page',
    ],
  },
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