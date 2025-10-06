// src/components/EmployeeManagementEnhanced.jsx
import React, { useState, useCallback, useMemo } from "react";
import { addEmployee, updateEmployee, deleteEmployee, updateCompanyUsers, savePaySlip, saveContractData } from "../utils/firebaseUtils";
import { validateEmployeeData, validateAbsenceData, validateNotification } from "../utils/validationUtils";
import { toast } from "react-toastify";
import { FiSearch, FiPlus, FiBell, FiEdit, FiFileText, FiUserX } from "react-icons/fi";
import { debounce } from "lodash";
import EmployeeCard from "../compoments/card";
import PaySlipGenerator from "../pages/PaySlipGenerator";
import ContractManagement from "../compoments/ContractManagement";
import DismissalManagement from "../compoments/DismissalManagement";
import Button from "../compoments/Button";
import Card from "../compoments/card";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import Modal from "../components/Modal";

const EmployeeManagementEnhanced = ({ companyData, employees, setEmployees, actionLoading, setActionLoading }) => {
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    matricule: "",
    role: "Employé",
    poste: "",
    phone: "",
    department: "",
    hireDate: "",
    status: "Actif",
    cnpsNumber: "",
    professionalCategory: "",
    baseSalary: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [newNotification, setNewNotification] = useState("");
  const [newAbsence, setNewAbsence] = useState({ employeeId: "", date: "", reason: "", duration: 1 });
  const [showPaySlipForm, setShowPaySlipForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showDismissalModal, setShowDismissalModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const debouncedSetSearchQuery = useMemo(() => debounce((value) => setSearchQuery(value), 300), []);

  // Gestionnaire d'ajout d'employé
  const addEmployeeHandler = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("[addEmployeeHandler] Tentative ajout nouvel employé");
      if (!validateEmployeeData(newEmployee)) return;
      if (employees.length >= companyData.licenseMaxUsers) {
        console.warn("[addEmployeeHandler] Limite d'utilisateurs atteinte");
        toast.error("Limite d'utilisateurs atteinte pour votre licence !");
        return;
      }
      try {
        setActionLoading(true);
        const employeeData = {
          name: newEmployee.name,
          email: newEmployee.email,
          matricule: newEmployee.matricule,
          role: newEmployee.role,
          poste: newEmployee.poste,
          phone: newEmployee.phone || "",
          department: newEmployee.department || "",
          hireDate: newEmployee.hireDate,
          status: newEmployee.status,
          cnpsNumber: newEmployee.cnpsNumber,
          professionalCategory: newEmployee.professionalCategory,
          baseSalary: Number(newEmployee.baseSalary),
          createdAt: new Date().toISOString(),
          leaves: { balance: 25, requests: [], history: [] },
          absences: [],
          payslips: [],
          notifications: [],
          profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(newEmployee.name)}&background=3B82F6&color=fff`,
        };
        const newEmployeeData = await addEmployee(companyData.id, employeeData);
        setEmployees((prev) => [...prev, newEmployeeData]);
        setNewEmployee({
          name: "",
          email: "",
          matricule: "",
          role: "Employé",
          poste: "",
          phone: "",
          department: "",
          hireDate: "",
          status: "Actif",
          cnpsNumber: "",
          professionalCategory: "",
          baseSalary: "",
        });
        await updateCompanyUsers(companyData.id, employees.length + 1);
        setSelectedEmployee(newEmployeeData);
        toast.success("Employé ajouté avec succès !");
      } catch (error) {
        console.error("Erreur lors de l'ajout:", error);
        toast.error("Erreur lors de l'ajout de l'employé");
      } finally {
        setActionLoading(false);
      }
    },
    [companyData, employees, newEmployee, setEmployees, setActionLoading]
  );

  // Gestionnaire de mise à jour d'employé
  const updateEmployeeHandler = useCallback(
    async (id, updatedData) => {
      try {
        setActionLoading(true);
        await updateEmployee(companyData.id, id, updatedData);
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === id ? { ...emp, ...updatedData } : emp))
        );
        toast.success("Informations mises à jour avec succès");
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        toast.error("Erreur lors de la mise à jour");
      } finally {
        setActionLoading(false);
      }
    },
    [companyData, setEmployees, setActionLoading]
  );

  // Gestionnaire de suppression d'employé
  const deleteEmployeeHandler = useCallback(
    async (id) => {
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) return;
      try {
        setActionLoading(true);
        await deleteEmployee(companyData.id, id);
        setEmployees((prev) => prev.filter((emp) => emp.id !== id));
        await updateCompanyUsers(companyData.id, employees.length - 1);
        toast.success("Employé supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression");
      } finally {
        setActionLoading(false);
      }
    },
    [companyData, employees, setEmployees, setActionLoading]
  );

  // Gestionnaire de mise à jour de contrat
  const handleContractUpdate = useCallback((employeeId, contractData) => {
    const updatedEmployee = {
      ...employees.find(emp => emp.id === employeeId),
      contract: {
        ...contractData,
        history: [
          ...(employees.find(emp => emp.id === employeeId)?.contract?.history || []),
          {
            action: 'update',
            date: new Date().toISOString(),
            changes: contractData,
            user: 'current_user'
          }
        ]
      }
    };
    updateEmployeeHandler(employeeId, updatedEmployee);
    setShowContractModal(false);
  }, [employees, updateEmployeeHandler]);

  // Gestionnaire de création de contrat
  const handleContractCreate = useCallback((employeeId, contractData) => {
    const updatedEmployee = {
      ...employees.find(emp => emp.id === employeeId),
      contract: {
        ...contractData,
        createdAt: new Date().toISOString(),
        history: [{
          action: 'create',
          date: new Date().toISOString(),
          changes: contractData,
          user: 'current_user'
        }]
      }
    };
    updateEmployeeHandler(employeeId, updatedEmployee);
    setShowContractModal(false);
  }, [employees, updateEmployeeHandler]);

  // Gestionnaire de terminaison de contrat
  const handleContractTerminate = useCallback((employeeId, terminationData) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const updatedEmployee = {
      ...employee,
      status: terminationData.type === 'DEMISSION' ? 'Resigned' :
              terminationData.type === 'RETRAIT' ? 'Retired' : 'Dismissed',
      contract: {
        ...employee.contract,
        status: 'terminated',
        termination: {
          ...terminationData,
          terminatedAt: new Date().toISOString()
        },
        history: [
          ...(employee.contract?.history || []),
          {
            action: 'terminate',
            date: new Date().toISOString(),
            changes: terminationData,
            user: 'current_user'
          }
        ]
      }
    };
    updateEmployeeHandler(employeeId, updatedEmployee);
    setShowContractModal(false);
  }, [employees, updateEmployeeHandler]);

  // Gestionnaire de création de licenciement
  const handleDismissalCreate = useCallback((dismissalData) => {
    const employee = employees.find(emp => emp.id === dismissalData.employeeId);
    const updatedEmployee = {
      ...employee,
      dismissals: [
        ...(employee.dismissals || []),
        dismissalData
      ]
    };
    updateEmployeeHandler(dismissalData.employeeId, updatedEmployee);
    setShowDismissalModal(false);
  }, [employees, updateEmployeeHandler]);

  // Fonctions pour ouvrir les modaux
  const openContractModal = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowContractModal(true);
  }, []);

  const openDismissalModal = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowDismissalModal(true);
  }, []);

  // Gestionnaire d'upload de fiche de paie
  const handlePaySlipUpload = useCallback(
    async (e, employeeId) => {
      console.log(`[handlePaySlipUpload] Upload fiche de paie pour employé ID: ${employeeId}`);
      const file = e.target.files[0];
      if (!file) return;
      try {
        setActionLoading(true);
        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result;
          console.log(`[handlePaySlipUpload] Fiche de paie convertie en dataURL, taille: ${(dataUrl.length / 1024).toFixed(2)} Ko`);
          await updateEmployeeHandler(employeeId, {
            payslips: [...(employees.find((emp) => emp.id === employeeId).payslips || []), {
              url: dataUrl,
              date: new Date().toISOString(),
            }],
          });
          console.log("[handlePaySlipUpload] Fiche de paie enregistrée");
          toast.success("Fiche de paie enregistrée avec succès !");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error(`[handlePaySlipUpload] Erreur: ${error.message}`);
        toast.error(`Erreur enregistrement fiche de paie: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    },
    [employees, updateEmployeeHandler, setActionLoading]
  );

  // Gestionnaire de demande de congé
  const handleLeaveRequest = useCallback(
    async (employeeId, requestIndex, action) => {
      console.log(`[handleLeaveRequest] Gestion demande congé, employé ID: ${employeeId}, action: ${action}`);
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee || !employee.leaves?.requests[requestIndex]) {
        console.warn("[handleLeaveRequest] Demande invalide");
        toast.error("Demande invalide !");
        return;
      }
      try {
        setActionLoading(true);
        const request = employee.leaves.requests[requestIndex];
        const updatedRequests = [...employee.leaves.requests];
        const updatedHistory = [...(employee.leaves.history || [])];
        updatedRequests[requestIndex] = { ...request, status: action };
        updatedHistory.push({ ...request, status: action });
        let updatedBalance = employee.leaves.balance;
        if (action === "Approuvé") {
          updatedBalance = Math.max(0, updatedBalance - request.days);
        }
        await updateEmployeeHandler(employeeId, {
          leaves: {
            balance: updatedBalance,
            requests: updatedRequests,
            history: updatedHistory,
          },
        });
        console.log(`[handleLeaveRequest] Demande congé ${action.toLowerCase()}`);
        toast.success(`Demande de congé ${action.toLowerCase()} !`);
      } catch (error) {
        console.error(`[handleLeaveRequest] Erreur: ${error.message}`);
        toast.error(`Erreur gestion congé: ${error.message}`);
      } finally {
        setActionLoading(false);
      }
    },
    [employees, updateEmployeeHandler, setActionLoading]
  );

  // Gestionnaire d'enregistrement d'absence
  const recordAbsenceHandler = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("[recordAbsenceHandler] Tentative enregistrement absence");
      if (!validateAbsenceData(newAbsence)) return;
      try {
        setActionLoading(true);
        const employee = employees.find((emp) => emp.id === newAbsence.employeeId);
        const updatedAbsences = [
          ...(employee.absences || []),
          {
            date: newAbsence.date,
            reason: newAbsence.reason,
            duration: Number(newAbsence.duration),
          },
        ];
        await updateEmployeeHandler(newAbsence.employeeId, { absences: updatedAbsences });
        setNewAbsence({ employeeId: "", date: "", reason: "", duration: 1 });
        toast.success("Absence enregistrée avec succès");
      } catch (error) {
        console.error("Erreur lors de l'enregistrement d'absence:", error);
        toast.error("Erreur lors de l'enregistrement de l'absence");
      } finally {
        setActionLoading(false);
      }
    },
    [employees, newAbsence, updateEmployeeHandler, setActionLoading]
  );

  // Gestionnaire d'envoi de notification
  const sendNotificationHandler = useCallback(
    async (e) => {
      e.preventDefault();
      console.log("[sendNotificationHandler] Tentative envoi notification");
      if (!validateNotification(newNotification)) return;
      try {
        setActionLoading(true);
        const promises = employees.map(async (employee) => {
          const updatedNotifications = [
            ...(employee.notifications || []),
            {
              id: `${employee.id}_${Date.now()}`,
              message: newNotification,
              date: new Date().toISOString(),
              read: false,
            },
          ];
          await updateEmployeeHandler(employee.id, { notifications: updatedNotifications });
          return { ...employee, notifications: updatedNotifications };
        });
        const updatedEmployees = await Promise.all(promises);
        setEmployees(updatedEmployees);
        setNewNotification("");
        toast.success("Notification envoyée à tous les employés");
      } catch (error) {
        console.error("Erreur lors de l'envoi de notification:", error);
        toast.error("Erreur lors de l'envoi de la notification");
      } finally {
        setActionLoading(false);
      }
    },
    [employees, newNotification, updateEmployeeHandler, setEmployees, setActionLoading]
  );

  // Fonctions pour ouvrir les formulaires
  const openPaySlipForm = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowPaySlipForm(true);
  }, []);

  const openContractForm = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowContractForm(true);
  }, []);

  // Gestionnaire de génération de fiche de paie
  const handlePaySlipGeneration = useCallback(
    (generatedPaySlip) => {
      console.log("[handlePaySlipGeneration] Fiche de paie générée:", generatedPaySlip);
      if (generatedPaySlip) {
        const completePaySlip = {
          ...generatedPaySlip,
          employee: {
            ...generatedPaySlip.employee,
            lastName: generatedPaySlip.employee.lastName || selectedEmployee.name.split(" ")[1] || "N/A",
            firstName: generatedPaySlip.employee.firstName || selectedEmployee.name.split(" ")[0] || "",
            matricule: generatedPaySlip.employee.matricule || selectedEmployee.id.slice(0, 8),
            professionalClassification: generatedPaySlip.employee.professionalClassification || selectedEmployee.professionalCategory || "N/A",
          },
          employer: {
            companyName: companyData.name || "PHRM",
            address: companyData.address || "BP 16194 Yaoundé, Cameroun",
            cnpsNumber: companyData.cnpsNumber || "Non spécifié",
          },
          salaryDetails: generatedPaySlip.salaryDetails || {
            monthlyRate: selectedEmployee.baseSalary || 0,
            dailyRate: ((selectedEmployee.baseSalary || 0) / 30).toFixed(2),
            hourlyRate: ((selectedEmployee.baseSalary || 0) / 30 / 8).toFixed(2),
            transportAllowance: 0,
          },
          remuneration: generatedPaySlip.remuneration || {
            workedDays: 30,
            overtime: 0,
            total: selectedEmployee.baseSalary || 0,
          },
          deductions: generatedPaySlip.deductions || { pvid: 0, irpp: 0, cac: 0, cfc: 0, rav: 0, tdl: 0, total: 0 },
          payPeriod: generatedPaySlip.payPeriod || `${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
          generatedAt: new Date().toISOString(),
        };
        savePaySlip(companyData.id, selectedEmployee.id, completePaySlip);
      }
      setShowPaySlipForm(false);
    },
    [selectedEmployee, companyData, setActionLoading]
  );

  // Gestionnaire de génération de contrat
  const handleContractGeneration = useCallback(
    (contractData) => {
      console.log("[handleContractGeneration] Contrat généré:", contractData);
      if (contractData) {
        saveContractData(companyData.id, selectedEmployee.id, contractData);
      }
      setShowContractForm(false);
    },
    [selectedEmployee, companyData, setActionLoading]
  );

  // Liste filtrée des employés
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

  // Données du graphique des congés
  const leaveChartData = useMemo(() => {
    const months = Array(12).fill(0);
    employees.forEach((emp) => {
      emp.leaves?.history?.forEach((req) => {
        if (req.status === "Approuvé") {
          const date = new Date(req.date);
          months[date.getMonth()] += req.days;
        }
      });
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
  }, [employees]);

  return (
    <Card title="Gestion Avancée des Employés" className="animate-scale-in">
      {/* Formulaire d'ajout d'employé */}
      <form onSubmit={addEmployeeHandler} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Nom complet"
          value={newEmployee.name}
          onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Nom de l'employé"
        />
        <input
          type="email"
          placeholder="Email"
          value={newEmployee.email}
          onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Email de l'employé"
        />
        <select
          value={newEmployee.role}
          onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Rôle de l'employé"
        >
          <option value="Employé">Employé</option>
          <option value="Manager">Manager</option>
          <option value="Directeur">Directeur</option>
        </select>
        <input
          type="text"
          placeholder="Poste"
          value={newEmployee.poste}
          onChange={(e) => setNewEmployee({ ...newEmployee, poste: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Poste de l'employé"
        />
        <input
          type="tel"
          placeholder="Téléphone"
          value={newEmployee.phone}
          onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Téléphone de l'employé"
        />
        <input
          type="text"
          placeholder="Département"
          value={newEmployee.department}
          onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Départément de l'employé"
        />
        <input
          type="date"
          placeholder="Date d'embauche"
          value={newEmployee.hireDate}
          onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Date d'embauche de l'employé"
        />
        <select
          value={newEmployee.status}
          onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Statut de l'employé"
        >
          <option value="Actif">Actif</option>
          <option value="Inactif">Inactif</option>
          <option value="En congé">En congé</option>
        </select>
        <input
          type="text"
          placeholder="Numéro CNPS"
          value={newEmployee.cnpsNumber}
          onChange={(e) => setNewEmployee({ ...newEmployee, cnpsNumber: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Numéro CNPS de l'employé"
        />
        <input
          type="text"
          placeholder="Catégorie professionnelle"
          value={newEmployee.professionalCategory}
          onChange={(e) => setNewEmployee({ ...newEmployee, professionalCategory: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          disabled={actionLoading}
          aria-label="Catégorie professionnelle de l'employé"
        />
        <input
          type="number"
          placeholder="Salaire de base (FCFA)"
          value={newEmployee.baseSalary}
          onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          min="0"
          disabled={actionLoading}
          aria-label="Salaire de base de l'employé"
        />
        <Button
          type="submit"
          icon={FiPlus}
          aria-label="Ajouter un employé"
          className="col-span-1"
          disabled={actionLoading}
        >
          Ajouter
        </Button>
      </form>

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <FiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Rechercher un employé..."
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            disabled={actionLoading}
            aria-label="Rechercher un employé"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg bg-white mt-2 sm:mt-0"
          disabled={actionLoading}
          aria-label="Trier les employés"
        >
          <option value="name">Trier par Nom</option>
          <option value="role">Trier par Rôle</option>
          <option value="poste">Trier par Poste</option>
          <option value="hireDate">Trier par Date d'Embauche</option>
        </select>
      </div>

      {/* Formulaire d'enregistrement d'absence */}
      <form onSubmit={recordAbsenceHandler} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={newAbsence.employeeId}
          onChange={(e) => setNewAbsence({ ...newAbsence, employeeId: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Sélectionner un employé pour l'absence"
        >
          <option value="">Sélectionner un employé</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={newAbsence.date}
          onChange={(e) => setNewAbsence({ ...newAbsence, date: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Date de l'absence"
        />
        <input
          type="text"
          placeholder="Raison de l'absence"
          value={newAbsence.reason}
          onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={actionLoading}
          aria-label="Raison de l'absence"
        />
        <input
          type="number"
          placeholder="Durée (jours)"
          value={newAbsence.duration}
          onChange={(e) => setNewAbsence({ ...newAbsence, duration: e.target.value })}
          className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          min="1"
          disabled={actionLoading}
          aria-label="Durée de l'absence"
        />
        <Button
          type="submit"
          icon={FiPlus}
          aria-label="Enregistrer l'absence"
          className="col-span-1"
          disabled={actionLoading}
        >
          Enregistrer absence
        </Button>
      </form>

      {/* Formulaire d'envoi de notification */}
      <form onSubmit={sendNotificationHandler} className="mb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Envoyer une notification à tous les employés..."
            value={newNotification}
            onChange={(e) => setNewNotification(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            disabled={actionLoading}
            aria-label="Message de notification"
          />
          <Button
            type="submit"
            icon={FiBell}
            aria-label="Envoyer la notification"
            disabled={actionLoading}
          >
            Envoyer
          </Button>
        </div>
      </form>

      {/* Graphique des congés */}
      <Card title="Statistiques des Congés" className="mb-6">
        <div className="h-64">
          <Line
            data={leaveChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: { beginAtZero: true, title: { display: true, text: "Jours" } },
                x: { title: { display: true, text: "Mois" } },
              },
            }}
          />
        </div>
      </Card>

      {/* Liste des employés avec boutons améliorés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredEmployees.map((employee, index) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onEdit={(emp) => {
              const newName = prompt("Nouveau nom :", emp.name) || emp.name;
              updateEmployeeHandler(emp.id, { name: newName });
            }}
            onDelete={deleteEmployeeHandler}
            onRequestLeave={handleLeaveRequest}
            onUploadPaySlip={handlePaySlipUpload}
            onCreatePaySlip={() => openPaySlipForm(employee)}
            onManageContract={() => openContractModal(employee)}
            onDismissal={() => openDismissalModal(employee)}
            animationDelay={`${index * 100}ms`}
            actionLoading={actionLoading}
          />
        ))}
      </div>

      {/* Modals */}
      {showContractModal && selectedEmployee && (
        <Modal
          isOpen={showContractModal}
          onClose={() => setShowContractModal(false)}
          title={`Gestion du Contrat - ${selectedEmployee.name}`}
          size="large"
        >
          <ContractManagement
            employee={selectedEmployee}
            onContractUpdate={handleContractUpdate}
            onContractCreate={handleContractCreate}
            onContractTerminate={handleContractTerminate}
          />
        </Modal>
      )}

      {showDismissalModal && selectedEmployee && (
        <Modal
          isOpen={showDismissalModal}
          onClose={() => setShowDismissalModal(false)}
          title={`Gestion du Licenciement - ${selectedEmployee.name}`}
          size="large"
        >
          <DismissalManagement
            employee={selectedEmployee}
            onDismissalCreate={handleDismissalCreate}
          />
        </Modal>
      )}

      {/* Générateurs de fiche de paie et contrat */}
      {showPaySlipForm && selectedEmployee && (
        <PaySlipGenerator
          employee={selectedEmployee}
          companyData={companyData}
          onGenerate={handlePaySlipGeneration}
          onClose={() => setShowPaySlipForm(false)}
          isContractMode={false}
        />
      )}

      {showContractForm && selectedEmployee && (
        <PaySlipGenerator
          employee={selectedEmployee}
          companyData={companyData}
          onGenerate={handleContractGeneration}
          onClose={() => setShowContractForm(false)}
          isContractMode={true}
        />
      )}
    </Card>
  );
};

export default EmployeeManagementEnhanced;

