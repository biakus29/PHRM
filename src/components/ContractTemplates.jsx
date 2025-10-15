import React from 'react';
import { Card, Button } from '@mui/material';
import { FileText, Download, Eye } from 'lucide-react';

// Modèles de contrats prédéfinis
const CONTRACT_TEMPLATES = [
  {
    id: 'contract1',
    name: 'Contrat CDI Standard',
    description: 'Contrat à durée indéterminée classique',
    preview: '/templates/contract-cdi.png',
    type: 'CDI',
    features: [
      'Clauses légales complètes',
      'Conditions de travail',
      'Rémunération détaillée',
      'Clause de confidentialité',
      'Signature des parties'
    ]
  },
  {
    id: 'contract2',
    name: 'Contrat CDD Standard',
    description: 'Contrat à durée déterminée',
    preview: '/templates/contract-cdd.png',
    type: 'CDD',
    features: [
      'Durée déterminée',
      'Motif du CDD',
      'Conditions de renouvellement',
      'Indemnité de fin de contrat',
      'Clauses spécifiques CDD'
    ]
  }
];

const ContractTemplates = ({ onSelectTemplate, selectedTemplate, onPreview, onDownload }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Modèles de Contrats</h2>
        <p className="text-gray-600">Choisissez un modèle de contrat adapté à votre situation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CONTRACT_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id
                ? 'ring-2 ring-green-500 bg-green-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    template.type === 'CDI' ? 'bg-blue-100 text-blue-800' :
                    template.type === 'CDD' ? 'bg-orange-100 text-orange-800' :
                    template.type === 'STAGE' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {template.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedTemplate === template.id
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300'
              }`}>
                {selectedTemplate === template.id && (
                  <div className="w-full h-full bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu du modèle */}
            <div className="bg-gray-100 rounded-lg p-4 mb-4 h-32 flex items-center justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
              <span className="text-sm text-gray-500 ml-2">Aperçu du contrat</span>
            </div>

            {/* Fonctionnalités */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Clauses incluses :</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {template.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
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
            Modèle sélectionné : <span className="font-medium text-green-600">
              {CONTRACT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ContractTemplates; 