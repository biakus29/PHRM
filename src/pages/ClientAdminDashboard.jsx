import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { auth, db } from "../firebase";
import {
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  writeBatch, 
  deleteField,
  query,
  where,
  onSnapshot,
  addDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  Bell,
  Settings,
  BarChart3,
  Menu,
  X,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Edit2,
  Check,
  XCircle,
  Upload,
  FileText,
  Trash,
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { v4 as uuidv4 } from 'uuid';
import ExportContrat from "../compoments/ExportContrat";
import ExportPaySlip from "../compoments/ExportPaySlip";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
// 1. Place la fonction removeUndefined tout en haut du fichier
function removeUndefined(obj) {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {});
  }
  return obj;
}
// Composant PaySlipGenerator (adapté de l'ancien code)
const PaySlipGenerator = ({ employee, company, initialData, onSave, onCancel, actionLoading, updateEmployee, setSelectedEmployee }) => {
  const [formData, setFormData] = React.useState({
    payPeriod: initialData?.payPeriod || '',
    salaryDetails: {
      baseSalary: initialData?.salaryDetails?.baseSalary || employee?.baseSalary || 0,
      dailyRate: initialData?.salaryDetails?.dailyRate || (employee?.baseSalary || 0) / 30,
      hourlyRate: initialData?.salaryDetails?.hourlyRate || (employee?.baseSalary || 0) / (30 * 8),
      transportAllowance: initialData?.salaryDetails?.transportAllowance || 0,
    },
    remuneration: {
    workedDays: initialData?.remuneration?.workedDays || 30,
      overtime: initialData?.remuneration?.overtime || 0,
      total: initialData?.remuneration?.total || employee?.baseSalary || 0,
    },
    deductions: {
      pvis: initialData?.deductions?.pvis || 0,
      irpp: initialData?.deductions?.irpp || 0,
      cac: initialData?.deductions?.cac || 0,
      cfc: initialData?.deductions?.cfc || 0,
      rav: initialData?.deductions?.rav || 0,
      tdl: initialData?.deductions?.tdl || 0,
      total: initialData?.deductions?.total || 0,
    },
    generatedAt: initialData?.generatedAt || new Date().toISOString(),
    month: initialData?.month || '',
    year: initialData?.year || '',
    id: initialData?.id || uuidv4(),
  });

  const [showMissingInfoModal, setShowMissingInfoModal] = React.useState(false);
  const [missingInfo, setMissingInfo] = React.useState({});
  const [missingInfoValues, setMissingInfoValues] = React.useState({});

  // Champs essentiels à vérifier
  const requiredFields = [
    { key: 'matricule', label: 'Matricule' },
    { key: 'poste', label: 'Poste' },
    { key: 'professionalCategory', label: 'Catégorie professionnelle' },
    { key: 'cnpsNumber', label: 'Numéro CNPS' },
    { key: 'email', label: 'Email' },
  ];

  // Vérification des champs manquants
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

  // Calculer les déductions initiales si un salaire de base est fourni
  React.useEffect(() => {
    const baseSalary = formData.salaryDetails.baseSalary;
    if (baseSalary > 0 && (!formData.deductions.pvis || formData.deductions.total === 0)) {
      const calculatedDeductions = calculateDeductions(baseSalary);
      setFormData(prev => ({
        ...prev,
        deductions: calculatedDeductions,
      }));
    }
  }, [formData.salaryDetails.baseSalary]);

  // Handler pour compléter les infos manquantes
  const handleMissingInfoChange = (key, value) => {
    setMissingInfoValues(prev => ({ ...prev, [key]: value }));
  };

  const handleMissingInfoSubmit = async () => {
    // Mettre à jour l'employé dans Firestore
    await updateEmployee(employee.id, missingInfoValues);
    setShowMissingInfoModal(false);
    // Mettre à jour l'état local de l'employé sélectionné
    setSelectedEmployee(prev => ({ ...prev, ...missingInfoValues }));
    setMissingInfo({});
  };

  const calculateDeductions = (baseSalary) => {
    const maxCnpsSalary = 750000; // Plafond CNPS
    const cnpsRate = 0.042; // 4.2%
    const pvis = Math.min(baseSalary, maxCnpsSalary) * cnpsRate;
    
    // SNC pour IRPP (Salaire Net Catégoriel)
    const snc = baseSalary > 0 ? (baseSalary * 0.7) - pvis - (500000 / 12) : 0;
    
    // IRPP progressif selon le barème camerounais
    let irpp = 0;
    if (baseSalary >= 62000 && snc > 0) {
      if (snc <= 166667) irpp = snc * 0.10;
      else if (snc <= 250000) irpp = 16667 + (snc - 166667) * 0.15;
      else if (snc <= 416667) irpp = 29167 + (snc - 250000) * 0.25;
      else irpp = 70833.75 + (snc - 416667) * 0.35;
    }
    
    // CAC = 10% de l'IRPP
    const cac = irpp * 0.1;
    
    // CFC = Contribution Foncière Communale (montant fixe selon la commune)
    // Pour simplifier, on utilise un montant fixe de 5000 FCFA
    const cfc = 5000;
    
    // RAV = Redevance Audio-Visuelle (montant fixe)
    // Montant fixe de 5000 FCFA par an, soit ~417 FCFA par mois
    const rav = 417;
    
    // TDL = Taxe de Développement Local (montant fixe selon la commune)
    // Pour simplifier, on utilise un montant fixe de 3000 FCFA
    const tdl = 3000;
    
    const total = pvis + irpp + cac + cfc + rav + tdl;
    
    return {
      pvis,
      irpp,
      cac,
      cfc,
      rav,
      tdl,
      total,
    };
  };

  const handleSalaryChange = (e) => {
    const baseSalary = parseFloat(e.target.value) || 0;
    if (baseSalary < 0) {
      toast.error("Le salaire de base ne peut pas être négatif.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      salaryDetails: { ...prev.salaryDetails, baseSalary },
      remuneration: { ...prev.remuneration, total: baseSalary },
      deductions: calculateDeductions(baseSalary),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Vérifier à nouveau les champs essentiels
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
        transportAllowance: Number(formData.salaryDetails.transportAllowance || 0),
      },
      deductions: formData.deductions,
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Indemnité de transport (FCFA)</label>
        <input
          type="number"
          value={formData.salaryDetails.transportAllowance}
          onChange={e =>
            setFormData({
              ...formData,
              salaryDetails: {
                ...formData.salaryDetails,
                transportAllowance: parseFloat(e.target.value) || 0,
              },
            })
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

// Composant ContractGenerator (à ajouter pour éviter l'erreur)
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={actionLoading}
        >
          {actionLoading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
      
      {/* Composant ExportContrat pour générer le PDF */}
      <ExportContrat 
        employee={employee}
        employer={companyData}
        contractData={contract}
      />
    </form>
  );
};
// Composant PaySlip (adapté de l'ancien code)
// Update the PaySlip component

const Contract = ({ employee, employer, contract }) => {
  const safeEmployee = employee || {};
  const safeEmployer = employer || {};
  const safeContract = contract || {};

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Contrat de Travail</h2>
      <p className="text-center">Généré le: {new Date(safeContract.generatedAt || Date.now()).toLocaleDateString("fr-FR")}</p>
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
            <td className="py-2 px-4">{safeContract.startDate ? new Date(safeContract.startDate).toLocaleDateString("fr-FR") : "N/A"}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Date de fin</td>
            <td className="py-2 px-4">{safeContract.endDate ? new Date(safeContract.endDate).toLocaleDateString("fr-FR") : "N/A"}</td>
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

const PaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt }) => {
  // État pour gérer la modale et les champs manquants
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [formData, setFormData] = useState({
    matricule: "",
    pvis: "",
    irpp: "",
  });

  // Validation et uniformisation du salaire de base
  const baseSalary = employee?.baseSalary || salaryDetails?.baseSalary || 0;
  if (baseSalary === 0 || isNaN(baseSalary)) {
    console.warn("[PaySlip] Salaire de base non défini, nul ou invalide. Utilisation de 0 comme valeur par défaut.");
    toast.warn("Aucun salaire de base valide défini. La fiche de paie sera générée avec un salaire de base de 0 FCFA.");
  }

  // Validation des props avec détection des champs manquants
  const validateProps = () => {
    const missing = [];
    if (!employee || !employee.matricule) missing.push("matricule de l'employé");
    if (!deductions || deductions.pvis === undefined) missing.push("PVIS");
    if (!deductions || deductions.irpp === undefined) missing.push("IRPP");
    return missing;
  };

  // Validation des déductions
  const validateDeductions = (deductions, baseSalary, formData) => {
    const warnings = [];
    const pvis = deductions?.pvis || formData?.pvis || 0;
    const irpp = deductions?.irpp || formData?.irpp || 0;
    
    // Validation PVIS (5% du salaire de base)
    const expectedPvis = baseSalary * 0.05;
    if (Math.abs(pvis - expectedPvis) > 100) {
      warnings.push(`PVIS: ${pvis.toLocaleString()} FCFA (attendu: ${expectedPvis.toLocaleString()} FCFA)`);
    }
    
    // Validation IRPP (basique)
    if (irpp > baseSalary * 0.3) {
      warnings.push(`IRPP: ${irpp.toLocaleString()} FCFA (semble élevé)`);
    }
    
    return warnings;
  };

  // Cache du logo
  const cacheLogo = (companyId) => {
    try {
      const logoData = localStorage.getItem(`logo_${companyId}`);
      if (logoData) {
        return logoData;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du logo:", error);
    }
    return null;
  };

  // Gestion de la modale
  const handleModalSubmit = () => {
    // Mettre à jour les données avec les champs manquants
    const updatedDeductions = {
      ...deductions,
      pvis: parseFloat(formData.pvis) || 0,
      irpp: parseFloat(formData.irpp) || 0,
    };
    
    // Recalculer le total des déductions
    const totalDeductions = Object.values(updatedDeductions).reduce((sum, value) => {
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
    
    updatedDeductions.total = totalDeductions;
    
    // Fermer la modale
    setIsModalOpen(false);
    
    // Générer le PDF avec les données mises à jour
    // Le composant ExportPaySlip s'occupera de la génération
  };

  const handleModalSkip = () => {
    setIsModalOpen(false);
    // Continuer sans les champs manquants
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Vérifier les champs manquants au chargement
  useEffect(() => {
    const missing = validateProps();
    if (missing.length > 0) {
      setMissingFields(missing);
      setIsModalOpen(true);
    }
  }, [employee, deductions]);

  // Calculs
  const remunerationTotal = remuneration?.total || 0;
  const deductionsTotal = deductions?.total || 0;
  const netToPay = Math.max(0, remunerationTotal - deductionsTotal);

  // Validation des déductions
  const deductionWarnings = validateDeductions(deductions, baseSalary, formData);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Fiche de Paie</h2>
      <p className="text-center">Période: {payPeriod || 'N/A'}</p>
      <p className="text-center">Généré le: {new Date(generatedAt || Date.now()).toLocaleDateString("fr-FR")}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold">Employé</h3>
          <p>Nom: {employee?.name || "N/A"}</p>
          <p>Matricule: {employee?.matricule || "N/A"}</p>
          <p>Poste: {employee?.poste || "N/A"}</p>
          <p>Catégorie: {employee?.professionalCategory || "N/A"}</p>
          <p>Numéro CNPS: {employee?.cnpsNumber || "N/A"}</p>
          <p>Email: {employee?.email || "N/A"}</p>
        </div>
        <div>
          <h3 className="font-semibold">Employeur</h3>
          <p>Entreprise: {employer?.companyName}</p>
          <p>Adresse: {employer?.address}</p>
          <p>Numéro CNPS: {employer?.cnpsNumber}</p>
        </div>
      </div>
      
      <h3 className="font-semibold mt-4">Rémunération</h3>
      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Salaire de base</td>
            <td className="py-2 px-4">{(salaryDetails?.baseSalary || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Taux journalier</td>
            <td className="py-2 px-4">{(salaryDetails?.dailyRate || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Taux horaire</td>
            <td className="py-2 px-4">{(salaryDetails?.hourlyRate || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Indemnité transport</td>
            <td className="py-2 px-4">{(salaryDetails?.transportAllowance || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Jours travaillés</td>
            <td className="py-2 px-4">{remuneration?.workedDays || 0}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Heures supplémentaires</td>
            <td className="py-2 px-4">{(remuneration?.overtime || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100 bg-blue-50">
            <td className="py-2 px-4 font-semibold">TOTAL RÉMUNÉRATION</td>
            <td className="py-2 px-4 font-semibold">{remunerationTotal.toLocaleString()} FCFA</td>
          </tr>
        </tbody>
      </table>
      
      <h3 className="font-semibold mt-4">Déductions</h3>
      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">PVIS</td>
            <td className="py-2 px-4">{(deductions?.pvis || 0).toLocaleString()} FCFA</td>
            </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">IRPP</td>
            <td className="py-2 px-4">{(deductions?.irpp || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">CAC</td>
            <td className="py-2 px-4">{(deductions?.cac || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">CFC</td>
            <td className="py-2 px-4">{(deductions?.cfc || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">RAV</td>
            <td className="py-2 px-4">{(deductions?.rav || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">TDL</td>
            <td className="py-2 px-4">{(deductions?.tdl || 0).toLocaleString()} FCFA</td>
          </tr>
          <tr className="border-b border-blue-100 bg-red-50">
            <td className="py-2 px-4 font-semibold">TOTAL DÉDUCTIONS</td>
            <td className="py-2 px-4 font-semibold">{deductionsTotal.toLocaleString()} FCFA</td>
          </tr>
        </tbody>
      </table>
      
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-bold text-lg">NET À PAYER: {netToPay.toLocaleString()} FCFA</h3>
      </div>
      
      {/* Avertissements sur les déductions */}
      {deductionWarnings.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Avertissements:</h4>
          <ul className="text-yellow-700">
            {deductionWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Composant ExportPaySlip pour générer le PDF */}
      <ExportPaySlip 
        employee={employee}
        employer={employer}
        salaryDetails={salaryDetails}
        remuneration={remuneration}
        deductions={deductions}
        payPeriod={payPeriod}
        generatedAt={generatedAt}
      />
      
      {/* Modale pour les champs manquants */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informations manquantes</h3>
          <p className="mb-4">Certaines informations sont manquantes pour générer la fiche de paie :</p>
          <ul className="mb-4">
            {missingFields.map((field, index) => (
              <li key={index} className="text-red-600">• {field}</li>
            ))}
          </ul>
          
          <div className="space-y-4">
            {missingFields.includes("matricule de l'employé") && (
              <div>
                <label className="block text-sm font-medium mb-1">Matricule de l'employé</label>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Entrez le matricule"
                />
              </div>
            )}
            
            {missingFields.includes("PVIS") && (
              <div>
                <label className="block text-sm font-medium mb-1">PVIS</label>
                <input
                  type="number"
                  name="pvis"
                  value={formData.pvis}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Montant PVIS"
                />
              </div>
            )}
            
            {missingFields.includes("IRPP") && (
              <div>
                <label className="block text-sm font-medium mb-1">IRPP</label>
                <input
                  type="number"
                  name="irpp"
                  value={formData.irpp}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Montant IRPP"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
                onClick={handleModalSkip}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Continuer sans
            </button>
            <button
                onClick={handleModalSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
              Compléter et continuer
            </button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

// Composant Button (inchangé)
const Button = ({ children, onClick, icon: Icon, variant = "default", size = "default", className = "", disabled }) => {
  const baseStyles = "flex items-center gap-2 rounded-lg font-medium transition-all duration-200";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";
  const sizeStyles = size === "sm" ? "px-3 py-1 text-sm" : "px-4 py-2";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
      disabled={disabled}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

// Composant Card (inchangé)
const Card = ({ title, children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md border-0 ${className}`}>
    {title && (
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">{title}</h2>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// Composant Modal (inchangé)
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        {children}
        <Button onClick={onClose} variant="outline" className="mt-4">Fermer</Button>
      </div>
    </div>
  );
};

// Composant principal
const CompanyAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [newEmployee, setNewEmployee] = useState({
  name: "",
  email: "",
  role: "Employé",
  poste: "",
  phone: "",
  department: "",
  hireDate: "",
  status: "Actif",
  cnpsNumber: "",
  professionalCategory: "",
  baseSalary: 0, // Changé de "" à 0 pour garantir un type nombre
  contract: null,
  contractFile: null,
  hoursPerMonth: 160,
  overtimeHours: { regular: 0, sunday: 0, night: 0 },
  seniority: 0,
  childrenCount: 0,
  diplomas: "",
  echelon: "",
  service: "",
  supervisor: "",
  placeOfBirth: "",
  hasTrialPeriod: false,
  trialPeriodDuration: "",
    matricule: "",
    // Nouveaux champs pour les informations personnelles
    dateNaissance: "",
    lieuNaissance: "",
    pere: "",
    mere: "",
    residence: "",
    situation: "",
    epouse: "",
    personneAPrevenir: "",
});
  const [newLeaveRequest, setNewLeaveRequest] = useState({ employeeId: "", date: "", days: 1, reason: "" });
  const [newAbsence, setNewAbsence] = useState({ employeeId: "", date: "", reason: "", duration: 1 });
  const [newNotification, setNewNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [leaveFilter, setLeaveFilter] = useState("Tous");
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showPaySlipForm, setShowPaySlipForm] = useState(false);
  const [showPaySlip, setShowPaySlip] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showPaySlipDetails, setShowPaySlipDetails] = useState(false);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Effet pour fermer showPaySlip quand showPaySlipForm s'ouvre
  useEffect(() => {
    if (showPaySlipForm) {
      setShowPaySlip(false);
      setShowPaySlipDetails(false);
    }
  }, [showPaySlipForm]);

  // Effet pour fermer showPaySlipForm quand showPaySlipDetails s'ouvre
  useEffect(() => {
    if (showPaySlipDetails) {
      setShowPaySlipForm(false);
    }
  }, [showPaySlipDetails]);

  // Fonction pour afficher les détails d'une fiche de paie
  const showPaySlipDetailsModal = (payslip, employee) => {
    setSelectedPaySlip(payslip);
    setSelectedEmployee(employee);
    setShowPaySlipDetails(true);
  };
  const [filteredEmployeees, setFilteredEmployees] = useState([]);

  const [paySlipData, setPaySlipData] = useState(null);
  const [logoData, setLogoData] = useState(null);
  const navigate = useNavigate();
  const [paySlipModal, setPaySlipModal] = useState({
  open: false,
  employee: null,       // Employé sélectionné
  paySlip: null,        // Fiche existante pour modification
  mode: 'create'        // 'create' | 'edit'
});

// Fonction utilitaire pour s'assurer que tous les nouveaux champs sont présents
const ensureEmployeeFields = (employee) => {
  return {
    ...employee,
    // S'assurer que les nouveaux champs sont présents même s'ils n'existent pas encore
    diplomas: employee.diplomas || '',
    echelon: employee.echelon || '',
    service: employee.service || '',
    supervisor: employee.supervisor || '',
    placeOfBirth: employee.placeOfBirth || '',
    // Autres champs optionnels qui pourraient manquer
    phone: employee.phone || '',
    department: employee.department || '',
    hasTrialPeriod: employee.hasTrialPeriod || false,
    trialPeriodDuration: employee.trialPeriodDuration || '',
    matricule: employee.matricule || '',
    // Nouveaux champs d'informations personnelles
    dateNaissance: employee.dateNaissance || '',
    lieuNaissance: employee.lieuNaissance || '',
    pere: employee.pere || '',
    mere: employee.mere || '',
    residence: employee.residence || '',
    situation: employee.situation || '',
    epouse: employee.epouse || '',
    personneAPrevenir: employee.personneAPrevenir || '',
  };
};

useEffect(() => {
  if (companyData?.id) {
    setLogoData(localStorage.getItem(`logo_${companyData.id}`));
  }
}, [companyData?.id]);

  // Fonction pour vérifier la taille du stockage local
  const getLocalStorageSize = useCallback(() => {
    let total = 0;
    for (const x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    return total / 1024 / 1024; // Taille en Mo
  }, []);
const deletePaySlip = async (employeeId, payslipId) => {
    setActionLoading(true);
    try {
      const employeeDoc = doc(db, "clients", companyData.id, "employees", employeeId);
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) {
        throw new Error("Employé non trouvé.");
      }
    const updatedPayslips = (employee.payslips || []).filter((ps) => ps.id !== payslipId);
    await updateDoc(employeeDoc, { payslips: removeUndefined(updatedPayslips) });
    setEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    setFilteredEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    // Mettre à jour selectedEmployee si c'est le même employé
    setSelectedEmployee(prev => prev && prev.id === employeeId ? { ...prev, payslips: updatedPayslips } : prev);
      toast.success("Fiche de paie supprimée avec succès !");
    } catch (error) {
      console.error("[deletePaySlip] Erreur:", error.message);
      toast.error(`Erreur lors de la suppression de la fiche de paie: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };
  // Gestion du téléchargement du logo
 const handleLogoUpload = (file, companyId, callback) => {
   console.log(`[handleLogoUpload] Début upload logo, type: ${file.type}, taille: ${(file.size / 1024).toFixed(2)} Ko`);
   if (!file.type.match(/image\/(png|jpeg)/)) {
     console.warn("[handleLogoUpload] Format d'image non supporté:", file.type);
     toast.error("Seuls les formats PNG et JPEG sont supportés.");
     return null;
   }
 
   if (file.size > 2 * 1024 * 1024) {
     console.warn("[handleLogoUpload] Fichier trop volumineux:", (file.size / 1024).toFixed(2), "Ko");
     toast.error("Le fichier est trop volumineux. Utilisez une image de moins de 2 Mo.");
     return null;
   }
 
   const reader = new FileReader();
   reader.onload = () => {
     const dataUrl = reader.result;
     console.log(`[handleLogoUpload] Taille de la dataURL: ${(dataUrl.length / 1024).toFixed(2)} Ko`);
     
     if (getLocalStorageSize() + dataUrl.length / 1024 / 1024 > 4.5) {
       console.warn(`[handleLogoUpload] localStorage presque plein (${getLocalStorageSize().toFixed(2)} Mo)`);
       toast.warn("Stockage local presque plein. Videz le cache ou réduisez la taille du logo.");
       return;
     }
 
     try {
       localStorage.setItem(`logo_${companyId}`, dataUrl);
       console.log(`[handleLogoUpload] Logo stocké dans localStorage pour companyId: ${companyId}`);
       callback(dataUrl);
     } catch (e) {
       console.error(`[handleLogoUpload] Échec stockage localStorage: ${e.message}`);
       toast.error("Échec du stockage local : limite dépassée. Réduisez la taille du logo.");
     }
   };
   reader.onerror = () => {
     console.error("[handleLogoUpload] Erreur lecture fichier:", reader.error.message);
     toast.error("Erreur lors de la lecture du fichier image.");
   };
   reader.readAsDataURL(file);
   return null;
 };

  // Charger les données depuis Firebase
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage("Utilisateur non authentifié.");
        toast.error("Utilisateur non authentifié, redirection vers login.");
        navigate("/client-admin-login");
        return;
      }
      try {
        setLoading(true);
        const clientsQuery = query(collection(db, "clients"), where("adminUid", "==", user.uid));
        const clientsSnapshot = await getDocs(clientsQuery);
        if (!clientsSnapshot.empty) {
          const companyDoc = clientsSnapshot.docs[0];
          const companyId = companyDoc.id;
          setCompanyData({ id: companyId, ...companyDoc.data() });
          setLogoData(localStorage.getItem(`logo_${companyId}`));
          const unsubscribe = onSnapshot(
            collection(db, "clients", companyId, "employees"),
            (snapshot) => {
              const employeesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
              setEmployees(employeesData);
              setLoading(false);
            },
            (error) => {
              console.error("Erreur chargement employés:", error);
              toast.error("Erreur chargement employés");
              setLoading(false);
            }
          );
          return () => unsubscribe();
        } else {
          setErrorMessage("Aucun client trouvé pour cet utilisateur.");
          toast.error("Aucun client trouvé pour cet utilisateur.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Erreur chargement données:", error);
        toast.error("Erreur chargement données");
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Mettre à jour un employé
const updateEmployee = useCallback(async (id, updatedData) => {
  try {
    setActionLoading(true);

    // Vérifier companyData.id
    if (!companyData?.id) {
      throw new Error("ID de l'entreprise manquant.");
    }

    // Vérifier l'ID de l'employé
    if (!id) {
      throw new Error("ID de l'employé manquant.");
    }

    // Valider les données
    if (!updatedData || Object.keys(updatedData).length === 0) {
      throw new Error("Aucune donnée à mettre à jour.");
    }
    if (updatedData.baseSalary && (isNaN(updatedData.baseSalary) || Number(updatedData.baseSalary) < 36270)) {
      throw new Error("Le salaire de base doit être un nombre supérieur ou égal à 36270 FCFA.");
    }
    if (updatedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
      throw new Error("Email invalide.");
    }

    // Vérifier la taille des données
    const sizeInBytes = new TextEncoder().encode(JSON.stringify(updatedData)).length;
    if (sizeInBytes > 900000) {
      throw new Error("Les données de l'employé sont trop volumineuses pour Firestore.");
    }

    // Vérifier si le document existe
    const employeeRef = doc(db, "clients", companyData.id, "employees", id);
    const employeeSnap = await getDocs(employeeRef);
    if (!employeeSnap.exists()) {
      throw new Error("L'employé spécifié n'existe pas.");
    }

    // Mettre à jour le document
    await updateDoc(employeeRef, {
      ...updatedData,
      updatedAt: new Date().toISOString(), // Ajouter un horodatage pour tracer les mises à jour
    });
    toast.success("Employé mis à jour avec succès !");
  } catch (error) {
    console.error("[updateEmployee] Erreur détaillée:", error.code, error.message);
    const errorMessages = {
      "permission-denied": "Vous n'avez pas les permissions nécessaires. Vérifiez votre authentification ou contactez l'administrateur.",
      "not-found": "L'employé ou l'entreprise spécifiée n'existe pas.",
      "invalid-argument": "Les données fournies sont invalides. Vérifiez les champs saisis.",
      "failed-precondition": "Une condition préalable n'est pas remplie. Vérifiez la configuration Firestore.",
    };
    toast.error(errorMessages[error.code] || `Erreur lors de la mise à jour de l'employé : ${error.message}`);
  } finally {
    setActionLoading(false);
  }
}, [companyData]);

  // Ajouter un employé
const addEmployee = async (e) => {
  e.preventDefault();
  setActionLoading(true);
  try {
    if (!companyData?.id) {
      throw new Error("ID de l'entreprise manquant.");
    }
    if (!newEmployee.name) throw new Error("Le nom est requis.");
    if (!newEmployee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmployee.email)) {
      throw new Error("Email invalide.");
    }
    if (!newEmployee.poste) throw new Error("Le poste est requis.");
    if (!newEmployee.hireDate) throw new Error("La date d'embauche est requise.");
    if (!newEmployee.cnpsNumber) throw new Error("Le numéro CNPS est requis.");
    if (!newEmployee.professionalCategory) throw new Error("La catégorie professionnelle est requise.");
    if (newEmployee.baseSalary === undefined || isNaN(newEmployee.baseSalary) || Number(newEmployee.baseSalary) < 0) {
      throw new Error("Le salaire de base doit être un nombre positif.");
    }
    if (!newEmployee.matricule) {
      newEmployee.matricule = uuidv4().slice(0, 8).toUpperCase();
    }
    // Prépare le contrat à partir des seuls champs utiles pour le PDF
    const contractData = {
      name: newEmployee.name,
      poste: newEmployee.poste,
      contractType: newEmployee.contractType || (newEmployee.contract?.contractType) || "CDI",
      salaryBrut: Number(newEmployee.baseSalary),
      workPlace: newEmployee.workPlace || (newEmployee.contract?.workPlace) || '',
      startDate: newEmployee.hireDate,
      endDate: newEmployee.endDate || (newEmployee.contract?.endDate) || '',
      trialPeriod: newEmployee.trialPeriodDuration || (newEmployee.contract?.trialPeriod) || '',
      cnpsNumber: newEmployee.cnpsNumber,
      clauses: newEmployee.clauses || (newEmployee.contract?.clauses) || '',
    };
    let employeeId;
    if (newEmployee.id) {
      await updateDoc(doc(db, "clients", companyData.id, "employees", newEmployee.id), {
        ...newEmployee,
        contract: contractData,
        contractFile: null,
      });
      employeeId = newEmployee.id;
      toast.success("Employé modifié avec succès !");
    } else {
      const docRef = await addDoc(collection(db, "clients", companyData.id, "employees"), {
        ...newEmployee,
        contract: contractData,
        contractFile: null,
        adminUid: auth.currentUser?.uid || null,
        payslips: [],
        createdAt: new Date().toISOString(),
      });
      employeeId = docRef.id;
      toast.success("Employé ajouté avec succès !");
    }
    // Génère automatiquement le PDF du contrat avec uniquement les champs utiles
    setTimeout(() => {
      if (window.generateContractPDF) {
        window.generateContractPDF({
          employee: { ...newEmployee, id: employeeId },
          contract: contractData,
          company: companyData,
        });
      }
    }, 500);
    setShowEmployeeModal(false);
    setNewEmployee({
      name: "",
      email: "",
      role: "Employé",
      poste: "",
      phone: "",
      department: "",
      hireDate: "",
      status: "Actif",
      cnpsNumber: "",
      professionalCategory: "",
      baseSalary: 0,
      contract: null,
      contractFile: null,
      hoursPerMonth: 160,
      overtimeHours: { regular: 0, sunday: 0, night: 0 },
      seniority: 0,
      childrenCount: 0,
      diplomas: "",
      echelon: "",
      service: "",
      supervisor: "",
      placeOfBirth: "",
      hasTrialPeriod: false,
      trialPeriodDuration: "",
      matricule: "",
      workPlace: "",
      endDate: "",
      contractType: "CDI",
      clauses: "",
    });
  } catch (error) {
    console.error("[addEmployee] Erreur détaillée:", error.code, error.message);
    toast.error(`Erreur lors de l'ajout/modification de l'employé : ${error.message}`);
  } finally {
    setActionLoading(false);
  }
};
const saveContract = async (contractData) => {
  setActionLoading(true);
  try {
    const employeeDoc = doc(db, "clients", companyData.id, "employees", selectedEmployee.id);
    await updateDoc(employeeDoc, {
      contract: contractData,
      contractFile: contractData.fileUrl || null,
      hasTrialPeriod: contractData.trialPeriod ? true : false,
      trialPeriodDuration: contractData.trialPeriod || "",
    });
    toast.success("Contrat enregistré avec succès !");
    setShowContractForm(false);
    setShowPaySlipForm(false);
    setShowPaySlip(false);
    setShowContract(false);
    setSelectedEmployee(null);
  } catch (error) {
    console.error("[saveContract] Erreur:", error.message);
    toast.error("Erreur lors de l'enregistrement du contrat.");
  } finally {
    setActionLoading(false);
  }
};
  // Supprimer un employé
  const deleteEmployee = useCallback(async (id) => {
    if (!window.confirm("Supprimer cet employé ?")) return;
    try {
      setActionLoading(true);
      const employeeRef = doc(db, "clients", companyData.id, "employees", id);
      await deleteDoc(employeeRef);
      await updateDoc(doc(db, "clients", companyData.id), { currentUsers: employees.length - 1 });
      toast.success("Employé supprimé !");
    } catch (error) {
      console.error("Erreur suppression employé:", error);
      toast.error("Erreur suppression employé");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  // Gérer les demandes de congé
  const handleLeaveRequest = useCallback(async (employeeId, requestIndex, action) => {
    const employee = employees.find((emp) => emp.id === employeeId);
    if (!employee || !employee.leaves.requests[requestIndex]) {
      toast.error("Demande invalide !");
      return;
    }
    try {
      setActionLoading(true);
      const request = employee.leaves.requests[requestIndex];
      const updatedRequests = [...employee.leaves.requests];
      const updatedHistory = [...employee.leaves.history];
      updatedRequests[requestIndex] = { ...request, status: action };
      updatedHistory.push({ ...request, status: action });
      let updatedBalance = employee.leaves.balance;
      if (action === "Approuvé") updatedBalance -= request.days;
      await updateEmployee(employeeId, {
        leaves: { balance: updatedBalance, requests: updatedRequests, history: updatedHistory },
      });
      toast.success(`Demande de congé ${action.toLowerCase()} !`);
    } catch (error) {
      console.error("Erreur gestion congé:", error);
      toast.error("Erreur gestion congé");
    } finally {
      setActionLoading(false);
    }
  }, [employees, updateEmployee]);

  // Enregistrer une absence
  const recordAbsence = useCallback(async (e) => {
    e.preventDefault();
    if (!newAbsence.employeeId || !newAbsence.date || !newAbsence.reason || newAbsence.duration <= 0) {
      toast.error("Veuillez remplir tous les champs de l'absence.");
      return;
    }
    try {
      setActionLoading(true);
      const employee = employees.find((emp) => emp.id === newAbsence.employeeId);
      const updatedAbsences = [
        ...(employee.absences || []),
        { date: newAbsence.date, reason: newAbsence.reason, duration: Number(newAbsence.duration) },
      ];
      await updateEmployee(newAbsence.employeeId, { absences: updatedAbsences });
      setNewAbsence({ employeeId: "", date: "", reason: "", duration: 1 });
      toast.success("Absence enregistrée !");
    } catch (error) {
      console.error("Erreur enregistrement absence:", error);
      toast.error("Erreur enregistrement absence");
    } finally {
      setActionLoading(false);
    }
  }, [employees, newAbsence, updateEmployee]);

  // Envoyer une notification
  const sendNotification = useCallback(async (e) => {
    e.preventDefault();
    if (!newNotification.trim()) {
      toast.error("Veuillez entrer un message.");
      return;
    }
    try {
      setActionLoading(true);
      const promises = employees.map(async (employee) => {
        const updatedNotifications = [
          ...(employee.notifications || []),
          { id: `${employee.id}_${Date.now()}`, message: newNotification, date: new Date().toISOString(), read: false },
        ];
        await updateEmployee(employee.id, { notifications: updatedNotifications });
      });
      await Promise.all(promises);
      setNewNotification("");
      toast.success("Notification envoyée à tous les employés !");
    } catch (error) {
      console.error("Erreur envoi notification:", error);
      toast.error("Erreur envoi notification");
    } finally {
      setActionLoading(false);
    }
  }, [employees, newNotification, updateEmployee]);

  // Générer un rapport PDF
  const generatePDFReport = useCallback(() => {
    try {
      // Imports nécessaires pour la génération PDF
      const { jsPDF } = require('jspdf');
      const autoTable = require('jspdf-autotable');
      
      setActionLoading(true);
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Rapport RH - ${companyData.name}`, 10, 10);
      doc.setFontSize(12);
      doc.text(`Employés : ${companyData.currentUsers}/${companyData.licenseMaxUsers}`, 10, 20);
      doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 10, 30);
      autoTable(doc, {
        startY: 40,
        head: [["Nom", "Rôle", "Poste", "Congés restants", "Statut"]],
        body: employees.map((emp) => [emp.name, emp.role, emp.poste, emp.leaves.balance, emp.status]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      doc.save(`${companyData.name}_rapport.pdf`);
      toast.success("Rapport PDF généré !");
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      toast.error("Erreur génération PDF");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  // Générer un rapport Excel
  const generateExcelReport = useCallback(() => {
    try {
      setActionLoading(true);
      const worksheet = XLSX.utils.json_to_sheet(
        employees.map((emp) => ({
          Nom: emp.name,
          Email: emp.email,
          Rôle: emp.role,
          Poste: emp.poste,
          Département: emp.department || "N/A",
          "Date d'embauche": new Date(emp.hireDate).toLocaleDateString(),
          Statut: emp.status,
          "Solde Congés": emp.leaves.balance,
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Employés");
      XLSX.writeFile(workbook, `${companyData.name}_rapport.xlsx`);
      toast.success("Rapport Excel généré !");
    } catch (error) {
      console.error("Erreur génération Excel:", error);
      toast.error("Erreur génération Excel");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  // Générer un rapport CSV
  const generateCSVReport = useCallback(() => {
    try {
      setActionLoading(true);
      const csvData = employees.map((emp) => ({
        Nom: emp.name,
        Email: emp.email,
        Rôle: emp.role,
        Poste: emp.poste,
        Département: emp.department || "N/A",
        "Date d'embauche": new Date(emp.hireDate).toLocaleDateString(),
        Statut: emp.status,
        "Solde Congés": emp.leaves.balance,
      }));
      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${companyData.name}_rapport.csv`);
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport CSV généré !");
    } catch (error) {
      console.error("Erreur génération CSV:", error);
      toast.error("Erreur génération CSV");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);
  // mise à jour

const migrateEmployeeSalaries = async () => {
  setActionLoading(true);
  try {
    const employeesRef = collection(db, "clients", companyData.id, "employees");
    const snapshot = await getDocs(employeesRef);
    const batch = writeBatch(db);

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.salary && !data.baseSalary) {
        batch.update(doc.ref, {
          baseSalary: Number(data.salary),
          salary: deleteField(),
        });
      }
    });

    await batch.commit();
    toast.success("Migration des salaires terminée avec succès !");
  } catch (error) {
    console.error("[migrateEmployeeSalaries] Erreur:", error.message);
    toast.error("Erreur lors de la migration des salaires.");
  } finally {
    setActionLoading(false);
  }
};
  // Enregistrer une fiche de paie
const savePaySlip = async (paySlipData, payslipId = null) => {
  setActionLoading(true);
  try {
    if (!selectedEmployee?.id || !companyData?.id) {
      throw new Error("Employé ou entreprise non sélectionné.");
    }
    const employeeDoc = doc(db, "clients", companyData.id, "employees", selectedEmployee.id);
    const employee = employees.find((emp) => emp.id === selectedEmployee.id);
    if (!employee) {
      throw new Error("Employé non trouvé.");
    }
    const newBaseSalary = Number(paySlipData?.salaryDetails?.baseSalary || 0);
    if (newBaseSalary < 36270) {
      throw new Error("Le salaire de base doit être supérieur ou égal à 36270 FCFA.");
    }
    if (newBaseSalary !== Number(employee.baseSalary)) {
      await updateDoc(employeeDoc, { baseSalary: newBaseSalary });
    }
    // Harmonisation : structure directe, ajout id unique si création
    const safePaySlipData = {
      ...paySlipData,
      id: paySlipData?.id || uuidv4(),
      salaryDetails: {
        baseSalary: Number(paySlipData?.salaryDetails?.baseSalary || 0),
        dailyRate: Number(paySlipData?.salaryDetails?.dailyRate || 0),
        hourlyRate: Number(paySlipData?.salaryDetails?.hourlyRate || 0),
        transportAllowance: Number(paySlipData?.salaryDetails?.transportAllowance || 0),
      },
      remuneration: {
        workedDays: Number(paySlipData?.remuneration?.workedDays || 30),
        overtime: Number(paySlipData?.remuneration?.overtime || 0),
        total: Number(paySlipData?.remuneration?.total || 0),
      },
      deductions: {
        pvis: Number(paySlipData?.deductions?.pvis || 0),
        irpp: Number(paySlipData?.deductions?.irpp || 0),
        cac: Number(paySlipData?.deductions?.cac || 0),
        cfc: Number(paySlipData?.deductions?.cfc || 0),
        rav: Number(paySlipData?.deductions?.rav || 0),
        tdl: Number(paySlipData?.deductions?.tdl || 0),
        total: Number(paySlipData?.deductions?.total || 0),
      },
    };
    let updatedPayslips = [...(employee.payslips || [])];
    if (payslipId) {
      // Modification : remplacer la fiche existante par id
      updatedPayslips = updatedPayslips.map(ps => ps.id === payslipId ? safePaySlipData : ps);
    } else {
      // Création : ajouter une nouvelle fiche
      updatedPayslips.push(safePaySlipData);
    }
    await updateDoc(employeeDoc, { payslips: removeUndefined(updatedPayslips) });
    setEmployees((prev) => prev.map((emp) => emp.id === selectedEmployee.id ? { ...emp, payslips: updatedPayslips } : emp));
    setFilteredEmployees((prev) => prev.map((emp) => emp.id === selectedEmployee.id ? { ...emp, payslips: updatedPayslips } : emp));
    // Mettre à jour selectedEmployee avec les nouvelles données
    setSelectedEmployee(prev => prev ? { ...prev, payslips: updatedPayslips } : prev);
    toast.success(`Fiche de paie ${payslipId ? "modifiée" : "enregistrée"} avec succès !`);
  } catch (error) {
    console.error("[savePaySlip] Erreur:", error.message);
    toast.error(`Erreur lors de l'enregistrement de la fiche de paie: ${error.message}`);
  } finally {
    setActionLoading(false);
  }
};
  // Déconnexion
  const handleLogout = useCallback(async () => {
    try {
      setActionLoading(true);
      await auth.signOut();
      navigate("/client-admin-login");
      toast.info("Déconnexion réussie.");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
      toast.error("Erreur déconnexion");
    } finally {
      setActionLoading(false);
    }
  }, [navigate]);

  // Filtrer les employés
  const filteredEmployees = useMemo(() => {
    let result = [...employees];
    if (searchQuery) {
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          emp.poste.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "role") return a.role.localeCompare(b.role);
      if (sortBy === "poste") return a.poste.localeCompare(b.poste);
      if (sortBy === "hireDate") return new Date(a.hireDate) - new Date(b.hireDate);
      return 0;
    });
  }, [employees, searchQuery, sortBy]);

  // Filtrer les demandes de congé
  const filteredLeaveRequests = useMemo(() => {
    if (leaveFilter === "Tous") return leaveRequests;
    return leaveRequests.filter((req) => req.status === leaveFilter);
  }, [leaveRequests, leaveFilter]);

  // Données pour les graphiques
  const doughnutData = {
    labels: ["Vacances", "Maladie", "Personnel", "Maternité", "Autre"],
    datasets: [
      {
        data: [30, 20, 15, 10, 25],
        backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"],
        borderColor: ["#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const barData = {
    labels: ["Informatique", "RH", "Finance", "Marketing", "Non assigné"],
    datasets: [
      {
        label: "Employés par département",
        data: [5, 3, 2, 4, 1],
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun"],
    datasets: [
      {
        label: "Embauches",
        data: [2, 3, 1, 4, 2, 5],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
      },
      {
        label: "Départs",
        data: [1, 0, 2, 1, 0, 1],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg flex items-start gap-3">
          <XCircle className="h-5 w-5 mt-0.5" />
          <p>{errorMessage || "Aucune donnée disponible."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer position="top-right" autoClose={3000} />
      {actionLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-blue-100 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        } md:static md:h-screen md:flex md:flex-col`}
      >
        <div className="p-4 border-b border-blue-100">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                {logoData ? (
                  <img src={logoData} alt="Logo" className="h-10 rounded-lg" />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">RH Dashboard</h1>
                  <p className="text-sm text-gray-500">{companyData.name}</p>
                </div>
              </div>
            )}
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              variant="outline"
              size="sm"
              className="md:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {[
              { id: "overview", label: "Tableau de bord", icon: BarChart3 },
              { id: "employees", label: "Employés", icon: Users },
              { id: "leaves", label: "Congés", icon: Calendar },
              { id: "absences", label: "Absences", icon: Clock },
              { id: "payslips", label: "Paie", icon: CreditCard },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "settings", label: "Paramètres", icon: Settings },
            ].map((item) => (
              <li key={item.id} className="relative group">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white"
                      : "text-gray-600 hover:bg-blue-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
                {!sidebarOpen && (
                  <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded hidden group-hover:block">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-blue-100">
          <Button
            onClick={handleLogout}
            variant="danger"
            icon={XCircle}
            className="w-full justify-start"
          >
            {sidebarOpen && "Déconnexion"}
          </Button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-blue-100 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <div className="relative">
              <Bell className="w-6 h-6 text-blue-600" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {notifications.filter((n) => !n.read).length}
              </span>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
              {auth.currentUser?.email[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>
        {/* Main */}
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-400 text-white">
                  <div className="p-6">
                    <Users className="w-8 h-8 mb-2" />
                    <p className="text-sm">Employés Actifs</p>
                    <p className="text-2xl font-bold">{employees.filter(emp => emp.status === 'Actif').length}</p>
                    <p className="text-sm mt-2">
                      {employees.filter(emp => emp.status === 'Actif').length > 0 
                        ? `${employees.filter(emp => emp.status === 'Actif').length} actifs`
                        : 'Aucun employé actif'}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-400 text-white">
                  <div className="p-6">
                    <Calendar className="w-8 h-8 mb-2" />
                    <p className="text-sm">Demandes de Congés</p>
                    <p className="text-2xl font-bold">{leaveRequests.filter(req => req.status === 'En attente').length}</p>
                    <p className="text-sm mt-2">
                      {leaveRequests.filter(req => req.status === 'En attente').length > 0
                        ? `${leaveRequests.filter(req => req.status === 'En attente').length} en attente`
                        : 'Aucune demande en attente'}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-600 to-yellow-400 text-white">
                  <div className="p-6">
                    <Clock className="w-8 h-8 mb-2" />
                    <p className="text-sm">Absences ce mois</p>
                    <p className="text-2xl font-bold">
                      {employees.reduce((sum, emp) => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        const monthAbsences = emp.absences?.filter(abs => {
                          const absDate = new Date(abs.date);
                          return absDate.getMonth() === currentMonth && absDate.getFullYear() === currentYear;
                        }) || [];
                        return sum + monthAbsences.length;
                      }, 0)}
                    </p>
                    <p className="text-sm mt-2">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        const monthAbsences = employees.reduce((sum, emp) => {
                          const monthAbs = emp.absences?.filter(abs => {
                            const absDate = new Date(abs.date);
                            return absDate.getMonth() === currentMonth && absDate.getFullYear() === currentYear;
                          }) || [];
                          return sum + monthAbs.length;
                        }, 0);
                        return monthAbsences > 0 ? `${monthAbsences} ce mois` : 'Aucune absence ce mois';
                      })()}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-600 to-purple-400 text-white">
                  <div className="p-6">
                    <CreditCard className="w-8 h-8 mb-2" />
                    <p className="text-sm">Fiches de Paie</p>
                    <p className="text-2xl font-bold">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return employees.reduce((sum, emp) => {
                          const monthPayslips = emp.payslips?.filter(payslip => {
                            const payslipDate = new Date(payslip.generatedAt);
                            return payslipDate.getMonth() === currentMonth && payslipDate.getFullYear() === currentYear;
                          }) || [];
                          return sum + monthPayslips.length;
                        }, 0);
                      })()}
                    </p>
                    <p className="text-sm mt-2">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        const monthPayslips = employees.reduce((sum, emp) => {
                          const monthPays = emp.payslips?.filter(payslip => {
                            const payslipDate = new Date(payslip.generatedAt);
                            return payslipDate.getMonth() === currentMonth && payslipDate.getFullYear() === currentYear;
                          }) || [];
                          return sum + monthPays.length;
                        }, 0);
                        return monthPayslips > 0 ? `${monthPayslips} ce mois` : 'Aucune fiche ce mois';
                      })()}
                    </p>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Types de Congés">
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} className="h-64" />
                </Card>
                <Card title="Répartition par Département">
                  <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} className="h-64" />
                </Card>
                <Card title="Tendances Mensuelles">
                  <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} className="h-64" />
                </Card>
              </div>
              
              {/* Nouvelles métriques financières */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white">
                  <div className="p-4">
                    <CreditCard className="w-6 h-6 mb-2" />
                    <p className="text-xs">Masse Salariale</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const totalSalary = employees.reduce((sum, emp) => {
                          return sum + (emp.baseSalary || 0);
                        }, 0);
                        return totalSalary.toLocaleString();
                      })()} FCFA
                    </p>
                    <p className="text-xs mt-1">Salaire de base total</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-indigo-600 to-indigo-400 text-white">
                  <div className="p-4">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <p className="text-xs">Moyenne Salaire</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const activeEmployees = employees.filter(emp => emp.status === 'Actif');
                        if (activeEmployees.length === 0) return '0';
                        const totalSalary = activeEmployees.reduce((sum, emp) => {
                          return sum + (emp.baseSalary || 0);
                        }, 0);
                        return Math.round(totalSalary / activeEmployees.length).toLocaleString();
                      })()} FCFA
                    </p>
                    <p className="text-xs mt-1">Par employé actif</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-orange-600 to-orange-400 text-white">
                  <div className="p-4">
                    <Calendar className="w-6 h-6 mb-2" />
                    <p className="text-xs">Fiches ce Mois</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return employees.reduce((sum, emp) => {
                          const monthPayslips = emp.payslips?.filter(payslip => {
                            const payslipDate = new Date(payslip.generatedAt);
                            return payslipDate.getMonth() === currentMonth && payslipDate.getFullYear() === currentYear;
                          }) || [];
                          return sum + monthPayslips.length;
                        }, 0);
                      })()}
                    </p>
                    <p className="text-xs mt-1">Générées ce mois</p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-pink-600 to-pink-400 text-white">
                  <div className="p-4">
                    <Users className="w-6 h-6 mb-2" />
                    <p className="text-xs">Taux d'Activité</p>
                    <p className="text-xl font-bold">
                      {(() => {
                        const totalEmployees = employees.length;
                        const activeEmployees = employees.filter(emp => emp.status === 'Actif').length;
                        if (totalEmployees === 0) return '0%';
                        return Math.round((activeEmployees / totalEmployees) * 100) + '%';
                      })()}
                    </p>
                    <p className="text-xs mt-1">Employés actifs</p>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Demandes de Congés Récentes">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4">Employé</th>
                      <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Durée</th>
                      <th className="text-left py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.slice(0, 5).map((req, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-blue-50">
                        <td className="py-4 px-4">{employees.find((emp) => emp.id === req.employeeId)?.name}</td>
                        <td className="py-4 px-4">{new Date(req.date).toLocaleDateString("fr-FR")}</td>
                          <td className="py-4 px-4">{req.days} jour(s)</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              req.status === "Approuvé"
                                ? "bg-green-100 text-green-800"
                                : req.status === "Rejeté"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
                
                <Card title="Fiches de Paie Récentes">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Employé</th>
                        <th className="text-left py-3 px-4">Période</th>
                        <th className="text-left py-3 px-4">Net à Payer</th>
                        <th className="text-left py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const recentPayslips = employees
                          .flatMap(emp => (emp.payslips || []).map(payslip => ({
                            ...payslip,
                            employee: emp
                          })))
                          .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
                          .slice(0, 5);
                        
                        return recentPayslips.map((payslip, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-green-50">
                            <td className="py-4 px-4">{payslip.employee?.name}</td>
                            <td className="py-4 px-4">{payslip.payPeriod}</td>
                            <td className="py-4 px-4 font-medium">
                              {(() => {
                                const remunerationTotal = payslip.remuneration?.total || 0;
                                const deductionsTotal = payslip.deductions?.total || 0;
                                const netToPay = Math.max(0, remunerationTotal - deductionsTotal);
                                return netToPay.toLocaleString() + ' FCFA';
                              })()}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {new Date(payslip.generatedAt).toLocaleDateString("fr-FR")}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </Card>
              </div>
              <Card title="Actions Rapides">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button onClick={() => setShowEmployeeModal(true)} className="p-4 bg-blue-50 hover:bg-blue-100 text-left">
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold">Ajouter Employé</h3>
                    <p className="text-sm text-gray-600">Créer un nouveau profil</p>
                  </Button>
                  <Button onClick={() => {
                    setSelectedEmployee(null);
                    setShowPaySlipForm(true);
                    setPaySlipData(null);
                  }} className="p-4 bg-green-50 hover:bg-green-100 text-left">
                    <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold">Générer Fiche</h3>
                    <p className="text-sm text-gray-600">Créer une fiche de paie</p>
                  </Button>
                  <Button onClick={() => setActiveTab("leaves")} className="p-4 bg-yellow-50 hover:bg-yellow-100 text-left">
                    <Calendar className="w-8 h-8 text-yellow-600 mb-2" />
                    <h3 className="font-semibold">Gérer Congés</h3>
                    <p className="text-sm text-gray-600">Voir les demandes</p>
                  </Button>
                  <Button onClick={() => setActiveTab("payslips")} className="p-4 bg-purple-50 hover:bg-purple-100 text-left">
                    <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold">Fiches de Paie</h3>
                    <p className="text-sm text-gray-600">Gérer la paie</p>
                  </Button>
                </div>
              </Card>
            </div>
          )}
{activeTab === "employees" && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900">Gestion des Employés</h1>
      <Button onClick={() => setShowEmployeeModal(true)} icon={Plus} className="bg-blue-600 hover:bg-blue-700 text-white">
        Ajouter Employé
      </Button>
    </div>
    <Card>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border border-blue-200 rounded-lg"
          >
            <option value="name">Nom</option>
            <option value="role">Rôle</option>
            <option value="poste">Poste</option>
            <option value="hireDate">Date d'embauche</option>
          </select>
        </div>
        {filteredEmployees.length === 0 ? (
          <p className="text-center text-gray-500">Aucun employé trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="text-left py-3 px-4">Photo</th>
                  <th className="text-left py-3 px-4">Nom & Prénom</th>
                  <th className="text-left py-3 px-4">Poste</th>
                  <th className="text-left py-3 px-4">Salaire</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="border-b border-blue-100 hover:bg-blue-50">
                    <td className="py-4 px-4">
                      <img
                        src={emp.profilePicture || "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff"}
                        alt={emp.name || "Employé"}
                        className="w-10 h-10 rounded-full"
                        onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff")}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium">{emp.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{emp.firstName || ""}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{emp.poste || "N/A"}</td>
                    <td className="py-4 px-4">{emp.baseSalary ? emp.baseSalary.toLocaleString() : "0"} FCFA</td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button size="sm" icon={Eye} onClick={() => setSelectedEmployee(emp)}>Voir</Button>
                      <Button
                        size="sm"
                        icon={Edit}
                        variant="outline"
                        onClick={() => {
                          setNewEmployee(ensureEmployeeFields(emp));
                          setShowEmployeeModal(true);
                        }}
                      >
                        Modifier
                      </Button>
                      <Button size="sm" icon={Trash2} variant="danger" onClick={() => deleteEmployee(emp.id)}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
{showEmployeeModal && (
  <Modal isOpen={showEmployeeModal} onClose={() => setShowEmployeeModal(false)}>
    <form onSubmit={addEmployee} className="space-y-4">
      <h2 className="text-lg font-semibold">{newEmployee.id ? "Modifier Employé" : "Ajouter Employé"}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-600">Nom complet</label>
        <input
          type="text"
          placeholder="Nom complet"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Email</label>
        <input
          type="email"
          placeholder="Email"
          value={newEmployee.email}
          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Rôle</label>
        <select
          value={newEmployee.role}
          onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        >
          <option value="Employé">Employé</option>
          <option value="Manager">Manager</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Poste</label>
        <input
          type="text"
          placeholder="Poste"
          value={newEmployee.poste}
          onChange={(e) => setNewEmployee({ ...newEmployee, poste: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Téléphone</label>
        <input
          type="tel"
          placeholder="Téléphone"
          value={newEmployee.phone}
          onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Département</label>
        <input
          type="text"
          placeholder="Département"
          value={newEmployee.department}
          onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Date d'embauche</label>
        <input
          type="date"
          placeholder="Date d'embauche"
          value={newEmployee.hireDate}
          onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Statut</label>
        <select
          value={newEmployee.status}
          onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        >
          <option value="Actif">Actif</option>
          <option value="Inactif">Inactif</option>
          <option value="Suspendu">Suspendu</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Numéro CNPS</label>
        <input
          type="text"
          placeholder="Numéro CNPS"
          value={newEmployee.cnpsNumber}
          onChange={(e) => setNewEmployee({ ...newEmployee, cnpsNumber: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Catégorie professionnelle</label>
        <input
          type="text"
          placeholder="Catégorie professionnelle"
          value={newEmployee.professionalCategory}
          onChange={(e) => setNewEmployee({ ...newEmployee, professionalCategory: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Salaire de base (FCFA)</label>
        <input
          type="number"
          placeholder="Salaire de base (FCFA)"
          value={newEmployee.baseSalary}
          onChange={e => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
          className="p-2 border border-blue-200 rounded-lg w-full"
          min="0"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600">Période d'essai</label>
        <select
          value={newEmployee.hasTrialPeriod}
          onChange={(e) => setNewEmployee({ ...newEmployee, hasTrialPeriod: e.target.value === "true" })}
          className="p-2 border border-blue-200 rounded-lg w-full"
        >
          <option value={false}>Non</option>
          <option value={true}>Oui</option>
        </select>
      </div>
      {newEmployee.hasTrialPeriod && (
        <div>
          <label className="block text-sm font-medium text-gray-600">Durée de la période d'essai</label>
          <input
            type="text"
            placeholder="Durée de la période d'essai (ex. 3 mois)"
            value={newEmployee.trialPeriodDuration}
            onChange={(e) => setNewEmployee({ ...newEmployee, trialPeriodDuration: e.target.value })}
            className="p-2 border border-blue-200 rounded-lg w-full"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-600">Matricule</label>
        <input
          type="text"
          value={newEmployee.matricule || ''}
          className="p-2 border border-blue-200 rounded-lg w-full bg-gray-100 cursor-not-allowed"
          readOnly
        />
      </div>
      
      {/* Nouveaux champs d'informations personnelles */}
      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Informations personnelles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Date de naissance</label>
            <input
              type="date"
              value={newEmployee.dateNaissance}
              onChange={(e) => setNewEmployee({ ...newEmployee, dateNaissance: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Lieu de naissance</label>
            <input
              type="text"
              placeholder="Lieu de naissance"
              value={newEmployee.lieuNaissance}
              onChange={(e) => setNewEmployee({ ...newEmployee, lieuNaissance: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Fils de</label>
            <input
              type="text"
              placeholder="Nom du père"
              value={newEmployee.pere}
              onChange={(e) => setNewEmployee({ ...newEmployee, pere: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Et de</label>
            <input
              type="text"
              placeholder="Nom de la mère"
              value={newEmployee.mere}
              onChange={(e) => setNewEmployee({ ...newEmployee, mere: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Lieu de résidence habituelle</label>
            <input
              type="text"
              placeholder="Adresse de résidence"
              value={newEmployee.residence}
              onChange={(e) => setNewEmployee({ ...newEmployee, residence: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Situation de famille</label>
            <select
              value={newEmployee.situation}
              onChange={(e) => setNewEmployee({ ...newEmployee, situation: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            >
              <option value="">Sélectionner</option>
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Nom et prénoms de l'épouse</label>
            <input
              type="text"
              placeholder="Nom et prénoms de l'épouse"
              value={newEmployee.epouse}
              onChange={(e) => setNewEmployee({ ...newEmployee, epouse: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-600">Personne à prévenir en cas de besoin</label>
            <input
              type="text"
              placeholder="Nom et téléphone de la personne à prévenir"
              value={newEmployee.personneAPrevenir}
              onChange={(e) => setNewEmployee({ ...newEmployee, personneAPrevenir: e.target.value })}
              className="p-2 border border-blue-200 rounded-lg w-full"
            />
          </div>
        </div>
      </div>
      
      <ContractGenerator
        employee={newEmployee.id ? newEmployee : { ...newEmployee, id: "new" }}
        company={companyData}
        onSave={(contractData) => {
          setNewEmployee({ ...newEmployee, contract: contractData, contractFile: contractData.fileUrl });
          toast.success("Contrat généré avec succès !");
        }}
        actionLoading={actionLoading}
      />
      <Button type="submit" icon={Plus} disabled={actionLoading}>
        {newEmployee.id ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  </Modal>
)}

<Modal isOpen={selectedEmployee && !showPaySlipForm && !showContractForm && !showPaySlip && !showContract} onClose={() => {
  setSelectedEmployee(null);
  setShowPaySlipForm(false);
  setShowContractForm(false);
  setShowPaySlip(false);
  setShowContract(false);
  setPaySlipData(null);
}}>
  {selectedEmployee && (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Détails de l'Employé</h2>
      <img
        src={selectedEmployee.profilePicture || "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff"}
        alt={selectedEmployee.name || "Employé"}
        className="w-16 h-16 rounded-full mx-auto"
        onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff")}
      />
      <p><strong>Nom:</strong> {selectedEmployee.name || "N/A"}</p>
      <p><strong>Email:</strong> {selectedEmployee.email || "N/A"}</p>
      <p><strong>Poste:</strong> {selectedEmployee.poste || "N/A"}</p>
      <p><strong>Département:</strong> {selectedEmployee.department || "N/A"}</p>
      <p><strong>Date d'embauche:</strong> {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString("fr-FR") : "N/A"}</p>
      <p><strong>Statut:</strong> {selectedEmployee.status || "N/A"}</p>
      <p><strong>Numéro CNPS:</strong> {selectedEmployee.cnpsNumber || "N/A"}</p>
      <p><strong>Catégorie:</strong> {selectedEmployee.professionalCategory || "N/A"}</p>
      <p><strong>Salaire de base:</strong> {selectedEmployee.baseSalary ? selectedEmployee.baseSalary.toLocaleString() : "0"} FCFA</p>
      <p><strong>Diplômes:</strong> {selectedEmployee.diplomas || "N/A"}</p>
      <p><strong>Échelon:</strong> {selectedEmployee.echelon || "N/A"}</p>
      <p><strong>Service:</strong> {selectedEmployee.service || "N/A"}</p>
      <p><strong>Superviseur:</strong> {selectedEmployee.supervisor || "N/A"}</p>
      <p><strong>Lieu de naissance:</strong> {selectedEmployee.placeOfBirth || "N/A"}</p>
      <p><strong>Période d'essai:</strong> {selectedEmployee.hasTrialPeriod ? selectedEmployee.trialPeriodDuration || "N/A" : "Non"}</p>
      <p><strong>Matricule:</strong> {selectedEmployee.matricule || 'N/A'}</p>
      <div className="flex gap-4">
        <Button
          onClick={() => {
            // Mettre à jour selectedEmployee avec les données les plus récentes
            const updatedEmployee = employees.find(emp => emp.id === selectedEmployee.id);
            if (updatedEmployee) {
              setSelectedEmployee(updatedEmployee);
            }
            setShowPaySlip(true);
            setShowPaySlipForm(false);
            setShowContractForm(false);
            setShowContract(false);
          }}
          icon={Eye}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Voir fiches de paie
        </Button>
        <Button
          onClick={() => {
            if (selectedEmployee.contract) {
              setShowContract(true);
              setShowContractForm(false);
            } else {
            setShowContractForm(true);
              setShowContract(false);
            }
            setShowPaySlipForm(false);
            setShowPaySlip(false);
          }}
          icon={selectedEmployee.contract ? Eye : Edit2}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {selectedEmployee.contract ? "Voir Contrat" : "Créer Contrat"}
        </Button>

      </div>
    </div>
  )}
</Modal>

<Modal isOpen={showContractForm} onClose={() => setShowContractForm(false)}>
  <ContractGenerator
    employee={selectedEmployee}
    companyData={companyData}
    onSave={saveContract}
    actionLoading={actionLoading}
  />
</Modal>

<Modal isOpen={showContract} onClose={() => setShowContract(false)}>
  <div className="p-6">
    <h2 className="text-lg font-semibold mb-4">Contrat de travail</h2>
    {selectedEmployee?.contract ? (
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Informations du contrat</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Salaire de base</p>
              <p className="font-medium">
                {selectedEmployee.contract?.salary ? selectedEmployee.contract.salary.toLocaleString() : selectedEmployee.baseSalary?.toLocaleString() || 'Non défini'} FCFA
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de début</p>
              <p className="font-medium">
                {selectedEmployee.contract?.startDate ? new Date(selectedEmployee.contract.startDate).toLocaleDateString('fr-FR') : 'Non définie'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type de contrat</p>
              <p className="font-medium">{selectedEmployee.contract?.type || 'CDI'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Poste</p>
              <p className="font-medium">{selectedEmployee.contract?.position || selectedEmployee.poste || 'Non défini'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Durée du contrat</p>
              <p className="font-medium">{selectedEmployee.contract?.duration || 'Indéterminée'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Période d'essai</p>
              <p className="font-medium">{selectedEmployee.contract?.trialPeriod || 'Non définie'}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowContract(false);
              setShowContractForm(true);
            }}
            icon={Edit2}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Modifier le contrat
          </Button>
        </div>
        <div className="flex justify-center mt-8">
          <Button
            onClick={() => {
              console.log('[ExportContrat] Bouton Exporter PDF cliqué');
              if (!selectedEmployee || !selectedEmployee.contract) {
                alert('Aucun contrat ou employé sélectionné.');
                return;
              }
              // Vérification des champs essentiels du contrat
              const missing = [];
              if (!selectedEmployee.name) missing.push("Nom de l'employé");
              if (!selectedEmployee.matricule) missing.push('Matricule');
              if (!selectedEmployee.contract.salary && !selectedEmployee.baseSalary) missing.push('Salaire de base');
              if (!selectedEmployee.contract.startDate) missing.push('Date de début');
              if (missing.length > 0) {
                alert('Impossible de générer le PDF du contrat. Champs manquants :\n' + missing.map(f => '- ' + f).join('\n'));
                return;
              }
              const employerData = {
                companyName: companyData?.name || companyData?.companyName || "N/A",
                address: companyData?.address || "N/A",
                cnpsNumber: companyData?.cnpsNumber || "N/A",
                representant: companyData?.representant || "N/A",
                id: companyData?.id || "",
              };
              console.log('employerData:', employerData);
              // On monte le composant ExportContrat en mode auto
              const tempDiv = document.createElement('div');
              tempDiv.style.display = 'none';
              document.body.appendChild(tempDiv);
              const root = createRoot(tempDiv);
              root.render(
                <ExportContrat
                  employee={selectedEmployee}
                  employer={employerData}
                  contractData={selectedEmployee.contract}
                  auto={true}
                  onExported={() => {
                    console.log('[ExportContrat] onExported callback déclenché');
                    setTimeout(() => {
                      root.unmount();
                      document.body.removeChild(tempDiv);
                      console.log('[ExportContrat] Composant démonté et div supprimé');
                    }, 500);
                  }}
                />
              );
              console.log('[ExportContrat] Composant monté dans le DOM temporaire');
            }}
            icon={Download}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Exporter PDF
          </Button>
        </div>
      </div>
    ) : (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Aucun contrat trouvé pour cet employé.</p>
        <Button
          onClick={() => {
            setShowContract(false);
            setShowContractForm(true);
          }}
          icon={Plus}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Créer un contrat
        </Button>
      </div>
    )}
  </div>
</Modal>
  </div>
)}
          {activeTab === "leaves" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Congés</h1>
                <Button onClick={() => setShowLeaveModal(true)} icon={Plus} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Nouvelle Demande
                </Button>
              </div>
              <Card>
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <select
                      value={leaveFilter}
                      onChange={(e) => setLeaveFilter(e.target.value)}
                      className="p-2 border border-blue-200 rounded-lg"
                    >
                      <option>Tous</option>
                      <option>En attente</option>
                      <option>Approuvé</option>
                      <option>Rejeté</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="text-left py-3 px-4">Employé</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Durée</th>
                          <th className="text-left py-3 px-4">Raison</th>
                          <th className="text-left py-3 px-4">Statut</th>
                          <th className="text-left py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeaveRequests.map((req, index) => (
                          <tr key={index} className="border-b border-blue-100 hover:bg-blue-50">
                            <td className="py-4 px-4">{employees.find((emp) => emp.id === req.employeeId)?.name}</td>
                            <td className="py-4 px-4">{new Date(req.date).toLocaleDateString("fr-FR")}</td>
                            <td className="py-4 px-4">{req.days} jour(s)</td>
                            <td className="py-4 px-4">{req.reason}</td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  req.status === "Approuvé"
                                    ? "bg-green-100 text-green-800"
                                    : req.status === "Rejeté"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {req.status === "En attente" && (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleLeaveRequest(req.employeeId, index, "Approuvé")}>
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleLeaveRequest(req.employeeId, index, "Rejeté")}
                                  >
                                    Rejeter
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
<Modal isOpen={showLeaveModal} onClose={() => setShowLeaveModal(false)}>
  <form
    onSubmit={(e) => {
      e.preventDefault();
      const employee = employees.find((emp) => emp.id === newLeaveRequest.employeeId);
      if (!employee || newLeaveRequest.days > employee.leaves.balance) {
        toast.error("Solde de congés insuffisant ou employé invalide.");
        return;
      }
      const updatedRequests = [...employee.leaves.requests, { ...newLeaveRequest, status: "En attente" }];
      updateEmployee(newLeaveRequest.employeeId, { leaves: { ...employee.leaves, requests: updatedRequests } });
      setNewLeaveRequest({ employeeId: "", date: "", days: 1, reason: "" });
      setShowLeaveModal(false);
      toast.success("Demande de congé enregistrée !");
    }}
    className="space-y-4"
  >
    <h2 className="text-lg font-semibold">Nouvelle Demande de Congé</h2>
    <div>
      <label className="block text-sm font-medium text-gray-600">Employé</label>
      <select
        value={newLeaveRequest.employeeId}
        onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, employeeId: e.target.value })}
        className="p-2 border border-blue-200 rounded-lg w-full"
        required
      >
        <option value="">Sélectionner un employé</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>{emp.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-600">Date de début</label>
      <input
        type="date"
        value={newLeaveRequest.date}
        onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, date: e.target.value })}
        className="p-2 border border-blue-200 rounded-lg w-full"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-600">Durée (jours)</label>
      <input
        type="number"
        placeholder="Durée (jours)"
        value={newLeaveRequest.days}
        onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, days: e.target.value })}
        className="p-2 border border-blue-200 rounded-lg w-full"
        min="1"
        required
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-600">Raison</label>
      <input
        type="text"
        placeholder="Raison"
        value={newLeaveRequest.reason}
        onChange={(e) => setNewLeaveRequest({ ...newLeaveRequest, reason: e.target.value })}
        className="p-2 border border-blue-200 rounded-lg w-full"
        required
      />
    </div>
    <Button type="submit" icon={Plus}>Enregistrer</Button>
  </form>
</Modal>
            </div>
          )}
          {activeTab === "absences" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Absences</h1>
              <Card>
                <div className="p-6">
                 <form onSubmit={recordAbsence} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
  <div>
    <label className="block text-sm font-medium text-gray-600">Employé</label>
    <select
      value={newAbsence.employeeId}
      onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
      className="p-2 border border-blue-200 rounded-lg"
      required
    >
      <option value="">Sélectionner un employé</option>
      {employees.map((emp) => (
        <option key={emp.id} value={emp.id}>{emp.name}</option>
      ))}
    </select>
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-600">Date</label>
    <input
      type="date"
      value={newAbsence.date}
      onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })}
      className="p-2 border border-blue-200 rounded-lg"
      required
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-600">Raison</label>
    <input
      type="text"
      placeholder="Raison"
      value={newAbsence.reason}
      onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
      className="p-2 border border-blue-200 rounded-lg"
      required
    />
  </div>
  <div>
    <label className="block text-sm font-medium text-gray-600">Durée (jours)</label>
    <input
      type="number"
      placeholder="Durée (jours)"
      value={newAbsence.duration}
      onChange={(e) => setNewAbsence({ ...newAbsence, duration: e.target.value })}
      className="p-2 border border-blue-200 rounded-lg"
      min="1"
      required
    />
  </div>
  <Button type="submit" icon={Plus}>Enregistrer</Button>
</form>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-100">
                          <th className="text-left py-3 px-4">Employé</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Raison</th>
                          <th className="text-left py-3 px-4">Durée</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.flatMap((emp) =>
                          emp.absences?.map((abs, index) => (
                            <tr key={index} className="border-b border-blue-100 hover:bg-blue-50">
                              <td className="py-4 px-4">{emp.name}</td>
                              <td className="py-4 px-4">{new Date(abs.date).toLocaleDateString("fr-FR")}</td>
                              <td className="py-4 px-4">{abs.reason}</td>
                              <td className="py-4 px-4">{abs.duration} jour(s)</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            </div>
          )}
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
              setPaySlipData(null); // Réinitialiser pour nouvelle fiche
            }}
            icon={Plus}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Générer Fiche
          </Button>
        </div>
        {filteredEmployees.every(emp => !emp.payslips || emp.payslips.length === 0) ? (
          <p className="text-center text-gray-500">Aucune fiche de paie disponible.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-blue-100">
                  <th className="text-left py-3 px-4">Nom</th>
                  <th className="text-left py-3 px-4">Matricule</th>
                  <th className="text-left py-3 px-4">Poste</th>
                  <th className="text-left py-3 px-4">Période</th>
                  <th className="text-left py-3 px-4">Montant Net</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.flatMap((emp) =>
                  (emp.payslips || []).map((payslip) => (
                    <tr key={payslip.id} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="py-4 px-4">{payslip.employee?.name || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.employee?.matricule || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.employee?.poste || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.payPeriod || "N/A"}</td>
                        <td className="py-4 px-4">
                        {typeof payslip.remuneration?.total === 'number' && typeof payslip.deductions?.total === 'number'
                          ? Math.max(0, payslip.remuneration.total - payslip.deductions.total).toLocaleString("fr-FR") + " FCFA"
                          : "N/A"}
                        </td>
                        <td className="py-4 px-4 flex gap-2">
                          <Button
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              showPaySlipDetailsModal(payslip, payslip.employee || emp);
                            }}
                          disabled={!payslip.employee || typeof payslip.remuneration?.total !== 'number'}
                          >
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            icon={Edit}
                            onClick={() => {
                              setPaySlipData(payslip);
                              setSelectedEmployee(payslip.employee || emp);
                              setShowPaySlipForm(true);
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                          disabled={!payslip.employee || typeof payslip.remuneration?.total !== 'number'}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            icon={Trash}
                            onClick={() => {
                            if (window.confirm(`Voulez-vous vraiment supprimer la fiche de paie pour ${payslip.employee?.name || "N/A"} (${payslip.payPeriod}) ?`)) {
                              deletePaySlip(emp.id, payslip.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={!payslip.employee || typeof payslip.remuneration?.total !== 'number'}
                          >
                            Supprimer
                          </Button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>

    {/* Modale pour afficher les fiches de paie */}
    <Modal isOpen={showPaySlip} onClose={() => setShowPaySlip(false)}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Fiches de paie - {selectedEmployee?.name}</h2>

        {(selectedEmployee?.payslips && selectedEmployee.payslips.length > 0) || 
         (employees.find(emp => emp.id === selectedEmployee?.id)?.payslips && 
          employees.find(emp => emp.id === selectedEmployee?.id)?.payslips.length > 0) ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-600">
                {(selectedEmployee?.payslips?.length || 0) + 
                 (employees.find(emp => emp.id === selectedEmployee?.id)?.payslips?.length || 0)} fiche(s) de paie trouvée(s)
              </p>
              <Button
                onClick={() => {
                  setShowPaySlipForm(true);
                }}
                icon={Plus}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Nouvelle fiche de paie
              </Button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(selectedEmployee.payslips || employees.find(emp => emp.id === selectedEmployee?.id)?.payslips || []).map((payslip, index) => (
                <div key={payslip.id || index} className="bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        Fiche de paie - {payslip.payPeriod}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Générée le {new Date(payslip.generatedAt).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        Salaire net: {payslip.deductions?.netToPay?.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          showPaySlipDetailsModal(payslip, selectedEmployee);
                        }}
                        icon={Eye}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setPaySlipData(payslip);
                          setShowPaySlipForm(true);
                        }}
                        icon={Edit2}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => deletePaySlip(selectedEmployee.id, payslip.id)}
                        icon={Trash2}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune fiche de paie trouvée pour cet employé.</p>
            <Button
              onClick={() => {
                setShowPaySlipForm(true);
              }}
              icon={Plus}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Créer une fiche de paie
            </Button>
          </div>
        )}
      </div>
    </Modal>

    {/* Modale pour afficher les détails d'une fiche de paie */}
    <Modal isOpen={showPaySlipDetails} onClose={() => {
      setShowPaySlipDetails(false);
      setSelectedPaySlip(null);
      setSelectedEmployee(null);
      setShowPaySlipForm(false);
      setShowPaySlip(false);
    }}>
      <div className="p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails de la Fiche de Paie</h2>
        {selectedPaySlip && selectedEmployee && (
          <div className="space-y-6">
            {/* Informations de l'employé */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Informations de l'Employé</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nom complet</p>
                  <p className="font-medium">{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Matricule</p>
                  <p className="font-medium">{selectedEmployee.matricule || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Poste</p>
                  <p className="font-medium">{selectedEmployee.poste}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Département</p>
                  <p className="font-medium">{selectedEmployee.department || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Informations de la fiche de paie */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations de la Fiche de Paie</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-medium">{selectedPaySlip.payPeriod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de génération</p>
                  <p className="font-medium">
                    {new Date(selectedPaySlip.generatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Rémunération */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Rémunération</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Salaire de base</p>
                  <p className="font-medium text-lg">
                    {selectedPaySlip.salaryDetails?.baseSalary?.toLocaleString()} FCFA
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Jours travaillés</p>
                  <p className="font-medium">{selectedPaySlip.remuneration?.workedDays} jours</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Heures supplémentaires</p>
                  <p className="font-medium">{selectedPaySlip.remuneration?.overtime?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Indemnité transport</p>
                  <p className="font-medium">{selectedPaySlip.salaryDetails?.transportAllowance?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total brut</p>
                  <p className="font-medium text-lg text-green-700">
                    {selectedPaySlip.remuneration?.total?.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* Déductions */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-3">Déductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">PVIS</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.pvis?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">IRPP</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.irpp?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CAC</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.cac?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CFC</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.cfc?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">RAV</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.rav?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">TDL</p>
                  <p className="font-medium">{selectedPaySlip.deductions?.tdl?.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total déductions</p>
                  <p className="font-medium text-lg text-red-700">
                    {selectedPaySlip.deductions?.total?.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* Net à payer */}
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <div className="text-center">
                <h3 className="text-xl font-bold text-purple-900 mb-2">NET À PAYER</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {(() => {
                    const remunerationTotal = selectedPaySlip.remuneration?.total || 0;
                    const deductionsTotal = selectedPaySlip.deductions?.total || 0;
                    const netToPay = Math.max(0, remunerationTotal - deductionsTotal);
                    return netToPay.toLocaleString();
                  })()} FCFA
                </p>
              </div>
            </div>
            {/* Boutons d'action en bas */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                onClick={() => {
                  console.log('[ExportPaySlip] Bouton Exporter PDF cliqué');
                  if (!selectedPaySlip || !selectedEmployee) {
                    alert('Aucune fiche de paie ou employé sélectionné.');
                    return;
                  }
                  // Vérification des champs essentiels côté bouton (sécurité supplémentaire)
                  const missing = [];
                  if (!selectedEmployee.name) missing.push("Nom de l'employé");
                  if (!selectedEmployee.matricule) missing.push('Matricule');
                  if (!selectedPaySlip.salaryDetails?.baseSalary) missing.push('Salaire de base');
                  if (!selectedPaySlip.payPeriod) missing.push('Période de paie');
                  if (missing.length > 0) {
                    alert('Impossible de générer le PDF. Champs manquants :\n' + missing.map(f => '- ' + f).join('\n'));
                    return;
                  }
                  const employerData = {
                    companyName: companyData?.name || companyData?.companyName || "N/A",
                    address: companyData?.address || "N/A",
                    cnpsNumber: companyData?.cnpsNumber || "N/A",
                    id: companyData?.id || "",
                  };
                  console.log('employerData:', employerData);
                  // On monte le composant ExportPaySlip en mode auto
                  const tempDiv = document.createElement('div');
                  tempDiv.style.display = 'none';
                  document.body.appendChild(tempDiv);
                  const root = createRoot(tempDiv);
                  root.render(
                    <ExportPaySlip
                      employee={selectedEmployee}
                      employer={employerData}
                      salaryDetails={selectedPaySlip.salaryDetails}
                      remuneration={selectedPaySlip.remuneration}
                      deductions={selectedPaySlip.deductions}
                      payPeriod={selectedPaySlip.payPeriod}
                      generatedAt={selectedPaySlip.generatedAt}
                      auto={true}
                      onExported={() => {
                        console.log('[ExportPaySlip] onExported callback déclenché');
                        setTimeout(() => {
                          root.unmount();
                          document.body.removeChild(tempDiv);
                          console.log('[ExportPaySlip] Composant démonté et div supprimé');
                        }, 500);
                      }}
                    />
                  );
                  console.log('[ExportPaySlip] Composant monté dans le DOM temporaire');
                }}
                icon={Download}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Exporter PDF
              </Button>
              <Button
                onClick={() => {
                  setPaySlipData(selectedPaySlip);
                  setShowPaySlipForm(true);
                  setShowPaySlipDetails(false);
                }}
                icon={Edit2}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>

    {/* Modale pour générer ou modifier une fiche de paie */}
    <Modal isOpen={showPaySlipForm} onClose={() => {
      setShowPaySlipForm(false);
      setPaySlipData(null);
    }}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {paySlipData ? "Modifier une Fiche de Paie" : "Générer une Fiche de Paie"}
          {selectedEmployee && ` - ${selectedEmployee.name}`}
        </h2>
        {selectedEmployee ? (
          <PaySlipGenerator
            employee={selectedEmployee}
            company={companyData}
            initialData={paySlipData} // Passer les données pour modification
            onSave={(payslipData) => {
              savePaySlip(payslipData, paySlipData?.id); // Passer l'id pour modification
              setShowPaySlipForm(false);
              setShowContractForm(false);
              setShowPaySlip(false);
              setShowContract(false);
              setPaySlipData(null);
            }}
            onCancel={() => setShowPaySlipForm(false)}
            actionLoading={actionLoading}
            updateEmployee={updateEmployee}
            setSelectedEmployee={setSelectedEmployee}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 mb-4">Sélectionnez un employé pour générer ou modifier une fiche de paie :</p>
        <select
          value={selectedEmployee?.id || ""}
          onChange={(e) => {
            const employee = employees.find((emp) => emp.id === e.target.value);
            setSelectedEmployee(employee || null);
            setPaySlipData(null); // Réinitialiser si changement d'employé
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
          </div>
        )}
      </div>
    </Modal>


  </div>
)}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Paramètres de l'Entreprise</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Logo</label>
<input
  type="file"
  accept="image/jpeg,image/png"
  onChange={(e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoUpload(file, companyData.id, (dataUrl) => {
        setLogoData(dataUrl); // <-- assure la mise à jour immédiate
        toast.success("Logo mis à jour !");
      });
    }
  }}
  className="p-2 border border-blue-200 rounded-lg"
/>
                      {logoData && <img src={logoData} alt="Logo" className="mt-2 h-16 rounded-lg" />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nom de l'entreprise</label>
                      <input
                        type="text"
                        value={companyData.name || ''}
                        onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="Nom de l'entreprise"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Adresse</label>
                      <input
                        type="text"
                        value={companyData.address || ''}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="Adresse de l'entreprise"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Téléphone</label>
                      <input
                        type="text"
                        value={companyData.phone || ''}
                        onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="Numéro de téléphone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Représentant</label>
                      <input
                        type="text"
                        value={companyData.representant || ''}
                        onChange={(e) => setCompanyData({ ...companyData, representant: e.target.value })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="Nom du représentant légal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Numéro d'immatriculation CNPS</label>
                      <input
                        type="text"
                        value={companyData.cnpsNumber || ''}
                        onChange={(e) => setCompanyData({ ...companyData, cnpsNumber: e.target.value })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="Numéro CNPS de l'entreprise"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          setActionLoading(true);
                          await updateDoc(doc(db, "clients", companyData.id), {
                            name: companyData.name,
                            address: companyData.address,
                            phone: companyData.phone,
                            representant: companyData.representant,
                            cnpsNumber: companyData.cnpsNumber
                          });
                          toast.success("Paramètres enregistrés !");
                        } catch (error) {
                          console.error("Erreur mise à jour paramètres:", error);
                          toast.error("Erreur mise à jour paramètres");
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              </Card>
              <Card title="Exporter Données">
                <div className="flex gap-4">
                  <Button onClick={generatePDFReport} icon={Download} className="bg-green-600 hover:bg-green-700 text-white">
                    Exporter PDF
                  </Button>
                  <Button onClick={generateExcelReport} icon={Download} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Exporter Excel
                  </Button>
                  <Button onClick={generateCSVReport} icon={Download} className="bg-purple-600 hover:bg-purple-700 text-white">
                    Exporter CSV
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompanyAdminDashboard;