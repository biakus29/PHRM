// src/components/DocumentsManager/DocumentHeader.jsx
// En-tête avec onglets et actions rapides

import React from 'react';
import { FiPlus, FiSettings } from 'react-icons/fi';
import { DOCUMENT_TYPES } from '../../config/documentConfig';

/**
 * En-tête du gestionnaire de documents
 */
const DocumentHeader = ({ 
  activeTab, 
  onTabChange, 
  onCreateNew, 
  onOpenSettings,
  documents,
  employeesCount 
}) => {
  return (
    <div className="space-y-4">
      {/* Titre et description */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-1">Documents RH</h3>
            <p className="text-blue-100 text-sm">Gestion complète des documents employés</p>
          </div>
          
          {/* Actions rapides */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(DOCUMENT_TYPES).map(([type, config]) => (
              <button
                key={type}
                onClick={() => {
                  onTabChange(type);
                  onCreateNew();
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all text-white text-sm"
                title={`Créer ${config.title}`}
              >
                <config.icon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {type === 'offers' ? 'Offre' :
                   type === 'attestations' ? 'Attestation' :
                   type === 'certificates' ? 'Certificat' :
                   type === 'contracts' ? 'Contrat' :
                   'Avenant'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Statistiques et actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Total: <span className="font-semibold text-blue-600">
                  {Object.values(documents).reduce((total, docs) => total + docs.length, 0)}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Employés: <span className="font-semibold text-green-600">{employeesCount}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all text-sm"
            >
              <FiSettings className="h-4 w-4" />
              <span>Personnaliser</span>
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm"
            >
              <FiPlus className="h-4 w-4" />
              <span>Nouveau</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentHeader;
