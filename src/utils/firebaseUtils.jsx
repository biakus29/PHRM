// src/utils/firebaseUtils.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";

// Ajoute un employé
export const addEmployee = async (companyId, employeeData) => {
  console.log(`[addEmployee] Ajout employé pour companyId: ${companyId}`);
  try {
    const employeeRef = doc(collection(db, "clients", companyId, "employees"));
    await setDoc(employeeRef, employeeData);
    console.log(`[addEmployee] Employé ajouté, ID: ${employeeRef.id}`);
    toast.success("L'employé a été ajouté avec succès dans la base de données !");
    return { id: employeeRef.id, ...employeeData };
  } catch (error) {
    console.error(`[addEmployee] Erreur: ${error.message}`);
    toast.error(`Erreur lors de la création de l'employé : Impossible d'ajouter l'employé dans la base de données. Veuillez vérifier votre connexion internet et réessayer.`);
    throw error;
  }
};

// Met à jour un employé
export const updateEmployee = async (companyId, employeeId, updatedData) => {
  console.log(`[updateEmployee] Mise à jour employé ID: ${employeeId}`);
  try {
    const employeeRef = doc(db, "clients", companyId, "employees", employeeId);
    await updateDoc(employeeRef, updatedData);
    console.log(`[updateEmployee] Employé mis à jour`);
    toast.success("Les informations de l'employé ont été mises à jour avec succès !");
  } catch (error) {
    console.error(`[updateEmployee] Erreur: ${error.message}`);
    toast.error(`Erreur lors de la mise à jour : Impossible de modifier les informations de l'employé. Veuillez vérifier votre connexion internet et réessayer.`);
    throw error;
  }
};

// Supprime un employé
export const deleteEmployee = async (companyId, employeeId) => {
  console.log(`[deleteEmployee] Suppression employé ID: ${employeeId}`);
  try {
    const employeeRef = doc(db, "clients", companyId, "employees", employeeId);
    await deleteDoc(employeeRef);
    console.log(`[deleteEmployee] Employé supprimé`);
    toast.success("L'employé a été supprimé avec succès de la base de données !");
  } catch (error) {
    console.error(`[deleteEmployee] Erreur: ${error.message}`);
    toast.error(`Erreur lors de la suppression : Impossible de supprimer l'employé de la base de données. Veuillez vérifier votre connexion internet et réessayer.`);
    throw error;
  }
};

export const updateCompanyUsers = async (companyId, newCount) => {
  console.log(`[updateCompanyUsers] Mise à jour nombre d'utilisateurs: ${newCount}`);
  try {
    const companyRef = doc(db, "clients", companyId);
    await updateDoc(companyRef, { currentUsers: newCount });
    console.log(`[updateCompanyUsers] Nombre d'utilisateurs mis à jour`);
  } catch (error) {
    console.error(`[updateCompanyUsers] Erreur: ${error.message}`);
    toast.error(`Erreur lors de la mise à jour du nombre d'utilisateurs : La modification n'a pas pu être enregistrée. Veuillez réessayer.`);
    throw error;
  }
};

export const savePaySlip = async (companyId, employeeId, paySlipData) => {
  console.log(`[savePaySlip] Sauvegarde fiche de paie pour employé ID: ${employeeId}`);
  try {
    const employeeRef = doc(db, "clients", companyId, "employees", employeeId);
    const employeeDoc = await getDoc(employeeRef);
    const currentPaySlips = employeeDoc.exists() ? employeeDoc.data().payslips || [] : [];
    const updatedPaySlips = [...currentPaySlips, { ...paySlipData, date: new Date().toISOString() }];
    await updateDoc(employeeRef, { payslips: updatedPaySlips });
    console.log(`[savePaySlip] Fiche de paie enregistrée`);
    toast.success("La fiche de paie a été enregistrée avec succès dans la base de données !");
    return updatedPaySlips;
  } catch (error) {
    console.error(`[savePaySlip] Erreur: ${error.message}`);
    toast.error(`Erreur lors de l'enregistrement de la fiche de paie : Le document n'a pas pu être sauvegardé. Veuillez vérifier votre connexion internet et réessayer.`);
    throw error;
  }
};

export const saveContractData = async (companyId, employeeId, contractData) => {
  console.log(`[saveContractData] Sauvegarde contrat pour employé ID: ${employeeId}`);
  try {
    const employeeRef = doc(db, "clients", companyId, "employees", employeeId);
    await updateDoc(employeeRef, { contract: { ...contractData, generatedAt: new Date().toISOString() } });
    console.log(`[saveContractData] Contrat enregistré`);
    toast.success("Le contrat a été enregistré avec succès dans la base de données !");
  } catch (error) {
    console.error(`[saveContractData] Erreur: ${error.message}`);
    toast.error(`Erreur lors de l'enregistrement du contrat : Le document n'a pas pu être sauvegardé. Veuillez vérifier votre connexion internet et réessayer.`);
    throw error;
  }
};

// Récupère les données de l'entreprise
export const getCompanyData = async (userId) => {
  console.log(`[getCompanyData] Récupération données entreprise pour userId: ${userId}`);
  try {
    const clientsQuery = query(collection(db, "clients"), where("adminUid", "==", userId));
    const clientsSnapshot = await getDocs(clientsQuery);
    if (!clientsSnapshot.empty) {
      const companyDoc = clientsSnapshot.docs[0];
      const companyId = companyDoc.id;
      console.log(`[getCompanyData] Données entreprise chargées, companyId: ${companyId}`);
      return { id: companyId, ...companyDoc.data() };
    }
    console.warn("[getCompanyData] Aucun client trouvé");
    toast.error("Aucun client trouvé pour cet utilisateur.");
    return null;
  } catch (error) {
    console.error(`[getCompanyData] Erreur: ${error.message}`);
    toast.error(`Erreur chargement données entreprise: ${error.message}`);
    throw error;
  }
};