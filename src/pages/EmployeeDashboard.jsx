import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiLogOut, FiCalendar, FiFileText, FiAlertTriangle, FiCheck, FiBell, FiClock, FiEdit, FiDownload, FiEye, FiHome } from "react-icons/fi";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Tooltip as ReactTooltip } from "react-tooltip";
import Papa from "papaparse";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configurer pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const EmployeeDashboard = () => {
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
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);
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
          setNewName(data.name);
          setNewPoste(data.poste);
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

  // Update profile
  const updateProfile = async () => {
    if (!newName.trim() || !newPoste.trim()) {
      toast.error("Le nom et le poste sont requis.");
      return;
    }

    try {
      const employeeRef = doc(db, "clients", clientId, "employees", employeeId);
      await updateDoc(employeeRef, {
        name: newName,
        poste: newPoste,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=3B82F6&color=orange&bold=true`,
      });
      setEmployeeData((prev) => ({
        ...prev,
        name: newName,
        poste: newPoste,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newName)}&background=3B82F6&color=orange&bold=true`,
      }));
      setEditingProfile(false);
      toast.success("Profil mis à jour !");
    } catch (error) {
      console.error("Erreur mise à jour profil :", error.message);
      toast.error("Erreur mise à jour profil : " + error.message);
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
      date: new Date(req.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
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
    const csvData = leaveHistory.map((req) => ({
      Date: req.date,
      Jours: req.days,
      Statut: req.status,
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conges_${employeeData.name}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Historique des congés exporté !");
  };

  // Pay slip history
  const paySlipHistory = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return [];

    let history = employeeData.payslips.map((slip, index) => ({
      id: index,
      date: slip.date,
      year: new Date(slip.date).getFullYear(),
      formattedDate: new Date(slip.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      netSalary: slip.salaryDetails?.netSalary || "Non disponible",
      grossSalary: slip.salaryDetails?.grossSalary || "Non disponible",
      hoursPerMonth: slip.salaryDetails?.hoursPerMonth || "N/A",
      deductions: slip.deductions || {},
      overtimeHours: slip.overtimeHours || {},
      bonuses: slip.bonuses || {},
      benefits: slip.benefits || {},
      url: slip.url || null,
    }));

    if (yearFilter !== "Tous") {
      history = history.filter((slip) => slip.year === Number(yearFilter));
    }

    history.sort((a, b) => {
      if (sortByPaySlips === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
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
    const years = [...new Set(employeeData.payslips.map((slip) => new Date(slip.date).getFullYear()))].sort((a, b) => b - a);
    return ["Tous", ...years];
  }, [employeeData]);

  // Total pages for pagination
  const totalPages = useMemo(() => {
    if (!employeeData || !employeeData.payslips?.length) return 1;
    const filteredCount =
      yearFilter === "Tous"
        ? employeeData.payslips.length
        : employeeData.payslips.filter((slip) => new Date(slip.date).getFullYear() === Number(yearFilter)).length;
    return Math.ceil(filteredCount / itemsPerPage);
  }, [employeeData, yearFilter]);

  // Export payslips to CSV
  const exportPaySlipsToCSV = () => {
    const csvData = paySlipHistory.map((slip) => ({
      Date: slip.formattedDate,
      "Salaire Brut": slip.grossSalary,
      "Salaire Net": slip.netSalary,
      "Heures Travaillées": slip.hoursPerMonth,
      URL: slip.url || "Non disponible",
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fiches_paie_${employeeData.name}.csv`);
    link.click();
    URL.revokeObjectURL(url);
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

  // Sidebar navigation
  const sidebarItems = [
    { id: "dashboard", label: "Accueil", icon: FiHome },
    { id: "profile", label: "Profil", icon: FiEdit },
    { id: "leaves", label: "Congés", icon: FiCalendar },
    { id: "payslips", label: "Fiches de Paie", icon: FiFileText },
    { id: "contract", label: "Contrat", icon: FiFileText },
    { id: "overtime", label: "Heures Sup", icon: FiClock },
    { id: "notifications", label: "Notifications", icon: FiBell },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden md:block">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-blue-600">Mon Espace</h2>
          <p className="text-sm text-gray-500 mt-1">{employeeData.name}</p>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 pt-4 border-t border-gray-100">
            <Button
              onClick={handleLogout}
              variant="danger"
              icon={FiLogOut}
              className="w-full justify-start"
            >
              Déconnexion
            </Button>
          </div>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-100 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 capitalize">{sidebarItems.find(i => i.id === activeTab)?.label}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </span>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white font-semibold">
              {employeeData.name[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
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
                      {new Date(employeeData.payslips[0].date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
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
            <Card title="Profil" className="animate-slide-in">
              {editingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="Entrez votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Poste
                    </label>
                    <input
                      type="text"
                      value={newPoste}
                      onChange={(e) => setNewPoste(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-500"
                      placeholder="Entrez votre poste"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={updateProfile} icon={FiCheck}>
                      Enregistrer
                    </Button>
                    <Button
                      onClick={() => setEditingProfile(false)}
                      variant="ghost"
                      icon={FiAlertTriangle}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img
                    src={employeeData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(employeeData.name)}&background=3B82F6&color=orange&bold=true`}
                    alt={`Avatar de ${employeeData.name}`}
                    className="w-24 h-24 rounded-full shadow-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div>
                      <p className="text-sm text-gray-600">Nom</p>
                      <p className="text-lg font-medium text-gray-800">
                        {employeeData.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-lg font-medium text-gray-800">
                        {employeeData.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rôle</p>
                      <p className="text-lg font-medium text-gray-800">
                        {employeeData.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Poste</p>
                      <p className="text-lg font-medium text-gray-800">
                        {employeeData.poste}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditingProfile(true)}
                    icon={FiEdit}
                    className="mt-4 sm:mt-0"
                  >
                    Modifier
                  </Button>
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
                    <div className="overflow-x-auto">
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
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "top", labels: { color: "#4B5563" } },
                            title: { display: true, text: "Congés pris par mois", color: "#1F2937" },
                            tooltip: { mode: "index", intersect: false },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: { display: true, text: "Jours", color: "#4B5563" },
                              ticks: { color: "#4B5563" },
                              grid: { color: "#F3F4F6" },
                            },
                            x: {
                              title: { display: true, text: "Mois", color: "#4B5563" },
                              ticks: { color: "#4B5563" },
                              grid: { color: "#F3F4F6" },
                            },
                          },
                        }}
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
                  <Button onClick={exportPaySlipsToCSV} icon={FiDownload} variant="ghost">
                    Exporter CSV
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Salaire Net</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paySlipHistory.map((slip) => (
                        <tr key={slip.id}>
                          <td>{slip.formattedDate}</td>
                          <td>{slip.netSalary !== "Non disponible" ? `${slip.netSalary} FCFA` : "N/A"}</td>
                          <td>
                            <Button onClick={() => setSelectedPaySlip(slip)} icon={FiEye} variant="ghost">Voir</Button>
                            {slip.url ? (
                              <a href={slip.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 ml-2">Télécharger</a>
                            ) : (
                              <span className="text-gray-400 ml-2">PDF non dispo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination si besoin */}
              </div>
              {/* Modale détails fiche de paie */}
              {selectedPaySlip && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-medium text-gray-700 mb-4">
                      Détails de la fiche de paie - {selectedPaySlip.formattedDate || selectedPaySlip.payPeriod || ''}
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
                            <p className="font-medium">{selectedPaySlip.payPeriod || selectedPaySlip.formattedDate || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Date de génération</p>
                            <p className="font-medium">
                              {selectedPaySlip.generatedAt ? new Date(selectedPaySlip.generatedAt).toLocaleDateString('fr-FR') : (selectedPaySlip.date ? new Date(selectedPaySlip.date).toLocaleDateString('fr-FR') : 'N/A')}
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
                              {selectedPaySlip.salaryDetails?.baseSalary?.toLocaleString() || selectedPaySlip.grossSalary?.toLocaleString() || 'N/A'} FCFA
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Jours travaillés</p>
                            <p className="font-medium">{selectedPaySlip.remuneration?.workedDays || 'N/A'} jours</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Heures supplémentaires</p>
                            <p className="font-medium">{selectedPaySlip.remuneration?.overtime?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Indemnité transport</p>
                            <p className="font-medium">{selectedPaySlip.salaryDetails?.transportAllowance?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total brut</p>
                            <p className="font-medium text-lg text-green-700">
                              {selectedPaySlip.remuneration?.total?.toLocaleString() || selectedPaySlip.grossSalary?.toLocaleString() || 'N/A'} FCFA
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
                            <p className="font-medium">{selectedPaySlip.deductions?.pvis?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">IRPP</p>
                            <p className="font-medium">{selectedPaySlip.deductions?.irpp?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">CAC</p>
                            <p className="font-medium">{selectedPaySlip.deductions?.cac?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">CFC</p>
                            <p className="font-medium">{selectedPaySlip.deductions?.cfc?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">RAV</p>
                            <p className="font-medium">{selectedPaySlip.deductions?.rav?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">TDL</p>
                            <p className="font-medium">{selectedPaySlip.deductions?.tdl?.toLocaleString() || '0'} FCFA</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total déductions</p>
                            <p className="font-medium text-lg text-red-700">
                              {selectedPaySlip.deductions?.total?.toLocaleString() || '0'} FCFA
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
                              const remunerationTotal = selectedPaySlip.remuneration?.total || selectedPaySlip.grossSalary || 0;
                              const deductionsTotal = selectedPaySlip.deductions?.total || 0;
                              const netToPay = Math.max(0, remunerationTotal - deductionsTotal);
                              return netToPay.toLocaleString();
                            })()} FCFA
                          </p>
                        </div>
                      </div>
                      {/* Boutons d'action en bas */}
                      <div className="flex justify-center gap-4 mt-8">
                        <Button onClick={() => setSelectedPaySlip(null)} variant="outline">Fermer</Button>
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
                  <p><strong>Date de début :</strong> {employeeData.contract.startDate ? new Date(employeeData.contract.startDate).toLocaleDateString("fr-FR") : "N/A"}</p>
                  <p><strong>Salaire de base :</strong> {employeeData.contract.baseSalary ? `${employeeData.contract.baseSalary} FCFA` : "N/A"}</p>
                  <p><strong>Poste :</strong> {employeeData.contract.poste || employeeData.poste || "N/A"}</p>
                  {/* ... autres infos ... */}
                  {employeeData.contract.fileUrl && (
                    <a href={employeeData.contract.fileUrl} download className="text-blue-600 hover:underline mt-2 block">
                      Télécharger le contrat PDF
                    </a>
                  )}
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
                    <div className="overflow-x-auto">
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
                                {new Date(req.date).toLocaleDateString("fr-FR", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
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
                            {new Date(notif.date).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
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

export default EmployeeDashboard;