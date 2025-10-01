// src/components/CotisationEmployeeSelector.jsx
// Composant pour la sélection d'employés dans les cotisations CNPS

import React from "react";
import { formatFR } from "../utils/numberUtils";

const CotisationEmployeeSelector = ({
  employees,
  selectedIds,
  onEmployeeSelect,
  onEmployeeDeselect,
  onSelectAll,
  onDeselectAll,
  loading
}) => {
  const handleEmployeeToggle = (employeeId, isSelected) => {
    if (isSelected) {
      onEmployeeSelect(employeeId);
    } else {
      onEmployeeDeselect(employeeId);
    }
  };

  const allSelected = employees.length > 0 && selectedIds.length === employees.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < employees.length;

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="text-center py-8 text-gray-500">
          <p>Aucun employé trouvé</p>
          <p className="text-sm mt-2">Ajoutez des employés pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Sélection des Employés ({selectedIds.length}/{employees.length})
        </h3>
      </div>

      {/* Checkbox principal */}
      <div className="mb-4 p-2 bg-gray-50 rounded">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) input.indeterminate = someSelected;
            }}
            onChange={(e) => {
              if (e.target.checked) {
                onSelectAll();
              } else {
                onDeselectAll();
              }
            }}
            className="mr-2"
          />
          <span className="font-medium">
            {allSelected ? 'Tous sélectionnés' : someSelected ? 'Sélection partielle' : 'Aucun sélectionné'}
          </span>
        </label>
      </div>

      {/* Liste des employés */}
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {employees.map((employee) => {
            const isSelected = selectedIds.includes(employee.id);
            return (
              <div
                key={employee.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleEmployeeToggle(employee.id, !isSelected)}
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Géré par le onClick du div
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {employee.name || 'Sans nom'}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">
                      {employee.professionalCategory || employee.poste || 'Poste non défini'}
                    </p>
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-400">
                        Matricule: {employee.matricule || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        CNPS: {employee.cnpsNumber || 'N/A'}
                      </p>
                      <p className="text-xs font-medium text-green-600">
                        {formatFR(employee.baseSalary || 0)} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Résumé de sélection */}
      {selectedIds.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Employés sélectionnés:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => {
              const employee = employees.find(e => e.id === id);
              return employee ? (
                <span
                  key={id}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {employee.name || 'Sans nom'}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmployeeDeselect(id);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
          <div className="mt-2 text-sm text-blue-700">
            Total salaires: {formatFR(
              selectedIds.reduce((sum, id) => {
                const employee = employees.find(e => e.id === id);
                return sum + (Number(employee?.baseSalary) || 0);
              }, 0)
            )} FCFA
          </div>
        </div>
      )}
    </div>
  );
};

export default CotisationEmployeeSelector;
