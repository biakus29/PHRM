import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";

/**
 * Hook useAbsences
 * 
 * Gère les absences avec Firestore.
 * Fournit des fonctions pour ajouter, modifier, supprimer des absences.
 * 
 * Utilisation:
 * const {
 *   absences,
 *   loading,
 *   addAbsence,
 *   updateAbsence,
 *   deleteAbsence,
 *   getAbsencesByEmployee
 * } = useAbsences(db, companyId);
 */

export const useAbsences = (db, companyId) => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== SUBSCRIPTION ====================
  useEffect(() => {
    if (!db || !companyId) return;

    setLoading(true);
    const collectionRef = collection(db, "clients", companyId, "absences");
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const absencesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAbsences(absencesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useAbsences] Erreur subscription:", err);
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des absences");
      }
    );

    return () => unsubscribe();
  }, [db, companyId]);

  // ==================== ADD ABSENCE ====================
  const addAbsence = useCallback(
    async (absenceData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour ajouter une absence");
        return null;
      }

      setActionLoading(true);
      try {
        const collectionRef = collection(db, "clients", companyId, "absences");
        const docRef = await addDoc(collectionRef, {
          ...absenceData,
          createdAt: new Date(),
          status: absenceData.status || "pending",
        });
        toast.success("Absence ajoutée avec succès !");
        return docRef.id;
      } catch (err) {
        console.error("[useAbsences] Erreur ajout:", err);
        toast.error(`Erreur lors de l'ajout: ${err.message}`);
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE ABSENCE ====================
  const updateAbsence = useCallback(
    async (absenceId, absenceData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour l'absence");
        return false;
      }

      setActionLoading(true);
      try {
        const docRef = doc(db, "clients", companyId, "absences", absenceId);
        await updateDoc(docRef, {
          ...absenceData,
          updatedAt: new Date(),
        });
        toast.success("Absence mise à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useAbsences] Erreur mise à jour:", err);
        toast.error(`Erreur lors de la mise à jour: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== DELETE ABSENCE ====================
  const deleteAbsence = useCallback(
    async (absenceId) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour supprimer l'absence");
        return false;
      }

      setActionLoading(true);
      try {
        const docRef = doc(db, "clients", companyId, "absences", absenceId);
        await deleteDoc(docRef);
        toast.success("Absence supprimée avec succès !");
        return true;
      } catch (err) {
        console.error("[useAbsences] Erreur suppression:", err);
        toast.error(`Erreur lors de la suppression: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== GET ABSENCES BY EMPLOYEE ====================
  const getAbsencesByEmployee = useCallback(
    (employeeId) => {
      return absences.filter((abs) => abs.employeeId === employeeId);
    },
    [absences]
  );

  // ==================== GET ABSENCES BY DATE RANGE ====================
  const getAbsencesByDateRange = useCallback(
    (startDate, endDate) => {
      return absences.filter((abs) => {
        const absDate = new Date(abs.date);
        return absDate >= startDate && absDate <= endDate;
      });
    },
    [absences]
  );

  // ==================== GET ABSENCES BY STATUS ====================
  const getAbsencesByStatus = useCallback(
    (status) => {
      return absences.filter((abs) => abs.status === status);
    },
    [absences]
  );

  return {
    absences,
    setAbsences,
    loading,
    actionLoading,
    error,
    addAbsence,
    updateAbsence,
    deleteAbsence,
    getAbsencesByEmployee,
    getAbsencesByDateRange,
    getAbsencesByStatus,
  };
};

export default useAbsences;
