import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

/**
 * Hook useLeaveRequests
 * 
 * Gère les demandes de congé avec Firestore.
 * Fournit des fonctions pour ajouter, modifier, supprimer des demandes.
 * 
 * Utilisation:
 * const {
 *   leaveRequests,
 *   loading,
 *   addLeaveRequest,
 *   updateLeaveRequest,
 *   deleteLeaveRequest,
 *   approveLeaveRequest,
 *   rejectLeaveRequest
 * } = useLeaveRequests(db, companyId);
 */

export const useLeaveRequests = (db, companyId) => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==================== SUBSCRIPTION ====================
  useEffect(() => {
    if (!db || !companyId) return;

    setLoading(true);
    const collectionRef = collection(db, "clients", companyId, "leaveRequests");
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaveRequests(requests);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useLeaveRequests] Erreur subscription:", err);
        setError(err.message);
        setLoading(false);
        toast.error("Erreur lors du chargement des demandes de congé");
      }
    );

    return () => unsubscribe();
  }, [db, companyId]);

  // ==================== ADD LEAVE REQUEST ====================
  const addLeaveRequest = useCallback(
    async (requestData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour ajouter une demande");
        return null;
      }

      setActionLoading(true);
      try {
        const collectionRef = collection(db, "clients", companyId, "leaveRequests");
        const docRef = await addDoc(collectionRef, {
          ...requestData,
          createdAt: new Date(),
          status: requestData.status || "pending",
        });
        toast.success("Demande de congé ajoutée avec succès !");
        return docRef.id;
      } catch (err) {
        console.error("[useLeaveRequests] Erreur ajout:", err);
        toast.error(`Erreur lors de l'ajout: ${err.message}`);
        return null;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== UPDATE LEAVE REQUEST ====================
  const updateLeaveRequest = useCallback(
    async (requestId, requestData) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour mettre à jour la demande");
        return false;
      }

      setActionLoading(true);
      try {
        const docRef = doc(db, "clients", companyId, "leaveRequests", requestId);
        await updateDoc(docRef, {
          ...requestData,
          updatedAt: new Date(),
        });
        toast.success("Demande mise à jour avec succès !");
        return true;
      } catch (err) {
        console.error("[useLeaveRequests] Erreur mise à jour:", err);
        toast.error(`Erreur lors de la mise à jour: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== DELETE LEAVE REQUEST ====================
  const deleteLeaveRequest = useCallback(
    async (requestId) => {
      if (!db || !companyId) {
        toast.error("Données manquantes pour supprimer la demande");
        return false;
      }

      setActionLoading(true);
      try {
        const docRef = doc(db, "clients", companyId, "leaveRequests", requestId);
        await deleteDoc(docRef);
        toast.success("Demande supprimée avec succès !");
        return true;
      } catch (err) {
        console.error("[useLeaveRequests] Erreur suppression:", err);
        toast.error(`Erreur lors de la suppression: ${err.message}`);
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [db, companyId]
  );

  // ==================== APPROVE LEAVE REQUEST ====================
  const approveLeaveRequest = useCallback(
    async (requestId) => {
      return updateLeaveRequest(requestId, {
        status: "approved",
        approvedAt: new Date(),
      });
    },
    [updateLeaveRequest]
  );

  // ==================== REJECT LEAVE REQUEST ====================
  const rejectLeaveRequest = useCallback(
    async (requestId, reason = "") => {
      return updateLeaveRequest(requestId, {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason,
      });
    },
    [updateLeaveRequest]
  );

  // ==================== GET REQUESTS BY STATUS ====================
  const getRequestsByStatus = useCallback(
    (status) => {
      return leaveRequests.filter((req) => req.status === status);
    },
    [leaveRequests]
  );

  // ==================== GET REQUESTS BY EMPLOYEE ====================
  const getRequestsByEmployee = useCallback(
    (employeeId) => {
      return leaveRequests.filter((req) => req.employeeId === employeeId);
    },
    [leaveRequests]
  );

  return {
    leaveRequests,
    setLeaveRequests,
    loading,
    actionLoading,
    error,
    addLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
    getRequestsByStatus,
    getRequestsByEmployee,
  };
};

export default useLeaveRequests;
