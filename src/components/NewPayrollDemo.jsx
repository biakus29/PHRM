// src/components/NewPayrollDemo.jsx
// Démonstration du nouveau système de paie camerounaise
// CRÉÉ: 26/09/2025 15:43 - COMPOSANT DE DÉMONSTRATION

import React, { useState, useMemo } from 'react';
import { calculComplet, formatCFA } from '../utils/payrollCalculations';

const NewPayrollDemo = () => {
  const [employeeData, setEmployeeData] = useState({
    salaireBrut: 85000,
    primesCotisables: {
      primeRendement: 15000,
      primeExceptionnelle: 15000,
      primeAnciennete: 0,
      primeResponsabilite: 0,
      heuresSupplementaires: 0,
      avantagesNature: 0
    },
    primesNonCotisables: {
      primeTransport: 25000,
      primePanier: 0,
      indemniteKilometrage: 0,
      primeNaissance: 0,
      primeScolarite: 0
    }
  });

  // Calcul automatique avec le nouveau système
  const payrollResult = useMemo(() => {
    return calculComplet(employeeData);
  }, [employeeData]);

  const handleSalaryChange = (value) => {
    setEmployeeData(prev => ({
      ...prev,
      salaireBrut: Number(value) || 0
    }));
  };

  const handlePrimeCotisableChange = (key, value) => {
    setEmployeeData(prev => ({
      ...prev,
      primesCotisables: {
        ...prev.primesCotisables,
        [key]: Number(value) || 0
      }
    }));
  };

  const handlePrimeNonCotisableChange = (key, value) => {
    setEmployeeData(prev => ({
      ...prev,
      primesNonCotisables: {
        ...prev.primesNonCotisables,
        [key]: Number(value) || 0
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-900">
        🇨🇲 Nouveau Système de Paie Camerounaise
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section Saisie */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">💰 Salaire de Base</h2>
            <input
              type="number"
              value={employeeData.salaireBrut}
              onChange={(e) => handleSalaryChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Salaire brut de base"
            />
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">✅ Primes Cotisables</h2>
            <div className="space-y-3">
              {Object.entries(employeeData.primesCotisables).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handlePrimeCotisableChange(key, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-orange-800">❌ Primes Non Cotisables</h2>
            <div className="space-y-3">
              {Object.entries(employeeData.primesNonCotisables).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handlePrimeNonCotisableChange(key, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Résultats */}
        <div className="space-y-6">
          {/* Bases de calcul */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">📊 Bases de Calcul</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Salaire Brut Total:</span>
                <span className="font-bold">{formatCFA(payrollResult.bases.salaireBrutTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">SBC (Cotisable):</span>
                <span className="font-bold text-green-600">{formatCFA(payrollResult.bases.sbc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">SBT (Taxable):</span>
                <span className="font-bold text-orange-600">{formatCFA(payrollResult.bases.sbt)}</span>
              </div>
            </div>
          </div>

          {/* Cotisations CNPS */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-green-800">🏛️ Cotisations CNPS</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>PVID Salarié:</span>
                <span className="font-bold">{formatCFA(payrollResult.cnps.pvidSalarie)}</span>
              </div>
              <div className="flex justify-between">
                <span>PVID Employeur:</span>
                <span className="font-bold">{formatCFA(payrollResult.cnps.pvidEmployeur)}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestations Familiales:</span>
                <span className="font-bold">{formatCFA(payrollResult.cnps.prestationsFamiliales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Risques Professionnels:</span>
                <span className="font-bold">{formatCFA(payrollResult.cnps.risquesPro)}</span>
              </div>
            </div>
          </div>

          {/* Autres déductions */}
          <div className="bg-red-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-red-800">📉 Autres Déductions</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>IRPP:</span>
                <span className="font-bold">{formatCFA(payrollResult.irpp)}</span>
              </div>
              <div className="flex justify-between">
                <span>CFC:</span>
                <span className="font-bold">{formatCFA(payrollResult.autres.cfc)}</span>
              </div>
              <div className="flex justify-between">
                <span>RAV:</span>
                <span className="font-bold">{formatCFA(payrollResult.rav)}</span>
              </div>
              <div className="flex justify-between">
                <span>TDL:</span>
                <span className="font-bold">{formatCFA(payrollResult.tdl)}</span>
              </div>
              <div className="flex justify-between">
                <span>FNE:</span>
                <span className="font-bold">{formatCFA(payrollResult.autres.fneSalarie)}</span>
              </div>
            </div>
          </div>

          {/* Résultat final */}
          <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">💵 Résultat Final</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total Retenues:</span>
                <span className="font-bold text-red-600">{formatCFA(payrollResult.totalRetenues)}</span>
              </div>
              <div className="flex justify-between text-xl border-t pt-3">
                <span className="font-bold">NET À PAYER:</span>
                <span className="font-bold text-green-600 text-2xl">{formatCFA(payrollResult.salaireNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations système */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">ℹ️ Informations Système</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>SBC:</strong> Salaire Brut Cotisable = Salaire + Primes cotisables (pour CNPS)</p>
          <p>• <strong>SBT:</strong> Salaire Brut Taxable = SBC + Primes non cotisables (pour impôts)</p>
          <p>• <strong>Distinction:</strong> Prime transport non cotisable mais imposable</p>
          <p>• <strong>Plafonds:</strong> Transport ≤ 30 000 FCFA, Panier ≤ 20 000 FCFA</p>
        </div>
      </div>
    </div>
  );
};

export default NewPayrollDemo;
