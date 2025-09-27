// src/components/CotisationCNPSControls.jsx
// Composant pour les contrôles et options des cotisations CNPS

import React from "react";
import Button from "./Button";

const CotisationCNPSControls = ({
  employerOptions,
  setEmployerOptions,
  taxOptions,
  setTaxOptions,
  uniformTransport,
  setUniformTransport,
  viewMode,
  setViewMode,
  onReloadFromPayslips,
  onSave,
  onExportCNPDF,
  onExportTaxesPDF,
  onExportExcel,
  selectedIds,
  saving,
  loading
}) => {
  return (
    <div className="space-y-6">
      {/* Vues */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Vues</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setViewMode('detailed')} className={`${viewMode==='detailed'?'bg-blue-700':'bg-blue-600 hover:bg-blue-700'} text-white`}>
            📋 Détaillé
          </Button>
          <Button onClick={() => setViewMode('declaration')} className={`${viewMode==='declaration'?'bg-blue-700':'bg-blue-600 hover:bg-blue-700'} text-white`}>
            🧾 Déclaration CNPS
          </Button>
          <Button onClick={() => setViewMode('dipe')} className={`${viewMode==='dipe'?'bg-blue-700':'bg-blue-600 hover:bg-blue-700'} text-white`}>
            🧾 DIPE
          </Button>
          <Button onClick={() => setViewMode('impots')} className={`${viewMode==='impots'?'bg-blue-700':'bg-blue-600 hover:bg-blue-700'} text-white`}>
            💰 Impôts
          </Button>
        </div>
      </div>
      {/* Options Employeur */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Options Employeur</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie Risques Professionnels
            </label>
            <select
              value={employerOptions.rpCategory || 'A'}
              onChange={(e) => setEmployerOptions(prev => ({ ...prev, rpCategory: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="A">Catégorie A - 1,75% (Bureaux, Commerce)</option>
              <option value="B">Catégorie B - 2,5% (Industrie légère)</option>
              <option value="C">Catégorie C - 5% (Industrie lourde, BTP)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Taux appliqué sur le salaire de base pour les risques professionnels
            </p>
          </div>
        </div>
      </div>

      {/* Options Impôts */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Options Impôts et Taxes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              CFC Salarié (% sur SBT)
            </label>
            <input
              type="number"
              value={taxOptions.cfcRate}
              onChange={(e) => setTaxOptions(prev => ({ ...prev, cfcRate: parseFloat(e.target.value) || 1.0 }))}
              className="w-full px-3 py-2 border rounded"
              step="0.1"
              min="0"
              max="10"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              FNE (% sur SBT)
            </label>
            <input
              type="number"
              value={taxOptions.fneRate}
              onChange={(e) => setTaxOptions(prev => ({ ...prev, fneRate: parseFloat(e.target.value) || 1.0 }))}
              className="w-full px-3 py-2 border rounded"
              step="0.1"
              min="0"
              max="10"
            />
          </div>
        </div>
      </div>

      {/* Prime Transport Uniforme */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Prime Transport Uniforme</h3>
        <div className="flex items-center space-x-4">
          <label className="block text-sm font-medium">
            Montant (FCFA)
          </label>
          <input
            type="number"
            value={uniformTransport}
            onChange={(e) => setUniformTransport(parseFloat(e.target.value) || 0)}
            className="px-3 py-2 border rounded"
            min="0"
            placeholder="0"
          />
          <span className="text-sm text-gray-500">
            Appliqué à tous les employés sélectionnés
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onReloadFromPayslips}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={selectedIds.length === 0 || loading}
          >
            🔄 Recharger depuis bulletins
          </Button>
          
          <Button
            onClick={onSave}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={selectedIds.length === 0 || saving}
          >
            {saving ? "Enregistrement..." : "💾 Enregistrer"}
          </Button>
          
          <Button
            onClick={onExportCNPDF}
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={selectedIds.length === 0}
          >
            📄 Export PDF CNPS
          </Button>
          
          <Button
            onClick={onExportTaxesPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            disabled={selectedIds.length === 0}
          >
            📄 Export PDF Impôts
          </Button>
          
          <Button
            onClick={onExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={selectedIds.length === 0}
          >
            📊 Export Excel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CotisationCNPSControls;
