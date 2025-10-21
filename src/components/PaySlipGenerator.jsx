import React from "react";
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from "react-toastify";
import { computeNetPay, computeEffectiveDeductions, computeRoundedDeductions, formatCFA, computeSBT, computeSBC, computeStatutoryDeductions, computeTDL } from "../utils/payrollCalculations";
import { calculateSeniorityPrime, createSeniorityPrimeObject, formatSeniority } from "../utils/seniorityUtils";
import PrimeIndemniteSelector from "../compoments/PrimeIndemniteSelector";
import Button from "../compoments/Button";

const PaySlipGenerator = ({ employee, company, initialData, selectedTemplate = "eneo", onSave, onCancel, actionLoading, updateEmployee, setSelectedEmployee }) => {
  const [formData, setFormData] = React.useState(() => {
    const now = new Date();
    const currYear = now.getFullYear();
    const currMonth = String(now.getMonth() + 1).padStart(2, '0');
    const defaultPeriod = `${currYear}-${currMonth}`;
    const baseSalaryInit = initialData?.salaryDetails?.baseSalary || employee?.baseSalary || 0;
    let primesInit = initialData?.primes || [];
    let indemnitesInit = initialData?.indemnites || [];
    // Pré-remplir à partir des données employé (aligné avec la création)
    const transport = Number(employee?.transportAllowance || 0);
    if (transport > 0 && !primesInit.some(p => (p.label || '').toLowerCase() === 'prime de transport')) {
      primesInit = [...primesInit, { label: 'Prime de transport', montant: transport }];
    }
    const housing = Number(employee?.housingAllowance || 0);
    if (housing > 0 && !indemnitesInit.some(i => (i.label || '').toLowerCase() === 'indemnité logement')) {
      indemnitesInit = [...indemnitesInit, { label: 'Indemnité logement', montant: housing }];
    }
    // Pré-remplir la prime d'ancienneté si applicable
    const seniorityYears = Number(employee?.seniority || employee?.seniorityYears || 0);
    const seniorityPercent = seniorityYears >= 2 ? 2 : 0;
    const seniorityAmount = Math.round((baseSalaryInit || 0) * (seniorityPercent / 100));
    if (seniorityAmount > 0 && !primesInit.some(p => (p.label || '').toLowerCase() === "prime d'ancienneté")) {
      primesInit = [...primesInit, { 
        label: "Prime d'ancienneté", 
        montant: seniorityAmount,
        type: "seniority",
        auto: true,
        readonly: true
      }];
    }
    
    // Calculer toutes les déductions statutaires dès l'initialisation
    const statutoryDeductions = computeStatutoryDeductions(
      { baseSalary: baseSalaryInit },
      { workedDays: 30, overtime: 0 },
      primesInit,
      indemnitesInit
    );
    
    const deductionsInit = {
      ...statutoryDeductions,
      advance: initialData?.deductions?.advance || 0,
      other: initialData?.deductions?.other || 0,
      total: Object.values(statutoryDeductions).reduce((sum, val) => sum + (Number(val) || 0), 0)
    };
    
    return {
      payPeriod: initialData?.payPeriod || defaultPeriod,
      salaryDetails: {
        baseSalary: baseSalaryInit,
        dailyRate: initialData?.salaryDetails?.dailyRate || baseSalaryInit / 30,
        hourlyRate: initialData?.salaryDetails?.hourlyRate || baseSalaryInit / (30 * 8),
        // Propager le modèle sélectionné pour usage ultérieur
        selectedTemplate: (initialData?.salaryDetails?.selectedTemplate || selectedTemplate || 'eneo')
      },
      remuneration: {
        workedDays: initialData?.remuneration?.workedDays || 30,
        overtime: initialData?.remuneration?.overtime || 0,
        total: initialData?.remuneration?.total || baseSalaryInit,
        // Propager également ici pour compatibilité
        selectedTemplate: (initialData?.remuneration?.selectedTemplate || selectedTemplate || 'eneo')
      },
      deductions: deductionsInit,
      primes: primesInit,
      indemnites: indemnitesInit,
      generatedAt: initialData?.generatedAt || new Date().toISOString(),
      month: initialData?.month || currMonth,
      year: initialData?.year || String(currYear),
      id: initialData?.id || uuidv4(),
      seniority: (() => {
        const seniorityYears = Number(employee?.seniority || employee?.seniorityYears || 0);
        const seniorityPercent = seniorityYears >= 2 ? 2 : 0;
        const seniorityAmount = Math.round((baseSalaryInit || 0) * (seniorityPercent / 100));
        console.log('[PaySlipGenerator] Initial seniority calculation:', {
          employee: employee?.name,
          employeeSeniority: employee?.seniority,
          employeeSeniorityYears: employee?.seniorityYears,
          seniorityYears,
          seniorityPercent,
          baseSalaryInit,
          seniorityAmount
        });
        return {
          years: seniorityYears,
          percent: seniorityPercent,
          amount: seniorityAmount,
        };
      })(),
    };
  });

  const [showMissingInfoModal, setShowMissingInfoModal] = React.useState(false);
  const [missingInfo, setMissingInfo] = React.useState({});
  const [missingInfoValues, setMissingInfoValues] = React.useState({});

  const requiredFields = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'poste', label: 'Poste' },
    { key: 'professionalCategory', label: 'Catégorie professionnelle' },
    { key: 'cnpsNumber', label: 'Numéro CNPS' },
    { key: 'email', label: 'Email' },
  ];

  React.useEffect(() => {
    const missing = {};
    requiredFields.forEach(f => {
      if (!employee[f.key] || employee[f.key] === '') {
        missing[f.key] = '';
      }
    });
    setMissingInfo(missing);
    setMissingInfoValues(missing);
  }, [employee]);

  React.useEffect(() => {
    const baseSalary = formData.salaryDetails.baseSalary;
    const salaryDetails = formData.salaryDetails;
    const overtime = formData.remuneration.overtime;
    const primes = formData.primes;
    const indemnites = formData.indemnites;

    const payrollCalc = computeNetPay({
      salaryDetails: { baseSalary, ...salaryDetails },
      remuneration: { overtime, workedDays: formData.remuneration.workedDays },
      deductions: formData.deductions,
      primes,
      indemnites
    });
    
    setFormData(prev => ({
      ...prev,
      deductions: payrollCalc.deductions,
      remuneration: { 
        ...prev.remuneration, 
        total: payrollCalc.grossTotal // Utiliser grossTotal, pas netPay
      },
    }));
  }, [formData.salaryDetails.baseSalary, formData.primes, formData.indemnites]);

  const handleMissingInfoChange = (key, value) => {
    setMissingInfoValues(prev => ({ ...prev, [key]: value }));
  };

  const handleMissingInfoSubmit = async () => {
    await updateEmployee(employee.id, missingInfoValues);
    setShowMissingInfoModal(false);
    setSelectedEmployee(prev => ({ ...prev, ...missingInfoValues }));
    setMissingInfo({});
  };

  const handleSalaryChange = (e) => {
    const baseSalary = parseFloat(e.target.value) || 0;
    if (baseSalary < 0) {
      toast.error("Le salaire de base ne peut pas être négatif.");
      return;
    }
    
    // Calculer les déductions statutaires avec les utilitaires centralisés
    const statutoryDeductions = computeStatutoryDeductions(
      { baseSalary }, 
      {}, 
      formData.primes, 
      formData.indemnites
    );
    
    setFormData((prev) => ({
      ...prev,
      salaryDetails: { ...prev.salaryDetails, baseSalary },
      deductions: { ...prev.deductions, ...statutoryDeductions },
    }));
  };


  // Recalcule et synchronise la prime d'ancienneté lorsque salaire change (basé sur l'expérience totale)
  React.useEffect(() => {
    const baseSalary = formData.salaryDetails.baseSalary;
    const seniorityYears = Number(employee?.seniority || employee?.seniorityYears || 0);
    const seniorityPercent = seniorityYears >= 2 ? 2 : 0;
    const seniorityAmount = Math.round(baseSalary * (seniorityPercent / 100));
    
    console.log('[PaySlipGenerator] Seniority calculation:', {
      employeeSeniority: employee?.seniority,
      seniorityYears,
      seniorityPercent,
      baseSalary,
      seniorityAmount
    });
    
    setFormData(prev => {
      // Met à jour montant auto et synchronise dans primes (non éditable)
      const primes = [...prev.primes];
      const idx = primes.findIndex(p => (p.label || '').toLowerCase() === "prime d'ancienneté".toLowerCase());
      
      // Supprimer l'ancienne prime d'ancienneté
      if (idx >= 0) {
        primes.splice(idx, 1);
      }
      
      // Ajouter la nouvelle prime si montant > 0
      if (seniorityAmount > 0) {
        primes.push({
          label: "Prime d'ancienneté",
          montant: seniorityAmount,
          type: "seniority",
          auto: true,
          readonly: true
        });
      }
      
      return { 
        ...prev, 
        primes, 
        seniority: { 
          years: seniorityYears, 
          percent: seniorityPercent, 
          amount: seniorityAmount 
        } 
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.salaryDetails.baseSalary, employee?.seniority, employee?.seniorityYears]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const missing = {};
    requiredFields.forEach(f => {
      if (!employee[f.key] || employee[f.key] === '') {
        missing[f.key] = '';
      }
    });
    if (Object.keys(missing).length > 0) {
      setMissingInfo(missing);
      setMissingInfoValues(missing);
      setShowMissingInfoModal(true);
      return;
    }
    if (!formData.payPeriod || !formData.month || !formData.year) {
      toast.error("Veuillez sélectionner une période de paie.");
      return;
    }
    if (formData.salaryDetails.baseSalary < 0) {
      toast.error("Le salaire de base ne peut pas être négatif.");
      return;
    }
    onSave({
      ...formData,
      employee: {
        id: employee.id || '',
        name: employee.name || '',
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        matricule: employee.matricule || '',
        poste: employee.poste || '',
        professionalCategory: employee.professionalCategory || '',
        email: employee.email || '',
        cnpsNumber: employee.cnpsNumber || '',
      },
      salaryDetails: {
        baseSalary: Number(formData.salaryDetails.baseSalary),
        dailyRate: Number(formData.salaryDetails.baseSalary) / 30,
        hourlyRate: Number(formData.salaryDetails.baseSalary) / (30 * 8),
      },
      remuneration: {
        workedDays: formData.remuneration.workedDays,
        overtime: formData.remuneration.overtime,
        total: formData.remuneration.total,
      },
      deductions: formData.deductions,
      primes: formData.primes,
      indemnites: formData.indemnites,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Période de paie</label>
        <input
          type="month"
          value={formData.payPeriod}
          onChange={(e) => {
            const [year, month] = e.target.value.split("-");
            setFormData({ ...formData, payPeriod: e.target.value, month, year });
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Salaire de base (FCFA)</label>
        <input
          type="number"
          value={formData.salaryDetails.baseSalary}
          onChange={handleSalaryChange}
          min="0"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ancienneté (années)</label>
          <input
            type="number"
            value={formData.seniority.years}
            readOnly
            title={formatSeniority(formData.seniority.years)}
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Pourcentage ancienneté (%)</label>
          <input
            type="number"
            value={formData.seniority.percent}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-center"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Prime d'ancienneté (auto)</label>
          <input
            type="number"
            min="0"
            value={formData.seniority.amount}
            readOnly
            className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm text-center"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Primes et Indemnités</label>
        {(() => {
          const primesEditable = (formData.primes || []).filter(p => (p.label || '').toLowerCase() !== "prime d'ancienneté".toLowerCase());
          const seniorityPrime = (formData.primes || []).find(p => (p.label || '').toLowerCase() === "prime d'ancienneté".toLowerCase());
          return (
            <PrimeIndemniteSelector
              primes={primesEditable}
              indemnites={formData.indemnites}
              onChange={(primes, indemnites) => setFormData(f => ({
                ...f,
                primes: seniorityPrime ? [...primes, seniorityPrime] : primes,
                indemnites
              }))}
            />
          );
        })()}
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={actionLoading}
        >
          {actionLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>

      {showMissingInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Compléter les informations de l'employé</h3>
            <p className="mb-4">Veuillez renseigner les champs suivants pour générer la fiche de paie :</p>
            {Object.keys(missingInfo).map((key) => (
              <div className="mb-4" key={key}>
                <label className="block text-sm font-medium">{requiredFields.find(f => f.key === key)?.label || key}</label>
                <input
                  type="text"
                  value={missingInfoValues[key] || ''}
                  onChange={e => handleMissingInfoChange(key, e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  placeholder={`Entrez ${requiredFields.find(f => f.key === key)?.label || key}`}
                  required
                />
              </div>
            ))}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowMissingInfoModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white"
              >
                Annuler
              </Button>
              <Button
                onClick={handleMissingInfoSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default PaySlipGenerator;
