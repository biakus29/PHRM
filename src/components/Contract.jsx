import React from "react";
import { displayGeneratedAt, displayContractStartDate, displayContractEndDate } from "../utils/displayUtils";
import ExportContrat from "../compoments/ExportContrat";

const Contract = ({ employee, employer, contract }) => {
  const safeEmployee = employee || {};
  const safeEmployer = employer || {};
  const safeContract = contract || {};

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-center">Contrat de Travail</h2>
      <p className="text-center text-xs sm:text-sm text-gray-600">Généré le: {displayGeneratedAt(safeContract.generatedAt || Date.now())}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Employé</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <p><span className="font-medium">Nom:</span> {safeEmployee.name || "N/A"}</p>
            <p className="truncate"><span className="font-medium">Email:</span> {safeEmployee.email || "N/A"}</p>
            <p><span className="font-medium">Poste:</span> {safeEmployee.poste || "N/A"}</p>
            <p><span className="font-medium">Numéro CNPS:</span> {safeEmployee.cnpsNumber || "N/A"}</p>
          </div>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Employeur</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <p><span className="font-medium">Entreprise:</span> {safeEmployer.companyName}</p>
            <p><span className="font-medium">Adresse:</span> {safeEmployer.address}</p>
            <p><span className="font-medium">Numéro contribuable:</span> {safeEmployer?.taxpayerNumber || "N/A"}</p>
            <p><span className="font-medium">Numéro CNPS:</span> {safeEmployer.cnpsNumber}</p>
          </div>
        </div>
      </div>
      <h3 className="font-semibold mt-4 text-sm sm:text-base">Détails du Contrat</h3>
      
      {/* Version mobile : cartes */}
      <div className="block sm:hidden space-y-2">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Type de contrat</span>
            <span className="text-sm">{safeContract.contractType || "N/A"}</span>
          </div>
        </div>
      </div>
      
      {/* Version desktop : tableau */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <tbody>
            <tr className="border-b border-blue-100 hover:bg-gray-50">
              <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm font-medium">Type de contrat</td>
              <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm">{safeContract.contractType || "N/A"}</td>
            </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Période d'essai</td>
            <td className="py-2 px-4">{safeContract.trialPeriod || "N/A"}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Lieu de travail</td>
            <td className="py-2 px-4">{safeContract.workPlace || "N/A"}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Date de début</td>
            <td className="py-2 px-4">{displayContractStartDate(safeContract.startDate)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Date de fin</td>
            <td className="py-2 px-4">{displayContractEndDate(safeContract.endDate)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Salaire de base</td>
            <td className="py-2 px-4">{(safeContract.baseSalary || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Clauses particulières</td>
            <td className="py-2 px-4">{safeContract.clauses || "N/A"}</td>
          </tr>
          {safeEmployee.contractFile && (
            <tr className="border-b border-blue-100">
              <td className="py-2 px-4">Fichier Contrat</td>
              <td className="py-2 px-4">
                <a href={safeEmployee.contractFile} download={`Contrat_${safeEmployee.name || "Inconnu"}.pdf`} className="text-blue-600 hover:underline">
                  Télécharger le contrat
                </a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
      
      {/* Composant ExportContrat pour générer le PDF */}
      <ExportContrat 
        employee={safeEmployee}
        employer={safeEmployer}
        contractData={safeContract}
      />
    </div>
  );
};

export default Contract;
