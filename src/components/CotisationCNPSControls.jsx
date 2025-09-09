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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employerOptions.includePF}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, includePF: e.target.checked }))}
                className="mr-2"
              />
              Prestations Familiales
            </label>
            {employerOptions.includePF && (
              <input
                type="number"
                value={employerOptions.ratePF}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, ratePF: parseFloat(e.target.value) || 7.0 }))}
                className="mt-1 w-20 px-2 py-1 border rounded"
                step="0.1"
                min="0"
              />
            )}
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employerOptions.includePVID}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, includePVID: e.target.checked }))}
                className="mr-2"
              />
              PVID Employeur
            </label>
            {employerOptions.includePVID && (
              <input
                type="number"
                value={employerOptions.ratePVID}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, ratePVID: parseFloat(e.target.value) || 4.9 }))}
                className="mt-1 w-20 px-2 py-1 border rounded"
                step="0.1"
                min="0"
              />
            )}
          </div>
          
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employerOptions.includeRP}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, includeRP: e.target.checked }))}
                className="mr-2"
              />
              Risques Professionnels
            </label>
            {employerOptions.includeRP && (
              <div className="mt-1">
                {/* Sélecteur de groupe RP avec taux prédéfinis */}
                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Groupe RP</label>
                  <select
                    value={employerOptions.rpGroup || 'A'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const groupRates = { A: 1.75, B: 2.5, C: 5 };
                      setEmployerOptions(prev => ({
                        ...prev,
                        rpGroup: val,
                        // si pas de taux uniforme forcé, appliquer le taux du groupe au rateRP
                        rateRP: prev.overrideRP ? prev.rateRP : groupRates[val]
                      }));
                    }}
                    className="w-28 px-2 py-1 border rounded"
                  >
                    <option value="A">A (1,75%)</option>
                    <option value="B">B (2,5%)</option>
                    <option value="C">C (5%)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Taux du groupe appliqué: {employerOptions.overrideRP ? `${employerOptions.rateRP ?? ''}% (forcé)` : `${({A:1.75,B:2.5,C:5}[employerOptions.rpGroup || 'A'])}%`}
                  </p>
                </div>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={employerOptions.overrideRP}
                    onChange={(e) => setEmployerOptions(prev => ({ ...prev, overrideRP: e.target.checked }))}
                    className="mr-1"
                  />
                  Taux uniforme
                </label>
                {employerOptions.overrideRP && (
                  <input
                    type="number"
                    value={employerOptions.rateRP}
                    onChange={(e) => setEmployerOptions(prev => ({ ...prev, rateRP: parseFloat(e.target.value) || 2.0 }))}
                    className="mt-1 w-20 px-2 py-1 border rounded"
                    step="0.1"
                    min="0"
                  />
                )}

                {/* Annexe: liste des activités par groupe (réducteur) */}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-700">Annexe: Classement des activités par groupe</summary>
                  <div className="mt-2 max-h-48 overflow-y-auto text-sm text-gray-600 space-y-2">
                    <div>
                      <p className="font-semibold">Groupe A (1,75%)</p>
                      <ul className="list-disc pl-5">
                        <li>Agriculture, agro-industries, horticulture, sylviculture</li>
                        <li>Elevage (sans abattoir), pisciculture</li>
                        <li>Architectes, promoteurs immobiliers</li>
                        <li>Commerce (bureaux, vente, manutention), VRP</li>
                        <li>Banques, assurances, professions libérales</li>
                        <li>Agences (immobilières, voyages, publicité), presse</li>
                        <li>Santé privée, maisons de retraite</li>
                        <li>Associations, syndicats, chambres consulaires, partis</li>
                        <li>Missions diplomatiques et consulaires</li>
                        <li>Cinémas, théâtres, sports/loisirs, clubs</li>
                        <li>Personnel domestique</li>
                        <li>Hôtels, restaurants, cafés, bars, dancings</li>
                        <li>Blanchisserie, nettoyage, teinture de vêtements</li>
                        <li>Pompes funèbres, stations-service (sans mécanique)</li>
                        <li>Studios photo, salons de coiffure, beauté, massage</li>
                        <li>Enseignement privé, organisations religieuses</li>
                        <li>Entretien/nettoyage d’immeubles</li>
                        <li>Etat, collectivités locales, transports ferroviaires</li>
                        <li>Exploitants et police des ports</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Groupe B (2,5%)</p>
                      <ul className="list-disc pl-5">
                        <li>Abattoirs</li>
                        <li>Industries de transformation (hors grosse métallurgie)</li>
                        <li>Boulangeries, pâtisseries, biscuiteries</li>
                        <li>Polygraphie</li>
                        <li>Automobile, garages, carrosserie, peinture</li>
                        <li>Raffinage du pétrole</li>
                        <li>Topographie, géophysique, géomètres</li>
                        <li>Bâtiment et TP (généraux, peinture, plomberie, électricité, routes/voies ferrées/canalisations hors ouvrages d’art)</li>
                        <li>Prospection minière</li>
                        <li>Production/transport/distribution d’électricité et d’eau</li>
                        <li>Fabrication objets bois, ivoire, or</li>
                        <li>Transports urbains, aériens, maritimes, fluviaux</li>
                        <li>Transit, consignation, manutention portuaire</li>
                        <li>Voirie, gardiennage, surveillance</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Groupe C (5%)</p>
                      <ul className="list-disc pl-5">
                        <li>Foresterie, scieries</li>
                        <li>Pêche</li>
                        <li>Transports routiers</li>
                        <li>Recherche d’hydrocarbures, grosse métallurgie</li>
                        <li>TP génie civil (carrières, souterrains, ouvrages d’art, lignes extérieures, démolition, tunnels)</li>
                        <li>Hydraulique agricole/pastorale, travaux de fond</li>
                      </ul>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employerOptions.includeFNEmp}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, includeFNEmp: e.target.checked }))}
                className="mr-2"
              />
              FNE Employeur
            </label>
            {employerOptions.includeFNEmp && (
              <input
                type="number"
                value={employerOptions.rateFNEmp ?? 1.5}
                onChange={(e) => setEmployerOptions(prev => ({ ...prev, rateFNEmp: parseFloat(e.target.value) || 1.5 }))}
                className="mt-1 w-20 px-2 py-1 border rounded"
                step="0.1"
                min="0"
              />
            )}
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
