import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "react-toastify";

/**
 * DashboardContext
 * 
 * Contexte centralisé pour partager l'état du dashboard entre tous les composants.
 * Évite le prop-drilling et centralise la gestion d'état.
 * 
 * État partagé:
 * - Données: companyData, employees, leaveRequests, absences, notifications
 * - Actions: CRUD pour chaque entité
 * - UI State: activeTab, sidebarState, selectedEmployee, modals
 * - Loading: loading, actionLoading, errorMessage
 */

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  // ==================== DONNÉES ====================
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ==================== UI STATE ====================
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarState, setSidebarState] = useState("fullyOpen"); // "fullyOpen" | "minimized" | "hidden"
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPaySlip, setSelectedPaySlip] = useState(null);

  // ==================== MODALS ====================
  const [modals, setModals] = useState({
    employeeForm: false,
    leaveRequest: false,
    paySlipForm: false,
    paySlipDetails: false,
    contractForm: false,
    badgeForm: false,
    importWizard: false,
    qrScanner: false,
  });

  // ==================== LOADING ====================
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ==================== MODAL HELPERS ====================
  const openModal = useCallback((modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: true }));
  }, []);

  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  }, []);

  const toggleModal = useCallback((modalName) => {
    setModals((prev) => ({ ...prev, [modalName]: !prev[modalName] }));
  }, []);

  // ==================== EMPLOYEE ACTIONS ====================
  const updateEmployee = useCallback((employeeId, updatedData) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === employeeId ? { ...emp, ...updatedData } : emp))
    );
    if (selectedEmployee?.id === employeeId) {
      setSelectedEmployee((prev) => ({ ...prev, ...updatedData }));
    }
  }, [selectedEmployee]);

  const removeEmployee = useCallback((employeeId) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
    if (selectedEmployee?.id === employeeId) {
      setSelectedEmployee(null);
    }
  }, [selectedEmployee]);

  const addEmployeeToList = useCallback((employee) => {
    setEmployees((prev) => [...prev, employee]);
  }, []);

  // ==================== LEAVE REQUEST ACTIONS ====================
  const updateLeaveRequest = useCallback((requestId, updatedData) => {
    setLeaveRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, ...updatedData } : req))
    );
  }, []);

  const removeLeaveRequest = useCallback((requestId) => {
    setLeaveRequests((prev) => prev.filter((req) => req.id !== requestId));
  }, []);

  const addLeaveRequestToList = useCallback((request) => {
    setLeaveRequests((prev) => [...prev, request]);
  }, []);

  // ==================== ABSENCE ACTIONS ====================
  const updateAbsence = useCallback((absenceId, updatedData) => {
    setAbsences((prev) =>
      prev.map((abs) => (abs.id === absenceId ? { ...abs, ...updatedData } : abs))
    );
  }, []);

  const removeAbsence = useCallback((absenceId) => {
    setAbsences((prev) => prev.filter((abs) => abs.id !== absenceId));
  }, []);

  const addAbsenceToList = useCallback((absence) => {
    setAbsences((prev) => [...prev, absence]);
  }, []);

  // ==================== NOTIFICATION ACTIONS ====================
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [...prev, { ...notification, id: Date.now() }]);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
  }, []);

  // ==================== CONTEXT VALUE ====================
  const value = {
    // Données
    companyData,
    setCompanyData,
    employees,
    setEmployees,
    leaveRequests,
    setLeaveRequests,
    absences,
    setAbsences,
    notifications,
    setNotifications,

    // UI State
    activeTab,
    setActiveTab,
    sidebarState,
    setSidebarState,
    selectedEmployee,
    setSelectedEmployee,
    selectedPaySlip,
    setSelectedPaySlip,

    // Modals
    modals,
    openModal,
    closeModal,
    toggleModal,

    // Loading
    loading,
    setLoading,
    actionLoading,
    setActionLoading,
    errorMessage,
    setErrorMessage,

    // Employee Actions
    updateEmployee,
    removeEmployee,
    addEmployeeToList,

    // Leave Request Actions
    updateLeaveRequest,
    removeLeaveRequest,
    addLeaveRequestToList,

    // Absence Actions
    updateAbsence,
    removeAbsence,
    addAbsenceToList,

    // Notification Actions
    addNotification,
    removeNotification,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

/**
 * Hook pour utiliser le DashboardContext
 * 
 * Utilisation:
 * const { employees, updateEmployee, openModal } = useDashboard();
 */
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard doit être utilisé dans un DashboardProvider");
  }
  return context;
};

export default DashboardContext;
