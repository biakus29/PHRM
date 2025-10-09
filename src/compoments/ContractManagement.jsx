// src/components/ContractManagement.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { toast } from 'react-toastify';
import Button from '../components/Button';
import {
  CONTRACT_TYPES,
  DISMISSAL_TYPES,
  EMPLOYEE_STATUS,
  validateContract,
  calculateSeniority,
  formatSeniority,
  generateContractReference,
  calculateTrialPeriodEnd,
  isInTrialPeriod
} from '../utils/contractUtils';

const ContractManagement = ({
  employee,
  onContractUpdate,
  onContractCreate,
  onContractTerminate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [contractForm, setContractForm] = useState({
    type: CONTRACT_TYPES.CDI,
    position: '',
    department: '',
    salary: '',
    startDate: '',
    endDate: '',
    trialPeriod: '',
    duration: '',
    clauses: '',
    status: 'active'
  });

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationData, setTerminationData] = useState({
    type: DISMISSAL_TYPES.DEMISSION,
    reason: '',
    terminationDate: format(new Date(), 'yyyy-MM-dd'),
    noticePeriod: '',
    comments: ''
  });

  useEffect(() => {
    if (employee?.contract) {
      setContractForm({
        type: employee.contract.type || CONTRACT_TYPES.CDI,
        position: employee.contract.position || '',
        department: employee.contract.department || '',
        salary: employee.contract.salary || '',
        startDate: employee.contract.startDate || '',
        endDate: employee.contract.endDate || '',
        trialPeriod: employee.contract.trialPeriod || '',
        duration: employee.contract.duration || '',
        clauses: employee.contract.clauses || '',
        status: employee.contract.status || 'active'
      });
    }
  }, [employee]);

  const handleContractSubmit = (e) => {
    e.preventDefault();

    const validation = validateContract(contractForm);
    if (!validation.isValid) {
      toast.error(validation.errors.join(', '));
      return;
    }

    const contractData = {
      ...contractForm,
      reference: generateContractReference(employee, contractForm.type),
      lastModified: new Date().toISOString(),
      modifiedBy: 'current_user' // À adapter selon le système d'authentification
    };

    if (employee.contract) {
      onContractUpdate(employee.id, contractData);
      toast.success('Contrat mis à jour avec succès');
    } else {
      onContractCreate(employee.id, contractData);
      toast.success('Contrat créé avec succès');
    }

    setIsEditing(false);
  };

  const handleTerminationSubmit = (e) => {
    e.preventDefault();

    if (!terminationData.terminationDate) {
      toast.error('La date de fin de contrat est requise');
      return;
    }

    onContractTerminate(employee.id, {
      ...terminationData,
      terminationDate: new Date(terminationData.terminationDate)
    });

    toast.success('Contrat terminé avec succès');
    setShowTerminateModal(false);
  };

  const seniority = employee?.contract?.startDate ?
    calculateSeniority(employee.contract.startDate) : null;

  const inTrialPeriod = employee ? isInTrialPeriod(employee) : false;

  return (
    <div className="space-y-6">
      {/* En-tête avec informations de l'employé */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Gestion du Contrat - {employee?.name || 'Employé'}
            </h2>
            <p className="text-gray-600">Matricule: {employee?.matricule}</p>
            {seniority && (
              <p className="text-sm text-gray-500">
                Ancienneté: {formatSeniority(seniority)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className={`${isEditing ? 'bg-gray-500' : 'bg-blue-600'} text-white`}
            >
              {isEditing ? 'Annuler' : 'Modifier Contrat'}
            </Button>
            <Button
              onClick={() => setShowTerminateModal(true)}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Terminer Contrat
            </Button>
          </div>
        </div>

        {/* Statuts */}
        <div className="flex gap-4 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm ${
            inTrialPeriod ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {inTrialPeriod ? 'Période d\'essai' : 'Contrat actif'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${
            employee?.status === EMPLOYEE_STATUS.ACTIVE ? 'bg-green-100 text-green-800' :
            employee?.status === EMPLOYEE_STATUS.DISMISSED ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {employee?.status || 'Statut inconnu'}
          </span>
        </div>
      </div>

      {/* Formulaire de modification du contrat */}
      {isEditing && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {employee?.contract ? 'Modifier le contrat' : 'Créer un contrat'}
          </h3>

          <form onSubmit={handleContractSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de contrat *
                </label>
                <select
                  value={contractForm.type}
                  onChange={(e) => setContractForm({...contractForm, type: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.entries(CONTRACT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poste *
                </label>
                <input
                  type="text"
                  value={contractForm.position}
                  onChange={(e) => setContractForm({...contractForm, position: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Département
                </label>
                <input
                  type="text"
                  value={contractForm.department}
                  onChange={(e) => setContractForm({...contractForm, department: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salaire de base (FCFA) *
                </label>
                <input
                  type="number"
                  value={contractForm.salary}
                  onChange={(e) => setContractForm({...contractForm, salary: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm({...contractForm, startDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {contractForm.type === 'CDD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm({...contractForm, endDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Période d'essai
                </label>
                <select
                  value={contractForm.trialPeriod}
                  onChange={(e) => setContractForm({...contractForm, trialPeriod: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Aucune</option>
                  <option value="1 mois">1 mois</option>
                  <option value="2 mois">2 mois</option>
                  <option value="3 mois">3 mois</option>
                  <option value="6 mois">6 mois</option>
                  <option value="1 an">1 an</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée
                </label>
                <input
                  type="text"
                  value={contractForm.duration}
                  onChange={(e) => setContractForm({...contractForm, duration: e.target.value})}
                  placeholder="Ex: Indéterminée, 12 mois, etc."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clauses spéciales
              </label>
              <textarea
                value={contractForm.clauses}
                onChange={(e) => setContractForm({...contractForm, clauses: e.target.value})}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Conditions particulières, avantages, etc."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">
                {employee?.contract ? 'Mettre à jour' : 'Créer'} le contrat
              </Button>
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-500 text-white hover:bg-gray-600"
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Affichage du contrat actuel */}
      {!isEditing && employee?.contract && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Contrat actuel</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium">{CONTRACT_TYPES[employee.contract.type] || employee.contract.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Poste:</span>
                <span className="font-medium">{employee.contract.position}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Salaire:</span>
                <span className="font-medium">{Number(employee.contract.salary || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date de début:</span>
                <span className="font-medium">
                  {employee.contract.startDate ? format(new Date(employee.contract.startDate), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {employee.contract.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de fin:</span>
                  <span className="font-medium">
                    {format(new Date(employee.contract.endDate), 'dd/MM/yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Période d'essai:</span>
                <span className="font-medium">{employee.contract.trialPeriod || 'Aucune'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Durée:</span>
                <span className="font-medium">{employee.contract.duration || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Référence:</span>
                <span className="font-medium text-sm">{employee.contract.reference || 'N/A'}</span>
              </div>
            </div>
          </div>

          {employee.contract.clauses && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-2">Clauses spéciales:</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 whitespace-pre-line">{employee.contract.clauses}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de terminaison de contrat */}
      {showTerminateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Terminer le contrat</h3>

            <form onSubmit={handleTerminationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de fin de contrat *
                </label>
                <select
                  value={terminationData.type}
                  onChange={(e) => setTerminationData({...terminationData, type: e.target.value})}
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
                  Date de fin de contrat *
                </label>
                <input
                  type="date"
                  value={terminationData.terminationDate}
                  onChange={(e) => setTerminationData({...terminationData, terminationDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif
                </label>
                <textarea
                  value={terminationData.reason}
                  onChange={(e) => setTerminationData({...terminationData, reason: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Expliquez le motif de la fin de contrat..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaires
                </label>
                <textarea
                  value={terminationData.comments}
                  onChange={(e) => setTerminationData({...terminationData, comments: e.target.value})}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Commentaires additionnels..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
                  Terminer le contrat
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowTerminateModal(false)}
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

export default ContractManagement;
