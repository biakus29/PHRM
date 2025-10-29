// src/components/DocumentsManager/DocumentsList.jsx
// Liste des documents avec gestion de l'état vide

import React from 'react';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import DocumentCard from './DocumentCard';
import { DOCUMENT_TYPES } from '../../config/documentConfig';

/**
 * Liste des documents avec état vide
 */
const DocumentsList = ({ 
  documents,
  documentType,
  loading,
  onPreview,
  onGeneratePDF,
  onEdit,
  onDelete,
  onSubmit,
  onCreate,
  onRefresh,
  viewMode,
  selectedEmployee
}) => {
  const config = DOCUMENT_TYPES[documentType];
  
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 animate-pulse">Chargement des documents...</p>
      </div>
    );
  }
  
  if (documents.length === 0) {
    const isEmployeeMode = viewMode === 'employee';
    const hasSelectedEmployee = selectedEmployee !== null;
    
    return (
      <div className="text-center py-16">
        <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <config.icon className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          {isEmployeeMode && hasSelectedEmployee 
            ? `Aucun ${config.title.toLowerCase()} pour ${selectedEmployee.name}`
            : isEmployeeMode && !hasSelectedEmployee
            ? 'Sélectionnez un employé'
            : `Aucun ${config.title.toLowerCase()}`
          }
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          {isEmployeeMode && hasSelectedEmployee 
            ? `Créez le premier ${config.title.toLowerCase().slice(0, -1)} pour ${selectedEmployee.name}.`
            : isEmployeeMode && !hasSelectedEmployee
            ? 'Choisissez un employé pour voir ses documents ou créer de nouveaux documents pré-remplis.'
            : `Créez votre premier document pour commencer à gérer vos ${config.title.toLowerCase()}.`
          }
        </p>
        {(!isEmployeeMode || hasSelectedEmployee) && (
          <button
            onClick={onCreate}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:scale-105"
          >
            <FiPlus className="h-5 w-5" />
            <span>
              {isEmployeeMode && hasSelectedEmployee
                ? `Créer pour ${selectedEmployee.name}`
                : 'Créer mon premier document'
              }
            </span>
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:gap-6">
        {documents.map((doc, index) => {
          const isHighlighted = viewMode === 'employee' && selectedEmployee && (
            (doc.employeeName || doc.nomEmploye || '').toLowerCase() === 
            (selectedEmployee.name || selectedEmployee.nom || '').toLowerCase()
          );
          
          return (
            <DocumentCard
              key={doc.id}
              document={doc}
              documentType={documentType}
              onPreview={onPreview}
              onGeneratePDF={onGeneratePDF}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmit={onSubmit}
              isHighlighted={isHighlighted}
              index={index}
            />
          );
        })}
      </div>
      
      {/* Bouton d'actualisation */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50"
        >
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-medium">
            {loading ? 'Actualisation...' : '🔄 Actualiser les documents'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DocumentsList;
