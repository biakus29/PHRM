// src/components/DocumentsManager/EmptyDocumentsState.jsx
// Composant pour l'état vide avec bouton de chargement

import React from 'react';
import { FiFileText } from 'react-icons/fi';
import { DOCUMENT_TYPES } from '../../config/documentConfig';

/**
 * Composant d'état vide pour le chargement à la demande
 */
const EmptyDocumentsState = ({ onLoadDocuments, isLoading, documentType }) => {
  const config = DOCUMENT_TYPES[documentType];
  const Icon = config.icon;
  
  const colorClasses = {
    blue: {
      bg: 'from-blue-100 to-blue-200',
      icon: 'text-blue-600',
      button: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
    },
    green: {
      bg: 'from-green-100 to-green-200',
      icon: 'text-green-600',
      button: 'from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
    },
    purple: {
      bg: 'from-purple-100 to-purple-200',
      icon: 'text-purple-600',
      button: 'from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
    },
    orange: {
      bg: 'from-orange-100 to-orange-200',
      icon: 'text-orange-600',
      button: 'from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800'
    },
    indigo: {
      bg: 'from-indigo-100 to-indigo-200',
      icon: 'text-indigo-600',
      button: 'from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800'
    }
  };
  
  const colors = colorClasses[config.color] || colorClasses.blue;
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      {/* Icône */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-br ${colors.bg}`}>
        <Icon className={`h-10 w-10 ${colors.icon}`} />
      </div>
      
      {/* Message */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {config.title}
      </h3>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Aucun document chargé. Cliquez sur le bouton ci-dessous pour afficher la liste des documents.
      </p>
      
      {/* Bouton de chargement */}
      <button
        onClick={onLoadDocuments}
        disabled={isLoading}
        className={`flex items-center space-x-3 px-8 py-4 rounded-xl shadow-lg transition-all transform hover:scale-105 ${
          isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : `bg-gradient-to-r ${colors.button} text-white`
        }`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="font-medium">Chargement en cours...</span>
          </>
        ) : (
          <>
            <FiFileText className="h-5 w-5" />
            <span className="font-medium">📄 Charger les documents</span>
          </>
        )}
      </button>
      
      {/* Info supplémentaire */}
      {!isLoading && (
        <p className="text-xs text-gray-400 mt-4">
          💡 Les documents ne seront chargés qu'à votre demande
        </p>
      )}
    </div>
  );
};

export default EmptyDocumentsState;
