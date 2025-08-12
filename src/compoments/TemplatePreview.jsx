import React from 'react';
import PaySlipTemplate from './PaySlipTemplate';
import ContractTemplate from './ContractTemplate';

const TemplatePreview = ({ 
  type, // "payslip" ou "contract"
  template, 
  data,
  onClose,
  onGenerate,
  className = ""
}) => {
  
  // Données d'exemple pour la prévisualisation
  const sampleData = {
    payslip: {
      employee: {
        name: "Jean Dupont",
        matricule: "EMP001",
        poste: "Développeur",
        department: "Informatique",
        hireDate: "2023-01-15",
        cnpsNumber: "123456789"
      },
      employer: {
        companyName: "Entreprise Example SARL",
        address: "123 Rue de la Paix, Douala, Cameroun",
        cnpsNumber: "987654321",
        representant: "Marie Martin"
      },
      salaryDetails: {
        baseSalary: 250000,
        hoursWorked: 160,
        overtimeHours: 8,
        hourlyRate: 1562.5
      },
      remuneration: {
        total: 275000
      },
      deductions: {
        total: 41250,
        cnps: 19250,
        irpp: 22000,
        others: 0
      },
      payPeriod: {
        start: "2024-01-01",
        end: "2024-01-31"
      },
      generatedAt: "2024-01-31",
      primes: [
        { name: "Prime de transport", amount: 15000 },
        { name: "Prime de logement", amount: 10000 }
      ],
      indemnites: []
    },
    contract: {
      employee: {
        name: "Jean Dupont",
        matricule: "EMP001",
        dateOfBirth: "1990-05-15",
        lieuNaissance: "Douala, Littoral, Cameroun",
        residence: "456 Avenue de l'Indépendance, Douala",
        cnpsNumber: "123456789",
        department: "Informatique",
        hoursPerMonth: 160
      },
      employer: {
        companyName: "Entreprise Example SARL",
        address: "123 Rue de la Paix, Douala, Cameroun",
        cnpsNumber: "987654321",
        representant: "Marie Martin"
      },
      contract: {
        type: "CDI",
        position: "Développeur Full Stack",
        startDate: "2024-01-15",
        endDate: null,
        duration: "Indéterminée",
        salary: 250000,
        trialPeriod: "3 mois",
        clauses: "L'employé s'engage à respecter les horaires de travail et les règles de l'entreprise.\n\nToute modification du présent contrat devra faire l'objet d'un avenant signé par les deux parties."
      }
    }
  };

  const currentData = data || sampleData[type];

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Prévisualisation - {type === "payslip" ? "Fiche de paie" : "Contrat"}
            </h2>
            <p className="text-sm text-gray-600">
              Modèle : {template}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Générer le document
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Contenu de prévisualisation */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">
              <strong>Note :</strong> Ceci est une prévisualisation avec des données d'exemple. 
              Le document final contiendra les vraies données de l'employé.
            </p>
          </div>

          {/* Template */}
          <div className="bg-white rounded-lg shadow-sm">
            {type === "payslip" ? (
              <PaySlipTemplate
                employee={currentData.employee}
                employer={currentData.employer}
                salaryDetails={currentData.salaryDetails}
                remuneration={currentData.remuneration}
                deductions={currentData.deductions}
                payPeriod={currentData.payPeriod}
                generatedAt={currentData.generatedAt}
                primes={currentData.primes}
                indemnites={currentData.indemnites}
                template={template}
              />
            ) : (
              <ContractTemplate
                employee={currentData.employee}
                employer={currentData.employer}
                contract={currentData.contract}
                template={template}
              />
            )}
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p>Document optimisé pour l'impression A4</p>
              <p>Généré automatiquement par le système de gestion RH</p>
            </div>
            <div className="text-right">
              <p>Modèle : {template}</p>
              <p>Type : {type === "payslip" ? "Fiche de paie" : "Contrat de travail"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreview; 