// src/components/ModalDemo.jsx
// Composant de démonstration de la modal améliorée

import React, { useState } from 'react';
import TextCustomizationModal from './TextCustomizationModal';

const ModalDemo = () => {
  const [showModal, setShowModal] = useState(false);
  const [documentType, setDocumentType] = useState('offers');

  const documentTypes = [
    { key: 'offers', name: 'Offres d\'emploi', icon: '📄', color: 'blue' },
    { key: 'contracts', name: 'Contrats de travail', icon: '📋', color: 'green' },
    { key: 'certificates', name: 'Certificats de travail', icon: '🏆', color: 'yellow' },
    { key: 'attestations', name: 'Attestations de virement', icon: '💳', color: 'purple' },
    { key: 'amendments', name: 'Avenants au contrat', icon: '📝', color: 'indigo' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎨 Modal de Personnalisation Améliorée
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Découvrez la nouvelle interface de personnalisation des textes
          </p>
          
          {/* Sélecteur de type de document */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {documentTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => setDocumentType(type.key)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  documentType === type.key
                    ? `bg-${type.color}-600 text-white shadow-lg transform scale-105`
                    : `bg-white text-gray-700 hover:bg-${type.color}-50 hover:text-${type.color}-700 border-2 border-gray-200 hover:border-${type.color}-300`
                }`}
              >
                <span className="text-2xl mr-2">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Navigation Intuitive</h3>
            <p className="text-gray-600">
              Sidebar avec navigation rapide vers chaque section. Cliquez pour aller directement où vous voulez.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Design Moderne</h3>
            <p className="text-gray-600">
              Interface redesignée avec gradients, animations et effets visuels pour une expérience premium.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Performance</h3>
            <p className="text-gray-600">
              Animations fluides, transitions douces et interface optimisée pour une expérience sans latence.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Responsive</h3>
            <p className="text-gray-600">
              S'adapte parfaitement à tous les écrans, des mobiles aux grands écrans de bureau.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Fonctionnalités Avancées</h3>
            <p className="text-gray-600">
              Compteurs de caractères, variables automatiques, et feedback visuel en temps réel.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="text-3xl mb-4">♿</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Accessibilité</h3>
            <p className="text-gray-600">
              Navigation clavier, lecteurs d'écran, et contraste élevé pour tous les utilisateurs.
            </p>
          </div>
        </div>

        {/* Bouton de démonstration */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-12 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            🚀 Tester la Modal Améliorée
          </button>
          <p className="text-gray-600 mt-4">
            Cliquez pour ouvrir la modal de personnalisation des textes
          </p>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📋 Comment Utiliser la Nouvelle Modal
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Navigation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Utilisez la sidebar pour naviguer entre les sections</li>
                <li>• Cliquez sur une section pour y aller directement</li>
                <li>• Le scroll est fluide et automatique</li>
                <li>• Chaque section est clairement identifiée</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">✏️ Personnalisation</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Modifiez les textes dans les zones de saisie</li>
                <li>• Utilisez les variables automatiques ({{nom}}, {{poste}})</li>
                <li>• Ajoutez des éléments aux listes facilement</li>
                <li>• Sauvegardez vos modifications</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de démonstration */}
      <TextCustomizationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        documentType={documentType}
        companyId="demo-company-123"
        onTextsUpdated={(docType, texts) => {
          console.log('Textes mis à jour:', docType, texts);
        }}
      />
    </div>
  );
};

export default ModalDemo;
