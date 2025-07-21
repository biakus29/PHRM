// src/utils/validationUtils.js
import { toast } from "react-toastify";

// Valide les données d'un nouvel employé
export const validateEmployeeData = (employeeData) => {
  console.log("[validateEmployeeData] Validation des données employé");
  const requiredFields = [
    { key: "name", label: "Nom" },
    { key: "email", label: "Email" },
    { key: "poste", label: "Poste" },
    { key: "hireDate", label: "Date d'embauche" },
    { key: "cnpsNumber", label: "Numéro CNPS" },
    { key: "professionalCategory", label: "Catégorie professionnelle" },
    { key: "baseSalary", label: "Salaire de base" }
  ];
  const errors = [];

  for (const field of requiredFields) {
    if (!employeeData[field.key] || (typeof employeeData[field.key] === "string" && !employeeData[field.key].trim())) {
      errors.push(`Le champ ${field.label} est obligatoire pour créer un employé.`);
    }
  }

  if (employeeData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeData.email)) {
    errors.push("L'adresse email n'est pas dans un format valide (exemple: nom@domaine.com).");
  }

  if (employeeData.phone && !/^\+?\d{7,}$/.test(employeeData.phone)) {
    errors.push("Le numéro de téléphone doit contenir au moins 7 chiffres et peut commencer par un '+' (exemple: +237612345678).");
  }

  if (employeeData.baseSalary && (isNaN(employeeData.baseSalary) || Number(employeeData.baseSalary) <= 0)) {
    errors.push("Le salaire de base doit être un montant valide supérieur à 0 FCFA.");
  }

  if (errors.length > 0) {
    console.warn("[validateEmployeeData] Erreurs de validation:", errors);
    errors.forEach((error) => toast.error(error));
    return false;
  }

  console.log("[validateEmployeeData] Données employé valides");
  return true;
};

// Valide les données d'une absence
export const validateAbsenceData = (absenceData) => {
  console.log("[validateAbsenceData] Validation des données absence");
  const requiredFields = [
    { key: "employeeId", label: "Employé" },
    { key: "date", label: "Date" },
    { key: "reason", label: "Motif" },
    { key: "duration", label: "Durée" }
  ];
  const errors = [];

  for (const field of requiredFields) {
    if (!absenceData[field.key] || (typeof absenceData[field.key] === "string" && !absenceData[field.key].trim())) {
      errors.push(`Veuillez sélectionner/saisir ${field.label.toLowerCase()} de l'absence.`);
    }
  }

  if (absenceData.duration && (isNaN(absenceData.duration) || Number(absenceData.duration) <= 0)) {
    errors.push("La durée de l'absence doit être un nombre de jours valide supérieur à 0.");
  }

  if (absenceData.date && new Date(absenceData.date) > new Date()) {
    errors.push("La date de l'absence ne peut pas être dans le futur. Veuillez sélectionner une date valide.");
  }

  if (errors.length > 0) {
    console.warn("[validateAbsenceData] Erreurs de validation:", errors);
    errors.forEach((error) => toast.error(error));
    return false;
  }

  console.log("[validateAbsenceData] Données absence valides");
  return true;
};

// Valide une notification
export const validateNotification = (notification) => {
  console.log("[validateNotification] Validation de la notification");
  if (!notification.trim()) {
    console.warn("[validateNotification] Message vide");
    toast.error("Le message de la notification ne peut pas être vide. Veuillez saisir un message à envoyer aux employés.");
    return false;
  }
  console.log("[validateNotification] Notification valide");
  return true;
};