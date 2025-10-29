// src/components/DocumentsManager/DocumentFilters.jsx
// Composant de filtrage et recherche

import React from 'react';
import { FiUsers } from 'react-icons/fi';

/**
 * Composant de filtres pour les documents
 */
const DocumentFilters = ({
  viewMode,
  onViewModeChange,
  selectedEmployee,
  onEmployeeSelect,
  searchTerm,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  employees,
  filteredEmployees,
  departments,
  filterStats
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête avec modes de vue */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <FiUsers className="h-5 w-5 text-blue-600" />
            <span>Gestion par employé</span>
          </h3>
          
          {/* Boutons de mode */}
          <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => onViewModeChange('all')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Tous les documents
            </button>
            <button
              onClick={() => onViewModeChange('employee')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'employee'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Par employé
            </button>
          </div>
        </div>
      </div>

      {/* Interface de sélection d'employé (épurée) */}
      {viewMode === 'employee' && (
        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="text"
              placeholder="Rechercher (nom, matricule, poste)"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find(x => x.id === e.target.value);
                onEmployeeSelect(emp || null);
              }}
              className="w-full sm:max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un employé...</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {(emp.name || emp.nom) || '—'} {emp.matricule ? `- ${emp.matricule}` : ''}
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <button
                type="button"
                onClick={() => onEmployeeSelect(null)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              >
                Effacer
              </button>
            )}
          </div>
          {!selectedEmployee && (
            <div className="text-sm text-gray-500 mt-2">
              Sélectionnez un employé pour filtrer la liste des documents.
            </div>
          )}
        </div>
      )}

      {/* Indicateurs de filtres actifs */}
      {filterStats.hasActiveFilters && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-blue-800 font-medium">Filtres actifs:</span>
            {viewMode === 'employee' && selectedEmployee && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center space-x-1">
                <span>👤</span>
                <span>{selectedEmployee.name || selectedEmployee.nom}</span>
                <button
                  onClick={() => onEmployeeSelect(null)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ✕
                </button>
              </span>
            )}
            {departmentFilter !== 'all' && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center space-x-1">
                <span>🏢</span>
                <span>{departmentFilter}</span>
                <button
                  onClick={() => onDepartmentChange('all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </span>
            )}
            <span className="text-blue-700 font-medium ml-2">
              {filterStats.filtered} sur {filterStats.total} documents
            </span>
          </div>
        </div>
      )}

      {/* Filtre par département */}
      {departments.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Département:</label>
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les départements</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentFilters;
