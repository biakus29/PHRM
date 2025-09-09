import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDocs, setDoc, updateDoc, deleteDoc, collection, onSnapshot, addDoc, getDoc, query, where, orderBy, limit } from "firebase/firestore";
import { toast } from "react-toastify";

export const useDashboardData = () => {
  const [companyData, setCompanyData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Charger les données de l'entreprise
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      doc(db, "companies", auth.currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          setCompanyData({ id: doc.id, ...doc.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors du chargement des données de l'entreprise:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Charger les employés
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "companies", auth.currentUser.uid, "employees"),
      (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmployees(employeesData);
      },
      (error) => {
        console.error("Erreur lors du chargement des employés:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Charger les demandes de congé
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "companies", auth.currentUser.uid, "leaveRequests"),
      (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLeaveRequests(requestsData);
      },
      (error) => {
        console.error("Erreur lors du chargement des demandes de congé:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fonctions CRUD pour les employés
  const addEmployee = async (employeeData) => {
    setActionLoading(true);
    try {
      await addDoc(collection(db, "companies", auth.currentUser.uid, "employees"), employeeData);
      toast.success("Employé ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'employé:", error);
      toast.error("Erreur lors de l'ajout de l'employé");
    } finally {
      setActionLoading(false);
    }
  };

  const updateEmployee = async (employeeId, employeeData) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "companies", auth.currentUser.uid, "employees", employeeId), employeeData);
      toast.success("Employé mis à jour avec succès !");
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'employé:", error);
      toast.error("Erreur lors de la mise à jour de l'employé");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEmployee = async (employeeId) => {
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "companies", auth.currentUser.uid, "employees", employeeId));
      toast.success("Employé supprimé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé:", error);
      toast.error("Erreur lors de la suppression de l'employé");
    } finally {
      setActionLoading(false);
    }
  };

  // Fonctions pour les demandes de congé
  const updateLeaveRequestStatus = async (requestId, status) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, "companies", auth.currentUser.uid, "leaveRequests", requestId), { status });
      toast.success(`Demande ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès !`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la demande:", error);
      toast.error("Erreur lors de la mise à jour de la demande");
    } finally {
      setActionLoading(false);
    }
  };

  return {
    companyData,
    employees,
    leaveRequests,
    loading,
    actionLoading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateLeaveRequestStatus
  };
};
