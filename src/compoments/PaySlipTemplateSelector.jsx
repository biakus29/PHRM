import React, { useState } from 'react';
import PaySlipTemplateModern from './PaySlipTemplateModern';
import PaySlipTemplateClassic from './PaySlipTemplateClassic';
import PaySlipTemplateMinimal from './PaySlipTemplateMinimal';
import ExportPaySlip from './ExportPaySlip';

/**
 * Composant sélecteur de modèles de fiches de paie
 * Permet de choisir entre les différents templates disponibles
 */
const PaySlipTemplateSelector = ({
  employee,
  employer,
  salaryDetails,
  remuneration,
  deductions,
  payPeriod,
  generatedAt,
  primes = [],
  indemnites = [],
  onGenerated,
  auto = false,
  className = ""
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showPreview, setShowPreview] = useState(true);

  // Configuration des modèles disponibles
  const templates = {
    modern: {
      name: 'Moderne',
      description: 'Design contemporain avec couleurs et mise en page attrayante',
      component: PaySlipTemplateModern,
      icon: '🎨',
      color: 'from-blue-500 to-purple-600',
      features: [
        'En-tête coloré avec logo',
        'Sections visuellement distinctes',
        'Typographie moderne',
        'Couleurs pour gains et déductions',
        'Bloc net à payer mis en valeur'
      ]
    },
    classic: {
      name: 'Classique',
      description: 'Style traditionnel sobre et professionnel',
      component: PaySlipTemplateClassic,
      icon: '📄',
      color: 'from-gray-600 to-gray-800',
      features: [
        'Design sobre et traditionnel',
        'Police Times pour un aspect formel',
        'Tableaux structurés',
        'Mise en page équilibrée',
        'Conformité réglementaire'
      ]
    },
    minimal: {
      name: 'Minimaliste',
      description: 'Design épuré avec l\'essentiel uniquement',
      component: PaySlipTemplateMinimal,
      icon: '✨',
      color: 'from-teal-400 to-blue-500',
      features: [
        'Design ultra épuré',
        'Informations condensées',
        'Génération rapide',
        'Économise le papier',
        'Lecture facile'
      ]
    },
    standard: {
      name: 'Standard',
      description: 'Modèle de base compatible avec l\'existant',
      component: ExportPaySlip,
      icon: '📋',
      color: 'from-green-500 to-blue-500',
      features: [
        'Compatible avec l\'existant',
        'Fonctionnalités éprouvées',
        'Génération rapide',
        'Format standard',
        'Léger et efficace'
      ]
    }
  };

  // Préparer les props pour les composants
  const templateProps = {
    employee,
    employer,
    salaryDetails,
    remuneration,
    deductions,
    payPeriod,
    generatedAt,
    primes,
    indemnites,
    onGenerated,
    auto: false // Désactiver l'auto pour la sélection
  };

  // Fonction pour rendre le composant sélectionné
  const renderSelectedTemplate = () => {
    const template = templates[selectedTemplate];
    const TemplateComponent = template.component;
    
    return (
      <TemplateComponent
        {...templateProps}
        auto={auto}
        buttonText={`Générer avec le modèle ${template.name}`}
      />
    );
  };

  // Si auto est activé, rendre directement le template sélectionné
  if (auto) {
    return renderSelectedTemplate();
  }

  return (
    <div className={`payslip-template-selector ${className}`}>
      {/* En-tête */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Choisissez un modèle de fiche de paie
        </h3>
        <p className="text-gray-600">
          Sélectionnez le style qui convient le mieux à vos besoins
        </p>
      </div>

             {/* Sélecteur de templates */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(templates).map(([key, template]) => (
          <div
            key={key}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
              selectedTemplate === key
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => setSelectedTemplate(key)}
          >
            {/* En-tête de la carte */}
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-2xl p-2 rounded-lg bg-gradient-to-r ${template.color} text-white`}>
                {template.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            </div>

            {/* Caractéristiques */}
            <ul className="text-xs text-gray-600 space-y-1">
              {template.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Indicateur de sélection */}
            {selectedTemplate === key && (
              <div className="mt-3 flex items-center gap-2 text-blue-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Sélectionné</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Options d'affichage */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Afficher l'aperçu</span>
          </label>
        </div>

        <div className="text-sm text-gray-600">
          Modèle actuel: <span className="font-medium">{templates[selectedTemplate].name}</span>
        </div>
      </div>

      {/* Aperçu et génération */}
      {showPreview && (
        <div className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              Aperçu - {templates[selectedTemplate].name}
            </h4>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {templates[selectedTemplate].icon} Modèle {templates[selectedTemplate].name}
            </span>
          </div>

          {/* Rendu du template sélectionné */}
          {renderSelectedTemplate()}
        </div>
      )}

      {/* Génération directe si pas d'aperçu */}
      {!showPreview && (
        <div className="flex justify-center">
          {renderSelectedTemplate()}
        </div>
      )}

      {/* Informations supplémentaires */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">💡 Conseils pour choisir un modèle</h5>
                 <ul className="text-sm text-blue-800 space-y-1">
           <li>• <strong>Moderne</strong> : Idéal pour les entreprises tech et startups</li>
           <li>• <strong>Classique</strong> : Parfait pour les administrations et entreprises traditionnelles</li>
           <li>• <strong>Minimaliste</strong> : Optimal pour une lecture rapide et l'économie de papier</li>
           <li>• <strong>Standard</strong> : Recommandé pour maintenir la compatibilité avec l'existant</li>
         </ul>
      </div>

      {/* Footer avec statistiques */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
        <span>
          Employé: {employee?.name || 'N/A'} | Période: {payPeriod || 'N/A'}
        </span>
        <span>
          Templates disponibles: {Object.keys(templates).length}
        </span>
      </div>
    </div>
  );
};

export default PaySlipTemplateSelector;