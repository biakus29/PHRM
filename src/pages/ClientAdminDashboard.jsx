import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import TemplateSelector from "../components/TemplateSelector";
import DocumentsManager from "../components/DocumentsManager";
import { createRoot } from "react-dom/client";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  Lock,
  Key,
  User,
  Copy,
  RefreshCw,
  Database,
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
import { exportContractPDF, exportDocumentContract } from "../utils/exportContractPDF";
import ExportPaySlip from "../compoments/ExportPaySlip";
import PrimeIndemniteSelector from "../compoments/PrimeIndemniteSelector";
import html2canvas from "html2canvas";
import { toPng } from "html-to-image";
import ExportBadgePDF from "../compoments/ExportBadgePDF";
import CotisationCNPS from "../compoments/CotisationCNPS";
import { displayDepartment, displayMatricule, displayPhone, displayCNPSNumber, displayProfessionalCategory, displaySalary, displayDate, displayDiplomas, displayEchelon, displayService, displaySupervisor, displayPlaceOfBirth, displayDateOfBirth, displayDateWithOptions, displayGeneratedAt, displayHireDate, displayContractStartDate, displayContractEndDate, displayLicenseExpiry, normalizeEmployeeData } from "../utils/displayUtils";
// Templates PDF (registre et renderers)
import { getPayslipRenderer } from "../utils/pdfTemplates";
import { generatePDFReport as generatePDFReportUtil } from "../utils/pdfUtils";
import { buildLeaveTypeDoughnut, buildDepartmentBar, buildMonthlyTrendsLine } from "../utils/dashboardData";
import { generateQRCodeUrl, generateUserInfoQRCode, generateVCardQRCode } from "../utils/qrCodeUtils";
import QRCodeScanner from "../compoments/QRCodeScanner";
import UserInfoDisplay from "../compoments/UserInfoDisplay";
import { INDEMNITIES, BONUSES } from "../utils/payrollLabels";
 
import { removeUndefined } from "../utils/objectUtils";
import PaySlipGenerator from "../components/PaySlipGenerator";
import { calculateSeniorityPrime } from "../utils/seniorityUtils";
import { generateOfferLetterPDF } from "../utils/pdfTemplates/offerTemplateCameroon";
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
import DemoExpirationBanner from "../components/DemoExpirationBanner";
import HRProceduresPage from "./HRProceduresPage";
import ContractManagementPage from "./ContractManagementPage";
import { VILLES_CAMEROUN, QUARTIERS_PAR_VILLE } from "../utils/constants";
import { computeEffectiveDeductions, computeRoundedDeductions, computeNetPay, computeGrossTotal, computeSBT, computeSBC, validateDeductions, formatCFA, computePVID, computeStatutoryDeductions, computeCompletePayroll } from "../utils/payrollCalculations";
import ContractGenerator from "../components/ContractGenerator";
import { useDemo } from "../contexts/DemoContext";
import DemoBanner from "../components/DemoBanner";
import PaySlip from "../components/PaySlip";
import Button from "../components/Button";
import BadgeStudio from "../components/BadgeStudio";
import Card from "../components/Card";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatDateOfBirthInput, validateDateOfBirth, convertFrenchDateToISO, ensureEmployeeFields } from "../utils/dateHelpers";
import { generateInternalEmail, generateUniqueInternalEmail } from "../utils/emailUtils";
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
  // Hook pour les données démo
  const { isDemoAccount, demoData, isExpired } = useDemo();
  
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
  // Demandes professionnelles (admin)
  const [requestProFilter, setRequestProFilter] = useState("Tous");

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
  transportAllowance: 0,
  housingAllowance: 0,
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
  const [showPostCreateModal, setShowPostCreateModal] = useState(false);
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [employeeForBadge, setEmployeeForBadge] = useState(null);
  const [employeeDetailTab, setEmployeeDetailTab] = useState("info"); // "info" ou "credentials"

  // Agréger les demandes professionnelles de tous les employés
  const professionalRequestsAdmin = useMemo(() => {
    const rows = [];
    for (const emp of employees || []) {
      const list = Array.isArray(emp.professionalRequests) ? emp.professionalRequests : [];
      for (const r of list) {
        rows.push({
          id: r.id || `${emp.id}_${rows.length}`,
          employeeId: emp.id,
          employeeName: emp.name || emp.email || emp.id,
          createdAt: r.createdAt,
          createdAtDisplay: displayDate ? displayDate(r.createdAt) : (r.createdAt || ""),
          type: r.type || "",
          subject: r.subject || "",
          description: r.description || "",
          status: r.status || "En attente",
          attachments: r.attachments || [],
          _raw: r,
        });
      }
    }
    const filtered = requestProFilter === "Tous" ? rows : rows.filter(r => r.status === requestProFilter);
    return filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [employees, requestProFilter]);
  
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
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  // Etats pour les modeles de templates
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  // Align default with implemented PDF renderer keys: 'eneo', 'classic', 'bulletin_paie', 'compta_online', 'enterprise'
  const [selectedPaySlipTemplate, setSelectedPaySlipTemplate] = useState("eneo");
  const [selectedContractTemplate, setSelectedContractTemplate] = useState("contract1");

  // États pour l'import d'employés avec mapping et génération de contrats
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Mapping, 3: Validation, 4: Création, 5: Contrats
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importHeaders, setImportHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, step: '' });
  const [importResults, setImportResults] = useState({ success: [], errors: [] });
  const [generateContracts, setGenerateContracts] = useState(true);
  const [contractTemplateForImport, setContractTemplateForImport] = useState("contract1");
  
  // États pour le modal de choix de documents après création/modification d'employé
  const [preparedDocuments, setPreparedDocuments] = useState(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('contract');
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);

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
const deletePaySlip = async (employeeId, payslipId, fallback) => {
    setActionLoading(true);
    try {
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) {
        throw new Error("Employé non trouvé.");
      }
    const currentPayslips = Array.isArray(employee.payslips) ? employee.payslips : [];
    let updatedPayslips = currentPayslips;

    if (payslipId) {
      updatedPayslips = currentPayslips.filter((ps) => ps.id !== payslipId);
    } else if (typeof fallback === 'number') {
      // Fallback: remove by index when id is missing
      updatedPayslips = currentPayslips.filter((_, idx) => idx !== fallback);
    } else if (fallback && typeof fallback === 'object') {
      // Fallback: try to match by generatedAt or payPeriod if available
      const genAt = fallback.generatedAt;
      const period = fallback.payPeriod || (fallback.year && fallback.month ? `${fallback.year}-${String(fallback.month).padStart(2,'0')}` : undefined);
      updatedPayslips = currentPayslips.filter((ps) => {
        if (ps.id && !payslipId) return true; // keep all with id when no id provided
        const sameGenAt = genAt && ps.generatedAt === genAt;
        const samePeriod = period && (ps.payPeriod === period || (ps.year && ps.month && `${ps.year}-${String(ps.month).padStart(2,'0')}` === period));
        return !(sameGenAt || samePeriod);
      });
    } else {
      throw new Error("Impossible d'identifier la fiche de paie à supprimer (ID manquant).");
    }
    await svcUpdateEmployeePayslips(db, companyData.id, employeeId, removeUndefined(updatedPayslips));
    setEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    setFilteredEmployees((prev) => prev.map((emp) => emp.id === employeeId ? { ...emp, payslips: updatedPayslips } : emp));
    // Mettre à jour selectedEmployee si c'est le meme employé
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
      
      // Vérifier si c'est un compte démo
      if (isDemoAccount && demoData) {
        console.log("Chargement des données démo...");
        setCompanyData({
          id: "demo_company",
          name: "Entreprise Démo PHRM",
          address: "123 Avenue de la Démo, Yaoundé",
          phone: "+237 6XX XXX XXX",
          email: "demo@phrm.com",
          sector: "Démonstration",
          adminUid: user.uid,
          createdAt: new Date(),
          // Licence démo : 30 jours par défaut, et limitation à 2 utilisateurs/employés
          licenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
          licenseMaxUsers: 2,
          isActive: true
        });
        setEmployees(demoData.employees || []);
        setLoading(false);
        toast.success("🎯 Données démo chargées avec succès !");
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
  }, [navigate, isDemoAccount, isExpired]);

  // Rediriger vers la page d'abonnement si le compte démo est expiré
  useEffect(() => {
    if (isDemoAccount && isExpired) {
      navigate('/subscription');
    }
  }, [isDemoAccount, isExpired, navigate]);

// Mettre Ã  jour un employé (via service)
const updateEmployee = useCallback(async (id, updatedData) => {
  try {
    setActionLoading(true);

    // Vérifier companyData.id (ou compte démo)
    if (!companyData?.id) {
      throw new Error("ID de l'entreprise manquant.");
    }
    
    // Si c'est un compte démo, simuler la mise à jour
    if (isDemoAccount) {
      const updatedEmployees = employees.map(emp => 
        emp.id === id ? { ...emp, ...updatedData } : emp
      );
      setEmployees(updatedEmployees);
      toast.success("✅ Employé mis à jour (mode démo)");
      setActionLoading(false);
      return;
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
    
    // Si c'est un compte démo, ajouter dans Firestore avec flag temporaire
    if (isDemoAccount) {
      const seniorityData = calculateSeniorityPrime(
        { seniority: newEmployee.seniority || 0 },
        Number(newEmployee.baseSalary) || 0
      );
      
      // Générer un email interne pour l'employé (mode démo)
      let internalEmail = null;
      try {
        internalEmail = generateInternalEmail(
          newEmployee.name,
          companyData.email || demoData?.originalEmail,
          companyData.name || demoData?.companyName
        );
        
        // Vérifier si l'email interne existe déjà dans Firestore
        const checkEmailExists = async (email) => {
          try {
            const clientsSnapshot = await getDocs(collection(db, "clients"));
            for (const clientDoc of clientsSnapshot.docs) {
              const employeeQuery = query(
                collection(db, "clients", clientDoc.id, "employees"),
                where("internalEmail", "==", email)
              );
              const employeeSnapshot = await getDocs(employeeQuery);
              if (!employeeSnapshot.empty) {
                return true;
              }
            }
            return false;
          } catch (error) {
            console.warn("Erreur lors de la vérification de l'email:", error);
            return false;
          }
        };

        // Générer un email unique si nécessaire
        internalEmail = await generateUniqueInternalEmail(internalEmail, checkEmailExists);
        console.log("Email interne généré pour l'employé (démo):", internalEmail);
      } catch (emailError) {
        console.warn("Erreur lors de la génération de l'email interne (démo):", emailError);
      }
      
      // Créer l'employé avec flag temporaire
      const employeeData = {
        ...newEmployee,
        seniorityYears: seniorityData.years,
        seniorityPercent: seniorityData.percent,
        seniorityAllowance: seniorityData.amount,
        createdAt: new Date().toISOString(),
        isTemporary: true, // Flag pour identifier les employés de démo
        demoExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        // Informations de connexion - Stocker le mot de passe initial
        initialPassword: newEmployee.initialPassword || "123456", // Mot de passe initial par défaut
        currentPassword: newEmployee.initialPassword || "123456", // Mot de passe actuel (identique à l'initial au départ)
        passwordChanged: false, // Indicateur si le mot de passe a été changé
        // Email interne de l'entreprise
        internalEmail: internalEmail || null,
      };
      
      // Créer un compte Firebase Auth pour l'employé avec l'email interne (mode démo)
      if (internalEmail) {
        try {
          const password = newEmployee.initialPassword || "123456";
          const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
          employeeData.authUid = userCredential.user.uid;
          console.log("Compte Firebase Auth créé pour l'employé (démo) avec l'email interne:", internalEmail);
        } catch (authError) {
          if (authError.code !== 'auth/email-already-in-use') {
            console.warn("Impossible de créer un compte Firebase Auth pour l'employé (démo):", authError.message);
          }
        }
      }
      
      // Sauvegarder dans Firestore
      await svcAddEmployee(db, companyData.id, employeeData);
      const newEmp = { id: Date.now().toString(), ...employeeData };
      setEmployees([...employees, newEmp]);
      setNewEmployee({
        name: '',
        email: '',
        poste: '',
        department: '',
        hireDate: '',
        status: 'Actif',
        baseSalary: 0,
        transportAllowance: 0,
        housingAllowance: 0,
        cnpsNumber: '',
        professionalCategory: '',
        matricule: ''
      });
      setShowAddForm(false);
      toast.success("✅ Employé ajouté (mode démo)");
      setSelectedEmployee(newEmp);
      setShowPostCreateModal(true);
      setActionLoading(false);
      return;
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
        department: newEmployee.department || '',
      };
      await svcUpdateEmployee(db, companyData.id, newEmployee.id, employeeData);
      employeeId = newEmployee.id;
      toast.success("Employé modifié avec succès !");
    } else {
      console.log('[DEBUG] addEmployee: add new employee', newEmployee);
      // Convertir la date de naissance du format français vers ISO
      const seniorityData = calculateSeniorityPrime(
        { seniority: newEmployee.seniority || 0 },
        Number(newEmployee.baseSalary) || 0
      );
      // Générer un email interne pour l'employé
      let internalEmail = null;
      try {
        internalEmail = generateInternalEmail(
          newEmployee.name,
          companyData.email,
          companyData.name
        );
        
        // Vérifier si l'email interne existe déjà dans Firestore
        const checkEmailExists = async (email) => {
          try {
            // Vérifier dans tous les clients
            const clientsSnapshot = await getDocs(collection(db, "clients"));
            for (const clientDoc of clientsSnapshot.docs) {
              const employeeQuery = query(
                collection(db, "clients", clientDoc.id, "employees"),
                where("internalEmail", "==", email)
              );
              const employeeSnapshot = await getDocs(employeeQuery);
              if (!employeeSnapshot.empty) {
                return true;
              }
            }
            return false;
          } catch (error) {
            console.warn("Erreur lors de la vérification de l'email:", error);
            return false;
          }
        };

        // Générer un email unique si nécessaire
        internalEmail = await generateUniqueInternalEmail(internalEmail, checkEmailExists);
        console.log("Email interne généré pour l'employé:", internalEmail);
      } catch (emailError) {
        console.warn("Erreur lors de la génération de l'email interne:", emailError);
        // Continuer sans email interne si la génération échoue
      }

      const employeeData = {
        ...newEmployee,
        seniorityYears: seniorityData.years,
        seniorityPercent: seniorityData.percent,
        seniorityAllowance: seniorityData.amount,
        dateOfBirth: convertFrenchDateToISO(newEmployee.dateOfBirth),
        contract: contractData,
        contractFile: null,
        adminUid: auth.currentUser?.uid || null,
        payslips: [],
        createdAt: new Date().toISOString(),
        department: newEmployee.department,
        // Informations de connexion - Stocker le mot de passe initial
        initialPassword: newEmployee.initialPassword || "123456", // Mot de passe initial par défaut
        currentPassword: newEmployee.initialPassword || "123456", // Mot de passe actuel (identique à l'initial au départ)
        passwordChanged: false, // Indicateur si le mot de passe a été changé
        // Email interne de l'entreprise
        internalEmail: internalEmail || null,
      };
      
      // Créer un compte Firebase Auth pour l'employé avec l'email interne
      let authUid = null;
      if (internalEmail) {
        try {
          const password = newEmployee.initialPassword || "123456";
          const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
          authUid = userCredential.user.uid;
          employeeData.authUid = authUid; // Stocker l'UID Firebase Auth
          console.log("Compte Firebase Auth créé pour l'employé avec l'email interne:", internalEmail, authUid);
          toast.success(`Compte créé avec l'email interne: ${internalEmail}`);
        } catch (authError) {
          // Si l'email est déjà utilisé, ce n'est pas grave (l'employé peut déjà avoir un compte)
          if (authError.code === 'auth/email-already-in-use') {
            console.log("L'email interne est déjà utilisé pour Firebase Auth, continuer sans créer de compte");
            toast.warning("L'email interne existe déjà, l'employé pourra utiliser son email personnel pour se connecter");
          } else {
            console.warn("Impossible de créer un compte Firebase Auth pour l'employé:", authError.message);
            toast.warning("Impossible de créer le compte Firebase Auth, l'employé utilisera la méthode de connexion standard");
            // Continuer quand même - l'employé pourra utiliser la méthode legacy
          }
        }
      } else {
        // Si pas d'email interne, essayer avec l'email fourni
        try {
          const password = newEmployee.initialPassword || "123456";
          const userCredential = await createUserWithEmailAndPassword(auth, newEmployee.email, password);
          authUid = userCredential.user.uid;
          employeeData.authUid = authUid;
          console.log("Compte Firebase Auth créé pour l'employé avec l'email fourni:", newEmployee.email, authUid);
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log("L'email est déjà utilisé pour Firebase Auth, continuer sans créer de compte");
          } else {
            console.warn("Impossible de créer un compte Firebase Auth pour l'employé:", authError.message);
          }
        }
      }
      
      employeeId = await svcAddEmployee(db, companyData.id, employeeData);
      toast.success("Employé ajouté avec succès !");
    }
    
    // Préparer les données pour le modal de choix de documents
    const today = new Date().toISOString().split('T')[0];
    const preparedContractDoc = {
      type: 'contracts',
      city: companyData.address || 'Douala',
      date: today,
      employerName: companyData.name || 'Entreprise',
      employerId: companyData.id || companyData.uid || companyData.email || companyData.name || 'default',
      employerBP: companyData.bp || 'BP 12345',
      employerPhone: companyData.phone || '+237',
      employerFax: companyData.fax || '',
      employerEmail: companyData.email || 'contact@entreprise.cm',
      employerRepresentative: companyData.representant || 'Directeur Général',
      employerRepresentativeTitle: 'Directeur Général',
      employerCNPS: companyData.cnpsNumber || '',
      employeeName: newEmployee.name,
      employeeBirthDate: convertFrenchDateToISO(newEmployee.dateOfBirth) || '1990-01-01',
      employeeBirthPlace: newEmployee.lieuNaissance || 'Douala',
      employeeFatherName: newEmployee.pere || '',
      employeeMotherName: newEmployee.mere || '',
      employeeAddress: newEmployee.residence || companyData.address || 'Douala',
      employeeMaritalStatus: newEmployee.situation || '',
      employeeSpouseName: newEmployee.epouse || '',
      employeeChildrenCount: newEmployee.childrenCount || 0,
      employeeEmergencyContact: newEmployee.personneAPrevenir || '',
      employeePosition: newEmployee.poste,
      employeeCategory: newEmployee.professionalCategory || newEmployee.category || '',
      employeeEchelon: newEmployee.echelon || '',
      workplace: newEmployee.workPlace || newEmployee.workplace || newEmployee.lieuTravail || companyData.city || 'Douala',
      totalSalary: Number(newEmployee.baseSalary || 0) + Number(newEmployee.transportAllowance || 0) + Number(newEmployee.housingAllowance || 0),
      baseSalary: Number(newEmployee.baseSalary) || 0,
      overtimeSalary: Number(newEmployee.overtimeHours?.regular) || 0,
      housingAllowance: Number(newEmployee.housingAllowance) || 0,
      transportAllowance: Number(newEmployee.transportAllowance) || 0,
      trialPeriod: newEmployee.hasTrialPeriod ? (newEmployee.trialPeriodDuration || 3) : 0,
      contractDuration: newEmployee.contractDuration || '12 mois',
      startDate: newEmployee.hireDate || today,
      weeklyHours: newEmployee.hoursPerMonth ? Math.round((Number(newEmployee.hoursPerMonth) || 160)/4) : 40,
    };

    const preparedOfferDoc = {
      type: 'offers',
      templateVersion: 'v2', // Version 2 par défaut (sursalaire conditionnel)
      employerId: companyData.id || companyData.uid || companyData.email || companyData.name || 'default',
      companyName: companyData.name || 'Entreprise',
      companyAddress: companyData.address || '',
      companyPhone: companyData.phone || '',
      companyEmail: companyData.email || '',
      city: companyData.city || '',
      date: today,
      title: newEmployee.poste,
      contractType: newEmployee.contractType || 'CDI',
      category: newEmployee.professionalCategory || newEmployee.category || '',
      echelon: newEmployee.echelon || '',
      location: newEmployee.department || '',
      workCity: companyData.city || '',
      description: '',
      salary: Number(newEmployee.baseSalary || 0) + Number(newEmployee.transportAllowance || 0) + Number(newEmployee.housingAllowance || 0),
      baseSalary: Number(newEmployee.baseSalary) || 0,
      overtimeSalary: Number(newEmployee.overtimeHours?.regular) || 0,
      housingAllowance: Number(newEmployee.housingAllowance) || 0,
      transportAllowance: Number(newEmployee.transportAllowance) || 0,
      weeklyHours: newEmployee.hoursPerMonth ? Math.round((Number(newEmployee.hoursPerMonth) || 160)/4) : 40,
      dailyAllowance: 0,
      trialPeriod: newEmployee.hasTrialPeriod ? (newEmployee.trialPeriodDuration || 3) : 3,
      startDate: newEmployee.hireDate || today,
      startTime: '08:00',
      responseDeadline: today,
      candidateName: newEmployee.name,
      candidateCity: newEmployee.residence || '',
      companyCity: companyData.city || '',
      workplace: newEmployee.department || '',
    };

    // Stocker les données pour le modal de choix
    setPreparedDocuments({
      contract: preparedContractDoc,
      offer: preparedOfferDoc,
      employee: { ...newEmployee, id: employeeId }
    });
    setShowEmployeeModal(false);
    setSelectedEmployee({ ...newEmployee, id: employeeId });
    setShowPostCreateModal(true);
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
      transportAllowance: 0,
      housingAllowance: 0,
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

// Mettre à jour tous les emails internes existants vers le nouveau format
const updateExistingInternalEmails = async () => {
  if (!companyData?.id) {
    toast.error("ID de l'entreprise manquant.");
    return;
  }

  setActionLoading(true);
  try {
    // Filtrer les employés qui ont déjà un email interne (à mettre à jour)
    const employeesWithInternalEmail = employees.filter(
      emp => emp.internalEmail && emp.name
    );

    if (employeesWithInternalEmail.length === 0) {
      toast.info("Aucun employé avec email interne à mettre à jour.");
      setActionLoading(false);
      return;
    }

    // Demander confirmation
    if (!window.confirm(
      `Vous allez mettre à jour ${employeesWithInternalEmail.length} email(s) interne(s) vers le nouveau format (nom@nomentreprise.com).\n\n` +
      `Les anciens comptes Firebase Auth seront conservés mais les nouveaux emails seront créés.\n\n` +
      `Continuer ?`
    )) {
      setActionLoading(false);
      return;
    }

    // Fonction pour vérifier si un email existe déjà
    const checkEmailExists = async (email, excludeEmployeeId = null) => {
      try {
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        for (const clientDoc of clientsSnapshot.docs) {
          const employeeQuery = query(
            collection(db, "clients", clientDoc.id, "employees"),
            where("internalEmail", "==", email)
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          for (const empDoc of employeeSnapshot.docs) {
            // Ignorer l'employé actuel si spécifié
            if (excludeEmployeeId && empDoc.id === excludeEmployeeId) {
              continue;
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        console.warn("Erreur lors de la vérification de l'email:", error);
        return false;
      }
    };

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Traiter chaque employé
    for (const employee of employeesWithInternalEmail) {
      try {
        // Générer le nouvel email interne avec le nouveau format
        let newInternalEmail = generateInternalEmail(
          employee.name,
          companyData.email,
          companyData.name
        );

        // Vérifier si le nouvel email est différent de l'ancien
        if (newInternalEmail === employee.internalEmail) {
          skippedCount++;
          continue; // L'email est déjà au bon format
        }

        // Générer un email unique si nécessaire (en excluant l'employé actuel)
        newInternalEmail = await generateUniqueInternalEmail(
          newInternalEmail, 
          (email) => checkEmailExists(email, employee.id)
        );

        // Vérifier d'abord si un compte Firebase Auth existe déjà avec ce nouvel email
        // en cherchant dans Firestore les employés qui ont déjà cet email interne
        let authUid = employee.authUid || null;
        let existingAuthUid = null;
        
        try {
          // Chercher si un autre employé a déjà cet email interne
          const clientsSnapshot = await getDocs(collection(db, "clients"));
          for (const clientDoc of clientsSnapshot.docs) {
            const employeeQuery = query(
              collection(db, "clients", clientDoc.id, "employees"),
              where("internalEmail", "==", newInternalEmail)
            );
            const employeeSnapshot = await getDocs(employeeQuery);
            
            for (const empDoc of employeeSnapshot.docs) {
              // Ignorer l'employé actuel
              if (empDoc.id !== employee.id) {
                const empData = empDoc.data();
                if (empData.authUid) {
                  existingAuthUid = empData.authUid;
                  console.log(`Un compte Firebase Auth existe déjà pour ${newInternalEmail} (employé: ${empData.name})`);
                  break;
                }
              }
            }
            if (existingAuthUid) break;
          }
        } catch (error) {
          console.warn("Erreur lors de la vérification de l'email existant:", error);
        }

        // Si un compte existe déjà, utiliser son authUid
        if (existingAuthUid) {
          authUid = existingAuthUid;
          console.log(`Utilisation du compte Firebase Auth existant pour ${employee.name}: ${newInternalEmail}`);
        } else {
          // Sinon, essayer de créer un nouveau compte Firebase Auth
          const password = employee.initialPassword || employee.currentPassword || "123456";
          
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, newInternalEmail, password);
            authUid = userCredential.user.uid;
            console.log(`Nouveau compte Firebase Auth créé pour ${employee.name}: ${newInternalEmail}`);
          } catch (authError) {
            if (authError.code === 'auth/email-already-in-use') {
              console.log(`L'email ${newInternalEmail} est déjà utilisé pour Firebase Auth (mais pas trouvé dans Firestore)`);
              // Ne pas créer de compte, garder l'ancien authUid si disponible
              // L'email interne sera quand même mis à jour dans Firestore
            } else {
              console.warn(`Impossible de créer un compte Firebase Auth pour ${employee.name}:`, authError.message);
              // Continuer avec l'ancien authUid si disponible
            }
          }
        }

        // Mettre à jour l'employé dans Firestore
        const updateData = {
          internalEmail: newInternalEmail,
        };
        
        if (authUid) {
          updateData.authUid = authUid;
        }

        await svcUpdateEmployee(db, companyData.id, employee.id, updateData);

        // Mettre à jour localement
        const updatedEmployees = employees.map(emp => 
          emp.id === employee.id 
            ? { ...emp, internalEmail: newInternalEmail, authUid: authUid || emp.authUid }
            : emp
        );
        setEmployees(updatedEmployees);

        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'email pour ${employee.name}:`, error);
        errorCount++;
        errors.push(`${employee.name}: ${error.message}`);
      }
    }

    // Afficher le résultat
    if (successCount > 0) {
      toast.success(
        `✅ ${successCount} email${successCount > 1 ? 's' : ''} interne${successCount > 1 ? 's' : ''} mis${successCount > 1 ? '' : ''} à jour avec succès !`
      );
    }
    
    if (skippedCount > 0) {
      toast.info(
        `ℹ️ ${skippedCount} email${skippedCount > 1 ? 's' : ''} déjà au bon format, ignoré${skippedCount > 1 ? 's' : ''}.`
      );
    }
    
    if (errorCount > 0) {
      toast.warning(
        `⚠️ ${errorCount} erreur${errorCount > 1 ? 's' : ''} lors de la mise à jour. Voir la console pour plus de détails.`
      );
      console.error("Erreurs détaillées:", errors);
    }

  } catch (error) {
    console.error("Erreur lors de la mise à jour des emails internes:", error);
    toast.error(`Erreur lors de la mise à jour des emails internes : ${error.message}`);
  } finally {
    setActionLoading(false);
  }
};

// Générer des emails internes pour les employés existants qui n'en ont pas
const generateInternalEmailsForExistingEmployees = async () => {
  if (!companyData?.id) {
    toast.error("ID de l'entreprise manquant.");
    return;
  }

  setActionLoading(true);
  try {
    // Filtrer les employés qui n'ont pas d'email interne
    const employeesWithoutInternalEmail = employees.filter(
      emp => !emp.internalEmail && emp.name
    );

    if (employeesWithoutInternalEmail.length === 0) {
      toast.info("Tous les employés ont déjà un email interne.");
      setActionLoading(false);
      return;
    }

    // Fonction pour vérifier si un email existe déjà
    const checkEmailExists = async (email) => {
      try {
        const clientsSnapshot = await getDocs(collection(db, "clients"));
        for (const clientDoc of clientsSnapshot.docs) {
          const employeeQuery = query(
            collection(db, "clients", clientDoc.id, "employees"),
            where("internalEmail", "==", email)
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          if (!employeeSnapshot.empty) {
            return true;
          }
        }
        return false;
      } catch (error) {
        console.warn("Erreur lors de la vérification de l'email:", error);
        return false;
      }
    };

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Traiter chaque employé
    for (const employee of employeesWithoutInternalEmail) {
      try {
        // Générer l'email interne
        let internalEmail = generateInternalEmail(
          employee.name,
          companyData.email,
          companyData.name
        );

        // Générer un email unique si nécessaire
        internalEmail = await generateUniqueInternalEmail(internalEmail, checkEmailExists);

        // Créer le compte Firebase Auth
        let authUid = null;
        const password = employee.initialPassword || employee.currentPassword || "123456";
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
          authUid = userCredential.user.uid;
          console.log(`Compte Firebase Auth créé pour ${employee.name}: ${internalEmail}`);
        } catch (authError) {
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`L'email ${internalEmail} est déjà utilisé pour Firebase Auth`);
            // Continuer quand même, on mettra à jour l'email interne
          } else {
            console.warn(`Impossible de créer un compte Firebase Auth pour ${employee.name}:`, authError.message);
            // Continuer quand même
          }
        }

        // Mettre à jour l'employé dans Firestore
        const updateData = {
          internalEmail: internalEmail,
        };
        
        if (authUid) {
          updateData.authUid = authUid;
        }

        await svcUpdateEmployee(db, companyData.id, employee.id, updateData);

        // Mettre à jour localement
        const updatedEmployees = employees.map(emp => 
          emp.id === employee.id 
            ? { ...emp, internalEmail, authUid: authUid || emp.authUid }
            : emp
        );
        setEmployees(updatedEmployees);

        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la génération de l'email pour ${employee.name}:`, error);
        errorCount++;
        errors.push(`${employee.name}: ${error.message}`);
      }
    }

    // Afficher le résultat
    if (successCount > 0) {
      toast.success(
        `✅ ${successCount} email${successCount > 1 ? 's' : ''} interne${successCount > 1 ? 's' : ''} généré${successCount > 1 ? 's' : ''} avec succès !`
      );
    }
    
    if (errorCount > 0) {
      toast.warning(
        `⚠️ ${errorCount} erreur${errorCount > 1 ? 's' : ''} lors de la génération. Voir la console pour plus de détails.`
      );
      console.error("Erreurs détaillées:", errors);
    }

  } catch (error) {
    console.error("Erreur lors de la génération des emails internes:", error);
    toast.error(`Erreur lors de la génération des emails internes : ${error.message}`);
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
      
      // Si c'est un compte démo, simuler la suppression
      if (isDemoAccount) {
        const updatedEmployees = employees.filter(emp => emp.id !== id);
        setEmployees(updatedEmployees);
        toast.success("✅ Employé supprimé (mode démo)");
        setActionLoading(false);
        return;
      }
      
      await svcDeleteEmployee(db, companyData.id, id);
      await svcSetCompanyUserCount(db, companyData.id, employees.length - 1);
      toast.success("Employé supprimé !");
    } catch (error) {
      console.error("Erreur suppression employé:", error);
      toast.error("Erreur suppression employé");
    } finally {
      setActionLoading(false);
    }
  }, [companyData, employees, isDemoAccount]);

  // Gérer les demandes professionnelles (Accepter / Refuser)
  const handleProfessionalRequestAction = useCallback(async (employeeId, requestId, action) => {
    try {
      setActionLoading(true);
      const employee = employees.find((e) => e.id === employeeId);
      if (!employee) {
        toast.error("Employé introuvable");
        return;
      }
      const list = Array.isArray(employee.professionalRequests) ? employee.professionalRequests : [];
      const idx = list.findIndex(r => r.id === requestId);
      const indexToUpdate = idx >= 0 ? idx : list.findIndex((r) => r === requestId);
      if (indexToUpdate < 0) {
        toast.error("Demande introuvable");
        return;
      }
      const updated = [...list];
      updated[indexToUpdate] = { ...updated[indexToUpdate], status: action };
      await updateEmployee(employeeId, { professionalRequests: updated });
      toast.success(`Demande ${action.toLowerCase()}e`);
    } catch (e) {
      console.error("[handleProfessionalRequestAction]", e);
      toast.error("Erreur lors de la mise à jour de la demande");
    } finally {
      setActionLoading(false);
    }
  }, [employees, updateEmployee]);

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

// ⚡ OPTIMISATION PAIE - TRAITEMENT EN PARALLÈLE ET BATCH FIRESTORE
// ===============================================================================

/**
 * Lance le traitement de paie optimisé pour tous les employés actifs
 */
const launchMonthlyPayroll = useCallback(async () => {
  if (!companyData?.id) {
    toast.error("Données entreprise manquantes");
    return;
  }

  const activeEmployees = employees.filter(emp => emp.status === 'Actif');
  
  if (activeEmployees.length === 0) {
    toast.warning("Aucun employé actif trouvé");
    return;
  }

  // Confirmation utilisateur
  const confirmed = window.confirm(
    `Lancer la paie du mois pour ${activeEmployees.length} employé(s) ?\n\n` +
    `Cette opération va :\n` +
    `• Calculer automatiquement toutes les fiches de paie\n` +
    `• Détecter les anomalies éventuelles\n` +
    `• Sauvegarder en base de données\n` +
    `• Générer les PDF automatiquement`
  );

  if (!confirmed) return;

  setActionLoading(true);

  try {
    // Import des fonctions optimisées
    const { 
      processPayrollBatch, 
      prepareFirestoreBatches 
    } = await import('../utils/payrollCalculations');

    const { writeBatch, doc } = await import('firebase/firestore');

    toast.info(`🚀 Lancement de la paie pour ${activeEmployees.length} employés...`);

    // Options de traitement
    const options = {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      chunkSize: 8, // Traiter 8 employés en parallèle
      ignoreAnomalies: false // Arrêter sur anomalies par défaut
    };

    // Callback de progression
    const onProgress = (progress) => {
      // Toast de progression tous les 25%
      if (progress.percentage % 25 === 0 && progress.percentage > 0) {
        toast.info(`⚡ Progression: ${progress.percentage}% (${progress.processed}/${progress.total})`);
      }
    };

    // Traitement en parallèle
    const results = await processPayrollBatch(activeEmployees, options, onProgress);

    // Affichage des résultats
    console.log('📊 Résultats traitement paie:', results);

    if (results.summary.failed > 0) {
      toast.error(
        `❌ ${results.summary.failed} erreur(s) détectée(s)\n` +
        `✅ ${results.summary.successful} succès\n` +
        `⚠️ ${results.summary.withAnomalies} anomalie(s)`
      );

      // Afficher les erreurs en détail
      results.errors.forEach(error => {
        console.error(`Erreur ${error.employeeName}:`, error.error);
      });

      // Les erreurs sont déjà loggées dans la console

      return;
    }

    // Préparation des batches Firestore
    const successfulResults = results.success;
    const firestoreBatches = prepareFirestoreBatches(successfulResults, companyData.id);

    toast.info(`💾 Sauvegarde de ${successfulResults.length} fiches en ${firestoreBatches.length} batch(es)...`);

    // Écriture batch Firestore
    let savedCount = 0;
    for (const batchInfo of firestoreBatches) {
      const batch = writeBatch(db);

      for (const operation of batchInfo.operations) {
        const employeeRef = doc(db, 'clients', companyData.id, 'employees', operation.docPath.split('/').pop());
        
        // Récupérer les payslips existants et ajouter le nouveau
        const employee = employees.find(emp => emp.id === operation.docPath.split('/').pop());
        const existingPayslips = employee?.payslips || [];
        const newPayslip = successfulResults.find(r => r.employeeId === employee?.id)?.payslipData;
        
        if (newPayslip) {
          const updatedPayslips = [...existingPayslips, newPayslip];
          batch.update(employeeRef, {
            payslips: updatedPayslips,
            lastPayrollUpdate: new Date().toISOString(),
            payrollStatus: 'completed'
          });
        }
      }

      await batch.commit();
      savedCount += batchInfo.size;
      
      toast.info(`💾 Batch ${batchInfo.batchIndex + 1}/${firestoreBatches.length} sauvegardé (${savedCount}/${successfulResults.length})`);
    }

    // Mise à jour de l'état local
    const updatedEmployees = employees.map(emp => {
      const result = successfulResults.find(r => r.employeeId === emp.id);
      if (result?.payslipData) {
        return {
          ...emp,
          payslips: [...(emp.payslips || []), result.payslipData],
          lastPayrollUpdate: new Date().toISOString(),
          payrollStatus: 'completed'
        };
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    setFilteredEmployees(updatedEmployees);

    // Résumé final
    const processingTime = (results.summary.processingTime / 1000).toFixed(2);
    
    toast.success(
      `🎉 Paie terminée avec succès !\n\n` +
      `✅ ${results.summary.successful} fiches générées\n` +
      `⚠️ ${results.summary.withAnomalies} anomalie(s) détectée(s)\n` +
      `⏱️ Temps de traitement: ${processingTime}s\n` +
      `💾 Sauvegarde: ${savedCount} fiches`
    );

    // Afficher les anomalies si présentes
    if (results.summary.withAnomalies > 0) {
      console.warn('⚠️ Anomalies détectées:', results.anomalies);
      
      const anomaliesText = results.anomalies
        .map(a => `${a.employeeName}: ${a.anomalies.join(', ')}`)
        .join('\n');
      
      setTimeout(() => {
        toast.warning(
          `⚠️ Anomalies détectées:\n${anomaliesText}`,
          { autoClose: 10000 }
        );
      }, 2000);
    }

  } catch (error) {
    console.error('❌ Erreur traitement paie:', error);
    toast.error(`Erreur lors du traitement de la paie: ${error.message}`);
  } finally {
    setActionLoading(false);
  }
}, [employees, companyData, db]);

/**
 * Génère les PDF de toutes les fiches de paie en parallèle
 */
const generateAllPayslipsPDF = useCallback(async () => {
  if (!companyData?.id) {
    toast.error("Données entreprise manquantes");
    return;
  }

  const employeesWithPayslips = employees.filter(emp => 
    emp.status === 'Actif' && emp.payslips && emp.payslips.length > 0
  );

  if (employeesWithPayslips.length === 0) {
    toast.warning("Aucune fiche de paie à générer");
    return;
  }

  setActionLoading(true);

  try {
    toast.info(`📄 Génération de ${employeesWithPayslips.length} PDF en parallèle...`);

    // Génération en parallèle par chunks
    const chunkSize = 5; // 5 PDF en parallèle max
    const chunks = [];
    
    for (let i = 0; i < employeesWithPayslips.length; i += chunkSize) {
      chunks.push(employeesWithPayslips.slice(i, i + chunkSize));
    }

    let generatedCount = 0;

    for (const chunk of chunks) {
      const pdfPromises = chunk.map(async (employee) => {
        try {
          const latestPayslip = employee.payslips[employee.payslips.length - 1];
          // Calculs consolidés pour le template
          const calc = computeCompletePayroll(latestPayslip || {});

          // Renderer du template sélectionné
          const renderer = getPayslipRenderer(selectedPaySlipTemplate || 'eneo');
          const { default: jsPDF } = await import('jspdf');
          const doc = new jsPDF();

          const ctx = {
            pageWidth: doc.internal.pageSize.getWidth(),
            pageHeight: doc.internal.pageSize.getHeight(),
            margin: 12,
            payslipData: latestPayslip || {},
            employerName: companyData?.name || companyData?.companyName || 'ENTREPRISE',
            employerAddress: companyData?.address || '',
            empName: employee?.name || latestPayslip?.employeeName || 'Employé',
            empPoste: employee?.poste || employee?.professionalCategory || latestPayslip?.employee?.poste || '',
            empCNPS: employee?.cnpsNumber || latestPayslip?.cnpsNumber || '',
            baseSalary: calc.baseSalary || Number(latestPayslip?.salaryDetails?.baseSalary || 0),
            totalGross: calc.grossTotal || Number(latestPayslip?.remuneration?.total || 0),
            totalDeductions: calc.deductions?.total || 0,
            netSalary: calc.netPay || Number(latestPayslip?.netPay || 0),
            primes: latestPayslip?.primes || [],
            indemnites: latestPayslip?.indemnites || [],
            d: {
              pvid: calc.deductions?.pvid || 0,
              irpp: calc.deductions?.irpp || 0,
              cac: calc.deductions?.cac || 0,
              cfc: calc.deductions?.cfc || 0,
              rav: calc.deductions?.rav || 0,
              tdl: calc.deductions?.tdl || 0,
              fne: calc.deductions?.fne || 0,
            }
          };

          // Rendu PDF (les templates sauvegardent généralement le fichier)
          renderer(doc, ctx);

          return {
            success: true,
            employeeName: employee.name,
            pdfData: true
          };
        } catch (error) {
          return {
            success: false,
            employeeName: employee.name,
            error: error.message
          };
        }
      });

      const chunkResults = await Promise.all(pdfPromises);
      
      chunkResults.forEach(result => {
        if (result.success) {
          generatedCount++;
          // Le PDF est automatiquement téléchargé par generatePaySlipData
        } else {
          console.error(`Erreur PDF ${result.employeeName}:`, result.error);
        }
      });

      toast.info(`📄 ${generatedCount}/${employeesWithPayslips.length} PDF générés`);
    }

    toast.success(`🎉 ${generatedCount} PDF générés avec succès !`);

  } catch (error) {
    console.error('❌ Erreur génération PDF:', error);
    toast.error(`Erreur génération PDF: ${error.message}`);
  } finally {
    setActionLoading(false);
  }
}, [employees, companyData, selectedPaySlipTemplate]);

/**
 * Vérifie les anomalies sur tous les employés actifs
 */
const checkPayrollAnomalies = useCallback(async () => {
  const activeEmployees = employees.filter(emp => emp.status === 'Actif');
  
  if (activeEmployees.length === 0) {
    toast.info("Aucun employé actif à vérifier");
    return;
  }

  try {
    // Import de la fonction de détection
    const { detectPayrollAnomalies } = await import('../utils/payrollCalculations');

    const allAnomalies = [];

    activeEmployees.forEach(employee => {
      const anomalyCheck = detectPayrollAnomalies(employee);
      if (anomalyCheck.hasAnomalies) {
        allAnomalies.push({
          employeeName: employee.name,
          anomalies: anomalyCheck.anomalies
        });
      }
    });

    if (allAnomalies.length === 0) {
      toast.success(`✅ Aucune anomalie détectée sur ${activeEmployees.length} employés`);
    } else {
      const anomaliesText = allAnomalies
        .map(a => `${a.employeeName}: ${a.anomalies.join(', ')}`)
        .join('\n');
      
      toast.warning(
        `⚠️ ${allAnomalies.length} employé(s) avec anomalies:\n${anomaliesText}`,
        { autoClose: 15000 }
      );
      
      console.warn('Anomalies détectées:', allAnomalies);
    }

  } catch (error) {
    console.error('Erreur vérification anomalies:', error);
    toast.error(`Erreur vérification: ${error.message}`);
  }
}, [employees]);

// FONCTIONS D'IMPORT D'EMPLOYÉS AVEC MAPPING ET GÉNÉRATION DE CONTRATS
// ==================================================================================

/**
 * Parse un fichier CSV et extrait les données avec les en-têtes
 */
const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('Le fichier doit contenir au moins une ligne d\'en-têtes et une ligne de données'));
          return;
        }

        // Parse headers (première ligne)
        const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
        
        // Parse data (lignes suivantes)
        const data = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
          const row = { _rowIndex: index + 2 }; // +2 car ligne 1 = headers, ligne 2 = première data
          
          headers.forEach((header, i) => {
            row[header] = values[i] || '';
          });
          
          return row;
        });

        resolve({ headers, data });
      } catch (error) {
        reject(new Error(`Erreur parsing CSV: ${error.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Mapping automatique des colonnes basé sur des mots-clés
 */
const getAutoMapping = (headers) => {
  const mapping = {};
  const mappingRules = {
    name: ['nom', 'name', 'prenom', 'prénom', 'fullname', 'nom_complet'],
    matricule: ['matricule', 'id', 'employee_id', 'emp_id', 'numero'],
    cnpsNumber: ['cnps', 'cnps_number', 'numero_cnps', 'social_security'],
    baseSalary: ['salaire', 'salary', 'salaire_base', 'base_salary', 'remuneration'],
    poste: ['poste', 'position', 'job', 'fonction', 'title', 'job_title'],
    department: ['departement', 'department', 'service', 'division'],
    hireDate: ['embauche', 'hire_date', 'date_embauche', 'start_date', 'debut'],
    phone: ['telephone', 'phone', 'tel', 'mobile', 'contact'],
    email: ['email', 'mail', 'e_mail', 'courriel'],
    dateOfBirth: ['naissance', 'birth_date', 'date_naissance', 'birthday'],
    lieuNaissance: ['lieu_naissance', 'birth_place', 'place_of_birth', 'ville_naissance']
  };

  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    for (const [field, keywords] of Object.entries(mappingRules)) {
      if (keywords.some(keyword => lowerHeader.includes(keyword))) {
        mapping[field] = header;
        break;
      }
    }
  });

  return mapping;
};

/**
 * Valide les données d'un employé avant création
 */
const validateEmployeeData = (rowData, mapping) => {
  const errors = [];
  
  // Nom obligatoire
  const name = rowData[mapping.name]?.trim();
  if (!name) {
    errors.push('Nom manquant');
  }

  // Salaire obligatoire et >= SMIG
  const salary = Number(rowData[mapping.baseSalary]?.replace(/[^0-9.]/g, '') || 0);
  if (!salary || salary <= 0) {
    errors.push('Salaire manquant ou invalide');
  } else if (salary < 36270) {
    errors.push(`Salaire < SMIG (${salary} < 36,270 FCFA)`);
  }

  // CNPS obligatoire
  const cnps = rowData[mapping.cnpsNumber]?.trim();
  if (!cnps) {
    errors.push('Numéro CNPS manquant');
  }

  // Matricule obligatoire
  const matricule = rowData[mapping.matricule]?.trim();
  if (!matricule) {
    errors.push('Matricule manquant');
  }

  return errors;
};

/**
 * Transforme une ligne CSV en objet employé
 */
const transformRowToEmployee = (rowData, mapping) => {
  const parseDate = (dateStr) => {
    if (!dateStr) return '';
    // Essayer plusieurs formats de date
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[1]) { // YYYY-MM-DD
          return `${match[3]}/${match[2]}/${match[1]}`;
        } else { // DD/MM/YYYY ou DD-MM-YYYY
          return `${match[1]}/${match[2]}/${match[3]}`;
        }
      }
    }
    return dateStr; // Retourner tel quel si pas de format reconnu
  };

  return {
    name: rowData[mapping.name]?.trim() || '',
    matricule: rowData[mapping.matricule]?.trim() || `AUTO_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    cnpsNumber: rowData[mapping.cnpsNumber]?.trim() || '',
    baseSalary: Number(rowData[mapping.baseSalary]?.replace(/[^0-9.]/g, '') || 0),
    poste: rowData[mapping.poste]?.trim() || 'Employé',
    professionalCategory: rowData[mapping.poste]?.trim() || 'Employé',
    department: rowData[mapping.department]?.trim() || '',
    hireDate: parseDate(rowData[mapping.hireDate]?.trim()) || new Date().toLocaleDateString('fr-FR'),
    phone: rowData[mapping.phone]?.trim() || '',
    email: rowData[mapping.email]?.trim() || '',
    dateOfBirth: parseDate(rowData[mapping.dateOfBirth]?.trim()) || '',
    lieuNaissance: rowData[mapping.lieuNaissance]?.trim() || '',
    status: 'Actif',
    transportAllowance: 0,
    housingAllowance: 0,
    contractType: 'CDI'
  };
};

/**
 * Crée les employés en masse avec gestion d'erreurs
 */
const createEmployeesFromImport = async (validatedData, onProgress) => {
  const results = { success: [], errors: [] };
  
  for (let i = 0; i < validatedData.length; i++) {
    const employeeData = validatedData[i];
    
    try {
      onProgress({
        current: i + 1,
        total: validatedData.length,
        step: `Création de ${employeeData.name}...`
      });

      // Utiliser la fonction addEmployee existante
      await addEmployee(employeeData);
      
      results.success.push({
        name: employeeData.name,
        matricule: employeeData.matricule,
        data: employeeData
      });

    } catch (error) {
      results.errors.push({
        name: employeeData.name || 'Inconnu',
        matricule: employeeData.matricule || 'N/A',
        error: error.message,
        data: employeeData
      });
    }

    // Petite pause pour éviter de surcharger Firestore
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Génère les contrats pour les employés créés
 */
const generateContractsForImportedEmployees = async (successfulEmployees, templateId, onProgress) => {
  const results = { success: [], errors: [] };
  
  // Import dynamique du générateur de contrat
  const { generateContractPDFCameroon } = await import('../utils/pdfTemplates/contractTemplateCameroon');
  
  for (let i = 0; i < successfulEmployees.length; i++) {
    const empData = successfulEmployees[i];
    
    try {
      onProgress({
        current: i + 1,
        total: successfulEmployees.length,
        step: `Contrat de ${empData.name}...`
      });

      // Générer le PDF du contrat
      await generateContractPDFCameroon(empData.data, companyData, {
        template: templateId,
        autoDownload: true
      });

      results.success.push({
        name: empData.name,
        matricule: empData.matricule
      });

    } catch (error) {
      results.errors.push({
        name: empData.name,
        matricule: empData.matricule,
        error: error.message
      });
    }

    // Pause entre générations
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return results;
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
          {/* Demo Banner for demo accounts */}
          <DemoBanner />
          
          {/* Bannière d'expiration pour les comptes démo */}
          <DemoExpirationBanner />
          
          {/* Mobile Page Title avec bouton déconnexion */}
          <div className="md:hidden mb-4 pt-2">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === "overview" && "📊 Tableau de bord"}
                {activeTab === "employees" && "👥 Employés"}
                {activeTab === "leaves" && "🏖️ Congés"}
                {activeTab === "absences" && "⏰ Absences"}
                {activeTab === "payslips" && "💰 Paie"}
                {activeTab === "documents" && "📄 Documents"}
                {activeTab === "hr-procedures" && "📚 Procédures RH"}
                {activeTab === "reports" && "📈 Rapports"}
                {activeTab === "notifications" && "🔔 Notifications"}
                {activeTab === "settings" && "⚙️ Paramètres"}
                {activeTab === "requests-pro" && "📥 Demandes Professionnelles"}
              </h1>
              
              {/* Boutons d'action mobile */}
              <div className="flex items-center space-x-2">
                {/* Notifications */}
                <button
                  onClick={() => setActiveTab("notifications")}
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications?.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>
                
                {/* Bouton déconnexion */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 p-2 hover:bg-red-50 rounded-lg transition-colors group border border-red-200"
                  title="Déconnexion"
                >
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <span className="text-xs font-bold text-red-600">
                      {(companyData?.name || auth.currentUser?.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-red-600 group-hover:text-red-700">
                    Déconnexion
                  </span>
                </button>
              </div>
            </div>
            
            {/* Info utilisateur mobile */}
            <div className="mt-2 text-sm text-gray-500">
              <span className="hidden sm:inline">Connecté en tant que </span>
              <span className="font-medium text-gray-700">
                {auth.currentUser?.email?.split('@')[0] || 'Admin'}
              </span>
              <span className="mx-2">•</span>
              <span className="text-green-600 font-medium">
                ● En ligne
              </span>
            </div>
          </div>
          
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Actions Rapides - Nouveau */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="text-white">
                    <h3 className="text-lg sm:text-xl font-bold mb-1">⚡ Actions Rapides</h3>
                    <p className="text-blue-100 text-sm">Effectuez vos tâches courantes en 1-2 clics</p>
                  </div>
                  
                  {/* Boutons d'actions rapides */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowEmployeeModal(true)}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <Plus className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Employé</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("payslips")}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <CreditCard className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Fiche Paie</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <FileText className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Document</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("documents")}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <Edit className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Contrat</span>
                    </button>
                    
                    <button
                      onClick={() => setActiveTab("reports")}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <Download className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Export</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("requests-pro")}
                      className="flex flex-col items-center p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                    >
                      <FileText className="w-5 h-5 text-white mb-1" />
                      <span className="text-xs text-white font-medium">Demandes pro</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* En-tête avec indicateur temps réel - Responsive */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📊 Tableau de Bord</h2>
                    <p className="text-sm sm:text-base text-gray-600">Vue d'ensemble de votre entreprise</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs sm:text-sm text-gray-500 font-medium">DONNÉES TEMPS RÉEL</span>
                    </div>
                    <span className="text-xs text-gray-400 sm:ml-2">
                      {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistiques principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <Card 
                  className="bg-gradient-to-br from-blue-600 to-blue-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setActiveTab("employees")}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8" />
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        LIVE
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90">Employés Actifs</p>
                    <p className="text-xl sm:text-2xl font-bold mb-1">
                      {employees.filter(emp => emp.status === 'Actif').length}
                    </p>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="opacity-90">
                        Total: {employees.length}
                      </span>
                      <span className="bg-white/20 px-2 py-1 rounded">
                        {employees.length > 0 
                          ? `${Math.round((employees.filter(emp => emp.status === 'Actif').length / employees.length) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs opacity-75 flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Cliquez pour voir la liste
                    </div>
                  </div>
                </Card>

                <Card 
                  className="bg-gradient-to-br from-green-600 to-green-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setActiveTab("leaves")}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {leaveRequests.filter(req => req.status === 'En attente').length > 0 ? 'URGENT' : 'OK'}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90">Demandes de Congés</p>
                    <p className="text-xl sm:text-2xl font-bold mb-1">
                      {leaveRequests.filter(req => req.status === 'En attente').length}
                    </p>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="opacity-90">
                        En attente
                      </span>
                      <span className="bg-white/20 px-2 py-1 rounded">
                        Total: {leaveRequests.length}
                      </span>
                    </div>
                    <div className="mt-2 text-xs opacity-75 flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      Gérer les congés
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-600 to-yellow-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90">Absences ce mois</p>
                    <p className="text-xl sm:text-2xl font-bold mb-1">
                      {(() => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return employees.reduce((sum, emp) => {
                          const monthAbsences = emp.absences?.filter(abs => {
                            const absDate = new Date(abs.date);
                            return absDate.getMonth() === currentMonth && absDate.getFullYear() === currentYear;
                          }) || [];
                          return sum + monthAbsences.length;
                        }, 0);
                      })()}
                    </p>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="opacity-90">
                        Ce mois
                      </span>
                      <span className="bg-white/20 px-2 py-1 rounded">
                        {(() => {
                          const totalAbsences = employees.reduce((sum, emp) => sum + (emp.absences?.length || 0), 0);
                          return `Total: ${totalAbsences}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-purple-600 to-purple-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                      <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
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
                          const activeEmployees = employees.filter(emp => emp.status === 'Actif').length;
                          return activeEmployees > 0 ? `${Math.round((monthPayslips / activeEmployees) * 100)}%` : '0%';
                        })()}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm opacity-90">Fiches de Paie</p>
                    <p className="text-xl sm:text-2xl font-bold mb-1">
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
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="opacity-90">
                        Ce mois
                      </span>
                      <span className="bg-white/20 px-2 py-1 rounded">
                        Actifs: {employees.filter(emp => emp.status === 'Actif').length}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
              <Suspense fallback={<div className="p-4">Chargement des graphiquesâ€¦</div>}>
                <ChartsSection />
              </Suspense>
              
              {/* Métriques financières temps réel - Responsive */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                    <span className="hidden sm:inline">Indicateurs Financiers</span>
                    <span className="sm:hidden">💰 Finances</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">TEMPS RÉEL</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          TOTAL
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm opacity-90">Masse Salariale</p>
                      <p className="text-lg sm:text-xl font-bold mb-1">
                        {(() => {
                          const totalSalary = employees.reduce((sum, emp) => {
                            const salary = Number(emp.baseSalary);
                            return sum + (isNaN(salary) || salary <= 0 ? 0 : salary);
                          }, 0);
                          
                          console.log('Masse salariale totale:', totalSalary);
                          
                          return totalSalary >= 1000000 
                            ? `${(totalSalary / 1000000).toFixed(1)}M` 
                            : totalSalary.toLocaleString();
                        })()} FCFA
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-90">
                          {employees.length} employés
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          Brut
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-indigo-600 to-indigo-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105 border-2 border-indigo-300">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
                        <div className="text-xs bg-white/30 px-2 py-1 rounded-full font-semibold">
                          MOYENNE
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm opacity-90">Salaire Moyen</p>
                      <p className="text-xl sm:text-2xl font-bold mb-1">
                        {(() => {
                          const activeEmployees = employees.filter(emp => emp.status === 'Actif');
                          if (activeEmployees.length === 0) return '0';
                          
                          // Filtrer les employés avec des salaires valides et les convertir en nombres
                          const validSalaries = activeEmployees
                            .map(emp => {
                              const salary = Number(emp.baseSalary);
                              return isNaN(salary) || salary <= 0 ? 0 : salary;
                            })
                            .filter(salary => salary > 0);
                          
                          if (validSalaries.length === 0) return '0';
                          
                          const totalSalary = validSalaries.reduce((sum, salary) => sum + salary, 0);
                          const average = Math.round(totalSalary / validSalaries.length);
                          
                          // Debug: afficher les valeurs pour vérifier
                          console.log('Salaires valides:', validSalaries);
                          console.log('Total:', totalSalary);
                          console.log('Moyenne:', average);
                          
                          return average.toLocaleString();
                        })()} FCFA
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-90">
                          Par employé actif
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {(() => {
                            const activeEmployees = employees.filter(emp => emp.status === 'Actif');
                            const totalSalary = activeEmployees.reduce((sum, emp) => sum + (emp.baseSalary || 0), 0);
                            const average = activeEmployees.length > 0 ? totalSalary / activeEmployees.length : 0;
                            const minSalary = Math.min(...activeEmployees.map(emp => emp.baseSalary || 0));
                            const maxSalary = Math.max(...activeEmployees.map(emp => emp.baseSalary || 0));
                            
                            if (activeEmployees.length === 0) return 'N/A';
                            if (average > (minSalary + maxSalary) / 2) return '↗️';
                            return '📊';
                          })()}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-600 to-cyan-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8" />
                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          MIN/MAX
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm opacity-90">Écart Salarial</p>
                      <div className="mb-1">
                        <p className="text-sm font-medium">
                          Min: {(() => {
                            const validSalaries = employees
                              .filter(emp => emp.status === 'Actif')
                              .map(emp => Number(emp.baseSalary))
                              .filter(salary => !isNaN(salary) && salary > 0);
                            
                            if (validSalaries.length === 0) return '0';
                            const minSalary = Math.min(...validSalaries);
                            return minSalary.toLocaleString();
                          })()} FCFA
                        </p>
                        <p className="text-sm font-medium">
                          Max: {(() => {
                            const validSalaries = employees
                              .filter(emp => emp.status === 'Actif')
                              .map(emp => Number(emp.baseSalary))
                              .filter(salary => !isNaN(salary) && salary > 0);
                            
                            if (validSalaries.length === 0) return '0';
                            const maxSalary = Math.max(...validSalaries);
                            return maxSalary.toLocaleString();
                          })()} FCFA
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-90">
                          Fourchette
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {(() => {
                            const validSalaries = employees
                              .filter(emp => emp.status === 'Actif')
                              .map(emp => Number(emp.baseSalary))
                              .filter(salary => !isNaN(salary) && salary > 0);
                            
                            if (validSalaries.length === 0) return '0x';
                            const minSalary = Math.min(...validSalaries);
                            const maxSalary = Math.max(...validSalaries);
                            const ratio = minSalary > 0 ? (maxSalary / minSalary).toFixed(1) : '∞';
                            return `${ratio}x`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-600 to-orange-400 text-white hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <Calendar className="w-6 h-6 sm:w-8 sm:h-8" />
                        <div className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {new Date().toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm opacity-90">Fiches ce Mois</p>
                      <p className="text-xl sm:text-2xl font-bold mb-1">
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
                      <div className="flex items-center justify-between text-xs">
                        <span className="opacity-90">
                          Générées ce mois
                        </span>
                        <span className="bg-white/20 px-2 py-1 rounded">
                          {(() => {
                            const activeEmployees = employees.filter(emp => emp.status === 'Actif').length;
                            const currentMonth = new Date().getMonth();
                            const currentYear = new Date().getFullYear();
                            const monthPayslips = employees.reduce((sum, emp) => {
                              const monthPays = emp.payslips?.filter(payslip => {
                                const payslipDate = new Date(payslip.generatedAt);
                                return payslipDate.getMonth() === currentMonth && payslipDate.getFullYear() === currentYear;
                              }) || [];
                              return sum + monthPays.length;
                            }, 0);
                            return activeEmployees > 0 ? `${Math.round((monthPayslips / activeEmployees) * 100)}%` : '0%';
                          })()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>
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

          {activeTab === "requests-pro" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Demandes Professionnelles</h1>
                <div>
                  <select
                    value={requestProFilter}
                    onChange={(e) => setRequestProFilter(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Tous">Tous les statuts</option>
                    <option value="En attente">En attente</option>
                    <option value="Approuvé">Approuvé</option>
                    <option value="Refusé">Refusé</option>
                    <option value="En cours">En cours de traitement</option>
                  </select>
                </div>
              </div>

              <Card>
                {professionalRequestsAdmin.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employé</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sujet</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pièces jointes</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {professionalRequestsAdmin.map((r) => (
                          <tr key={`${r.employeeId}_${r.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.createdAtDisplay}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.employeeName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{r.type}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{r.subject}</td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                r.status === "En attente"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : r.status === "Approuvé"
                                  ? "bg-green-100 text-green-800"
                                  : r.status === "Refusé"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                              {r.attachments?.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {r.attachments.map((f, idx) => (
                                    <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs underline">
                                      {f.name?.length > 18 ? `${f.name.slice(0,15)}...` : f.name}
                                    </a>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">Aucune PJ</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleProfessionalRequestAction(r.employeeId, r.id, "Approuvé")}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                                  disabled={actionLoading || r.status === "Approuvé"}
                                >
                                  <Check className="w-4 h-4" />
                                  Approuver
                                </Button>
                                <Button
                                  onClick={() => handleProfessionalRequestAction(r.employeeId, r.id, "Refusé")}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                  disabled={actionLoading || r.status === "Refusé"}
                                >
                                  <XCircle className="w-4 h-4" />
                                  Refuser
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="mx-auto h-12 w-12 text-gray-400">📭</div>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                    <p className="mt-1 text-sm text-gray-500">Aucune demande professionnelle à afficher.</p>
                  </div>
                )}
              </Card>
            </div>
          )}

{activeTab === "employees" && (
  <div className="space-y-6">
    {/* En-tête amélioré avec actions rapides */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">👥 Gestion des Employés</h1>
          <p className="text-gray-600">Gérez votre équipe efficacement</p>
        </div>
        
        {/* Actions rapides pour employés */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => setShowEmployeeModal(true)} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvel Employé</span>
            <span className="sm:hidden">Nouveau</span>
          </Button>
          
          <Button 
            onClick={() => setActiveTab("payslips")} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Fiche de Paie</span>
            <span className="sm:hidden">Paie</span>
          </Button>
          
          <Button 
            onClick={() => setActiveTab("reports")} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exporter</span>
            <span className="sm:hidden">Export</span>
          </Button>
          
          <Button 
            onClick={generateInternalEmailsForExistingEmployees}
            disabled={actionLoading}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Générer des emails internes pour les employés existants"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Créer Emails Internes</span>
            <span className="sm:hidden">Emails</span>
          </Button>
          
          <Button 
            onClick={updateExistingInternalEmails}
            disabled={actionLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mettre à jour les emails internes existants vers le nouveau format (nom@nomentreprise.com)"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Mettre à Jour Emails</span>
            <span className="sm:hidden">MàJ</span>
          </Button>
        </div>
      </div>
      
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{employees.length}</p>
          <p className="text-xs text-blue-600">Total</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{employees.filter(emp => emp.status === 'Actif').length}</p>
          <p className="text-xs text-green-600">Actifs</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{employees.filter(emp => emp.status === 'Inactif').length}</p>
          <p className="text-xs text-yellow-600">Inactifs</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-purple-600">{new Set(employees.map(emp => emp.department).filter(Boolean)).size}</p>
          <p className="text-xs text-purple-600">Départements</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-orange-600">{employees.filter(emp => !emp.internalEmail && emp.name).length}</p>
          <p className="text-xs text-orange-600">Sans Email Interne</p>
        </div>
      </div>
    </div>
    <Card>
      <div className="p-4 sm:p-6">
        {/* Barre de recherche et filtres améliorée */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, poste..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="name">Trier par Nom</option>
                  <option value="role">Trier par Rôle</option>
                  <option value="poste">Trier par Poste</option>
                  <option value="hireDate">Trier par Date</option>
                </select>
              </div>
              
              {/* Indicateur de résultats */}
              <div className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <span className="font-medium">{filteredEmployees.length}</span>
                <span className="ml-1">résultat{filteredEmployees.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
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
  setEmployeeDetailTab("info"); // Réinitialiser l'onglet
}}>
  {selectedEmployee && (
    <div className="space-y-4">
      {console.log('[DEBUG] Affichage modal employé:', selectedEmployee)}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Détails de l'Employé - {selectedEmployee.name || 'N/A'}</h2>
        <img
          src={selectedEmployee.profilePicture || "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff"}
          alt={selectedEmployee.name || "Employé"}
          className="w-16 h-16 rounded-full"
          onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff")}
        />
      </div>

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex space-x-4">
          <button
            onClick={() => setEmployeeDetailTab("info")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              employeeDetailTab === "info"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations
            </div>
          </button>
          <button
            onClick={() => setEmployeeDetailTab("credentials")}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              employeeDetailTab === "credentials"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Informations de connexion
            </div>
          </button>
        </nav>
      </div>

      {/* Contenu des onglets */}
      {employeeDetailTab === "info" && (
        <div className="space-y-3">
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
        </div>
      )}

      {employeeDetailTab === "credentials" && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              Informations de connexion
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email personnel (optionnel)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedEmployee.email || "Non renseigné"}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm"
                  />
                  {selectedEmployee.email && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEmployee.email || "");
                        toast.success("Email copié dans le presse-papiers !");
                      }}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copier l'email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email personnel de l'employé (peut être utilisé pour la connexion)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email interne de l'entreprise
                  {selectedEmployee.internalEmail ? (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      ✓ Actif
                    </span>
                  ) : (
                    <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      ⚠ Non généré
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedEmployee.internalEmail || "Aucun email interne généré"}
                    readOnly
                    className={`flex-1 p-3 border rounded-lg font-mono text-sm ${
                      selectedEmployee.internalEmail
                        ? "border-green-300 bg-green-50 text-gray-800"
                        : "border-gray-300 bg-gray-50 text-gray-500"
                    }`}
                  />
                  {selectedEmployee.internalEmail ? (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedEmployee.internalEmail || "");
                        toast.success("Email interne copié dans le presse-papiers !");
                      }}
                      className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Copier l'email interne"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!selectedEmployee?.id || !companyData?.id) {
                          toast.error("Erreur: Données manquantes.");
                          return;
                        }
                        // Générer un email interne pour cet employé spécifique
                        try {
                          const checkEmailExists = async (email) => {
                            try {
                              const clientsSnapshot = await getDocs(collection(db, "clients"));
                              for (const clientDoc of clientsSnapshot.docs) {
                                const employeeQuery = query(
                                  collection(db, "clients", clientDoc.id, "employees"),
                                  where("internalEmail", "==", email)
                                );
                                const employeeSnapshot = await getDocs(employeeQuery);
                                if (!employeeSnapshot.empty) {
                                  return true;
                                }
                              }
                              return false;
                            } catch (error) {
                              console.warn("Erreur lors de la vérification de l'email:", error);
                              return false;
                            }
                          };

                          let internalEmail = generateInternalEmail(
                            selectedEmployee.name,
                            companyData.email,
                            companyData.name
                          );
                          internalEmail = await generateUniqueInternalEmail(internalEmail, checkEmailExists);

                          const password = selectedEmployee.initialPassword || selectedEmployee.currentPassword || "123456";
                          let authUid = null;

                          try {
                            const userCredential = await createUserWithEmailAndPassword(auth, internalEmail, password);
                            authUid = userCredential.user.uid;
                          } catch (authError) {
                            if (authError.code !== 'auth/email-already-in-use') {
                              console.warn("Impossible de créer un compte Firebase Auth:", authError.message);
                            }
                          }

                          const updateData = { internalEmail };
                          if (authUid) updateData.authUid = authUid;

                          await svcUpdateEmployee(db, companyData.id, selectedEmployee.id, updateData);
                          
                          // Mettre à jour localement
                          const updatedEmployees = employees.map(emp => 
                            emp.id === selectedEmployee.id 
                              ? { ...emp, internalEmail, authUid: authUid || emp.authUid }
                              : emp
                          );
                          setEmployees(updatedEmployees);
                          setSelectedEmployee({ ...selectedEmployee, internalEmail, authUid: authUid || selectedEmployee.authUid });
                          
                          toast.success(`Email interne généré : ${internalEmail}`);
                        } catch (error) {
                          console.error("Erreur lors de la génération de l'email interne:", error);
                          toast.error(`Erreur : ${error.message}`);
                        }
                      }}
                      className="p-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      title="Générer un email interne"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedEmployee.internalEmail 
                    ? "Email interne généré automatiquement. L'employé peut se connecter avec cet email ou son email personnel."
                    : "Cliquez sur le bouton pour générer un email interne pour cet employé."}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe actuel
                  {selectedEmployee.passwordChanged ? (
                    <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      (Mot de passe modifié par l'employé)
                    </span>
                  ) : (
                    <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      (Mot de passe initial actif)
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedEmployee.currentPassword || selectedEmployee.initialPassword || "123456"}
                    readOnly
                    className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-800 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const password = selectedEmployee.currentPassword || selectedEmployee.initialPassword || "123456";
                      navigator.clipboard.writeText(password);
                      toast.success("Mot de passe copié dans le presse-papiers !");
                    }}
                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Copier le mot de passe"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {selectedEmployee.passwordChanged 
                    ? "✓ Ce mot de passe a été modifié par l'employé depuis son espace personnel."
                    : "⚠️ Ce mot de passe est le mot de passe initial. L'employé peut le modifier depuis son espace."}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 mb-1">Note importante</p>
                    <p className="text-xs text-yellow-700">
                      L'employé peut modifier son mot de passe depuis son espace personnel. 
                      Une fois modifié, ce mot de passe initial ne sera plus valide.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section réinitialisation du mot de passe par l'admin */}
              <div className="border-t border-blue-200 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Réinitialiser le mot de passe</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs text-red-700 mb-3">
                    Vous pouvez réinitialiser le mot de passe de cet employé. Le nouveau mot de passe sera défini sur "123456" par défaut.
                  </p>
                  <Button
                    onClick={async () => {
                      if (!selectedEmployee?.id || !companyData?.id) {
                        toast.error("Erreur: Données manquantes.");
                        return;
                      }

                      if (!window.confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${selectedEmployee.name} ? Le nouveau mot de passe sera "123456".`)) {
                        return;
                      }

                      try {
                        setActionLoading(true);
                        const employeeRef = doc(db, "clients", companyData.id, "employees", selectedEmployee.id);
                        await updateDoc(employeeRef, {
                          currentPassword: "123456",
                          initialPassword: "123456",
                          passwordChanged: false,
                        });

                        // Mettre à jour l'état local
                        setSelectedEmployee((prev) => ({
                          ...prev,
                          currentPassword: "123456",
                          initialPassword: "123456",
                          passwordChanged: false,
                        }));

                        // Mettre à jour la liste des employés
                        setEmployees((prev) =>
                          prev.map((emp) =>
                            emp.id === selectedEmployee.id
                              ? { ...emp, currentPassword: "123456", initialPassword: "123456", passwordChanged: false }
                              : emp
                          )
                        );

                        toast.success("Mot de passe réinitialisé avec succès ! Le nouveau mot de passe est '123456'.");
                      } catch (error) {
                        console.error("Erreur réinitialisation mot de passe:", error);
                        toast.error("Erreur lors de la réinitialisation: " + error.message);
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    icon={RefreshCw}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {actionLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 pt-4 border-t border-gray-200">
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
            onClick={async () => {
              console.log('[Export unifié] Bouton Exporter PDF cliqué');
              if (!selectedEmployee || !selectedEmployee.contract) {
                alert('Aucun contrat ou employé sélectionné.');
                return;
              }
              
              const employerData = {
                name: companyData?.name || companyData?.companyName || "N/A",
                companyName: companyData?.name || companyData?.companyName || "N/A",
                address: companyData?.address || "N/A",
                taxpayerNumber: companyData?.taxpayerNumber || "N/A",
                cnpsNumber: companyData?.cnpsNumber || "N/A",
                representant: companyData?.representant || "N/A",
                id: companyData?.id || "",
              };
              
              // Utiliser la fonction d'export unifiée
              await exportContractPDF(selectedEmployee, employerData, selectedEmployee.contract);
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
              {/* ⚡ EN-TÊTE OPTIMISÉ AVEC ACTIONS RAPIDES */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">💰 Gestion de la Paie Optimisée</h1>
          <p className="text-green-100 text-sm sm:text-base">
            Traitement automatique et parallèle • Détection d'anomalies • Batch Firestore
          </p>
        </div>
        
        {/* Statistiques temps réel */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-white">
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
            <p className="text-lg sm:text-xl font-bold">{employees.filter(emp => emp.status === 'Actif').length}</p>
            <p className="text-xs text-green-100">Employés Actifs</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm">
            <p className="text-lg sm:text-xl font-bold">
              {employees.reduce((sum, emp) => sum + (emp.payslips?.length || 0), 0)}
            </p>
            <p className="text-xs text-green-100">Fiches Générées</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center backdrop-blur-sm col-span-2 sm:col-span-1">
            <p className="text-lg sm:text-xl font-bold">
              {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-green-100">Période Courante</p>
          </div>
        </div>
      </div>
    </div>

    {/* ⚡ ACTIONS RAPIDES OPTIMISÉES */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Actions Rapides</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lancer Paie Mensuelle */}
        <button
          onClick={launchMonthlyPayroll}
          disabled={actionLoading || employees.filter(emp => emp.status === 'Actif').length === 0}
          className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <CreditCard className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-center">Lancer Paie du Mois</span>
          <span className="text-xs text-blue-100 mt-1">
            {employees.filter(emp => emp.status === 'Actif').length} employés
          </span>
        </button>

        {/* Vérifier Anomalies */}
        <button
          onClick={checkPayrollAnomalies}
          disabled={actionLoading}
          className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-center">Vérifier Anomalies</span>
          <span className="text-xs text-yellow-100 mt-1">Contrôle qualité</span>
        </button>

        {/* Générer tous les PDF */}
        <button
          onClick={generateAllPayslipsPDF}
          disabled={actionLoading || employees.filter(emp => emp.payslips?.length > 0).length === 0}
          className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Download className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-center">Générer tous PDF</span>
          <span className="text-xs text-purple-100 mt-1">Traitement parallèle</span>
        </button>

        {/* Fiche Individuelle */}
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowPaySlipForm(true);
            setPaySlipData(null);
          }}
          disabled={actionLoading}
          className="flex flex-col items-center p-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm text-center">Fiche Individuelle</span>
          <span className="text-xs text-green-100 mt-1">Mode classique</span>
        </button>
      </div>

      {/* Barre de progression si traitement en cours */}
      {actionLoading && (
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Traitement en cours...</span>
            <span className="text-sm text-blue-600">⚡ Mode parallèle</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Calculs automatiques • Détection anomalies • Sauvegarde batch
          </p>
        </div>
      )}
    </div>

    {/* ⚡ TABLEAU OPTIMISÉ DES FICHES */}
    <Card>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📋 Fiches de Paie</h3>
            <p className="text-sm text-gray-600">
              {employees.reduce((sum, emp) => sum + (emp.payslips?.length || 0), 0)} fiche(s) • 
              Template: <span className="font-medium text-blue-600">{selectedPaySlipTemplate}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowTemplateSelector(true)}
              icon={Settings}
              className="bg-gray-600 hover:bg-gray-700 text-white"
              size="sm"
            >
              Modèles
            </Button>
          </div>
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
                  (emp.payslips || []).map((payslip, index) => (
                    <tr key={payslip.id || `${emp.id}_${index}`} className="border-b border-blue-100 hover:bg-blue-50">
                      <td className="py-4 px-4">{payslip.employee?.name || payslip.employeeName || emp.name || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.employee?.matricule || payslip.matricule || emp.matricule || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.employee?.poste || emp.poste || emp.professionalCategory || "N/A"}</td>
                      <td className="py-4 px-4">{payslip.payPeriod || (payslip.year && payslip.month ? `${payslip.year}-${String(payslip.month).padStart(2,'0')}` : "N/A")}</td>
                        <td className="py-4 px-4">
                        {(() => {
                          try {
                            const calc = computeCompletePayroll(payslip || {});
                            return formatCFA(calc.netPay || 0);
                          } catch {
                            const fallbackNet = payslip?.netPay ?? payslip?.net ?? 0;
                            return formatCFA(Number(fallbackNet) || 0);
                          }
                        })()}
                      </td>
                        <td className="py-4 px-4 flex gap-2">
                          <Button
                            size="sm"
                            icon={Eye}
                            onClick={() => {
                              showPaySlipDetailsModal(payslip, payslip.employee || emp);
                            }}
                          disabled={false}
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
                          disabled={false}
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            icon={Trash}
                            onClick={() => {
                            if (window.confirm(`Voulez-vous vraiment supprimer la fiche de paie pour ${payslip.employee?.name || payslip.employeeName || emp.name || "N/A"} (${payslip.payPeriod || (payslip.year && payslip.month ? `${payslip.year}-${String(payslip.month).padStart(2,'0')}` : 'N/A')}) ?`)) {
                              deletePaySlip(emp.id, payslip.id, index);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={false}
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
                        onClick={() => {
                          const period = payslip.payPeriod || (payslip.year && payslip.month ? `${payslip.year}-${String(payslip.month).padStart(2,'0')}` : 'N/A');
                          const name = selectedEmployee?.name || payslip.employeeName || 'N/A';
                          if (window.confirm(`Supprimer la fiche de paie de ${name} (${period}) ?`)) {
                            deletePaySlip(selectedEmployee.id, payslip.id, index);
                          }
                        }}
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
                      {companyData.taxpayerNumber && !/^[PM][A-Za-z0-9]{11,12}[A-Za-z]$/.test((companyData.taxpayerNumber || '').replace(/\s+/g, '')) && (
                        <div className="text-red-600 text-xs mt-1">Format invalide. Doit commencer par P ou M, contenir 11 à 12 caractères alphanumériques, et se terminer par une lettre (ex: M0A060000123K).</div>
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
              
              {/* Migration des employés existants */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Migration des données
                  </h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Mise à jour des informations de connexion</strong>
                      </p>
                      <p className="text-xs text-gray-600 mb-4">
                        Cette fonction met à jour tous les employés existants pour ajouter les champs de mot de passe initial. 
                        Les employés qui n'ont pas encore ces champs recevront le mot de passe par défaut "123456".
                      </p>
                      <Button
                        onClick={async () => {
                          if (!companyData?.id) {
                            toast.error("Erreur: ID de l'entreprise manquant.");
                            return;
                          }
                          
                          try {
                            setActionLoading(true);
                            let updatedCount = 0;
                            let skippedCount = 0;
                            
                            // Récupérer tous les employés
                            const employeesRef = collection(db, "clients", companyData.id, "employees");
                            const employeesSnapshot = await getDocs(employeesRef);
                            
                            if (employeesSnapshot.empty) {
                              toast.info("Aucun employé à mettre à jour.");
                              setActionLoading(false);
                              return;
                            }
                            
                            // Mettre à jour chaque employé qui n'a pas encore initialPassword
                            let batch = writeBatch(db);
                            let batchCount = 0;
                            
                            for (const docSnap of employeesSnapshot.docs) {
                              const employeeData = docSnap.data();
                              
                              // Vérifier si l'employé a déjà initialPassword
                              if (!employeeData.hasOwnProperty('initialPassword')) {
                                const employeeRef = doc(db, "clients", companyData.id, "employees", docSnap.id);
                                batch.update(employeeRef, {
                                  initialPassword: "123456",
                                  currentPassword: employeeData.currentPassword || "123456",
                                  passwordChanged: employeeData.passwordChanged !== undefined ? employeeData.passwordChanged : false
                                });
                                batchCount++;
                                updatedCount++;
                                
                                // Firestore limite les batches à 500 opérations
                                if (batchCount >= 500) {
                                  await batch.commit();
                                  batch = writeBatch(db); // Créer un nouveau batch
                                  batchCount = 0;
                                }
                              } else {
                                skippedCount++;
                              }
                            }
                            
                            // Commit le reste des mises à jour
                            if (batchCount > 0) {
                              await batch.commit();
                            }
                            
                            // Mettre à jour l'état local
                            const updatedEmployees = employees.map(emp => {
                              if (!emp.hasOwnProperty('initialPassword')) {
                                return {
                                  ...emp,
                                  initialPassword: "123456",
                                  currentPassword: emp.currentPassword || "123456",
                                  passwordChanged: false
                                };
                              }
                              return emp;
                            });
                            setEmployees(updatedEmployees);
                            
                            toast.success(
                              `Migration terminée ! ${updatedCount} employé(s) mis à jour, ${skippedCount} déjà à jour.`
                            );
                          } catch (error) {
                            console.error("Erreur migration employés:", error);
                            toast.error(`Erreur lors de la migration: ${error.message}`);
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        disabled={actionLoading}
                        icon={RefreshCw}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {actionLoading ? "Migration en cours..." : "Mettre à jour les employés existants"}
                      </Button>
                    </div>
                  </div>
                </div>
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
          {activeTab === "documents" && companyData?.id && (
            <div className="space-y-6">
              {/* Section Documents RH unifiée */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">📄 Documents des Employés</h2>
                    <p className="text-sm text-gray-600">Tous les documents RH : contrats, offres, attestations, certificats</p>
                  </div>
                </div>
                
                {/* DocumentsManager unifié */}
                <DocumentsManager 
                  companyId={companyData.id} 
                  userRole="admin" 
                  companyData={companyData} 
                  employees={employees}
                />
              </div>

              {/* Section Gestion des Contrats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">📋 Gestion des Contrats</h2>
                    <p className="text-sm text-gray-600">Modifications de contrats et procédures de licenciement</p>
                  </div>
                </div>
                
                <ContractManagementPage
                  employees={employees}
                  onEmployeeUpdate={(employeeId, updatedEmployee) => {
                    setEmployees(prev => prev.map(emp => 
                      emp.id === employeeId ? updatedEmployee : emp
                    ));
                  }}
                />
              </div>
            </div>
          )}
          {activeTab === "hr-procedures" && (
            <HRProceduresPage
              companyData={companyData}
              employees={employees}
              setEmployees={setEmployees}
              actionLoading={actionLoading}
              setActionLoading={setActionLoading}
            />
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
      
      {/* Bouton d'actions rapides flottant - Mobile uniquement */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden">
        <div className="relative">
          {/* Menu d'actions rapides */}
          {showQuickActions && (
            <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 min-w-[200px]">
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowEmployeeModal(true);
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Nouvel Employé</span>
                </button>

                <button
                  onClick={() => {
                    setShowImportWizard(true);
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Import CSV</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("payslips");
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Fiche de Paie</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Nouveau Document</span>
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab("documents");
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Edit className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Nouveau Contrat</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Bouton principal */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 active:scale-95"
          >
            {showQuickActions ? (
              <X className="w-6 h-6" />
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* WIZARD D'IMPORT D'EMPLOYÉS */}
      <Modal 
        isOpen={showImportWizard} 
        onClose={() => {
          setShowImportWizard(false);
          setImportStep(1);
          setImportFile(null);
          setImportData([]);
          setImportHeaders([]);
          setColumnMapping({});
          setImportProgress({ current: 0, total: 0, step: '' });
          setImportResults({ success: [], errors: [] });
        }}
        className="max-w-4xl"
      >
        <div className="p-6">
          {/* En-tête simplifié */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import d'Employés</h2>
              <p className="text-sm text-gray-500">Étape {importStep} sur 5</p>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    step <= importStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Étape 1: Upload du fichier */}
          {importStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Fichier CSV</h3>
                <p className="text-gray-600 text-sm">
                  Format attendu : Nom, Matricule, CNPS, Salaire, Poste
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      try {
                        setImportFile(file);
                        const { headers, data } = await parseCSVFile(file);
                        setImportHeaders(headers);
                        setImportData(data);
                        setColumnMapping(getAutoMapping(headers));
                        toast.success(`${data.length} lignes détectées`);
                      } catch (error) {
                        toast.error(error.message);
                      }
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="font-medium text-gray-700 mb-1">
                    {importFile ? importFile.name : 'Sélectionner un fichier CSV'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {importFile ? `${importData.length} lignes` : 'Glisser-déposer ou cliquer'}
                  </p>
                </label>
              </div>

              {importFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Colonnes : {importHeaders.length}</p>
                  <div className="flex flex-wrap gap-1">
                    {importHeaders.slice(0, 6).map((header, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {header}
                      </span>
                    ))}
                    {importHeaders.length > 6 && (
                      <span className="px-2 py-1 text-blue-600 text-xs">+{importHeaders.length - 6}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button onClick={() => setShowImportWizard(false)} variant="outline">
                  Annuler
                </Button>
                <Button
                  onClick={() => setImportStep(2)}
                  disabled={!importFile || importData.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* Étape 2: Mapping des colonnes */}
          {importStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Correspondance des colonnes</h3>
                <p className="text-gray-600 text-sm">
                  Associez les colonnes de votre fichier aux champs employé
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'name', label: 'Nom complet', required: true },
                  { key: 'matricule', label: 'Matricule', required: true },
                  { key: 'cnpsNumber', label: 'Numéro CNPS', required: true },
                  { key: 'baseSalary', label: 'Salaire de base', required: true },
                  { key: 'poste', label: 'Poste/Fonction', required: false },
                  { key: 'department', label: 'Département', required: false },
                  { key: 'hireDate', label: 'Date d\'embauche', required: false },
                  { key: 'phone', label: 'Téléphone', required: false },
                  { key: 'email', label: 'Email', required: false },
                  { key: 'dateOfBirth', label: 'Date de naissance', required: false },
                  { key: 'lieuNaissance', label: 'Lieu de naissance', required: false }
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={columnMapping[field.key] || ''}
                      onChange={(e) => setColumnMapping(prev => ({
                        ...prev,
                        [field.key]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Sélectionner une colonne --</option>
                      {importHeaders.map((header, index) => (
                        <option key={index} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Aperçu simplifié */}
              {importData.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">Aperçu (3 premières lignes)</p>
                  <div className="space-y-2">
                    {importData.slice(0, 3).map((row, index) => (
                      <div key={index} className="text-xs text-blue-700 bg-blue-100 rounded p-2">
                        {columnMapping.name && row[columnMapping.name] && (
                          <span className="font-medium">{row[columnMapping.name]}</span>
                        )}
                        {columnMapping.matricule && row[columnMapping.matricule] && (
                          <span className="ml-2">• {row[columnMapping.matricule]}</span>
                        )}
                        {columnMapping.baseSalary && row[columnMapping.baseSalary] && (
                          <span className="ml-2">• {row[columnMapping.baseSalary]} FCFA</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={() => setImportStep(1)}
                  variant="outline"
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setImportStep(3)}
                  disabled={!columnMapping.name || !columnMapping.matricule || !columnMapping.cnpsNumber || !columnMapping.baseSalary}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {/* Étape 3: Validation */}
          {importStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Validation</h3>
                <p className="text-gray-600 text-sm">
                  Vérification avant création
                </p>
              </div>

              {(() => {
                const validationResults = importData.map((row, index) => {
                  const errors = validateEmployeeData(row, columnMapping);
                  return {
                    index,
                    row,
                    errors,
                    employee: transformRowToEmployee(row, columnMapping)
                  };
                });

                const validRows = validationResults.filter(r => r.errors.length === 0);
                const invalidRows = validationResults.filter(r => r.errors.length > 0);

                return (
                  <div className="space-y-4">
                    {/* Résumé simplifié */}
                    <div className="flex justify-center space-x-8">
                      <div className="text-center">
                        <div className="text-xl font-semibold text-gray-900">{importData.length}</div>
                        <div className="text-xs text-gray-600">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-green-600">{validRows.length}</div>
                        <div className="text-xs text-gray-600">Valides</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-semibold text-red-600">{invalidRows.length}</div>
                        <div className="text-xs text-gray-600">Erreurs</div>
                      </div>
                    </div>

                    {/* Erreurs détaillées */}
                    {invalidRows.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-3">Erreurs détectées :</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {invalidRows.map((result) => (
                            <div key={result.index} className="text-sm">
                              <span className="font-medium text-red-700">
                                Ligne {result.index + 2}: {result.row[columnMapping.name] || 'Nom manquant'}
                              </span>
                              <ul className="ml-4 text-red-600">
                                {result.errors.map((error, i) => (
                                  <li key={i}>• {error}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Options contrats */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="generate-contracts"
                          checked={generateContracts}
                          onChange={(e) => setGenerateContracts(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="generate-contracts" className="text-sm font-medium text-gray-700">
                          Générer les contrats PDF
                        </label>
                      </div>
                      
                      {generateContracts && (
                        <div className="mt-3">
                          <select
                            value={contractTemplateForImport}
                            onChange={(e) => setContractTemplateForImport(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="contract1">Standard Cameroun</option>
                            <option value="amendment">Avenant</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Stockage des résultats pour l'étape suivante */}
                    <script
                      dangerouslySetInnerHTML={{
                        __html: `window.validationResults = ${JSON.stringify(validRows.map(r => r.employee))};`
                      }}
                    />
                  </div>
                );
              })()}

              <div className="flex justify-between">
                <Button
                  onClick={() => setImportStep(2)}
                  variant="outline"
                >
                  Précédent
                </Button>
                <Button
                  onClick={() => setImportStep(4)}
                  disabled={importData.filter((row) => validateEmployeeData(row, columnMapping).length === 0).length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Créer
                </Button>
              </div>
            </div>
          )}

          {/* Étape 4: Création des employés */}
          {importStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Création en cours</h3>
                <p className="text-gray-600 text-sm">
                  {importProgress.step || 'Traitement...'}
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progression</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: importProgress.total > 0 ? `${(importProgress.current / importProgress.total) * 100}%` : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Démarrage automatique de la création */}
              {(() => {
                React.useEffect(() => {
                  if (importStep === 4 && importResults.success.length === 0 && importResults.errors.length === 0) {
                    const validEmployees = importData
                      .filter((row) => validateEmployeeData(row, columnMapping).length === 0)
                      .map((row) => transformRowToEmployee(row, columnMapping));

                    if (validEmployees.length > 0) {
                      createEmployeesFromImport(validEmployees, setImportProgress)
                        .then((results) => {
                          setImportResults(results);
                          if (generateContracts && results.success.length > 0) {
                            setImportStep(5);
                          } else {
                            // Afficher les résultats finaux
                            toast.success(`${results.success.length} employé(s) créé(s) avec succès !`);
                            if (results.errors.length > 0) {
                              toast.warning(`${results.errors.length} erreur(s) lors de la création`);
                            }
                          }
                        })
                        .catch((error) => {
                          toast.error(`Erreur lors de la création : ${error.message}`);
                        });
                    }
                  }
                }, [importStep]);

                return null;
              })()}

              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          )}

          {/* Étape 5: Génération des contrats */}
          {importStep === 5 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Génération PDF</h3>
                <p className="text-gray-600 text-sm">
                  {importProgress.step || 'Création des contrats...'}
                </p>
              </div>

              {/* Barre de progression contrats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Contrats</span>
                  <span>{importProgress.current} / {importProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: importProgress.total > 0 ? `${(importProgress.current / importProgress.total) * 100}%` : '0%'
                    }}
                  />
                </div>
              </div>

              {/* Démarrage automatique de la génération de contrats */}
              {(() => {
                React.useEffect(() => {
                  if (importStep === 5 && importResults.success.length > 0) {
                    generateContractsForImportedEmployees(
                      importResults.success,
                      contractTemplateForImport,
                      setImportProgress
                    )
                      .then((contractResults) => {
                        toast.success(`${contractResults.success.length} contrat(s) généré(s) !`);
                        if (contractResults.errors.length > 0) {
                          toast.warning(`${contractResults.errors.length} erreur(s) de génération de contrats`);
                        }
                        
                        // Résumé final
                        const totalCreated = importResults.success.length;
                        const totalContracts = contractResults.success.length;
                        
                        toast.success(
                          `🎉 Import terminé !\n` +
                          `✅ ${totalCreated} employé(s) créé(s)\n` +
                          `📄 ${totalContracts} contrat(s) généré(s)`,
                          { autoClose: 10000 }
                        );
                      })
                      .catch((error) => {
                        toast.error(`Erreur génération contrats : ${error.message}`);
                      });
                  }
                }, [importStep, importResults]);

                return null;
              })()}

              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>

              <div className="text-center">
                <Button
                  onClick={() => {
                    setShowImportWizard(false);
                    // Reset du wizard
                    setImportStep(1);
                    setImportFile(null);
                    setImportData([]);
                    setImportHeaders([]);
                    setColumnMapping({});
                    setImportProgress({ current: 0, total: 0, step: '' });
                    setImportResults({ success: [], errors: [] });
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Terminer
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de choix de documents après création d'employé */}
      {showPostCreateModal && preparedDocuments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Créer un document</h3>
                <p className="text-sm text-gray-600">
                  Employé : {preparedDocuments.employee?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPostCreateModal(false);
                  setPreparedDocuments(null);
                  setSelectedDocumentType('contract');
                  setShowDocumentPreview(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {!showDocumentPreview ? (
                <>
                  {/* Choix du type de document */}
                  <div className="space-y-4 mb-6">
                    <h4 className="font-medium text-gray-800">Choisir le type de document :</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        onClick={() => setSelectedDocumentType('contract')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedDocumentType === 'contract'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedDocumentType === 'contract' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <FileText className={`w-5 h-5 ${
                              selectedDocumentType === 'contract' ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="text-left">
                            <h5 className="font-medium text-gray-900">Contrat de travail</h5>
                            <p className="text-sm text-gray-600">Document officiel d'embauche</p>
                          </div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setSelectedDocumentType('offer')}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          selectedDocumentType === 'offer'
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedDocumentType === 'offer' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Edit className={`w-5 h-5 ${
                              selectedDocumentType === 'offer' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="text-left">
                            <h5 className="font-medium text-gray-900">Lettre d'offre</h5>
                            <p className="text-sm text-gray-600">Proposition d'emploi</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setShowPostCreateModal(false);
                        setPreparedDocuments(null);
                        setSelectedDocumentType('contract');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                    >
                      Passer
                    </button>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowDocumentPreview(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Aperçu</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const docData = preparedDocuments[selectedDocumentType];
                            
                            // Sauvegarder le document dans Firestore
                            await addDoc(collection(db, 'documents'), {
                              ...docData,
                              companyId: companyData.id,
                              createdAt: new Date(),
                              updatedAt: new Date()
                            });
                            
                            // Générer le PDF
                            if (selectedDocumentType === 'contract') {
                              const { exportDocumentContract } = await import('../utils/exportContractPDF');
                              exportDocumentContract(docData);
                            } else {
                              const { generateOfferLetterPDF } = await import('../utils/pdfTemplates/offerTemplateCameroon');
                              const offerOptions = {
                                version: docData.templateVersion || 'v2'
                              };
                              generateOfferLetterPDF(docData, offerOptions);
                            }
                            
                            toast.success(`${selectedDocumentType === 'contract' ? 'Contrat' : 'Lettre d\'offre'} créé et téléchargé !`);
                            setShowPostCreateModal(false);
                            setPreparedDocuments(null);
                            setSelectedDocumentType('contract');
                          } catch (error) {
                            console.error('Erreur création document:', error);
                            toast.error('Erreur lors de la création du document');
                          }
                        }}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Créer & Télécharger</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Prévisualisation du document */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-800">
                        Aperçu - {selectedDocumentType === 'contract' ? 'Contrat de travail' : 'Lettre d\'offre'}
                      </h4>
                      <button
                        onClick={() => setShowDocumentPreview(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {Object.entries(preparedDocuments[selectedDocumentType]).map(([key, value]) => {
                          if (key === 'type' || key === 'companyId') return null;
                          return (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                              </span>
                              <span className="text-gray-800">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setShowDocumentPreview(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        Retour
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const docData = preparedDocuments[selectedDocumentType];
                            
                            // Sauvegarder le document dans Firestore
                            await addDoc(collection(db, 'documents'), {
                              ...docData,
                              companyId: companyData.id,
                              createdAt: new Date(),
                              updatedAt: new Date()
                            });
                            
                            // Générer le PDF
                            if (selectedDocumentType === 'contract') {
                              const { exportDocumentContract } = await import('../utils/exportContractPDF');
                              exportDocumentContract(docData);
                            } else {
                              const { generateOfferLetterPDF } = await import('../utils/pdfTemplates/offerTemplateCameroon');
                              const offerOptions = {
                                version: docData.templateVersion || 'v2'
                              };
                              generateOfferLetterPDF(docData, offerOptions);
                            }
                            
                            toast.success(`${selectedDocumentType === 'contract' ? 'Contrat' : 'Lettre d\'offre'} créé et téléchargé !`);
                            setShowPostCreateModal(false);
                            setPreparedDocuments(null);
                            setSelectedDocumentType('contract');
                            setShowDocumentPreview(false);
                          } catch (error) {
                            console.error('Erreur création document:', error);
                            toast.error('Erreur lors de la création du document');
                          }
                        }}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all"
                      >
                        <Download className="h-4 w-4" />
                        <span>Générer PDF</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
