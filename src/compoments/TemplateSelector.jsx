import React from 'react';

const TemplateSelector = ({ 
  selectedTemplate, 
  onTemplateChange, 
  type = "payslip", // "payslip" ou "contract"
  className = "" 
}) => {
  
  const templates = {
    payslip: {
      eneo: {
        name: "ENEO (officiel)",
        description: "Format détaillé conforme ENEO Cameroun",
        preview: "bg-white border border-gray-200 rounded p-2"
      },
      classic: {
        name: "Classique",
        description: "Modèle compact en sections",
        preview: "bg-white border border-gray-300 rounded p-2"
      },
      bulletin_paie: {
        name: "Bulletin de Paie",
        description: "Style français avec en-tête jaune",
        preview: "bg-yellow-50 border border-yellow-200 rounded p-2"
      },
      compta_online: {
        name: "Compta Online",
        description: "Thème violet avec en-tête",
        preview: "bg-purple-50 border border-purple-200 rounded p-2"
      },
      enterprise: {
        name: "Enterprise",
        description: "Thème bleu avec tableaux de résumé",
        preview: "bg-blue-50 border border-blue-200 rounded p-2"
      }
    },
    contract: {
      default: {
        name: "Standard",
        description: "Format contractuel classique",
        preview: "bg-white border border-gray-200 rounded p-2"
      },
      modern: {
        name: "Moderne",
        description: "Design moderne et élégant",
        preview: "bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded p-2"
      },
      minimal: {
        name: "Minimaliste",
        description: "Format épuré et simple",
        preview: "bg-white border border-gray-300 rounded p-2"
      },
      legal: {
        name: "Juridique",
        description: "Format officiel et formel",
        preview: "bg-white border-2 border-gray-400 rounded p-2"
      }
    }
  };

  const currentTemplates = templates[type] || templates.payslip;

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Choisir un modèle de {type === "payslip" ? "fiche de paie" : "contrat"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez le design qui correspond le mieux à vos besoins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(currentTemplates).map(([key, template]) => (
          <div
            key={key}
            className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 ${
              selectedTemplate === key
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => onTemplateChange(key)}
          >
            {/* Indicateur de sélection */}
            {selectedTemplate === key && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <div className="p-4">
              {/* Aperçu du design */}
              <div className={`${template.preview} h-16 mb-3 flex items-center justify-center`}>
                <span className="text-xs text-gray-500">
                  Aperçu {template.name}
                </span>
              </div>

              {/* Informations du template */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {template.description}
                </p>
              </div>

              {/* Bouton radio */}
              <div className="mt-3 flex items-center">
                <input
                  type="radio"
                  name={`template-${type}`}
                  value={key}
                  checked={selectedTemplate === key}
                  onChange={() => onTemplateChange(key)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Utiliser ce modèle
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informations supplémentaires */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Informations</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Tous les modèles sont optimisés pour l'impression</li>
          <li>• Les couleurs et styles peuvent être personnalisés</li>
          <li>• Le contenu reste identique quel que soit le modèle choisi</li>
          <li>• Vous pouvez changer de modèle à tout moment</li>
        </ul>
      </div>
    </div>
  );
};

export default TemplateSelector; 