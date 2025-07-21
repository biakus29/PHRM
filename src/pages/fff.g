```jsx
import React from "react";
import { Button, Modal, Card } from "./components"; // Composants UI personnalisés
import { Plus, Eye } from "lucide-react"; // Icônes
import PaySlip from "./PaySlip"; // Composant pour afficher la fiche de paie
import ContractGenerator from "./ContractGenerator"; // Composant pour générer les contrats
import { db } from "../firebase"; // Firebase
import { doc, updateDoc } from "firebase/firestore"; // Firebase Firestore

{activeTab === "payslips" && (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-gray-900">Gestion de la Paie</h1>
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            onClick={() => {
              setSelectedEmployee(null);
              setShowPaySlipForm(true);
            }}
            icon={Plus}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Générer Fiche
          </Button>
        </div>
        {filteredEmployees.length === 0 ? (
          <p className="text-center text-gray-500">Aucun employé disponible pour générer une fiche de paie.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="text-left py-3 px-4">Employé</th>
                  <th className="text-left py-3 px-4">Période</th>
                  <th className="text-left py-3 px-4">Montant Net</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.flatMap((emp) =>
                  emp.payslips?.length > 0 ? (
                    emp.payslips.map((payslip, index) => (
                      <tr key={`${emp.id}-${index}`} className="border-b border-blue-100 hover:bg-blue-50">
                        <td className="py-4 px-4">{emp.name || "N/A"}</td>
                        <td className="py-4 px-4">{payslip.payPeriod || `${payslip.month || "N/A"}-${payslip.year || "N/A"}`}</td>
                        <td className="py-4 px-4">
                          {((payslip.remuneration?.total || 0) - (payslip.deductions?.total || 0)).toLocaleString("fr-FR")} FCFA
                        </td>
                        <td className="py-4 px-4 flex gap-2">
                          <Button
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setPaySlipData(payslip);
                              setShowPaySlip(true);
                              setShowPaySlipForm(false);
                              setShowContractForm(false);
                            }}
                          >
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key={emp.id}>
                      <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                        Aucune fiche de paie pour {emp.name}.
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>

    {/* Modale pour afficher la fiche de paie */}
    <Modal isOpen={showPaySlip} onClose={() => setShowPaySlip(false)}>
      {paySlipData && selectedEmployee && (
        <PaySlip
          employee={selectedEmployee}
          employer={{
            companyName: companyData?.name || "N/A",
            address: companyData?.address || "N/A",
            cnpsNumber: companyData?.cnpsNumber || "N/A",
            id: companyData?.id || "",
          }}
          salaryDetails={paySlipData.salaryDetails}
          remuneration={paySlipData.remuneration}
          deductions={paySlipData.deductions}
          payPeriod={paySlipData.payPeriod}
          generatedAt={paySlipData.generatedAt}
        />
      )}
    </Modal>

    {/* Modale pour générer une fiche de paie */}
    <Modal isOpen={showPaySlipForm} onClose={() => setShowPaySlipForm(false)}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Générer une Fiche de Paie</h2>
        <select
          value={selectedEmployee?.id || ""}
          onChange={(e) => {
            const employee = employees.find((emp) => emp.id === e.target.value);
            setSelectedEmployee(employee || null);
          }}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        >
          <option value="">Sélectionner un employé</option>
          {filteredEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.poste || "N/A"})
            </option>
          ))}
        </select>
        {selectedEmployee ? (
          <PaySlipGenerator
            employee={selectedEmployee}
            company={companyData}
            onSave={(payslipData) => {
              savePaySlip(payslipData);
              setShowPaySlipForm(false);
              setShowContractForm(false);
              setShowPaySlip(false);
            }}
            actionLoading={actionLoading}
          />
        ) : (
          <p className="text-gray-500">Veuillez sélectionner un employé pour générer une fiche de paie.</p>
        )}
      </div>
    </Modal>

    {/* Modale pour afficher le contrat */}
    <Modal isOpen={showContractForm} onClose={() => setShowContractForm(false)}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{selectedEmployee?.contract ? "Modifier le Contrat" : "Créer un Contrat"}</h2>
        {selectedEmployee ? (
          <ContractGenerator
            employee={selectedEmployee}
            company={companyData}
            onSave={saveContract}
            actionLoading={actionLoading}
          />
        ) : (
          <p className="text-gray-500">Veuillez sélectionner un employé pour gérer son contrat.</p>
        )}
      </div>
    </Modal>
  </div>
)}

// PaySlipGenerator Component
function PaySlipGenerator({ employee, company, onSave, actionLoading }) {
  const [formData, setFormData] = React.useState({
    payPeriod: "",
    salaryDetails: { baseSalary: employee?.salary || 0 },
    remuneration: { total: employee?.salary || 0 },
    deductions: {
      fne: 0, // FNE fixé à 0
      cnps: employee?.salary ? employee.salary * 0.042 : 0, // 4.2% pour CNPS
      taxes: employee?.salary ? employee.salary * 0.1 : 0, // 10% pour taxes (exemple)
      total: employee?.salary ? employee.salary * (0.042 + 0.1) : 0,
    },
    generatedAt: new Date().toISOString(),
  });

  const [missingData, setMissingData] = React.useState({});
  const [showMissingDataForm, setShowMissingDataForm] = React.useState(false);
  const [error, setError] = React.useState("");

  // Vérification des données manquantes et mise à jour des déductions
  React.useEffect(() => {
    const missing = {};
    if (!company?.name) missing.companyName = "";
    if (!company?.address) missing.companyAddress = "";
    if (!company?.cnpsNumber) missing.cnpsNumber = "";
    if (!employee?.salary) missing.baseSalary = "";
    setMissingData(missing);
    setShowMissingDataForm(Object.keys(missing).length > 0);

    // Recalculer les déductions si le salaire de base change
    if (employee?.salary) {
      setFormData((prev) => ({
        ...prev,
        salaryDetails: { baseSalary: employee.salary },
        remuneration: { total: employee.salary },
        deductions: {
          fne: 0,
          cnps: employee.salary * 0.042, // 4.2% pour CNPS
          taxes: employee.salary * 0.1, // 10% pour taxes (exemple)
          total: employee.salary * (0.042 + 0.1),
        },
      }));
    }
  }, [employee, company]);

  const handleMissingDataChange = (e) => {
    const { name, value } = e.target;
    setMissingData((prev) => ({ ...prev, [name]: value }));

    // Si le salaire de base est saisi, recalculer les déductions
    if (name === "baseSalary" && value) {
      const baseSalary = parseFloat(value) || 0;
      setFormData((prev) => ({
        ...prev,
        salaryDetails: { baseSalary },
        remuneration: { total: baseSalary },
        deductions: {
          fne: 0,
          cnps: baseSalary * 0.042,
          taxes: baseSalary * 0.1,
          total: baseSalary * (0.042 + 0.1),
        },
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "payPeriod") {
      // Valider le format MM-YYYY
      const regex = /^(0[1-9]|1[0-2])-\d{4}$/;
      if (value && !regex.test(value)) {
        setError("La période de paie doit être au format MM-YYYY (ex. 01-2025).");
        return;
      }
      setError("");
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    const updatedDeductions = {
      ...formData.deductions,
      [name]: parseFloat(value) || 0,
      fne: 0, // Toujours 0 pour FNE
    };
    updatedDeductions.total = updatedDeductions.cnps + updatedDeductions.taxes;
    setFormData((prev) => ({
      ...prev,
      deductions: updatedDeductions,
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.payPeriod) {
      setError("La période de paie est requise.");
      return;
    }
    if (Object.values(missingData).some((value) => !value)) {
      setError("Veuillez renseigner toutes les données manquantes.");
      return;
    }
    if (!formData.salaryDetails.baseSalary) {
      setError("Le salaire de base est requis.");
      return;
    }

    // Enregistrer les données manquantes dans Firebase
    if (missingData.companyName || missingData.companyAddress || missingData.cnpsNumber) {
      try {
        const companyRef = doc(db, "companies", company?.id || "default");
        await updateDoc(companyRef, {
          name: missingData.companyName || company?.name,
          address: missingData.companyAddress || company?.address,
          cnpsNumber: missingData.cnpsNumber || company?.cnpsNumber,
        });
      } catch (err) {
        setError("Erreur lors de l'enregistrement des données de l'entreprise.");
        return;
      }
    }
    if (missingData.baseSalary) {
      try {
        const employeeRef = doc(db, "employees", employee.id);
        await updateDoc(employeeRef, {
          salary: parseFloat(missingData.baseSalary) || formData.salaryDetails.baseSalary,
        });
      } catch (err) {
        setError("Erreur lors de l'enregistrement du salaire de l'employ