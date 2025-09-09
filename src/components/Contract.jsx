import React from "react";
import { displayGeneratedAt, displayContractStartDate, displayContractEndDate } from "../utils/displayUtils";
import ExportContrat from "../compoments/ExportContrat";

const Contract = ({ employee, employer, contract }) => {
  const safeEmployee = employee || {};
  const safeEmployer = employer || {};
  const safeContract = contract || {};

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Contrat de Travail</h2>
              <p className="text-center">Généré le: {displayGeneratedAt(safeContract.generatedAt || Date.now())}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Employé</h3>
          <p>Nom: {safeEmployee.name || "N/A"}</p>
          <p>Email: {safeEmployee.email || "N/A"}</p>
          <p>Poste: {safeEmployee.poste || "N/A"}</p>
          <p>Numéro CNPS: {safeEmployee.cnpsNumber || "N/A"}</p>
        </div>
        <div>
          <h3 className="font-semibold">Employeur</h3>
          <p>Entreprise: {safeEmployer.companyName}</p>
          <p>Adresse: {safeEmployer.address}</p>
          <p>Numéro contribuable: {safeEmployer?.taxpayerNumber || "N/A"}</p>
          <p>Numéro CNPS: {safeEmployer.cnpsNumber}</p>
        </div>
      </div>
      <h3 className="font-semibold mt-4">Détails du Contrat</h3>
      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Type de contrat</td>
            <td className="py-2 px-4">{safeContract.contractType || "N/A"}</td>
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
