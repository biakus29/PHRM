import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
  subscribeEmployees,
  addEmployee as svcAddEmployee,
  updateEmployee as svcUpdateEmployee,
  deleteEmployee as svcDeleteEmployee,
  updateEmployeePayslips as svcUpdateEmployeePayslips,
  updateEmployeeBaseSalary as svcUpdateEmployeeBaseSalary,
  updateEmployeeContract as svcUpdateEmployeeContract,
  updateEmployeeBadge as svcUpdateEmployeeBadge,
} from "../services/employees";

/**
 * Hook useEmployees
 * 
 * Gère le CRUD des employés avec Firestore.
 * Fournit des fonctions pour ajouter, modifier, supprimer des employés.
 * 
 * Utilisation:
 * const {
 *   employees,
 *   loading,
 *   addEmployee,
 *   updateEmployee,
 *   deleteEmployee,
 *   updatePayslips,
 *   updateBaseSalary,
 *   updateContract,
 *   updateBadge,
 *   refreshEmployees
 * } = useEmployees(db, companyId);
 */

export const useEmployees = (db, companyId) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== SUBSCRIPTION ====================
  useEffect(() => {
    if (!db || !companyId) return;

    setLoading(true);
    const unsubscribe = subscribeEmployees(
      db,
      companyId,
      (data) => {
        setEmployees(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useEmployees] Erreur subscription:", err);
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des employés");
      }
    );

    return () => unsubscribe();
  }, [db, companyId]);

  // ==================== ADD EMPLOYEE ====================
  const addEmployee = useCallback(
    async (employeeData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour ajouter un employé");
        return null;
      }

      setActionLoading(true);
      try {
        const employeeId = await svcAddEmployee(db, companyId, employeeData);
        toast.success("Employé ajouté avec succès !");
        return employeeId;
      } catch (err) {
        console.error("[useEmployees] Erreur ajout:", err);
        toast.error(`Erreur lors de l'ajout de l'employé: ${err.message}`);
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE EMPLOYEE ====================
  const updateEmployee = useCallback(
    async (employeeId, employeeData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour l'employé");
        return false;
      }

      setActionLoading(true);
      try {
        await svcUpdateEmployee(db, companyId, employeeId, employeeData);
        toast.success("Employé mis à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur mise à jour:", err);
        toast.error(`Erreur lors de la mise à jour: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== DELETE EMPLOYEE ====================
  const deleteEmployee = useCallback(
    async (employeeId) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour supprimer l'employé");
        return false;
      }

      setActionLoading(true);
      try {
        await svcDeleteEmployee(db, companyId, employeeId);
        toast.success("Employé supprimé avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur suppression:", err);
        toast.error(`Erreur lors de la suppression: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE PAYSLIPS ====================
  const updatePayslips = useCallback(
    async (employeeId, payslips) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour les fiches de paie");
        return false;
      }

      setActionLoading(true);
      try {
        await svcUpdateEmployeePayslips(db, companyId, employeeId, payslips);
        toast.success("Fiches de paie mises à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur payslips:", err);
        toast.error(`Erreur lors de la mise à jour des fiches: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE BASE SALARY ====================
  const updateBaseSalary = useCallback(
    async (employeeId, baseSalary) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour le salaire");
        return false;
      }

      setActionLoading(true);
      try {
        await svcUpdateEmployeeBaseSalary(db, companyId, employeeId, baseSalary);
        toast.success("Salaire mis à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur salaire:", err);
        toast.error(`Erreur lors de la mise à jour du salaire: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE CONTRACT ====================
  const updateContract = useCallback(
    async (employeeId, contractData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour le contrat");
        return false;
      }

      setActionLoading(true);
      try {
        await svcUpdateEmployeeContract(db, companyId, employeeId, contractData);
        toast.success("Contrat mis à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur contrat:", err);
        toast.error(`Erreur lors de la mise à jour du contrat: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE BADGE ====================
  const updateBadge = useCallback(
    async (employeeId, badgeData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour le badge");
        return false;
      }

      setActionLoading(true);
      try {
        await svcUpdateEmployeeBadge(db, companyId, employeeId, badgeData);
        toast.success("Badge mis à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useEmployees] Erreur badge:", err);
        toast.error(`Erreur lors de la mise à jour du badge: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== REFRESH ====================
  const refreshEmployees = useCallback(() => {
    if (!db || !companyId) return;
    setLoading(true);
    const unsubscribe = subscribeEmployees(
      db,
      companyId,
      (data) => {
        setEmployees(data);
        setLoading(false);
      },
      (err) => {
        console.error("[useEmployees] Erreur refresh:", err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [db, companyId]);

  return {
    employees,
    setEmployees,
    loading,
    actionLoading,
    error,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updatePayslips,
    updateBaseSalary,
    updateContract,
    updateBadge,
    refreshEmployees,
  };
};

export default useEmployees;
