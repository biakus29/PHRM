// src/components/TextCustomizationHelp.jsx
// Composant d'aide intégré pour la personnalisation des textes

import React, { useState } from 'react';
import { FiHelpCircle, FiX, FiCheckCircle, FiInfo } from 'react-icons/fi';

const TextCustomizationHelp = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('basics');

  const helpSections = {
    basics: {
      title: 'Les Bases',
      icon: '🎯',
      content: (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Comment ça marche ?</h3>
            <p className="text-blue-700 text-sm">
              Vous pouvez modifier tous les textes de vos documents PDF pour les adapter à votre entreprise. 
              Les informations entre accolades (comme {'{{nom}}'}) sont automatiquement remplacées.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-lg">1️⃣</div>
              <div>
                <h4 className="font-medium text-gray-800">Choisissez une section</h4>
                <p className="text-sm text-gray-600">Cliquez sur la section que vous voulez modifier</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-lg">2️⃣</div>
              <div>
                <h4 className="font-medium text-gray-800">Modifiez le texte</h4>
                <p className="text-sm text-gray-600">Tapez votre nouveau texte dans la zone de texte</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-green-600 text-lg">3️⃣</div>
              <div>
                <h4 className="font-medium text-gray-800">Sauvegardez</h4>
                <p className="text-sm text-gray-600">Cliquez sur "Sauvegarder mes modifications"</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    variables: {
      title: 'Les Variables',
      icon: '🔧',
      content: (
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Qu'est-ce qu'une variable ?</h3>
            <p className="text-yellow-700 text-sm">
              Une variable est une information qui sera automatiquement remplacée par la vraie donnée 
              quand vous générerez le PDF.
            </p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Variables courantes :</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <code className="text-blue-600 font-mono text-sm">{'{{nom}}'}</code>
                <span className="text-sm text-gray-600">Nom de l'employé</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <code className="text-blue-600 font-mono text-sm">{'{{poste}}'}</code>
                <span className="text-sm text-gray-600">Poste proposé</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <code className="text-blue-600 font-mono text-sm">{'{{salaire}}'}</code>
                <span className="text-sm text-gray-600">Montant du salaire</span>
              </div>
              <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                <code className="text-blue-600 font-mono text-sm">{'{{date}}'}</code>
                <span className="text-sm text-gray-600">Date de début</span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Exemple :</h4>
            <div className="space-y-2">
              <p className="text-sm text-green-700">
                <strong>Votre texte :</strong> "Bonjour {'{{nom}}'}, nous vous proposons le poste de {'{{poste}}'}"
              </p>
              <p className="text-sm text-green-700">
                <strong>Dans le PDF :</strong> "Bonjour Jean Dupont, nous vous proposons le poste de Développeur"
              </p>
            </div>
          </div>
        </div>
      )
    },
    examples: {
      title: 'Exemples',
      icon: '💡',
      content: (
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-800 mb-2">Entreprise Traditionnelle</h4>
              <p className="text-sm text-gray-600 italic">
                "Notre société a le plaisir de vous proposer un emploi pour une durée déterminée..."
              </p>
            </div>
            
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-800 mb-2">Startup Moderne</h4>
              <p className="text-sm text-gray-600 italic">
                "Rejoignez notre équipe dynamique ! Nous sommes ravis de vous offrir l'opportunité..."
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-800 mb-2">Secteur Médical</h4>
              <p className="text-sm text-gray-600 italic">
                "Nous recherchons un professionnel de santé pour rejoindre notre équipe médicale..."
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">Conseils :</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Adaptez le ton à votre secteur d'activité</li>
              <li>• Restez professionnel mais authentique</li>
              <li>• Testez vos modifications avant de finaliser</li>
              <li>• Gardez une cohérence dans tous vos documents</li>
            </ul>
          </div>
        </div>
      )
    },
    tips: {
      title: 'Conseils',
      icon: '⭐',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-500 text-lg">💡</div>
              <div>
                <h4 className="font-medium text-gray-800">Commencez simple</h4>
                <p className="text-sm text-gray-600">Modifiez d'abord les textes les plus importants (introduction, conclusion)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-green-500 text-lg">✅</div>
              <div>
                <h4 className="font-medium text-gray-800">Testez régulièrement</h4>
                <p className="text-sm text-gray-600">Générez des PDF de test pour voir le résultat de vos modifications</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-blue-500 text-lg">🔄</div>
              <div>
                <h4 className="font-medium text-gray-800">Sauvegardez souvent</h4>
                <p className="text-sm text-gray-600">N'oubliez pas de sauvegarder vos modifications</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-purple-500 text-lg">🎨</div>
              <div>
                <h4 className="font-medium text-gray-800">Soyez créatif</h4>
                <p className="text-sm text-gray-600">Personnalisez vos textes pour refléter l'identité de votre entreprise</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Attention :</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Ne modifiez pas les variables entre accolades</li>
              <li>• Vérifiez l'orthographe avant de sauvegarder</li>
              <li>• Gardez une cohérence dans le style</li>
            </ul>
          </div>
        </div>
      )
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">💡</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Aide - Personnalisation des Textes
              </h2>
              <p className="text-sm text-gray-600">
                Tout ce qu'il faut savoir pour personnaliser vos documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 bg-gray-50 p-4">
            <nav className="space-y-2">
              {Object.entries(helpSections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                    activeTab === key
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {helpSections[activeTab]?.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <FiInfo className="text-blue-500" />
            <span>Cette aide est disponible à tout moment</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextCustomizationHelp;
