import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import Button from "./Button";
import { FiSave, FiRefreshCw } from "react-icons/fi";

const FiscalSettings = () => {
  const [settings, setSettings] = useState({
    cnps: {
      pvidSalarie: 4.2,
      pvidEmployeur: 4.2,
      prestationsFamiliales: 7.0,
      risquesPro: {
        A: 1.75,
        B: 2.5,
        C: 5.0
      },
      plafond: 750000
    },
    taxes: {
      cfc: 1.0,
      fne: 1.0,
      cac: 10.0,
      abattementMensuel: 41666.67
    },
    exonerations: {
      primeTransport: 30000,
      primePanier: 20000
    },
    irpp: [
      { min: 0, max: 2000000, taux: 10 },
      { min: 2000001, max: 3000000, taux: 15 },
      { min: 3000001, max: 5000000, taux: 25 },
      { min: 5000001, max: Infinity, taux: 35 }
    ],
    tdl: [
      { min: 0, max: 62000, montant: 0 },
      { min: 62001, max: 100000, montant: 500 },
      { min: 100001, max: 200000, montant: 1000 },
      { min: 200001, max: 250000, montant: 1500 },
      { min: 250001, max: 500000, montant: 2000 },
      { min: 500001, max: Infinity, montant: 2500 }
    ],
    rav: [
      { min: 0, max: 100000, montant: 1950 },
      { min: 100001, max: 250000, montant: 3250 },
      { min: 250001, max: 500000, montant: 4550 },
      { min: 500001, max: Infinity, montant: 5000 }
    ]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger les paramètres depuis Firestore
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsRef = doc(db, "systemSettings", "fiscalConfig");
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data());
        }
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error);
        toast.error("Erreur de chargement des paramètres");
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Sauvegarder les paramètres
  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "systemSettings", "fiscalConfig");
      await setDoc(settingsRef, settings);
      toast.success("Paramètres sauvegardés avec succès !");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  // Réinitialiser aux valeurs par défaut
  const handleReset = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser tous les paramètres aux valeurs par défaut ?")) {
      setSettings({
        cnps: {
          pvidSalarie: 4.2,
          pvidEmployeur: 4.2,
          prestationsFamiliales: 7.0,
          risquesPro: {
            A: 1.75,
            B: 2.5,
            C: 5.0
          },
          plafond: 750000
        },
        taxes: {
          cfc: 1.0,
          fne: 1.0,
          cac: 10.0,
          abattementMensuel: 41666.67
        },
        exonerations: {
          primeTransport: 30000,
          primePanier: 20000
        },
        irpp: [
          { min: 0, max: 2000000, taux: 10 },
          { min: 2000001, max: 3000000, taux: 15 },
          { min: 3000001, max: 5000000, taux: 25 },
          { min: 5000001, max: Infinity, taux: 35 }
        ],
        tdl: [
          { min: 0, max: 62000, montant: 0 },
          { min: 62001, max: 100000, montant: 500 },
          { min: 100001, max: 200000, montant: 1000 },
          { min: 200001, max: 250000, montant: 1500 },
          { min: 250001, max: 500000, montant: 2000 },
          { min: 500001, max: Infinity, montant: 2500 }
        ],
        rav: [
          { min: 0, max: 100000, montant: 1950 },
          { min: 100001, max: 250000, montant: 3250 },
          { min: 250001, max: 500000, montant: 4550 },
          { min: 500001, max: Infinity, montant: 5000 }
        ]
      });
      toast.info("Paramètres réinitialisés (non sauvegardés)");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleReset}
          icon={FiRefreshCw}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Réinitialiser
        </Button>
        <Button
          onClick={handleSave}
          icon={FiSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      {/* Paramètres CNPS */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">⚖️ Paramètres CNPS</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PVID Salarié (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.cnps.pvidSalarie}
              onChange={(e) => setSettings({
                ...settings,
                cnps: { ...settings.cnps, pvidSalarie: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PVID Employeur (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.cnps.pvidEmployeur}
              onChange={(e) => setSettings({
                ...settings,
                cnps: { ...settings.cnps, pvidEmployeur: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prestations Familiales (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.cnps.prestationsFamiliales}
              onChange={(e) => setSettings({
                ...settings,
                cnps: { ...settings.cnps, prestationsFamiliales: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plafond CNPS (FCFA)
            </label>
            <input
              type="number"
              value={settings.cnps.plafond}
              onChange={(e) => setSettings({
                ...settings,
                cnps: { ...settings.cnps, plafond: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Risques Professionnels (%)</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Catégorie A</label>
              <input
                type="number"
                step="0.01"
                value={settings.cnps.risquesPro.A}
                onChange={(e) => setSettings({
                  ...settings,
                  cnps: { ...settings.cnps, risquesPro: { ...settings.cnps.risquesPro, A: parseFloat(e.target.value) } }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Catégorie B</label>
              <input
                type="number"
                step="0.01"
                value={settings.cnps.risquesPro.B}
                onChange={(e) => setSettings({
                  ...settings,
                  cnps: { ...settings.cnps, risquesPro: { ...settings.cnps.risquesPro, B: parseFloat(e.target.value) } }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Catégorie C</label>
              <input
                type="number"
                step="0.01"
                value={settings.cnps.risquesPro.C}
                onChange={(e) => setSettings({
                  ...settings,
                  cnps: { ...settings.cnps, risquesPro: { ...settings.cnps.risquesPro, C: parseFloat(e.target.value) } }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres Fiscaux */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">💰 Paramètres Fiscaux</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CFC (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.taxes.cfc}
              onChange={(e) => setSettings({
                ...settings,
                taxes: { ...settings.taxes, cfc: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FNE (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.taxes.fne}
              onChange={(e) => setSettings({
                ...settings,
                taxes: { ...settings.taxes, fne: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAC (% de l'IRPP)
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.taxes.cac}
              onChange={(e) => setSettings({
                ...settings,
                taxes: { ...settings.taxes, cac: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abattement Mensuel (FCFA)
            </label>
            <input
              type="number"
              value={settings.taxes.abattementMensuel}
              onChange={(e) => setSettings({
                ...settings,
                taxes: { ...settings.taxes, abattementMensuel: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Limites d'Exonération */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🎁 Limites d'Exonération</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prime Transport (FCFA)
            </label>
            <input
              type="number"
              value={settings.exonerations.primeTransport}
              onChange={(e) => setSettings({
                ...settings,
                exonerations: { ...settings.exonerations, primeTransport: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prime Panier (FCFA)
            </label>
            <input
              type="number"
              value={settings.exonerations.primePanier}
              onChange={(e) => setSettings({
                ...settings,
                exonerations: { ...settings.exonerations, primePanier: parseInt(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Barème IRPP */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Barème IRPP</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Minimum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Maximum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Taux (%)</th>
              </tr>
            </thead>
            <tbody>
              {settings.irpp.map((tranche, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={tranche.min}
                      onChange={(e) => {
                        const newIrpp = [...settings.irpp];
                        newIrpp[index].min = parseInt(e.target.value);
                        setSettings({ ...settings, irpp: newIrpp });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={tranche.max === Infinity ? "∞" : tranche.max}
                      onChange={(e) => {
                        const newIrpp = [...settings.irpp];
                        newIrpp[index].max = e.target.value === "∞" ? Infinity : parseInt(e.target.value);
                        setSettings({ ...settings, irpp: newIrpp });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={tranche.taux}
                      onChange={(e) => {
                        const newIrpp = [...settings.irpp];
                        newIrpp[index].taux = parseFloat(e.target.value);
                        setSettings({ ...settings, irpp: newIrpp });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barème TDL */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">🏛️ Barème TDL (Taxe de Développement Local)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Minimum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Maximum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {settings.tdl.map((tranche, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={tranche.min}
                      onChange={(e) => {
                        const newTdl = [...settings.tdl];
                        newTdl[index].min = parseInt(e.target.value);
                        setSettings({ ...settings, tdl: newTdl });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={tranche.max === Infinity ? "∞" : tranche.max}
                      onChange={(e) => {
                        const newTdl = [...settings.tdl];
                        newTdl[index].max = e.target.value === "∞" ? Infinity : parseInt(e.target.value);
                        setSettings({ ...settings, tdl: newTdl });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={tranche.montant}
                      onChange={(e) => {
                        const newTdl = [...settings.tdl];
                        newTdl[index].montant = parseInt(e.target.value);
                        setSettings({ ...settings, tdl: newTdl });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barème RAV */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📺 Barème RAV (Redevance Audio Visuelle)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Minimum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Maximum (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {settings.rav.map((tranche, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={tranche.min}
                      onChange={(e) => {
                        const newRav = [...settings.rav];
                        newRav[index].min = parseInt(e.target.value);
                        setSettings({ ...settings, rav: newRav });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={tranche.max === Infinity ? "∞" : tranche.max}
                      onChange={(e) => {
                        const newRav = [...settings.rav];
                        newRav[index].max = e.target.value === "∞" ? Infinity : parseInt(e.target.value);
                        setSettings({ ...settings, rav: newRav });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={tranche.montant}
                      onChange={(e) => {
                        const newRav = [...settings.rav];
                        newRav[index].montant = parseInt(e.target.value);
                        setSettings({ ...settings, rav: newRav });
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions en bas */}
      <div className="flex justify-end gap-3 sticky bottom-0 bg-white p-4 border-t">
        <Button
          onClick={handleReset}
          icon={FiRefreshCw}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          Réinitialiser
        </Button>
        <Button
          onClick={handleSave}
          icon={FiSave}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={saving}
        >
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};

export default FiscalSettings;
