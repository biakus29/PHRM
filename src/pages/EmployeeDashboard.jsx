import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLogOut, FiCalendar, FiFileText, FiAlertTriangle, FiCheck, FiBell, FiClock, FiEdit, FiDownload, FiEye, FiHome, FiUpload, FiX, FiUser, FiLock } from "react-icons/fi";
import "../styles/sidebar.css";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { exportToCSV } from "../utils/fileIO";
import { buildCommonOptions } from "../utils/chartConfig";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import ExportPaySlip from '../compoments/ExportPaySlip';
import { exportContractPDF } from '../utils/exportContractPDF';
import { createRoot } from 'react-dom/client';
import { displayDate, displayDateWithOptions, displayGeneratedAt, displayContractStartDate } from "../utils/displayUtils";
import { computeEffectiveDeductions, computeRoundedDeductions, computeNetPay, formatCFA, computeCompletePayroll } from "../utils/payrollCalculations";
import EmployeeMobileFooterNav from "../components/EmployeeMobileFooterNav";
import { useDemo } from "../contexts/DemoContext";

// Configurer pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EmployeeDashboard = () => {
  const { isDemoAccount } = useDemo?.() || { isDemoAccount: false };
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [leaveDays, setLeaveDays] = useState(1);
  const [leaveError, setLeaveError] = useState("");
  const [overtimeHours, setOvertimeHours] = useState(1);
  const [overtimeError, setOvertimeError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPoste, setNewPoste] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [sortByPaySlips, setSortByPaySlips] = useState("date");
  const [sortOrderPaySlips, setSortOrderPaySlips] = useState("desc");
  const [yearFilter, setYearFilter] = useState("Tous");
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const itemsPerPage = 10;
  const [sortBy, setSortBy] = useState("date");
  const [statusFilter, setStatusFilter] = useState("Tous");

  const navigate = useNavigate();
  const location = useLocation();
  const { clientId, employeeId, email } = location.state || {};

  // Load employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!clientId || !employeeId || !email) {
        setErrorMessage("Données manquantes. Veuillez vous reconnecter.");
        toast.error("Données manquantes. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      try {
        console.log("Chargement des données pour clientId:", clientId, "employeeId:", employeeId);
        const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
        const employeeSnap = await getDoc(employeeRef);
        if (employeeSnap.exists()) {
          const data = employeeSnap.data();
          if (data.email !== email) {
            setErrorMessage("Email invalide. Veuillez vous reconnecter.");
            toast.error("Email invalide. Veuillez vous reconnecter.");
            setLoading(false);
            return;
          }
          // Patch: garantir la présence de leaves
          setEmployeeData({
            id: employeeSnap.id,
            ...data,
            leaves: data.leaves || { balance: 25, requests: [], history: [] },
          });
          setNewName(data.name || "");
          setNewPoste(data.poste || "");
          setNewPhone(data.phone || "");
          setNewDepartment(data.department || "");
          console.log("Données employé chargées:", data);
        } else {
          setErrorMessage("Données employé non trouvées.");
          toast.error("Données employé non trouvées.");
        }
      } catch (error) {
        console.error("Erreur chargement :", error.code, error.message);
        setErrorMessage("Erreur de chargement : " + error.message);
        toast.error("Erreur de chargement : " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, [clientId, employeeId, email]);

  // Validate leave requests
  useEffect(() => {
    if (!employeeData || !leaveDays) return;
    const days = Number(leaveDays);
    if (isNaN(days) || days <= 0) {
      setLeaveError("Veuillez entrer un nombre de jours valide.");
    } else if (days > employeeData.leaves.balance) {
      setLeaveError(`Vous ne pouvez pas demander plus de ${employeeData.leaves.balance} jour(s).`);
    } else {
      setLeaveError("");
    }
  }, [leaveDays, employeeData]);

  // Validate overtime requests
  useEffect(() => {
    if (!overtimeHours) return;
    const hours = Number(overtimeHours);
    if (isNaN(hours) || hours <= 0) {
      setOvertimeError("Veuillez entrer un nombre d'heures valide.");
    } else if (hours > 8) {
      setOvertimeError("Maximum 8 heures par demande.");
    } else {
      setOvertimeError("");
    }
  }, [overtimeHours]);

  // Request leave
  const requestLeave = async () => {
    if (!employeeData || leaveError || !leaveDays) {
      toast.error(leaveError || "Veuillez vérifier votre demande.");
      setErrorMessage(leaveError || "Veuillez vérifier votre demande.");
      return;
    }

    try {
      console.log("Demande de congé:", { days: leaveDays });
      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      const request = {
        date: new Date().toISOString(),
        days: Number(leaveDays),
        status: "En attente",
      };
      const updatedLeaves = {
        balance: employeeData.leaves.balance,
        requests: [...employeeData.leaves.requests, request],
        history: [...employeeData.leaves.history, request],
      };
      await updateDoc(employeeRef, { leaves: updatedLeaves });
      setEmployeeData((prev) => ({
        ...prev,
        leaves: updatedLeaves,
      }));
      setLeaveDays(1);
      toast.success("Demande de congé envoyée !");
      setErrorMessage("");
    } catch (error) {
      console.error("Erreur congé :", error.code, error.message);
      setErrorMessage("Erreur congé : " + error.message);
      toast.error("Erreur congé : " + error.message);
    }
  };

  // Request overtime
  const requestOvertime = async () => {
    if (overtimeError || !overtimeHours) {
      toast.error(overtimeError || "Veuillez vérifier votre demande.");
      setErrorMessage(overtimeError || "Veuillez vérifier votre demande.");
      return;
    }

    try {
      console.log("Demande d'heures sup:", { hours: overtimeHours });
      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      const request = {
        date: new Date().toISOString(),
        hours: Number(overtimeHours),
        status: "En attente",
      };
      const updatedOvertime = [...(employeeData.overtime || []), request];
      await updateDoc(employeeRef, { overtime: updatedOvertime });
      setEmployeeData((prev) => ({
        ...prev,
        overtime: updatedOvertime,
      }));
      setOvertimeHours(1);
      toast.success("Demande d'heures supplémentaires envoyée !");
      setErrorMessage("");
    } catch (error) {
      console.error("Erreur heures sup :", error.code, error.message);
      setErrorMessage("Erreur heures sup : " + error.message);
      toast.error("Erreur heures sup : " + error.message);
    }
  };

  // Handle photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image valide (JPG, PNG, etc.)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("L'image est trop volumineuse. Taille maximale : 2 Mo");
      return;
    }

    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Remove photo selection
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  // Upload photo - Stocker en base64 dans Firestore (comme les logos)
  const uploadPhoto = async (file) => {
    try {
      // Vérifier la taille du fichier (max 2 Mo pour base64)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("L'image est trop volumineuse. Taille maximale : 2 Mo");
      }

      // Convertir l'image en base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result;
          resolve(base64String);
        };
        reader.onerror = () => {
          reject(new Error("Erreur lors de la lecture du fichier"));
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error("Erreur upload photo:", error);
      throw new Error("Erreur lors de l'upload de la photo: " + error.message);
    }
  };

  // Update profile
  const updateProfile = async () => {
    if (!newName.trim() || !newPoste.trim()) {
      toast.error("Le nom et le poste sont requis.");
      return;
    }

    try {
      setUploadingPhoto(true);
      let profilePictureUrl = employeeData.profilePicture;

      // Upload photo if selected
      if (selectedPhoto) {
        profilePictureUrl = await uploadPhoto(selectedPhoto);
      }

      // If no photo and no existing photo, use avatar generator
      if (!profilePictureUrl) {
        profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=3B82F6&color=orange&bold=true`;
      }

      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      const updateData = {
        name: newName.trim(),
        poste: newPoste.trim(),
        phone: newPhone.trim() || null,
        department: newDepartment.trim() || null,
        profilePicture: profilePictureUrl,
      };

      await updateDoc(employeeRef, updateData);
      
      setEmployeeData((prev) => ({
        ...prev,
        ...updateData,
      }));
      
      setEditingProfile(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);
      toast.success("Profil mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur mise à jour profil :", error.message);
      toast.error("Erreur mise à jour profil : " + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Tous les champs sont requis.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");

      // Vérifier le mot de passe actuel
      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      const employeeSnap = await getDoc(employeeRef);
      
      if (!employeeSnap.exists()) {
        throw new Error("Employé non trouvé.");
      }

      const employeeData = employeeSnap.data();
      const actualCurrentPassword = employeeData.currentPassword || employeeData.initialPassword || "123456";

      if (currentPassword !== actualCurrentPassword) {
        setPasswordError("Mot de passe actuel incorrect.");
        setChangingPassword(false);
        return;
      }

      // Mettre à jour le mot de passe
      await updateDoc(employeeRef, {
        currentPassword: newPassword,
        passwordChanged: true,
      });

      // Mettre à jour l'état local
      setEmployeeData((prev) => ({
        ...prev,
        currentPassword: newPassword,
        passwordChanged: true,
      }));

      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      toast.success("Mot de passe modifié avec succès !");
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      setPasswordError("Erreur lors du changement de mot de passe: " + error.message);
      toast.error("Erreur lors du changement de mot de passe: " + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notifId) => {
    try {
      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      const updatedNotifications = employeeData.notifications.map((notif) =>
        notif.id === notifId ? { ...notif, read: true } : notif
      );
      await updateDoc(employeeRef, { notifications: updatedNotifications });
      setEmployeeData((prev) => ({
        ...prev,
        notifications: updatedNotifications,
      }));
      toast.success("Notification marquée comme lue.");
    } catch (error) {
      console.error("Erreur notification :", error.message);
      toast.error("Erreur notification : " + error.message);
    }
  };

  // Logout
  const handleLogout = () => {
    navigate("/employee-login");
    toast.info("Déconnexion réussie.");
  };

  // Leave history table data
  const leaveHistory = useMemo(() => {
    if (!employeeData || !employeeData.leaves?.history) return [];
    let history = employeeData.leaves.history.map((req, index) => ({
      id: index,
      date: displayDate(req.date),
      days: req.days,
      status: req.status,
    }));

    if (statusFilter !== "Tous") {
      history = history.filter((req) => req.status === statusFilter);
    }

    return history.sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      if (sortBy === "days") return b.days - a.days;
      return a.status.localeCompare(b.status);
    });
  }, [employeeData, sortBy, statusFilter]);

  // Export leave history to CSV
  const exportLeavesToCSV = () => {
    const rows = leaveHistory.map((req) => ({
      Date: req.date,
      Jours: req.days,
      Statut: req.status,
    }));
    exportToCSV(rows, `conges_${employeeData.name}.csv`);
    toast.success("Historique des congés exporté !");
  };

  // Pay slip history
  const paySlipHistory = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return [];

    let history = employeeData.payslips.map((slip, index) => {
      // Calculer le net avec computeCompletePayroll comme dans ClientAdminDashboard
      let netSalary = 0;
      try {
        const calc = computeCompletePayroll(slip);
        netSalary = calc.netPay || 0;
      } catch (error) {
        console.error("Erreur calcul fiche de paie:", error);
        netSalary = slip.netPay || slip.salaryDetails?.netSalary || 0;
      }
      
      return {
        ...slip, // Garder toutes les données originales
        id: index,
        year: new Date(slip.date || slip.generatedAt).getFullYear(),
        formattedDate: displayDateWithOptions(slip.date || slip.generatedAt, { month: "numeric", day: "numeric" }),
        netSalary: netSalary,
        grossSalary: slip.remuneration?.total || slip.salaryDetails?.grossSalary || 0,
        hoursPerMonth: slip.salaryDetails?.hoursPerMonth || "N/A",
      };
    });

    if (yearFilter !== "Tous") {
      history = history.filter((slip) => slip.year === Number(yearFilter));
    }

    history.sort((a, b) => {
      if (sortByPaySlips === "date") {
        const dateA = new Date(a.date || a.generatedAt).getTime();
        const dateB = new Date(b.date || b.generatedAt).getTime();
        return sortOrderPaySlips === "desc" ? dateB - dateA : dateA - dateB;
      }
      if (sortByPaySlips === "netSalary") {
        const salaryA = Number(a.netSalary) || 0;
        const salaryB = Number(b.netSalary) || 0;
        return sortOrderPaySlips === "desc" ? salaryB - salaryA : salaryA - salaryB;
      }
      return 0;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return history.slice(startIndex, startIndex + itemsPerPage);
  }, [employeeData, sortByPaySlips, sortOrderPaySlips, yearFilter, currentPage]);

  // Available years for filter
  const availableYears = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return [];
    const years = [...new Set(employeeData.payslips.map((slip) => new Date(slip.date || slip.generatedAt).getFullYear()))].sort((a, b) => b - a);
    return ["Tous", ...years];
  }, [employeeData]);

  // Total pages for pagination
  const totalPages = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return 1;
    const filteredCount =
      yearFilter === "Tous"
        ? employeeData.payslips.length
        : employeeData.payslips.filter((slip) => new Date(slip.date || slip.generatedAt).getFullYear() === Number(yearFilter)).length;
    return Math.ceil(filteredCount / itemsPerPage);
  }, [employeeData, yearFilter]);

  // Calculs centralisés pour la fiche sélectionnée - Utiliser computeCompletePayroll comme dans ClientAdminDashboard
  const selectedPayrollCalc = useMemo(() => {
    if (!selectedPaySlip) return null;
    return computeCompletePayroll(selectedPaySlip);
  }, [selectedPaySlip]);

  // Export payslips to CSV
  const exportPaySlipsToCSV = () => {
    // Récupérer toutes les fiches de paie (pas seulement celles de la page actuelle)
    const allPayslips = employeeData.payslips?.map((slip) => {
      let netSalary = 0;
      try {
        const calc = computeCompletePayroll(slip);
        netSalary = calc.netPay || 0;
      } catch (error) {
        netSalary = slip.netPay || slip.salaryDetails?.netSalary || 0;
      }
      
      return {
        Date: displayDateWithOptions(slip.date || slip.generatedAt, { month: "numeric", day: "numeric" }),
        Période: slip.payPeriod || 'N/A',
        "Salaire Net": formatCFA(netSalary),
        URL: slip.url || "Non disponible",
      };
    }) || [];
    
    exportToCSV(allPayslips, `fiches_paie_${employeeData.name}.csv`);
    toast.success("Historique des fiches de paie exporté !");
  };

  // Leave chart data
  const leaveChartData = useMemo(() => {
    if (!employeeData || !employeeData.leaves?.history) return null;
    const months = Array(12).fill(0);
    employeeData.leaves.history.forEach((req) => {
      const date = new Date(req.date);
      if (req.status === "Approuvé") {
        months[date.getMonth()] += req.days;
      }
    });

    return {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
      datasets: [
        {
          label: "Jours de congé pris",
          data: months,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [employeeData]);

  // Salary chart data
  const salaryChartData = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return null;
    const months = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    employeeData.payslips
      .filter((slip) => new Date(slip.date).getFullYear() === currentYear)
      .forEach((slip) => {
        const month = new Date(slip.date).getMonth();
        months[month] = Number(slip.salaryDetails?.netSalary) || 0;
      });

    return {
      labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"],
      datasets: [
        {
          label: "Salaire Net (FCFA)",
          data: months,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [employeeData]);

  // PDF document loaded handler
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!employeeData || errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-100 text-red-600 p-4 rounded-lg flex items-start gap-3 animate-fade-bounce">
          <FiAlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{errorMessage || "Aucune donnée disponible."}</p>
        </div>
      </div>
    );
  }

  // Sidebar navigation avec badges et descriptions
  const sidebarItems = [
    { 
      id: "dashboard", 
      label: "Accueil", 
      icon: FiHome, 
      description: "Tableau de bord",
      badge: null
    },
    { 
      id: "profile", 
      label: "Profil", 
      icon: FiEdit, 
      description: "Informations personnelles",
      badge: null
    },
    { 
      id: "leaves", 
      label: "Congés", 
      icon: FiCalendar, 
      description: "Gestion des congés",
      badge: employeeData?.leaves?.balance || 0
    },
    { 
      id: "payslips", 
      label: "Fiches de Paie", 
      icon: FiFileText, 
      description: "Historique des salaires",
      badge: employeeData?.payslips?.length || 0
    },
    { 
      id: "contract", 
      label: "Contrat", 
      icon: FiFileText, 
      description: "Contrat de travail",
      badge: employeeData?.contract ? "✓" : null
    },
    { 
      id: "overtime", 
      label: "Heures Sup", 
      icon: FiClock, 
      description: "Heures supplémentaires",
      badge: employeeData?.overtime?.length || 0
    },
    { 
      id: "notifications", 
      label: "Notifications", 
      icon: FiBell, 
      description: "Messages et alertes",
      badge: employeeData?.notifications?.filter(n => !n.read)?.length || 0
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Cachée sur mobile/tablette, visible uniquement sur desktop (lg et plus) */}
      <aside className="w-72 bg-gradient-to-b from-blue-50 to-white border-r border-blue-100 flex-shrink-0 hidden lg:block shadow-lg sidebar-scroll overflow-y-auto">
        {/* Header avec avatar et infos */}
        <div className="p-6 border-b border-blue-100 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={employeeData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name)}&background=3B82F6&color=white&bold=true`}
                alt={`Avatar de ${employeeData.name}`}
                className="w-12 h-12 rounded-full border-2 border-white shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full status-indicator"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">Mon Espace</h2>
              <p className="text-blue-100 text-sm truncate">{employeeData.name}</p>
              <p className="text-blue-200 text-xs truncate">{employeeData.poste}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-105 sidebar-item ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    activeTab === item.id 
                      ? "bg-white bg-opacity-20" 
                      : "bg-blue-100 group-hover:bg-blue-200"
                  }`}>
                    <item.icon className={`h-5 w-5 ${
                      activeTab === item.id ? "text-white" : "text-blue-600"
                    }`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${
                      activeTab === item.id ? "text-white" : "text-gray-900"
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-xs ${
                      activeTab === item.id ? "text-blue-100" : "text-gray-500"
                    }`}>
                      {item.description}
                    </p>
                  </div>
                </div>
                
                {/* Badge */}
                {item.badge && (
                  <div className={`px-2 py-1 rounded-full text-xs font-bold badge-glow ${
                    activeTab === item.id
                      ? "bg-white bg-opacity-20 text-white"
                      : "bg-blue-500 text-white"
                  }`}>
                    {item.badge}
                  </div>
                )}
              </div>
              
              {/* Indicateur actif */}
              {activeTab === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Section déconnexion */}
        <div className="mt-auto p-4 border-t border-blue-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-4 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200">
              <FiLogOut className="h-5 w-5" />
            </div>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>

        {/* Footer avec version */}
        <div className="p-4 border-t border-blue-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">PHRM v2.0</p>
            <p className="text-xs text-gray-400">© 2024 Tous droits réservés</p>
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-6 overflow-y-auto pb-24 lg:pb-6 animate-fade-in main-content-scroll">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <ReactTooltip id="tooltip" place="top" effect="solid" />
      
      {/* Mobile/Tablet Page Title - Caché sur desktop */}
      <div className="lg:hidden mb-4 pt-2 px-4">
        <h1 className="text-xl font-bold text-gray-900">
          {activeTab === "dashboard" && "Tableau de bord"}
          {activeTab === "leaves" && "Mes Congés"}
          {activeTab === "payslips" && "Mes Fiches de Paie"}
          {activeTab === "profile" && "Mon Profil"}
          {activeTab === "notifications" && "Notifications"}
          {activeTab === "contract" && "Mon Contrat"}
          {activeTab === "overtime" && "Heures Supplémentaires"}
        </h1>
      </div>

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
            <Card title="Résumé Congés">
              <p className="text-2xl font-bold text-blue-500">
                {employeeData.leaves.balance} jour(s) restant(s)
              </p>
              <Button
                onClick={() => setActiveTab("leaves")}
                className="mt-4"
                icon={FiCalendar}
              >
                Gérer les congés
              </Button>
            </Card>
            <Card title="Dernière Fiche de Paie">
              {employeeData.payslips?.length > 0 ? (
                <div className="flex items-center gap-2">
                  <a
                    href={employeeData.payslips[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {displayDateWithOptions(employeeData.payslips[0].date, { month: "numeric", day: "numeric" })}
                  </a>
                  <FiFileText className="h-5 w-5 text-blue-500" />
                </div>
              ) : (
                <p className="text-gray-600">Aucune fiche disponible.</p>
              )}
            </Card>
            <Card title="Notifications Récentes">
              {employeeData.notifications?.length > 0 ? (
                <ul className="space-y-2">
                  {employeeData.notifications.slice(0, 3).map((notif) => (
                    <li
                      key={notif.id}
                      className={`flex items-center gap-2 text-sm ${
                        notif.read ? "text-gray-500" : "text-gray-800"
                      }`}
                    >
                      <FiBell className="h-4 w-4 text-blue-500" />
                      <span>{notif.message}</span>
                      {!notif.read && (
                        <Button
                          onClick={() => markNotificationRead(notif.id)}
                          variant="ghost"
                          className="text-xs"
                        >
                          Marquer comme lu
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">Aucune notification disponible.</p>
              )}
            </Card>
          </div>
        )}

        {activeTab === "profile" && (
          <Card title="Mon Profil" className="animate-slide-in">
            {editingProfile ? (
              <div className="space-y-6">
                {/* Photo de profil */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <img
                      src={photoPreview || employeeData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name)}&background=3B82F6&color=orange&bold=true`}
                      alt="Photo de profil"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                    {photoPreview && (
                      <button
                        onClick={handleRemovePhoto}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                        title="Supprimer la photo"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                      <FiUpload className="w-4 h-4" />
                      {selectedPhoto ? "Changer la photo" : "Choisir une photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-xs text-gray-500">JPG, PNG (max 2 Mo)</p>
                  </div>
                </div>

                {/* Informations personnelles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poste <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newPoste}
                      onChange={(e) => setNewPoste(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="Votre poste"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="+237 6XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Département
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="Votre département"
                    />
                  </div>
                </div>

                {/* Informations non modifiables */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Informations non modifiables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium text-gray-800">{employeeData.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Matricule:</span>
                      <span className="ml-2 font-medium text-gray-800">{employeeData.matricule || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button 
                    onClick={updateProfile} 
                    icon={FiCheck}
                    disabled={uploadingPhoto}
                    className="flex-1"
                  >
                    {uploadingPhoto ? "Enregistrement..." : "Enregistrer les modifications"}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingProfile(false);
                      setSelectedPhoto(null);
                      setPhotoPreview(null);
                      // Réinitialiser les valeurs
                      setNewName(employeeData.name || "");
                      setNewPoste(employeeData.poste || "");
                      setNewPhone(employeeData.phone || "");
                      setNewDepartment(employeeData.department || "");
                    }}
                    variant="ghost"
                    icon={FiX}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative">
                    <img
                      src={employeeData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name)}&background=3B82F6&color=orange&bold=true`}
                      alt={`Avatar de ${employeeData.name}`}
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow-lg"
                    />
                    <div className="absolute bottom-0 right-0 bg-green-400 border-4 border-white rounded-full w-4 h-4"></div>
                  </div>
                  <div className="flex-1 w-full">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{employeeData.name}</h2>
                    <p className="text-lg text-gray-600 mb-2">{employeeData.poste}</p>
                    {employeeData.department && (
                      <p className="text-sm text-gray-500">{employeeData.department}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => setEditingProfile(true)}
                    icon={FiEdit}
                    className="mt-4 sm:mt-0"
                  >
                    Modifier mon profil
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-medium text-gray-800">
                      {employeeData.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Téléphone</p>
                    <p className="text-lg font-medium text-gray-800">
                      {employeeData.phone || "Non renseigné"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Matricule</p>
                    <p className="text-lg font-medium text-gray-800">
                      {employeeData.matricule || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Département</p>
                    <p className="text-lg font-medium text-gray-800">
                      {employeeData.department || "Non renseigné"}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <FiUser className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Photo pour le badge</p>
                      <p className="text-xs text-blue-700">
                        La photo que vous uploadez sera utilisée pour votre badge d'employé. 
                        Assurez-vous qu'elle soit claire et professionnelle.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section changement de mot de passe */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Sécurité</h3>
                      <p className="text-sm text-gray-600">Gérez votre mot de passe de connexion</p>
                    </div>
                    <Button
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      icon={showChangePassword ? FiX : FiLock}
                      variant={showChangePassword ? "ghost" : "primary"}
                    >
                      {showChangePassword ? "Annuler" : "Changer le mot de passe"}
                    </Button>
                  </div>

                  {showChangePassword && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mot de passe actuel <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => {
                            setCurrentPassword(e.target.value);
                            setPasswordError("");
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                          placeholder="Entrez votre mot de passe actuel"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nouveau mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            setPasswordError("");
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                          placeholder="Au moins 6 caractères"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setPasswordError("");
                          }}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
                          placeholder="Confirmez le nouveau mot de passe"
                        />
                      </div>

                      {passwordError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">{passwordError}</p>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <Button
                          onClick={handleChangePassword}
                          icon={FiCheck}
                          disabled={changingPassword}
                          className="flex-1"
                        >
                          {changingPassword ? "Modification..." : "Modifier le mot de passe"}
                        </Button>
                        <Button
                          onClick={() => {
                            setShowChangePassword(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setPasswordError("");
                          }}
                          variant="ghost"
                          icon={FiX}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === "leaves" && (
          <Card title="Gestion des Congés" className="animate-slide-in">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  Solde de congés
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {employeeData.leaves.balance} jours
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    value={leaveDays}
                    onChange={(e) => setLeaveDays(e.target.value)}
                    className={`w-full p-3 border ${
                      leaveError ? "border-red-400" : "border-gray-200"
                    } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500`}
                    placeholder="Nombre de jours"
                    aria-label="Nombre de jours de congé"
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Entrez le nombre de jours de congé souhaités"
                  />
                  {leaveError && (
                    <p className="text-red-500 text-sm mt-1">
                      {leaveError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={requestLeave}
                  disabled={!!leaveError || !leaveDays}
                  icon={FiCalendar}
                  aria-label="Demander un congé"
                >
                  Demander un congé
                </Button>
              </div>
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-700">
                    Historique des demandes
                  </h3>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-2 border border-gray-200 rounded-full bg-gray-100 text-gray-800"
                    >
                      <option>Tous</option>
                      <option>En attente</option>
                      <option>Approuvé</option>
                      <option>Refusé</option>
                    </select>
                    <Button onClick={exportLeavesToCSV} icon={FiDownload} variant="ghost">
                      Exporter CSV
                    </Button>
                  </div>
                </div>
                {leaveHistory.length > 0 ? (
                  <div className="overflow-x-auto hide-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th
                            onClick={() => setSortBy("date")}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                          >
                            Date {sortBy === "date" && "↓"}
                          </th>
                          <th
                            onClick={() => setSortBy("days")}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                          >
                            Jours {sortBy === "days" && "↓"}
                          </th>
                          <th
                            onClick={() => setSortBy("status")}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer"
                          >
                            Statut {sortBy === "status" && "↓"}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {leaveHistory.map((req) => (
                          <tr
                            key={req.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {req.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {req.days}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  req.status === "En attente"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : req.status === "Approuvé"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">
                    Aucune demande de congé.
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Statistiques des congés
                </h3>
                {leaveChartData && (
                  <div className="h-64">
                    <Line
                      data={leaveChartData}
                      options={buildCommonOptions({ title: "Congés pris par mois", xTitle: "Mois", yTitle: "Jours" })}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === "payslips" && (
          <Card title="Fiches de Paie" className="animate-slide-in">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-medium text-gray-700">Historique des fiches de paie</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {availableYears.length > 1 && (
                    <select
                      value={yearFilter}
                      onChange={(e) => {
                        setYearFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="p-2 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm"
                    >
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button onClick={exportPaySlipsToCSV} icon={FiDownload} variant="ghost">
                    Exporter CSV
                  </Button>
                </div>
              </div>
              {paySlipHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucune fiche de paie disponible.</p>
              ) : (
                <>
                  <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full table-auto">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Période</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Salaire Net</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paySlipHistory.map((slip) => (
                          <tr key={slip.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-800">{slip.formattedDate}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{slip.payPeriod || 'N/A'}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCFA(slip.netSalary || 0)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button onClick={() => setSelectedPaySlip(slip)} icon={FiEye} variant="ghost" className="text-xs">Voir</Button>
                                {slip.url ? (
                                  <a href={slip.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-sm">
                                    <FiDownload className="inline w-4 h-4 mr-1" />
                                    PDF
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-sm">PDF non dispo</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        variant="ghost"
                        className="text-sm"
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        variant="ghost"
                        className="text-sm"
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
              {/* Modale détails fiche de paie */}
        {selectedPaySlip && (
          <div className="fixed inset-0 bg-gray-900/80 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                      Détails de la fiche de paie - {selectedPaySlip.payPeriod || selectedPaySlip.formattedDate || selectedPaySlip.date || 'N/A'}
              </h3>
              <div className="space-y-6">
                      {/* Informations de l'employé */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">Informations de l'Employé</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Nom complet</p>
                            <p className="font-medium">{employeeData.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Matricule</p>
                            <p className="font-medium">{employeeData.matricule || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Poste</p>
                            <p className="font-medium">{employeeData.poste}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Département</p>
                            <p className="font-medium">{employeeData.department || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informations de la fiche de paie */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations de la Fiche de Paie</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Période</p>
                            <p className="font-medium">{selectedPaySlip.payPeriod || selectedPaySlip.formattedDate || selectedPaySlip.date || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date de génération</p>
                            <p className="font-medium">{displayGeneratedAt(selectedPaySlip.generatedAt)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Rémunération */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-900 mb-3">Rémunération</h3>
                        {selectedPayrollCalc ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Salaire de base</p>
                                <p className="font-medium text-lg">
                                  {selectedPaySlip.salaryDetails?.baseSalary?.toLocaleString()} XAF
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Jours travaillés</p>
                                <p className="font-medium">{selectedPaySlip.remuneration?.workedDays || 0} jours</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Heures supplémentaires</p>
                                <p className="font-medium">{selectedPaySlip.remuneration?.overtime?.toLocaleString() || 0} XAF</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">SBT (Taxable)</p>
                                <p className="font-medium text-lg text-green-700">
                                  {selectedPayrollCalc.sbt?.toLocaleString() || 0} XAF
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">SBC (Cotisable)</p>
                                <p className="font-medium text-lg text-green-700">
                                  {selectedPayrollCalc.sbc?.toLocaleString() || 0} XAF
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
                                        <td>{Number(prime.montant || prime.amount || 0).toLocaleString()} XAF</td>
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
                                        <td>{Number(ind.montant || ind.amount || 0).toLocaleString()} XAF</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500">Aucune indemnité</p>
                              )}
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-500">Calcul en cours...</p>
                        )}
                      </div>

                      {/* Déductions */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold text-red-900 mb-3">Déductions</h3>
                        {selectedPayrollCalc ? (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">PVID</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.pvid || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">IRPP</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.irpp || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">CAC</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.cac || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">CFC</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.cfc || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">RAV</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.rav || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">TDL</p>
                              <p className="font-medium">{formatCFA(selectedPayrollCalc.deductions?.tdl || 0)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total déductions</p>
                              <p className="font-medium text-lg text-red-700">
                                {formatCFA(selectedPayrollCalc.deductions?.total || selectedPayrollCalc.deductionsTotal || 0)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500">Calcul en cours...</p>
                        )}
                      </div>

                      {/* Net à payer */}
                      <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-purple-900 mb-2">NET À PAYER</h3>
                          <p className="text-3xl font-bold text-purple-700">
                            {formatCFA(selectedPayrollCalc?.netPay || 0)}
                          </p>
                        </div>
                      </div>
                      {/* Boutons d'action en bas */}
                      <div className="flex justify-center gap-4 mt-8">
                        <Button onClick={() => setSelectedPaySlip(null)} variant="outline">Fermer</Button>
                        <Button
                          onClick={() => {
                            // Export PDF fiche de paie
                            const employerData = {
                              companyName: employeeData.companyName || employeeData.employerName || 'N/A',
                              address: employeeData.companyAddress || 'N/A',
                              cnpsNumber: employeeData.companyCNPS || 'N/A',
                              id: employeeData.companyId || '',
                            };
                            const tempDiv = document.createElement('div');
                            tempDiv.style.display = 'none';
                            document.body.appendChild(tempDiv);
                            const root = createRoot(tempDiv);
                            root.render(
                              <ExportPaySlip
                                employee={employeeData}
                                employer={employerData}
                                salaryDetails={selectedPaySlip.salaryDetails}
                                remuneration={selectedPaySlip.remuneration}
                                deductions={selectedPayrollCalc?.deductions || selectedPaySlip.deductions}
                                payPeriod={selectedPaySlip.payPeriod}
                                generatedAt={selectedPaySlip.generatedAt}
                                primes={selectedPaySlip.primes}
                                indemnites={selectedPaySlip.indemnites}
                                template={selectedPaySlip.template}
                                auto
                                isDemoAccount={isDemoAccount}
                                onExported={() => {
                                  try {
                                    root.unmount();
                                    document.body.removeChild(tempDiv);
                                  } catch {}
                                }}
                              />
                            );
                          }}
                          variant="success"
                        >
                          Exporter PDF
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
              )}
            </Card>
          )}
          {activeTab === "contract" && (
            <Card title="Contrat de travail" className="animate-slide-in">
              {employeeData.contract ? (
                <div>
                  <p><strong>Type :</strong> {employeeData.contract.contractType || "N/A"}</p>
                  <p><strong>Date de début :</strong> {displayContractStartDate(employeeData.contract.startDate)}</p>
                  <p><strong>Salaire de base :</strong> {employeeData.contract.baseSalary ? `${employeeData.contract.baseSalary} FCFA` : "N/A"}</p>
                  <p><strong>Poste :</strong> {employeeData.contract.poste || employeeData.poste || "N/A"}</p>
                  {/* ... autres infos ... */}
                  {employeeData.contract.fileUrl && (
                    <a href={employeeData.contract.fileUrl} download className="text-blue-600 hover:underline mt-2 block">
                      Télécharger le contrat PDF
                  </a>
                )}
                <Button
                    onClick={() => {
                      // Export PDF contrat
                      const employerData = {
                        companyName: employeeData.companyName || employeeData.employerName || 'N/A',
                        address: employeeData.companyAddress || 'N/A',
                        cnpsNumber: employeeData.companyCNPS || 'N/A',
                        id: employeeData.companyId || '',
                      };
                      // Utiliser la fonction d'export unifiée
                      exportContractPDF(employeeData, employerData, employeeData.contract);
                    }}
                    variant="success"
                  >
                    Exporter PDF
                </Button>
              </div>
              ) : (
                <div>
                  <p className="text-gray-500">Aucun contrat trouvé.</p>
                  {/* Optionnel : bouton pour demander la création */}
          </div>
              )}
            </Card>
        )}

        {activeTab === "overtime" && (
          <Card title="Heures Supplémentaires" className="animate-slide-in">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value)}
                    className={`w-full p-3 border ${
                      overtimeError ? "border-red-400" : "border-gray-200"
                    } rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500`}
                    placeholder="Nombre d'heures"
                    aria-label="Nombre d'heures supplémentaires"
                    data-tooltip-id="tooltip"
                    data-tooltip-content="Entrez le nombre d'heures supplémentaires (max 8)"
                  />
                  {overtimeError && (
                    <p className="text-red-500 text-sm mt-1">
                      {overtimeError}
                    </p>
                  )}
                </div>
                <Button
                  onClick={requestOvertime}
                  disabled={!!overtimeError || !overtimeHours}
                  icon={FiClock}
                  aria-label="Demander des heures supplémentaires"
                >
                  Demander
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">
                  Historique des demandes
                </h3>
                {employeeData.overtime?.length > 0 ? (
                  <div className="overflow-x-auto hide-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Heures
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {employeeData.overtime.map((req, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {displayDate(req.date)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                              {req.hours}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  req.status === "En attente"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : req.status === "Approuvé"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm">
                    Aucune demande d'heures supplémentaires.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === "notifications" && (
          <Card title="Notifications" className="animate-slide-in">
            {employeeData.notifications?.length > 0 ? (
              <ul className="space-y-3">
                {employeeData.notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className={`p-4 rounded-lg ${
                      notif.read
                        ? "bg-gray-100"
                        : "bg-blue-50"
                    } flex justify-between items-center transition-colors`}
                  >
                    <div className="flex items-center gap-3">
                      <FiBell className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-800">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500">
                          {displayDateWithOptions(notif.date, { hour: "numeric", minute: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {!notif.read && (
                      <Button
                        onClick={() => markNotificationRead(notif.id)}
                        variant="ghost"
                        className="text-xs"
                      >
                        Marquer comme lu
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">
                Aucune notification.
              </p>
            )}
          </Card>
        )}
      </main>
      </div>
      
      {/* Mobile Footer Navigation */}
      <EmployeeMobileFooterNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        notificationCount={employeeData?.notifications?.filter(n => !n.read)?.length || 0}
        handleLogout={handleLogout}
      />
    </div>
  );
};

// Card Component
const Card = ({ children, title, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
  >
    {title && (
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-700">
          {title}
        </h3>
      </div>
    )}
    <div className="p-4 text-gray-600">{children}</div>
  </div>
);

// Button Component
const Button = ({
  children,
  onClick,
  variant = "primary",
  icon: Icon,
  className = "",
  disabled = false,
}) => {
  const variantClasses = {
    primary: `bg-blue-400 text-white hover:bg-blue-500`,
    danger: `bg-red-400 text-white hover:bg-red-500`,
    ghost: `text-gray-600 hover:bg-gray-200`,
    outline: `border-2 border-gray-300 text-gray-700 hover:bg-gray-50`,
    success: `bg-green-600 text-white hover:bg-green-700`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium flex items-center justify-center gap-2 px-4 py-2 transition-all hover:shadow-sm ${
        variantClasses[variant]
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      aria-disabled={disabled}
      data-tooltip-id="tooltip"
      data-tooltip-content={children}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

// Ajouter le footer mobile avant la fermeture du composant principal
// Note: Le footer doit être ajouté dans le return principal du EmployeeDashboard

export default EmployeeDashboard;