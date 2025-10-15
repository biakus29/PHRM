import React, { useState } from "react";
import { toast } from "react-toastify";
import { exportContractPDF } from "../utils/exportContractPDF";

const ContractGenerator = ({ employee, companyData, onSave, onCancel, actionLoading = false }) => {
  const [contract, setContract] = useState({
    employeeId: employee?.id || "",
    contractType: employee?.contract?.contractType || "CDI",
    trialPeriod: employee?.hasTrialPeriod ? employee?.trialPeriodDuration || "" : "",
    workPlace: employee?.contract?.workPlace || "",
    startDate: employee?.contract?.startDate || employee?.hireDate || "",
    endDate: employee?.contract?.endDate || "",
    baseSalary: employee?.baseSalary || 0,
    clauses: employee?.contract?.clauses || "",
    fileUrl: employee?.contractFile || null,
  });

  const handleSalaryChange = (e) => {
    const baseSalary = parseFloat(e.target.value) || 0;
    if (baseSalary < 36270) {
      toast.error("Le salaire de base doit être supérieur ou égal à 36270 FCFA.");
      return;
    }
    setContract((prev) => ({ ...prev, baseSalary }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!contract.employeeId || !contract.contractType || !contract.startDate) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (contract.baseSalary < 36270) {
      toast.error("Le salaire de base doit être supérieur ou égal à 36270 FCFA.");
      return;
    }
    onSave({
      ...contract,
      baseSalary: Number(contract.baseSalary),
    });
  };

  const handleExportContract = async () => {
    // Normaliser les données pour l'export unifié
    const normalizedContract = {
      ...contract,
      type: contract.contractType, // contractType -> type
      workLocation: contract.workPlace, // workPlace -> workLocation
      position: employee?.poste || employee?.position || 'Non spécifié'
    };
    await exportContractPDF(employee, companyData, normalizedContract);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Type de contrat</label>
        <select
          value={contract.contractType}
          onChange={(e) => setContract({ ...contract, contractType: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="CDI">CDI</option>
          <option value="CDD">CDD</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Salaire de base (FCFA)</label>
        <input
          type="number"
          value={contract.baseSalary}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
          readOnly
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Lieu de travail</label>
        <input
          type="text"
          value={contract.workPlace}
          onChange={(e) => setContract({ ...contract, workPlace: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Date de début</label>
        <input
          type="date"
          value={contract.startDate}
          onChange={(e) => setContract({ ...contract, startDate: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Représentant légal</label>
        <input
          type="text"
          value={contract.representant || companyData?.representant || ''}
          onChange={(e) => setContract({ ...contract, representant: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Nom du représentant légal"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          disabled={actionLoading}
        >
          Annuler
        </button>
      </div>
      
      {/* Bouton d'export unifié utilisant le générateur de la section Documents */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={handleExportContract}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          📄 Générer le Contrat PDF
        </button>
      </div>
    </form>
  );
};

export default ContractGenerator;
