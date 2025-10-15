import React, { useState } from "react";
import { FiFileText, FiDownload, FiEdit, FiCalendar, FiUser, FiMapPin } from 'react-icons/fi';
import { displayGeneratedAt, displayContractStartDate, displayContractEndDate } from "../utils/displayUtils";
import { exportContractPDF } from "../utils/exportContractPDF";
import { exportDocumentContract } from '../utils/exportContractPDF';
import { toast } from 'react-toastify';

const Contract = ({ employee, employer, contract, onContractUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  
  const safeEmployee = employee || {};
  const safeEmployer = employer || {};
  const safeContract = contract || {};

  const handleExportContract = async () => {
    try {
      // Utiliser la même fonction que DocumentsManager pour la cohérence
      const contractData = {
        employerName: safeEmployer.name || safeEmployer.companyName,
        employerBP: safeEmployer.bp || 'BP 12345',
        employerPhone: safeEmployer.phone,
        employerRepresentative: safeEmployer.representant || 'Directeur Général',
        employerCNPS: safeEmployer.cnpsNumber,
        employeeName: safeEmployee.name,
        employeeBirthDate: safeEmployee.dateOfBirth || safeEmployee.birthDate,
        employeeBirthPlace: safeEmployee.lieuNaissance || safeEmployee.birthPlace,
        employeeAddress: safeEmployee.residence || safeEmployee.address,
        employeePosition: safeEmployee.poste || safeEmployee.position,
        totalSalary: safeContract.totalSalary || safeContract.baseSalary,
        baseSalary: safeContract.baseSalary,
        contractDuration: safeContract.contractDuration || '12 mois',
        startDate: safeContract.startDate,
        trialPeriod: safeContract.trialPeriod || 3
      };
      
      await exportDocumentContract(contractData);
      toast.success('Contrat exporté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast.error('Erreur lors de l\'export du contrat');
    }
  };

  const handleEditContract = () => {
    setEditData(safeContract);
    setIsEditing(true);
  };

  const handleSaveContract = () => {
    if (onContractUpdate) {
      onContractUpdate(safeEmployee.id, editData);
    }
    setIsEditing(false);
    toast.success('Contrat mis à jour avec succès');
  };

  return (
    <div className="p-6">
      {/* En-tête avec actions */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FiFileText className="w-6 h-6 mr-2 text-blue-600" />
            Contrat de Travail
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Généré le: {displayGeneratedAt(safeContract.generatedAt || Date.now())}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEditContract}
            className="flex items-center px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <FiEdit className="w-4 h-4 mr-2" />
            Modifier
          </button>
          <button
            onClick={handleExportContract}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="w-4 h-4 mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
          <h3 className="font-semibold text-lg mb-3 text-blue-900 flex items-center">
            <FiUser className="w-5 h-5 mr-2" />
            Employé
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-blue-200">
              <span className="font-medium text-gray-700">Nom complet</span>
              <span className="text-gray-900">{safeEmployee.name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-blue-200">
              <span className="font-medium text-gray-700">Email</span>
              <span className="text-gray-900 truncate">{safeEmployee.email || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-blue-200">
              <span className="font-medium text-gray-700">Poste</span>
              <span className="text-gray-900">{safeEmployee.poste || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-gray-700">N° CNPS</span>
              <span className="text-gray-900">{safeEmployee.cnpsNumber || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
          <h3 className="font-semibold text-lg mb-3 text-green-900 flex items-center">
            <FiMapPin className="w-5 h-5 mr-2" />
            Employeur
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-green-200">
              <span className="font-medium text-gray-700">Entreprise</span>
              <span className="text-gray-900">{safeEmployer.name || safeEmployer.companyName || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-green-200">
              <span className="font-medium text-gray-700">Adresse</span>
              <span className="text-gray-900">{safeEmployer.address || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-green-200">
              <span className="font-medium text-gray-700">N° Contribuable</span>
              <span className="text-gray-900">{safeEmployer.taxpayerNumber || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="font-medium text-gray-700">N° CNPS</span>
              <span className="text-gray-900">{safeEmployer.cnpsNumber || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
      {/* Détails du contrat */}
      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-4 text-gray-900 flex items-center">
          <FiCalendar className="w-5 h-5 mr-2 text-purple-600" />
          Détails du Contrat
        </h3>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
            <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-1">Type de contrat</div>
              <div className="text-lg font-semibold text-gray-900">{safeContract.contractType || "CDI"}</div>
            </div>
            <div className="p-4 border-b md:border-b-0 lg:border-r border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-1">Période d'essai</div>
              <div className="text-lg font-semibold text-gray-900">{safeContract.trialPeriod || "3"} mois</div>
            </div>
            <div className="p-4 border-b lg:border-b-0 border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-1">Lieu de travail</div>
              <div className="text-lg font-semibold text-gray-900">{safeContract.workPlace || "N/A"}</div>
            </div>
            <div className="p-4 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-1">Date de début</div>
              <div className="text-lg font-semibold text-gray-900">{displayContractStartDate(safeContract.startDate)}</div>
            </div>
            <div className="p-4 border-b md:border-b-0 lg:border-r border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-1">Date de fin</div>
              <div className="text-lg font-semibold text-gray-900">{displayContractEndDate(safeContract.endDate)}</div>
            </div>
            <div className="p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Salaire de base</div>
              <div className="text-lg font-semibold text-green-600">{(safeContract.baseSalary || 0).toLocaleString()} FCFA</div>
            </div>
          </div>
          
          {safeContract.clauses && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm font-medium text-gray-500 mb-2">Clauses particulières</div>
              <div className="text-gray-900">{safeContract.clauses}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal d'édition (à implémenter si nécessaire)
const EditContractModal = ({ isOpen, onClose, contractData, onSave }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Modifier le contrat</h3>
        {/* Formulaire d'édition à implémenter */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
};

export default Contract;
