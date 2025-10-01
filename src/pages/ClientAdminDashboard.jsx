import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import TemplateSelector from "../components/TemplateSelector";
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
  addDoc,
  getDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { exportToXLSX, exportToCSV } from "../utils/fileIO";
import { buildCommonOptions } from "../utils/chartConfig";
import { ToastContainer, toast } from "react-toastify";
// import { calculateDeductions } from "../utils/payrollUtils"; // plus utilise ici
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
import PrimeIndemniteSelector from "../compoments/PrimeIndemniteSelector";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import ExportBadgePDF from "../compoments/ExportBadgePDF";
import CotisationCNPS from "../compoments/CotisationCNPS";
import { displayDepartment, displayMatricule, displayPhone, displayCNPSNumber, displayProfessionalCategory, displaySalary, displayDate, displayDiplomas, displayEchelon, displayService, displaySupervisor, displayPlaceOfBirth, displayDateOfBirth, displayDateWithOptions, displayGeneratedAt, displayHireDate, displayContractStartDate, displayContractEndDate, displayLicenseExpiry, normalizeEmployeeData } from "../utils/displayUtils";
import { generatePaySlipData, PAYSLIP_TEMPLATE_CONFIGS } from "../utils/paySlipTemplates";
import { generatePDFReport as generatePDFReportUtil } from "../utils/pdfUtils";
import { buildLeaveTypeDoughnut, buildDepartmentBar, buildMonthlyTrendsLine } from "../utils/dashboardData";
import { generateQRCodeUrl, generateUserInfoQRCode, generateVCardQRCode } from "../utils/qrCodeUtils";
import QRCodeScanner from "../compoments/QRCodeScanner";
import UserInfoDisplay from "../compoments/UserInfoDisplay";
import { INDEMNITIES, BONUSES } from "../utils/payrollLabels";
 
import { removeUndefined } from "../utils/objectUtils";
import PaySlipGenerator from "../components/PaySlipGenerator";
import { subscribeEmployees, addEmployee as svcAddEmployee, updateEmployee as svcUpdateEmployee, updateEmployeeContract as svcUpdateEmployeeContract, updateEmployeePayslips as svcUpdateEmployeePayslips, updateEmployeeBaseSalary as svcUpdateEmployeeBaseSalary, deleteEmployee as svcDeleteEmployee, updateEmployeeBadge as svcUpdateEmployeeBadge } from "../services/employees";
import { updateCompany as svcUpdateCompany, setCompanyUserCount as svcSetCompanyUserCount } from "../services/companies";
import ExportsBar from "../components/ExportsBar";
import LeaveRequestsRecent from "../components/LeaveRequestsRecent";
import EmployeesTable from "../components/EmployeesTable";
import LeaveRequestsPanel from "../components/LeaveRequestsPanel";
import EmployeeFormModal from "../components/EmployeeFormModal";
import Modal from "../components/Modal";
import DashboardSidebar from "../components/DashboardSidebar";
import MobileFooterNav from "../components/MobileFooterNav";
import generateBadgePDF from "../utils/badgePdf";
import { VILLES_CAMEROUN, QUARTIERS_PAR_VILLE } from "../utils/constants";
import { computeEffectiveDeductions, computeRoundedDeductions, computeNetPay, computeGrossTotal, computeSBT, computeSBC, validateDeductions, formatCFA, computePVID, computeStatutoryDeductions, computeCompletePayroll } from "../utils/payrollCalculations";
import ContractGenerator from "../components/ContractGenerator";
import Contract from "../components/Contract";
import PaySlip from "../components/PaySlip";
import Button from "../components/Button";
import BadgeStudio from "../components/BadgeStudio";
import Card from "../components/Card";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatDateOfBirthInput, validateDateOfBirth, convertFrenchDateToISO, ensureEmployeeFields } from "../utils/dateHelpers";
import EmployeeSelector from "../components/EmployeeSelector";
import LogoUploader from "../components/LogoUploader";
import EmployeeForm from "../components/EmployeeForm";

// Lazy-loaded heavy sections
const ChartsSection = lazy(() => import("../components/ChartsSection"));
const QRSection = lazy(() => import("../components/QRSection"));

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
// PaySlipGenerator extracted to src/components/PaySlipGenerator.jsx

// Modal moved to shared component: ../components/Modal

// Composant principal
const CompanyAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  // Sidebar state supports: "fullyOpen" | "minimized" | "hidden"
  const [sidebarState, setSidebarState] = useState("fullyOpen");
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
  role: "Employe",
  poste: "",
  hireDate: "",
  status: "Actif",
  cnpsNumber: "",
  professionalCategory: "",
  category: "",
  baseSalary: 0, // Changàde "" Ã  0 pour garantir un type nombre
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
  hasTrialPeriod: false,
  trialPeriodDuration: "",
    matricule: "",
    // Nouveaux champs pour les informations personnelles
    dateOfBirth: "",
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
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [employeeForBadge, setEmployeeForBadge] = useState(null);
  
  // Ajout des hooks pour suggestions
  const [allResidences, setAllResidences] = useState([]);
  const [allLieuNaissance, setAllLieuNaissance] = useState([]);

  // Dans le composant CompanyAdminDashboard, juste avant le JSX du formulaire d'employe :
  const [dateOfBirthError, setDateOfBirthError] = useState("");

  // ... autres hooks d'etat ...
  // ... reste du composant ...

  const [selectedBadgeModel, setSelectedBadgeModel] = useState("BadgeModel1");
  const [selectedQRType, setSelectedQRType] = useState("userInfo");
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // Etats pour les modeles de templates
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  // Align default with implemented PDF renderer keys: 'eneo', 'classic', 'bulletin_paie', 'compta_online', 'enterprise'
  const [selectedPaySlipTemplate, setSelectedPaySlipTemplate] = useState("eneo");
  const [selectedContractTemplate, setSelectedContractTemplate] = useState("contract1");

  function formatDateOfBirthInput(value) {
    // Si l'utilisateur tape 8 chiffres d'affilée, on formate automatiquement
    const onlyDigits = value.replace(/\D/g, "");
    if (onlyDigits.length === 8) {
      return onlyDigits.replace(/(\d{2})(\d{2})(\d{4})/, "$1/$2/$3");
    }
    // Ajoute les / automatiquement
    let v = value.replace(/[^\d]/g, "");
    if (v.length > 2 && v.length <= 4) v = v.slice(0,2) + "/" + v.slice(2);
    else if (v.length > 4) v = v.slice(0,2) + "/" + v.slice(2,4) + "/" + v.slice(4,8);
    return v;
  }

  function validateDateOfBirth(value) {
    // Format attendu : JJ/MM/AAAA
    if (!value) return "";
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;
    if (!regex.test(value)) return "Format attendu : JJ/MM/AAAA";
    // Vérifie que la date existe
    const [jour, mois, annee] = value.split("/").map(Number);
    const d = new Date(annee, mois - 1, jour);
    if (d.getFullYear() !== annee || d.getMonth() !== mois - 1 || d.getDate() !== jour) return "Date invalide";
    return "";
  }

  // Fonction pour convertir le format français (JJ/MM/AAAA) en format ISO
  function convertFrenchDateToISO(frenchDate) {
    if (!frenchDate || !frenchDate.trim()) return null;
    
    // Vérifier le format français
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;
    if (!regex.test(frenchDate)) return null;
    
    // Convertir en format ISO
    const [jour, mois, annee] = frenchDate.split("/").map(Number);
    const date = new Date(annee, mois - 1, jour);
    
    // Vérifier que la date est valide
    if (date.getFullYear() !== annee || date.getMonth() !== mois - 1 || date.getDate() !== jour) {
      return null;
    }
    
    return date.toISOString();
  }

  useEffect(() => {
    // Collecte toutes les adresses et lieux de naissance uniques (insensible Ã  la casse)
    if (employees && employees.length > 0) {
      const residencesSet = new Map();
      const lieuNaissanceSet = new Map();
      employees.forEach(emp => {
        if (emp.residence && emp.residence.trim()) {
          const key = emp.residence.trim().toLowerCase();
          if (!residencesSet.has(key)) residencesSet.set(key, emp.residence.trim());
        }
        if (emp.lieuNaissance && emp.lieuNaissance.trim()) {
          const key = emp.lieuNaissance.trim().toLowerCase();
          if (!lieuNaissanceSet.has(key)) lieuNaissanceSet.set(key, emp.lieuNaissance.trim());
        }
      });
      setAllResidences(Array.from(residencesSet.values()));
      setAllLieuNaissance(Array.from(lieuNaissanceSet.values()));
    } else {
      setAllResidences([]);
      setAllLieuNaissance([]);
    }
  }, [employees]);

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
    // S'assurer que les nouveaux champs sont présents meme s'ils n'existent pas encore
    diplomas: employee.diplomas || '',
    echelon: employee.echelon || '',
    service: employee.service || '',
    supervisor: employee.supervisor || '',
    category: employee.category || '',
    // Autres champs optionnels qui pourraient manquer
    phone: employee.phone || '',
    department: employee.department || '',
    hasTrialPeriod: employee.hasTrialPeriod || false,
    trialPeriodDuration: employee.trialPeriodDuration || '',
    matricule: employee.matricule || '',
    // Nouveaux champs d'informations personnelles
            dateOfBirth: employee.dateOfBirth || '',
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
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) {
        throw new Error("Employé non trouvé.");
      }
    const updatedPayslips = (employee.payslips || []).filter((ps) => ps.id !== payslipId);
    await svcUpdateEmployeePayslips(db, companyData.id, employeeId, removeUndefined(updatedPayslips));
    setEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    setFilteredEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    // Mettre Ã  jour selectedEmployee si c'est le meme employé
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
    let unsubscribe;
    const fetchData = async () => {
      console.log('[DEBUG] useEffect fetchData: auth.currentUser =', auth.currentUser);
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
          const companyInfo = { id: companyId, ...companyDoc.data() };
          
          // Vérification de l'expiration de la licence
          const licenseExpiry = companyInfo.licenseExpiry;
          const isActive = companyInfo.isActive !== false; // Par défaut actif si non défini
          
          if (!isActive) {
            toast.error("Votre compte a été désactivé. Contactez l'administrateur.");
            await signOut(auth);
            navigate("/client-admin-login");
            return;
          }
          
          if (licenseExpiry) {
            const expiryDate = new Date(licenseExpiry);
            const today = new Date();
            
            if (expiryDate < today) {
              toast.error("Votre licence a expiré. Contactez l'administrateur pour renouveler.");
              await signOut(auth);
              navigate("/client-admin-login");
              return;
            }
            
            // Avertissement si expiration dans moins de 7 jours
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 7 && daysLeft > 0) {
              toast.warning(`Attention : Votre licence expire dans ${daysLeft} jour(s) !`);
            }
          }
          
          setCompanyData(companyInfo);
          setLogoData(localStorage.getItem(`logo_${companyId}`));
          unsubscribe = subscribeEmployees(
            db,
            companyId,
            (rows) => {
              const employeesData = rows.map((employeeData) => normalizeEmployeeData(employeeData));
              setEmployees(employeesData);
              setLoading(false);
            },
            (error) => {
              console.error("Erreur chargement employés:", error);
              toast.error("Erreur chargement employés");
              setLoading(false);
            }
          );
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
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigate]);

// Mettre Ã  jour un employé (via service)
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
      throw new Error("Aucune donnée Ã  mettre Ã  jour.");
    }
    if (updatedData.baseSalary && (isNaN(updatedData.baseSalary) || Number(updatedData.baseSalary) < 36270)) {
      throw new Error("Le salaire de base doit Ãªtre un nombre supérieur ou égal Ã  36270 FCFA.");
    }
    if (updatedData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedData.email)) {
      throw new Error("Email invalide.");
    }

    // Mettre Ã  jour via service
    await svcUpdateEmployee(db, companyData.id, id, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    toast.success("Employé mis Ã  jour avec succès !");
  } catch (error) {
    console.error("[updateEmployee] Erreur détaillée:", error.code, error.message);
    const errorMessages = {
      "permission-denied": "Vous n'avez pas les permissions nécessaires. Vérifiez votre authentification ou contactez l'administrateur.",
      "not-found": "L'employé ou l'entreprise spécifiée n'existe pas.",
      "invalid-argument": "Les données fournies sont invalides. Vérifiez les champs saisis.",
      "failed-precondition": "Une condition préalable n'est pas remplie. Vérifiez la configuration Firestore.",
    };
    toast.error(errorMessages[error.code] || `Erreur lors de la mise Ã  jour de l'employé : ${error.message}`);
  } finally {
    setActionLoading(false);
  }
}, [companyData]);

// Ajouter un employé (via service)
const addEmployee = async (e) => {
  e.preventDefault();
  setActionLoading(true);
  try {
    console.log('[DEBUG] addEmployee: auth.currentUser =', auth.currentUser);
    if (!companyData?.id) {
      console.error('[DEBUG] addEmployee: companyData.id manquant', companyData);
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
      throw new Error("Le salaire de base doit Ãªtre un nombre positif.");
    }
    if (!newEmployee.matricule) {
      throw new Error("Le matricule est requis. Veuillez saisir un matricule pour l'employé.");
    }
    // Prépare le contrat Ã  partir des seuls champs utiles pour le PDF
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
      console.log('[DEBUG] addEmployee: update existing employee', newEmployee.id);
      // Convertir la date de naissance du format français vers ISO
      const employeeData = {
        ...newEmployee,
        dateOfBirth: convertFrenchDateToISO(newEmployee.dateOfBirth),
        contract: contractData,
        contractFile: null,
        department: newEmployee.department,
      };
      await svcUpdateEmployee(db, companyData.id, newEmployee.id, employeeData);
      employeeId = newEmployee.id;
      toast.success("Employé modifié avec succès !");
    } else {
      console.log('[DEBUG] addEmployee: add new employee', newEmployee);
      // Convertir la date de naissance du format français vers ISO
      const employeeData = {
        ...newEmployee,
        dateOfBirth: convertFrenchDateToISO(newEmployee.dateOfBirth),
        contract: contractData,
        contractFile: null,
        adminUid: auth.currentUser?.uid || null,
        payslips: [],
        createdAt: new Date().toISOString(),
        department: newEmployee.department,
      };
      employeeId = await svcAddEmployee(db, companyData.id, employeeData);
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
      category: "",
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
    await svcUpdateEmployeeContract(db, companyData.id, selectedEmployee.id, {
      contract: contractData,
      contractFile: contractData.fileUrl || null,
      hasTrialPeriod: contractData.trialPeriod ? true : false,
      trialPeriodDuration: contractData.trialPeriod || "",
      updatedAt: new Date().toISOString(),
    });
    toast.success("Contrat enregistré avec succès !");
    // Mettre Ã  jour localement l'employé sélectionné
    setSelectedEmployee((prev) => ({
      ...prev,
      contract: contractData,
      contractFile: contractData.fileUrl || null,
      hasTrialPeriod: !!contractData.trialPeriod,
      trialPeriodDuration: contractData.trialPeriod || "",
    }));
  } catch (error) {
    console.error("[saveContract] Erreur:", error.message);
    toast.error(`Erreur lors de l'enregistrement du contrat : ${error.message}`);
  } finally {
    setActionLoading(false);
  }
};
  // Supprimer un employé
  const deleteEmployee = useCallback(async (id) => {
    if (!window.confirm("Supprimer cet employé ?")) return;
    try {
      setActionLoading(true);
      await svcDeleteEmployee(db, companyData.id, id);
      await svcSetCompanyUserCount(db, companyData.id, employees.length - 1);
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
      toast.success("Notification envoyée Ã  tous les employés !");
    } catch (error) {
      console.error("Erreur envoi notification:", error);
      toast.error("Erreur envoi notification");
    } finally {
      setActionLoading(false);
    }
  }, [employees, newNotification, updateEmployee]);

  // Generer un rapport PDF
  const generatePDFReport = useCallback(() => {
    generatePDFReportUtil(companyData, employees, setActionLoading);
  }, [companyData, employees]);

  // Generer un rapport Excel
  const generateExcelReport = useCallback(() => {
    try {
      setActionLoading(true);
      const rows = employees.map((emp) => ({
        Nom: emp.name,
        Email: emp.email,
        Role: emp.role,
        Poste: emp.poste,
        Departement: emp.department || "N/A",
        "Date d'embauche": displayHireDate(emp.hireDate),
        Statut: emp.status,
        "Solde Conges": emp.leaves.balance,
      }));
      exportToXLSX(rows, `${companyData.name}_rapport.xlsx`, "Employes");
      toast.success("Rapport Excel genere !");
    } catch (error) {
      console.error("Erreur generation Excel:", error);
      toast.error("Erreur generation Excel");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);

  // Generer un rapport CSV
  const generateCSVReport = useCallback(() => {
    try {
      setActionLoading(true);
      const rows = employees.map((emp) => ({
        Nom: emp.name,
        Email: emp.email,
        Role: emp.role,
        Poste: emp.poste,
        Departement: emp.department || "N/A",
        "Date d'embauche": displayHireDate(emp.hireDate),
        Statut: emp.status,
        "Solde Conges": emp.leaves.balance,
      }));
      exportToCSV(rows, `${companyData.name}_rapport.csv`);
      toast.success("Rapport CSV genere !");
    } catch (error) {
      console.error("Erreur generation CSV:", error);
      toast.error("Erreur generation CSV");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees]);
  // mise Ã  jour

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
    const employee = employees.find((emp) => emp.id === selectedEmployee.id);
    if (!employee) {
      throw new Error("Employé non trouvé.");
    }
    const newBaseSalary = Number(paySlipData?.salaryDetails?.baseSalary || 0);
    if (newBaseSalary < 36270) {
      throw new Error("Le salaire de base doit Ãªtre supérieur ou égal Ã  36270 FCFA.");
    }
    if (newBaseSalary !== Number(employee.baseSalary)) {
      await svcUpdateEmployeeBaseSalary(db, companyData.id, selectedEmployee.id, newBaseSalary);
    }
    // Recalcul avec fonctions centralisées pour garantir la cohérence
    const payrollCalc = computeNetPay({
      salaryDetails: paySlipData?.salaryDetails || {},
      remuneration: paySlipData?.remuneration || {},
      deductions: paySlipData?.deductions || {},
      primes: paySlipData?.primes || [],
      indemnites: paySlipData?.indemnites || []
    });

    // Harmonisation : structure directe avec calculs corrects
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
        total: payrollCalc.grossTotal, // Utilise le calcul centralisé
      },
      deductions: {
        pvid: payrollCalc.deductions.pvid, // PVID corrigé (4.2% du salaire de base)
        pvis: payrollCalc.deductions.pvid, // Backward compatibility
        irpp: payrollCalc.deductions.irpp,
        cac: payrollCalc.deductions.cac,
        cfc: payrollCalc.deductions.cfc,
        rav: payrollCalc.deductions.rav,
        tdl: payrollCalc.deductions.tdl, // TDL corrigé (10% de l'IRPP)
        total: payrollCalc.deductionsTotal,
      },
      // Ajouter le net Ã  payer calculé
      netPay: payrollCalc.netPay,
    };
    let updatedPayslips = [...(employee.payslips || [])];
    if (payslipId) {
      // Modification : remplacer la fiche existante par id
      updatedPayslips = updatedPayslips.map(ps => ps.id === payslipId ? safePaySlipData : ps);
    } else {
      // Création : ajouter une nouvelle fiche
      updatedPayslips.push(safePaySlipData);
    }
    await svcUpdateEmployeePayslips(db, companyData.id, selectedEmployee.id, removeUndefined(updatedPayslips));
    setEmployees((prev) => prev.map((emp) => emp.id === selectedEmployee.id ? { ...emp, payslips: updatedPayslips } : emp));
    setFilteredEmployees((prev) => prev.map((emp) => emp.id === selectedEmployee.id ? { ...emp, payslips: updatedPayslips } : emp));
    // Mettre Ã  jour selectedEmployee avec les nouvelles données
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

  // Données pour les graphiques (via utilitaires)
  const doughnutData = buildLeaveTypeDoughnut();
  const barData = buildDepartmentBar();
  const lineData = buildMonthlyTrendsLine();

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

  // Cameroon cities and PDF helpers moved to utils (constants.js, badgePdf.js)

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer position="top-right" autoClose={3000} />
      {actionLoading && (
        <div className="fixed top-4 right-4 z-50 bg-white p-3 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <DashboardSidebar
          sidebarState={sidebarState}
          setSidebarState={setSidebarState}
          companyData={companyData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logoData={logoData}
          handleLogout={handleLogout}
          notifications={notifications}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Main - Responsive padding and spacing */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto animate-fade-in pb-20 md:pb-6">
          {/* Mobile Page Title */}
          <div className="md:hidden mb-4 pt-2">
            <h1 className="text-xl font-bold text-gray-900">
              {activeTab === "overview" && "Tableau de bord"}
              {activeTab === "employees" && "Employés"}
              {activeTab === "leaves" && "Congés"}
              {activeTab === "absences" && "Absences"}
              {activeTab === "payslips" && "Paie"}
              {activeTab === "reports" && ""}
              {activeTab === "notifications" && "Notifications"}
              {activeTab === "settings" && "Paramètres"}
            </h1>
          </div>
          
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card className="bg-gradient-to-br from-blue-600 to-blue-400 text-white">
                  <div className="p-4 sm:p-6">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                    <p className="text-xs sm:text-sm">Employes Actifs</p>
                    <p className="text-xl sm:text-2xl font-bold">{employees.filter(emp => emp.status === 'Actif').length}</p>
                    <p className="text-xs sm:text-sm mt-2">
                      {employees.filter(emp => emp.status === 'Actif').length > 0 
                        ? `${employees.filter(emp => emp.status === 'Actif').length} actifs`
                        : 'Aucun employé actif'}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-600 to-green-400 text-white">
                  <div className="p-4 sm:p-6">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                    <p className="text-xs sm:text-sm">Demandes de Conges</p>
                    <p className="text-xl sm:text-2xl font-bold">{leaveRequests.filter(req => req.status === 'En attente').length}</p>
                    <p className="text-xs sm:text-sm mt-2">
                      {leaveRequests.filter(req => req.status === 'En attente').length > 0
                        ? `${leaveRequests.filter(req => req.status === 'En attente').length} en attente`
                        : 'Aucune demande en attente'}
                    </p>
                  </div>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-600 to-yellow-400 text-white">
                  <div className="p-4 sm:p-6">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                    <p className="text-xs sm:text-sm">Absences ce mois</p>
                    <p className="text-xl sm:text-2xl font-bold">
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
                    <p className="text-xs sm:text-sm mt-2">
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
                  <div className="p-4 sm:p-6">
                    <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                    <p className="text-xs sm:text-sm">Fiches de Paie</p>
                    <p className="text-xl sm:text-2xl font-bold">
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
              <Suspense fallback={<div className="p-4">Chargement des graphiquesâ€¦</div>}>
                <ChartsSection />
              </Suspense>
              
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
                    <p className="text-xs mt-1">Employes actifs</p>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Demandes de Conges Recentes">
                  <LeaveRequestsRecent employees={employees} requests={filteredLeaveRequests} />
                </Card>
                
                <Card title="Fiches de Paie Récentes">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4">Employé</th>
                        <th className="text-left py-3 px-4">Période</th>
                        <th className="text-left py-3 px-4">Net Ã  Payer</th>
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
                                const payslipCalc = computeNetPay({
                                  salaryDetails: payslip.salaryDetails || {},
                                  remuneration: payslip.remuneration || {},
                                  deductions: payslip.deductions || {},
                                  primes: payslip.primes || [],
                                  indemnites: payslip.indemnites || []
                                });
                                
                                // Debug: Log calculation details
                                if (process.env.NODE_ENV === 'development') {
                                  console.log('[DEBUG] Payslip calculation:', {
                                    employee: payslip.employee?.name,
                                    baseSalary: payslip.salaryDetails?.baseSalary,
                                    grossTotal: payslipCalc.grossTotal,
                                    pvid: payslipCalc.deductions.pvid,
                                    deductionsTotal: payslipCalc.deductionsTotal,
                                    netPay: payslipCalc.netPay,
                                    rawDeductions: payslip.deductions
                                  });
                                }
                                
                                return formatCFA(payslipCalc.netPay);
                              })()}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {displayGeneratedAt(payslip.generatedAt)}
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
                  <Button onClick={() => setActiveTab("employees")} className="p-4 bg-blue-50 hover:bg-blue-100 text-left">
                    <Users className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold">Ajouter Employé</h3>
                    <p className="text-sm text-gray-600">Créer un nouveau profil</p>
                  </Button>
                  <Button onClick={() => {
                    setSelectedEmployee(null);
                    setShowPaySlipForm(true);
                    setPaySlipData(null);
                    setActiveTab("payslips");
                  }} className="p-4 bg-green-50 hover:bg-green-100 text-left">
                    <CreditCard className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold">Generer Fiche</h3>
                    <p className="text-sm text-gray-600">Creer une fiche de paie</p>
                  </Button>
                  <Button onClick={() => setActiveTab("leaves")} className="p-4 bg-yellow-50 hover:bg-yellow-100 text-left">
                    <Calendar className="w-8 h-8 text-yellow-600 mb-2" />
                    <h3 className="font-semibold">Gerer Conges</h3>
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
      <h1 className="text-3xl font-bold text-gray-900">Gestion des Employes</h1>
      <Button onClick={() => setShowEmployeeModal(true)} icon={Plus} className="bg-blue-600 hover:bg-blue-700 text-white">
        Ajouter Employe
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
            <option value="role">Role</option>
            <option value="poste">Poste</option>
            <option value="hireDate">Date d'embauche</option>
          </select>
        </div>
        {filteredEmployees.length === 0 ? (
          <p className="text-center text-gray-500">Aucun employé trouvé.</p>
        ) : (
          <EmployeesTable
            employees={filteredEmployees}
            onView={(emp) => {
              try {
                setSelectedEmployee(emp);
              } catch (error) {
                console.error('[ERROR] Erreur lors du clic sur Voir:', error);
                toast.error("Erreur lors de l'affichage des détails");
              }
            }}
            onEdit={(emp) => {
              setNewEmployee(ensureEmployeeFields(emp));
              setShowEmployeeModal(true);
              setShowContractForm(false);
              setShowContract(false);
              setShowPaySlipForm(false);
              setShowPaySlip(false);
            }}
            onDelete={(id) => deleteEmployee(id)}
          />
        )}
      </div>
    </Card>
    
    {/* Section Badges */}
    <Card title="Badges Employes" className="mt-8">
      <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
        <label className="font-semibold">Modele de badge :</label>
        <select
          value={selectedBadgeModel}
          onChange={e => setSelectedBadgeModel(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="BadgeModel1">Moderne</option>
          <option value="BadgeModel2">Bandeau coloré</option>
          <option value="BadgeModel3">Minimaliste</option>
          <option value="BadgeModel4">Vertical coloré</option>
          <option value="BadgeModel5">Photo fond</option>
        </select>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2">Nom</th>
            <th className="px-4 py-2">Poste</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id}>
              <td className="px-4 py-2">{emp.name}</td>
              <td className="px-4 py-2">{emp.poste}</td>
              <td className="px-4 py-2">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                  onClick={() => {
                    setEmployeeForBadge(emp);
                    setShowBadgeForm(true);
                  }}
                >
                  Générer badge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  </div>
)}

{showEmployeeModal && (
  <Modal
    isOpen={showEmployeeModal}
    onClose={() => {
      setShowEmployeeModal(false);
      setSelectedEmployee(null);
    }}
  >
    <EmployeeFormModal
      newEmployee={newEmployee}
      setNewEmployee={setNewEmployee}
      onSubmit={addEmployee}
      actionLoading={actionLoading}
      formatDateOfBirthInput={formatDateOfBirthInput}
      validateDateOfBirth={validateDateOfBirth}
      dateOfBirthError={dateOfBirthError}
      setDateOfBirthError={setDateOfBirthError}
      allLieuNaissance={allLieuNaissance}
      allResidences={allResidences}
    />
  </Modal>
)}

<Modal isOpen={selectedEmployee && !showPaySlipForm && !showContractForm && !showPaySlip && !showContract && !showEmployeeModal} onClose={() => {
  console.log('[DEBUG] Fermeture modal employé');
  setSelectedEmployee(null);
  setShowPaySlipForm(false);
  setShowContractForm(false);
  setShowPaySlip(false);
  setShowContract(false);
  setShowEmployeeModal(false);
  setPaySlipData(null);
}}>
  {selectedEmployee && (
    <div className="space-y-4">
      {console.log('[DEBUG] Affichage modal employé:', selectedEmployee)}
      <h2 className="text-lg font-semibold">Détails de l'Employé - {selectedEmployee.name || 'N/A'}</h2>
      <img
        src={selectedEmployee.profilePicture || "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff"}
        alt={selectedEmployee.name || "Employé"}
        className="w-16 h-16 rounded-full mx-auto"
        onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff")}
      />
              <p><strong>Nom:</strong> {selectedEmployee.name || "Non renseigné"}</p>
        <p><strong>Email:</strong> {selectedEmployee.email || "Non renseigné"}</p>
        <p><strong>Poste:</strong> {selectedEmployee.poste || "Non renseigné"}</p>
      <p><strong>Departement:</strong> {typeof displayDepartment === 'function' ? displayDepartment(selectedEmployee.department) : (selectedEmployee.department || "Non renseigne")}</p>
      <p><strong>Date d'embauche:</strong> {typeof displayDate === 'function' ? displayDate(selectedEmployee.hireDate) : (selectedEmployee.hireDate || "Non renseigné")}</p>
      <p><strong>Statut:</strong> {selectedEmployee.status || "Non renseigné"}</p>
      <p><strong>Numero CNPS:</strong> {typeof displayCNPSNumber === 'function' ? displayCNPSNumber(selectedEmployee.cnpsNumber) : (selectedEmployee.cnpsNumber || "Non renseigne")}</p>
      <p><strong>Catégorie:</strong> {typeof displayProfessionalCategory === 'function' ? displayProfessionalCategory(selectedEmployee.professionalCategory) : (selectedEmployee.professionalCategory || "Non renseigné")}</p>
      <p><strong>Salaire de base:</strong> {typeof displaySalary === 'function' ? displaySalary(selectedEmployee.baseSalary) : (selectedEmployee.baseSalary ? selectedEmployee.baseSalary.toLocaleString() : "Non renseigné")}</p>
      <p><strong>Diplômes:</strong> {typeof displayDiplomas === 'function' ? displayDiplomas(selectedEmployee.diplomas) : (selectedEmployee.diplomas || "Non renseigné")}</p>
      <p><strong>Échelon:</strong> {typeof displayEchelon === 'function' ? displayEchelon(selectedEmployee.echelon) : (selectedEmployee.echelon || "Non renseigné")}</p>
      <p><strong>Service:</strong> {typeof displayService === 'function' ? displayService(selectedEmployee.service) : (selectedEmployee.service || "Non renseigné")}</p>
      <p><strong>Superviseur:</strong> {typeof displaySupervisor === 'function' ? displaySupervisor(selectedEmployee.supervisor) : (selectedEmployee.supervisor || "Non renseigné")}</p>
      <p><strong>Date de naissance:</strong> {typeof displayDateOfBirth === 'function' ? displayDateOfBirth(selectedEmployee.dateOfBirth) : (selectedEmployee.dateOfBirth || "Non renseigné")}</p>
      <p><strong>Lieu de naissance:</strong> {typeof displayPlaceOfBirth === 'function' ? displayPlaceOfBirth(selectedEmployee.lieuNaissance) : (selectedEmployee.lieuNaissance || "Non renseigné")}</p>
      <p><strong>Période d'essai:</strong> {selectedEmployee.hasTrialPeriod ? selectedEmployee.trialPeriodDuration || "Non renseignée" : "Non"}</p>
      <p><strong>Matricule:</strong> {typeof displayMatricule === 'function' ? displayMatricule(selectedEmployee.matricule) : (selectedEmployee.matricule || "Non renseigné")}</p>
      <div className="flex gap-4">
        <Button
          onClick={() => {
            // Mettre Ã  jour selectedEmployee avec les données les plus récentes
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
            setShowEmployeeModal(false);
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
                {selectedEmployee.contract?.salary ? selectedEmployee.contract.salary.toLocaleString() : selectedEmployee.baseSalary?.toLocaleString() || 'Non défini'} XAF
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date de début</p>
              <p className="font-medium">
                {displayContractStartDate(selectedEmployee.contract?.startDate)}
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
                taxpayerNumber: companyData?.taxpayerNumber || "N/A",
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

          {activeTab === "leaves" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Conges</h1>
                <Button onClick={() => setShowLeaveModal(true)} icon={Plus} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Nouvelle Demande
                </Button>
              </div>
              <Card>
                <LeaveRequestsPanel
                  employees={employees}
                  requests={filteredLeaveRequests}
                  leaveFilter={leaveFilter}
                  setLeaveFilter={setLeaveFilter}
                  onApprove={(employeeId, idx) => handleLeaveRequest(employeeId, idx, "Approuvé")}
                  onReject={(employeeId, idx) => handleLeaveRequest(employeeId, idx, "Rejeté")}
                />
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
                              <td className="py-4 px-4">{displayDate(abs.date)}</td>
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
            Generer Fiche
          </Button>
          <Button
            onClick={() => setShowTemplateSelector(true)}
            icon={FileText}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Modèles
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
                        {(() => {
                          const calc = computeCompletePayroll(payslip);
                          return formatCFA(calc.netPay);
                        })()}
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
                        Générée le {displayGeneratedAt(payslip.generatedAt)}
                      </p>
                      <p className="text-sm text-gray-600">
                          {(() => {
                          const payslipCalc = computeNetPay({
                            salaryDetails: payslip.salaryDetails || {},
                            remuneration: payslip.remuneration || {},
                            deductions: payslip.deductions || {},
                            primes: payslip.primes || [],
                            indemnites: payslip.indemnites || []
                          });
                          return formatCFA(payslipCalc.netPay);
                        })()}
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
          (() => {
            const mainEmployee = employees.find(emp => emp.id === selectedEmployee?.id);
            return (
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
                      <p className="text-sm text-gray-600">Departement</p>
                      <p className="font-medium">{mainEmployee?.department || 'N/A'}</p>
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
                        {displayGeneratedAt(selectedPaySlip.generatedAt)}
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
                        {selectedPaySlip.salaryDetails?.baseSalary?.toLocaleString()} XAF
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jours travaillés</p>
                      <p className="font-medium">{selectedPaySlip.remuneration?.workedDays} jours</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Heures supplémentaires</p>
                      <p className="font-medium">{selectedPaySlip.remuneration?.overtime?.toLocaleString()} XAF</p>
                    </div>
                    {/* Indemnité transport supprimée ici */}
                    <div>
                      <p className="text-sm text-gray-600">SBT (Taxable)</p>
                      <p className="font-medium text-lg text-green-700">
                        {(() => {
                          const calc = computeCompletePayroll(selectedPaySlip);
                          return calc.sbt.toLocaleString();
                        })()} XAF
                      </p>
                    </div>
                  </div>
                  {/* Primes */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-green-800 mb-1">Primes</h4>
                    {(selectedPaySlip.primes && selectedPaySlip.primes.length > 0) ? (
                      <table className="w-full text-sm mb-2">
                        <thead>
                          <tr>
                            <th className="text-left">Type</th>
                            <th className="text-left">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPaySlip.primes.map((prime, idx) => (
                            <tr key={idx}>
                              <td>{prime.label || prime.type}</td>
                              <td>{Number(prime.montant).toLocaleString()} XAF</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500">Aucune prime</p>
                    )}
                  </div>
                  {/* Indemnités */}
                  <div className="mt-2">
                    <h4 className="font-semibold text-green-800 mb-1">Indemnités</h4>
                    {(selectedPaySlip.indemnites && selectedPaySlip.indemnites.length > 0) ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left">Type</th>
                            <th className="text-left">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPaySlip.indemnites.map((ind, idx) => (
                            <tr key={idx}>
                              <td>{ind.label || ind.type}</td>
                              <td>{Number(ind.montant).toLocaleString()} XAF</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500">Aucune indemnité</p>
                    )}
                  </div>
                </div>

                {/* Déductions */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-900 mb-3">Déductions</h3>
                  {(() => {
                    const calc = computeCompletePayroll(selectedPaySlip);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">PVID</p>
                          <p className="font-medium">{formatCFA(calc.deductions.pvid)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">IRPP</p>
                          <p className="font-medium">{formatCFA(calc.deductions.irpp)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CAC</p>
                          <p className="font-medium">{formatCFA(calc.deductions.cac)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">CFC</p>
                          <p className="font-medium">{formatCFA(calc.deductions.cfc)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">RAV</p>
                          <p className="font-medium">{formatCFA(calc.deductions.rav)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">TDL</p>
                          <p className="font-medium">{formatCFA(calc.deductions.tdl)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total déductions</p>
                          <p className="font-medium text-lg text-red-700">
                            {formatCFA(calc.deductions.total)}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                  }
                </div>

                {/* Net Ã  payer */}
                <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-purple-900 mb-2">NET À PAYER</h3>
                    <p className="text-3xl font-bold text-purple-700">
                      {(() => {
                        const calc = computeCompletePayroll(selectedPaySlip);
                        return formatCFA(calc.netPay);
                      })()}
                    </p>
                  </div>
                </div>
                {/* Boutons d'action en bas */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 md:gap-4 mt-8">
                  {/* Sélecteur de modèle pour l'export */}
                  <div className="w-full md:w-auto">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modèle PDF</label>
                    <select
                      className="p-2 border rounded-md w-full md:min-w-[220px]"
                      value={selectedPaySlipTemplate}
                      onChange={(e) => setSelectedPaySlipTemplate(e.target.value)}
                    >
                      <option value="eneo">Officiel</option>
                      <option value="classic">Classique</option>
                      <option value="bulletin_paie">Bulletin de Paie</option>
                      <option value="compta_online">Compta Online</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
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
                        taxpayerNumber: companyData?.taxpayerNumber || "N/A",
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
                          primes={selectedPaySlip.primes}
                          indemnites={selectedPaySlip.indemnites}
                          payPeriod={selectedPaySlip.payPeriod}
                          generatedAt={selectedPaySlip.generatedAt}
                          // Pass the chosen template so export uses the right PDF model
                          template={(selectedPaySlipTemplate || selectedPaySlip?.salaryDetails?.selectedTemplate || selectedPaySlip?.remuneration?.selectedTemplate || 'eneo')}
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
            );
          })()
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
          {paySlipData ? "Modifier une Fiche de Paie" : "Generer une Fiche de Paie"}
          {selectedEmployee && ` - ${selectedEmployee.name}`}
        </h2>
        {selectedEmployee ? (
          <PaySlipGenerator
            employee={selectedEmployee}
            company={companyData}
            initialData={paySlipData} // Passer les données pour modification
            selectedTemplate={selectedPaySlipTemplate} // Passer le modèle sélectionné
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
        setLogoData(dataUrl); // <-- assure la mise Ã  jour immédiate
        toast.success("Logo mis Ã  jour !");
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
                      <label className="block text-sm font-medium text-gray-600">Numéro contribuable</label>
                      <input
                        type="text"
                        value={companyData.taxpayerNumber || ''}
                        onChange={(e) => setCompanyData({ ...companyData, taxpayerNumber: e.target.value.toUpperCase() })}
                        className="p-2 border border-blue-200 rounded-lg w-full"
                        placeholder="PXXXXXXXXXXXXA ou MXXXXXXXXXXXXB"
                      />
                      {companyData.taxpayerNumber && !/^[PM][0-9]{12}[A-Za-z]$/.test(companyData.taxpayerNumber) && (
                        <div className="text-red-600 text-xs mt-1">Format invalide. Doit commencer par P ou M, contenir 12 chiffres, et se terminer par une lettre.</div>
                      )}

                      <label className="block text-sm font-medium text-gray-600 mt-4">Numéro d'immatriculation CNPS</label>
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
                          await svcUpdateCompany(db, companyData.id, {
                            name: companyData.name,
                            address: companyData.address,
                            phone: companyData.phone,
                            representant: companyData.representant,
                            taxpayerNumber: companyData.taxpayerNumber || '',
                            cnpsNumber: companyData.cnpsNumber
                          });
                          toast.success("Paramètres enregistrés !");
                        } catch (error) {
                          console.error("Erreur mise Ã  jour paramètres:", error);
                          toast.error("Erreur mise Ã  jour paramètres");
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
                <ExportsBar
                  onPdf={generatePDFReport}
                  onXlsx={generateExcelReport}
                  onCsv={generateCSVReport}
                  disabled={actionLoading}
                />
              </Card>
              <Card title="Badges Employes" className="mt-8">
                <div className="mb-4 flex flex-col md:flex-row md:items-center gap-4">
                  <label className="font-semibold">Modele de badge :</label>
                  <select
                    value={selectedBadgeModel}
                    onChange={e => setSelectedBadgeModel(e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="BadgeModel1">Moderne</option>
                    <option value="BadgeModel2">Bandeau coloré</option>
                    <option value="BadgeModel3">Minimaliste</option>
                    <option value="BadgeModel4">Vertical coloré</option>
                    <option value="BadgeModel5">Photo fond</option>
                  </select>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Nom</th>
                      <th className="px-4 py-2">Poste</th>
                      <th className="px-4 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp.id}>
                        <td className="px-4 py-2">{emp.name}</td>
                        <td className="px-4 py-2">{emp.poste}</td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                            onClick={() => {
                              setEmployeeForBadge(emp);
                              setShowBadgeForm(true);
                            }}
                          >
                            Générer badge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}
          {activeTab === "reports" && companyData?.id && companyData.cnpsNumber && (
            <CotisationCNPS companyId={companyData.id} cnpsEmployeur={companyData.cnpsNumber} />
          )}
        </main>
      </div>
      
      {showQRScanner && (
        <QRCodeScanner
          onScan={(data) => {
            console.log('QR Code scanné:', data);
            toast.success(`QR Code de ${data.employeeName} scanné avec succès !`);
            setShowQRScanner(false);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Sélecteur de modèles */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectPaySlipTemplate={setSelectedPaySlipTemplate}
        onSelectContractTemplate={setSelectedContractTemplate}
        selectedPaySlipTemplate={selectedPaySlipTemplate}
        selectedContractTemplate={selectedContractTemplate}
      />
      
      {/* Modal Badge */}
      <Modal isOpen={showBadgeForm} onClose={() => {
        setShowBadgeForm(false);
        setEmployeeForBadge(null);
      }}>
        {employeeForBadge && (
          <BadgeStudio
            employee={employeeForBadge}
            companyData={companyData}
            qrType="userInfo"
            initialModel={selectedBadgeModel}
            onSaveBadgeImage={async (employeeId, dataUrl) => {
              try {
                await svcUpdateEmployeeBadge(db, companyData.id, employeeId, {
                  badgeImage: dataUrl,
                  badgeModel: selectedBadgeModel,
                  badgeUpdatedAt: new Date().toISOString(),
                });
                toast.success("Badge enregistré avec succès !");
              } catch (error) {
                console.error("Erreur lors de l'enregistrement du badge:", error);
                toast.error("Erreur lors de l'enregistrement du badge");
              }
            }}
          />
        )}
      </Modal>
      
      {/* Mobile Footer Navigation */}
      <MobileFooterNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        notificationCount={notifications?.length || 0}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default CompanyAdminDashboard;
