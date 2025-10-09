// src/components/DismissalManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from 'react-toastify';
import Button from '../components/Button';
import {
  DISMISSAL_TYPES,
  calculateDismissalIndemnities,
  calculateSeniority,
  formatSeniority
} from '../utils/contractUtils';

const DismissalManagement = ({
  employee,
  onDismissalCreate,
  onDismissalUpdate,
  onDismissalCancel
}) => {
  const [showDismissalModal, setShowDismissalModal] = useState(false);
  const [dismissalData, setDismissalData] = useState({
    type: DISMISSAL_TYPES.DEMISSION,
    reason: '',
    terminationDate: format(new Date(), 'yyyy-MM-dd'),
    noticePeriod: '',
    effectiveDate: '',
    comments: '',
    appealPeriod: 30, // jours
    appealDeadline: ''
  });

  const [calculatedIndemnities, setCalculatedIndemnities] = useState(null);
  const [showIndemnities, setShowIndemnities] = useState(false);

  // Calcul automatique des indemnités
  useEffect(() => {
    if (employee && dismissalData.terminationDate) {
      try {
        const indemnities = calculateDismissalIndemnities(
          employee,
          dismissalData.type,
          new Date(dismissalData.terminationDate)
        );
        setCalculatedIndemnities(indemnities);

        // Calcul de la date effective (avec préavis)
        const terminationDate = new Date(dismissalData.terminationDate);
        const effectiveDate = new Date(terminationDate);
        effectiveDate.setMonth(effectiveDate.getMonth() + indemnities.noticePeriod);

        setDismissalData(prev => ({
          ...prev,
          effectiveDate: format(effectiveDate, 'yyyy-MM-dd'),
          noticePeriod: `${indemnities.noticePeriod} mois`
        }));
      } catch (error) {
        console.error('Erreur lors du calcul des indemnités:', error);
        setCalculatedIndemnities(null);
      }
    }
  }, [employee, dismissalData.type, dismissalData.terminationDate]);

  // Calcul de la date limite d'appel
  useEffect(() => {
    if (dismissalData.effectiveDate) {
      const effectiveDate = new Date(dismissalData.effectiveDate);
      const appealDeadline = new Date(effectiveDate);
      appealDeadline.setDate(appealDeadline.getDate() + dismissalData.appealPeriod);

      setDismissalData(prev => ({
        ...prev,
        appealDeadline: format(appealDeadline, 'yyyy-MM-dd')
      }));
    }
  }, [dismissalData.effectiveDate, dismissalData.appealPeriod]);

  const handleDismissalSubmit = (e) => {
    e.preventDefault();

    if (!dismissalData.terminationDate) {
      toast.error('La date de licenciement est requise');
      return;
    }

    if (!dismissalData.reason.trim()) {
      toast.error('Le motif du licenciement est requis');
      return;
    }

    const dismissalRecord = {
      ...dismissalData,
      indemnities: calculatedIndemnities,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeMatricule: employee.matricule,
      createdAt: new Date().toISOString(),
      status: 'pending_approval'
    };

    onDismissalCreate(dismissalRecord);
    toast.success('Licenciement enregistré avec succès');
    setShowDismissalModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDismissalData({
      type: DISMISSAL_TYPES.DEMISSION,
      reason: '',
      terminationDate: format(new Date(), 'yyyy-MM-dd'),
      noticePeriod: '',
      effectiveDate: '',
      comments: '',
      appealPeriod: 30,
      appealDeadline: ''
    });
    setCalculatedIndemnities(null);
    setShowIndemnities(false);
  };

  const seniority = useMemo(() => {
    if (!employee?.contract?.startDate) return null;
    return calculateSeniority(employee.contract.startDate, new Date(dismissalData.terminationDate));
  }, [employee, dismissalData.terminationDate]);

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Gestion des Licenciements - {employee?.name || 'Employé'}
            </h2>
            <p className="text-gray-600">Matricule: {employee?.matricule}</p>
            {seniority && (
              <p className="text-sm text-gray-500">
                Ancienneté au {format(new Date(dismissalData.terminationDate), 'dd/MM/yyyy')}: {formatSeniority(seniority)}
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowDismissalModal(true)}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Nouveau Licenciement
          </Button>
        </div>
      </div>

      {/* Historique des licenciements */}
      {employee?.dismissals && employee.dismissals.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Historique des licenciements</h3>

          <div className="space-y-4">
            {employee.dismissals.map((dismissal, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-800">{dismissal.type}</h4>
                    <p className="text-sm text-gray-600">
                      Date: {format(new Date(dismissal.terminationDate), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dismissal.status === 'completed' ? 'bg-green-100 text-green-800' :
                    dismissal.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {dismissal.status === 'completed' ? 'Terminé' :
                     dismissal.status === 'pending_approval' ? 'En attente' : 'Annulé'}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mb-2">{dismissal.reason}</p>

                {dismissal.indemnities && (
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <p><strong>Total des indemnités:</strong> {formatAmount(dismissal.indemnities.totalIndemnity)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de licenciement */}
      {showDismissalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Nouveau Licenciement</h3>
              <button
                onClick={() => setShowDismissalModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDismissalSubmit} className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de licenciement *
                  </label>
                  <select
                    value={dismissalData.type}
                    onChange={(e) => setDismissalData({...dismissalData, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {Object.entries(DISMISSAL_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de notification *
                  </label>
                  <input
                    type="date"
                    value={dismissalData.terminationDate}
                    onChange={(e) => setDismissalData({...dismissalData, terminationDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif détaillé *
                </label>
                <textarea
                  value={dismissalData.reason}
                  onChange={(e) => setDismissalData({...dismissalData, reason: e.target.value})}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Expliquez en détail les motifs du licenciement..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaires additionnels
                </label>
                <textarea
                  value={dismissalData.comments}
                  onChange={(e) => setDismissalData({...dismissalData, comments: e.target.value})}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Informations complémentaires..."
                />
              </div>

              {/* Calcul automatique des dates et indemnités */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-blue-800">Calcul automatique</h4>
                  <Button
                    type="button"
                    onClick={() => setShowIndemnities(!showIndemnities)}
                    className="bg-blue-600 text-white text-sm"
                  >
                    {showIndemnities ? 'Masquer' : 'Voir'} les indemnités
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Préavis:</span>
                    <p className="font-medium">{dismissalData.noticePeriod || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date effective:</span>
                    <p className="font-medium">
                      {dismissalData.effectiveDate ?
                        format(new Date(dismissalData.effectiveDate), 'dd/MM/yyyy', { locale: fr }) :
                        'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Délai d'appel:</span>
                    <p className="font-medium">
                      {dismissalData.appealDeadline ?
                        format(new Date(dismissalData.appealDeadline), 'dd/MM/yyyy', { locale: fr }) :
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Affichage détaillé des indemnités */}
              {showIndemnities && calculatedIndemnities && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-3">Indemnités calculées</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Indemnité de base:</span>
                        <span className="font-medium">{formatAmount(calculatedIndemnities.baseIndemnity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Indemnité supplémentaire:</span>
                        <span className="font-medium">{formatAmount(calculatedIndemnities.additionalIndemnity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Indemnité de préavis:</span>
                        <span className="font-medium">{formatAmount(calculatedIndemnities.noticeIndemnity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Indemnité de congés:</span>
                        <span className="font-medium">{formatAmount(calculatedIndemnities.leaveIndemnity)}</span>
                      </div>
                    </div>

                    <div className="bg-green-100 p-3 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-green-600">Total des indemnités</p>
                        <p className="text-2xl font-bold text-green-800">
                          {formatAmount(calculatedIndemnities.totalIndemnity)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p><strong>Ancienneté:</strong> {formatSeniority(calculatedIndemnities.seniority)}</p>
                    <p><strong>Préavis:</strong> {calculatedIndemnities.noticePeriod} mois</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
                  Enregistrer le licenciement
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowDismissalModal(false);
                    resetForm();
                  }}
                  className="bg-gray-500 text-white hover:bg-gray-600"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DismissalManagement;
