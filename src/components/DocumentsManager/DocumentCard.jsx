// src/components/DocumentsManager/DocumentCard.jsx
// Carte d'affichage d'un document individuel

import React from 'react';
import { FiEye, FiDownload, FiEdit, FiTrash2, FiSend } from 'react-icons/fi';
import { DOCUMENT_TYPES } from '../../config/documentConfig';
import { formatDate, formatCurrency } from '../../utils/documentHelpers';

/**
 * Carte d'affichage d'un document
 */
const DocumentCard = ({ 
  document, 
  documentType, 
  onPreview, 
  onGeneratePDF, 
  onEdit, 
  onDelete,
  onSubmit,
  isHighlighted = false,
  index
}) => {
  const config = DOCUMENT_TYPES[documentType];
  const Icon = config.icon;
  
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };
  
  const gradientClass = colorClasses[config.color] || colorClasses.blue;
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02] overflow-hidden ${
        isHighlighted 
          ? 'border-green-300 hover:shadow-lg ring-1 ring-green-200' 
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-start space-x-3 mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0 ${gradientClass}`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {document.title || document.employeeName || document.position || `Document #${index + 1}`}
                  </h4>
                  {isHighlighted && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
                      ✓ Employé sélectionné
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  📅 <span className="hidden sm:inline">Créé le </span>
                  {document.createdAt?.seconds 
                    ? formatDate(new Date(document.createdAt.seconds * 1000).toISOString())
                    : '-'
                  }
                </p>
              </div>
            </div>
            
            {/* Informations supplémentaires */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-4">
              {document.employeeName && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">👤</span>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{document.employeeName}</span>
                </div>
              )}
              {document.position && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">💼</span>
                  <span className="text-xs sm:text-sm text-gray-700 truncate">{document.position}</span>
                </div>
              )}
              {document.category && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">📊</span>
                  <span className="text-xs sm:text-sm text-gray-700 truncate">{document.category}</span>
                </div>
              )}
              {document.salary && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">💰</span>
                  <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                    {formatCurrency(document.salary)}
                  </span>
                </div>
              )}
              {document.reference && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">🔖</span>
                  <span className="text-xs sm:text-sm text-gray-700 truncate">{document.reference}</span>
                </div>
              )}
              {document.city && (
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-medium text-gray-500 flex-shrink-0">📍</span>
                  <span className="text-xs sm:text-sm text-gray-700 truncate">{document.city}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-row sm:flex-col lg:flex-col space-x-2 sm:space-x-0 sm:space-y-2 lg:ml-6">
            <button
              onClick={() => onPreview(document)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
              title="Prévisualiser"
            >
              <FiEye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium">Aperçu</span>
            </button>
            <button
              onClick={() => onGeneratePDF(document)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
              title="Télécharger PDF"
            >
              <FiDownload className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium">PDF</span>
            </button>
            {documentType === 'offers' && onSubmit && (
              <button
                onClick={() => onSubmit(document)}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm disabled:opacity-60"
                title="Soumettre au SuperAdmin"
                disabled={!!document.submittedJobId}
              >
                <FiSend className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-medium">{document.submittedJobId ? 'Déjà soumis' : 'Soumettre'}</span>
              </button>
            )}
            <button
              onClick={() => onEdit(document)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
              title="Modifier"
            >
              <FiEdit className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium hidden sm:inline">Modifier</span>
            </button>
            <button
              onClick={() => onDelete(document)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
              title="Supprimer"
            >
              <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="font-medium hidden sm:inline">Supprimer</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Barre de statut */}
      <div className={`h-1 bg-gradient-to-r ${gradientClass}`}></div>
    </div>
  );
};

export default DocumentCard;
