import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiFileText, FiX, FiFile, FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import { jsPDF } from "jspdf";
import { displayDateWithOptions } from "../utils/displayUtils";

// Fonction utilitaire pour échapper le texte
const escapeText = (str) => (str ? String(str).replace(/[\n\r]/g, " ") : "");

// Fonction pour calculer la taille de localStorage
const getLocalStorageSize = () => {
  let total = 0;
  for (const x in localStorage) {
    if (localStorage.hasOwnProperty(x)) {
      total += ((localStorage[x].length + x.length) * 2);
    }
  }
  return total / 1024 / 1024; // Taille en Mo
};

// Fonction pour gérer l'upload et le stockage du logo dans localStorage
const handleLogoUpload = (file, companyId, callback) => {
  console.log(`[handleLogoUpload] Début upload logo, type: ${file.type}, taille: ${(file.size / 1024).toFixed(2)} Ko`);
  if (!file.type.match(/image\/(png|jpeg)/)) {
    console.warn("[handleLogoUpload] Format d'image non supporté:", file.type);
    toast.error("Seuls les formats PNG et JPEG sont supportés.");
    return null;
  }
  if (file.size > 2 * 1024 * 1024) {
    console.warn("[handleLogoUpload] Fichier trop volumineux:", (file.size / 1024).toFixed(2), "Ko");
    toast.error("Le fichier est trop volumineux. Utilisez une image de moins de 2 Mo.");
    return null;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    console.log(`[handleLogoUpload] Taille de la dataURL: ${(dataUrl.length / 1024).toFixed(2)} Ko`);
    if (getLocalStorageSize() + dataUrl.length / 1024 / 1024 > 4.5) {
      console.warn(`[handleLogoUpload] localStorage presque plein (${getLocalStorageSize().toFixed(2)} Mo)`);
      toast.warn("Stockage local presque plein. Videz le cache ou réduisez la taille du logo.");
      return;
    }
    try {
      localStorage.setItem(`logo_${companyId}`, dataUrl);
      console.log(`[handleLogoUpload] Logo stocké dans localStorage pour companyId: ${companyId}`);
      callback(dataUrl);
    } catch (e) {
      console.error(`[handleLogoUpload] Échec stockage localStorage: ${e.message}`);
      toast.error("Échec du stockage local : limite dépassée. Réduisez la taille du logo.");
    }
  };
  reader.onerror = () => {
    console.error("[handleLogoUpload] Erreur lecture fichier:", reader.error.message);
    toast.error("Erreur lors de la lecture du fichier image.");
  };
  reader.readAsDataURL(file);
  return null;
};

// Centralized error handler
const handleError = (error, message) => {
  console.error(`[${message}] Erreur: ${error.message}`);
  toast.error(`${message}: ${error.message}`);
};

const PaySlipGenerator = ({ employee, companyData, onGenerate, onClose, isContractMode }) => {
  const [formData, setFormData] = useState({
    // Champs communs
    salaryBrut: employee.contract?.salaryBrut || 500000,
    transportAllowance: employee.contract?.transportAllowance || 0,
    hireDate: employee.contract?.hireDate || "2025-05-02", // Mis à jour avec la date du PDF
    companyRepresentative: employee.contract?.companyRepresentative || "NDJOCK Parfait", // Mis à jour avec le PDF
    leaveDays: employee.contract?.leaveDays || 18,
    // Champs spécifiques au contrat
    trialPeriod: employee.contract?.trialPeriod || "1 mois",
    workLocation: employee.contract?.workLocation || "Yaoundé", // Mis à jour avec le PDF
    contractType: employee.contract?.contractType || "CDI",
    employeeDOB: employee.dateOfBirth || employee.contract?.employeeDOB || "2025-06-02", // Mis à jour avec le PDF
    employeeFather: employee.contract?.employeeFather || "bbb",
    employeeMother: employee.contract?.employeeMother || "bbb",
    employeeResidence: employee.contract?.employeeResidence || "bbb",
    employeeMaritalStatus: employee.contract?.employeeMaritalStatus || "bbb",
    employeeEmergencyContact: employee.contract?.employeeEmergencyContact || "bbb",
    employeeSpouse: employee.contract?.employeeSpouse || "Non applicable",
    employeeClassification: employee.contract?.employeeClassification || "DRH", // Mis à jour avec le PDF
    // Champs spécifiques à la fiche de paie
    hoursPerMonth: employee.hoursPerMonth || 160,
    daysWorked: 30,
    overtimeHoursRegular: employee.overtimeHours?.regular || 0,
    overtimeHoursSunday: employee.overtimeHours?.sunday || 0,
    overtimeHoursNight: employee.overtimeHours?.night || 0,
    payPeriod: "2025-06",
    seniority: employee.seniority || 0,
    childrenCount: employee.childrenCount || 0,
    diplomas: employee.diplomas || "",
    echelon: employee.echelon || "",
    department: employee.department || "",
    service: employee.service || "",
    supervisor: employee.supervisor || "",
    // Ajout des primes et indemnités
    primes: [],
    indemnites: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [logoData, setLogoData] = useState(localStorage.getItem(`logo_${companyData.id}`));

  useEffect(() => {
    if (isContractMode && employee.contract) {
      console.log(`[PaySlipGenerator] Pré-remplissage formulaire contrat pour employé: ${employee.name}`);
      setFormData((prev) => ({
        ...prev,
        ...employee.contract,
        hoursPerMonth: prev.hoursPerMonth,
        daysWorked: prev.daysWorked,
        overtimeHoursRegular: prev.overtimeHoursRegular,
        overtimeHoursSunday: prev.overtimeHoursSunday,
        overtimeHoursNight: prev.overtimeHoursNight,
        payPeriod: prev.payPeriod,
        seniority: prev.seniority,
        childrenCount: prev.childrenCount,
        diplomas: prev.diplomas,
        echelon: prev.echelon,
        department: prev.department,
        service: prev.service,
        supervisor: prev.supervisor,
      }));
    }
  }, [isContractMode, employee.contract]);

  const tdlRates = [
    { min: 62000, max: 75000, amount: 250 },
    { min: 75001, max: 100000, amount: 500 },
    { min: 100001, max: 125000, amount: 750 },
    { min: 125001, max: 150000, amount: 1000 },
    { min: 150001, max: 200000, amount: 1250 },
    { min: 200001, max: 250000, amount: 1500 },
    { min: 250001, max: 300000, amount: 2000 },
    { min: 300001, max: 500000, amount: 2250 },
    { min: 500001, max: Infinity, amount: 2500 },
  ];

  const validateInput = (data, isContractMode) => {
    console.log(`[PaySlipGenerator] Validation des entrées, mode contrat: ${isContractMode}`);
    const errors = {};
    if (!data.salaryBrut || data.salaryBrut < 36270)
      errors.salaryBrut = "Le salaire brut doit être d'au moins 36 270 FCFA.";
    if (data.transportAllowance < 0)
      errors.transportAllowance = "L'indemnité de transport ne peut pas être négative.";
    if (isContractMode) {
      if (!data.trialPeriod)
        errors.trialPeriod = "Indiquez la période d'essai.";
      if (!data.workLocation)
        errors.workLocation = "Le lieu de travail est obligatoire.";
      if (!data.hireDate)
        errors.hireDate = "La date d'embauche est obligatoire.";
      if (!data.contractType)
        errors.contractType = "Choisissez le type de contrat (CDI ou CDD).";
      if (!data.companyRepresentative)
        errors.companyRepresentative = "Le nom du représentant de l'entreprise est requis.";
      if (!data.leaveDays || data.leaveDays <= 0)
        errors.leaveDays = "Entrez un nombre de jours de congé positif.";
      if (!data.employeeDOB)
        errors.employeeDOB = "La date de naissance est obligatoire.";
      if (!data.employeeFather)
        errors.employeeFather = "Le nom du père est requis.";
      if (!data.employeeMother)
        errors.employeeMother = "Le nom de la mère est requis.";
      if (!data.employeeResidence)
        errors.employeeResidence = "L'adresse de résidence est obligatoire.";
      if (!data.employeeMaritalStatus)
        errors.employeeMaritalStatus = "L'état matrimonial est requis.";
      if (!data.employeeEmergencyContact)
        errors.employeeEmergencyContact = "Le contact d'urgence est obligatoire.";
      if (!data.employeeClassification)
        errors.employeeClassification = "La classification professionnelle est obligatoire.";
    } else {
      if (!data.hoursPerMonth || data.hoursPerMonth <= 0)
        errors.hoursPerMonth = "Entrez un nombre d'heures par mois positif.";
      if (!data.daysWorked || data.daysWorked <= 0 || data.daysWorked > 31)
        errors.daysWorked = "Les jours travaillés doivent être entre 1 et 31.";
      if (data.overtimeHoursRegular < 0)
        errors.overtimeHoursRegular = "Les heures supplémentaires régulières ne peuvent pas être négatives.";
      if (data.overtimeHoursSunday < 0)
        errors.overtimeHoursSunday = "Les heures supplémentaires du dimanche ne peuvent pas être négatives.";
      if (data.overtimeHoursNight < 0)
        errors.overtimeHoursNight = "Les heures supplémentaires de nuit ne peuvent pas être négatives.";
      if (!data.payPeriod)
        errors.payPeriod = "La période de paie est obligatoire.";
      if (data.seniority < 0)
        errors.seniority = "L'ancienneté ne peut pas être négative.";
      if (data.childrenCount < 0)
        errors.childrenCount = "Le nombre d'enfants ne peut pas être négatif.";
    }
    return errors;
  };

  const calculateRates = (salaryBrut, hoursPerMonth, daysWorked) => {
    console.log(`[PaySlipGenerator] Calcul des taux pour salaire brut: ${salaryBrut}, heures/mois: ${hoursPerMonth}, jours travaillés: ${daysWorked}`);
    const rates = {
      monthlyRate: salaryBrut,
      dailyRate: daysWorked > 0 ? salaryBrut / daysWorked : 0,
      hourlyRate: hoursPerMonth > 0 ? salaryBrut / hoursPerMonth : 0,
    };
    console.log(`[PaySlipGenerator] Résultat calcul taux: ${JSON.stringify(rates)}`);
    return rates;
  };

  const calculateOvertimePay = (hourlyRate, overtimeHoursRegular, overtimeHoursSunday, overtimeHoursNight) => {
    console.log(`[PaySlipGenerator] Calcul heures supplémentaires, taux horaire: ${hourlyRate}`);
    const overtimePay = {
      firstTranche: Math.min(overtimeHoursRegular, 8) * hourlyRate * 1.2,
      secondTranche: Math.min(Math.max(overtimeHoursRegular - 8, 0), 8) * hourlyRate * 1.3,
      thirdTranche: Math.max(overtimeHoursRegular - 16, 0) * hourlyRate * 1.4,
      sunday: overtimeHoursSunday * hourlyRate * 1.4,
      night: overtimeHoursNight * hourlyRate * 1.5,
    };
    const total = Object.values(overtimePay).reduce((sum, val) => sum + val, 0);
    console.log(`[PaySlipGenerator] Heures supplémentaires: ${JSON.stringify(overtimePay)}, Total: ${total}`);
    return total;
  };

  const calculateDeductions = (salaryBrut) => {
    console.log(`[PaySlipGenerator] Calcul des retenues pour salaire brut: ${salaryBrut}`);
    const taxableSalary = salaryBrut;
    const pvidRate = 0.042; // 4.2% à la charge de l'employé
    const pvidCap = 750000;
    const pvid = Math.min(taxableSalary, pvidCap) * pvidRate;

    // Calcul du salaire net catégoriel mensuel (SNC)
    const annualTaxableSalary = taxableSalary * 12;
    const professionalExpenses = annualTaxableSalary * 0.30;
    const annualPvid = pvid * 12;
    const annualAbattement = 500000;
    const annualNetCategoriel = annualTaxableSalary - professionalExpenses - annualPvid - annualAbattement;
    const monthlyNetCategoriel = annualNetCategoriel > 0 ? annualNetCategoriel / 12 : 0;

    // Calcul de l'IRPP selon les tranches
    let irpp = 0;
    if (monthlyNetCategoriel > 0) {
      if (monthlyNetCategoriel <= 166667) {
        irpp = monthlyNetCategoriel * 0.10;
      } else if (monthlyNetCategoriel <= 250000) {
        irpp = 16667 + (monthlyNetCategoriel - 166667) * 0.15;
      } else if (monthlyNetCategoriel <= 416667) {
        irpp = 29167 + (monthlyNetCategoriel - 250000) * 0.25;
      } else {
        irpp = 70833.75 + (monthlyNetCategoriel - 416667) * 0.35;
      }
    }

    const cac = irpp * 0.10; // 10% de l'IRPP
    const cfc = taxableSalary * 0.01; // 1% du salaire brut
    // RAV uniquement si salaire brut > 50000
    const rav = salaryBrut > 50000 ? 750 : 0; // 750 FCFA ou adapte selon ta règle
    const tdl = 0; // Toujours 0
    const fne = 0; // À confirmer si applicable

    const deductions = {
      pvid,
      irpp,
      cac,
      cfc,
      rav,
      tdl,
      fne,
      communalTax: 0,
      total: pvid + irpp + cac + cfc + rav + tdl + fne,
    };
    console.log(`[PaySlipGenerator] Résultat calcul retenues: ${JSON.stringify(deductions)}`);
    return deductions;
  };

  const generatePaySlipData = () => {
    console.log("[PaySlipGenerator] Début génération données fiche de paie");
    const errors = validateInput(formData, false);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Certains champs pour la fiche de paie sont incorrects. Vérifiez les erreurs.");
      return null;
    }

    const {
      salaryBrut,
      hoursPerMonth,
      daysWorked,
      overtimeHoursRegular,
      overtimeHoursSunday,
      overtimeHoursNight,
      seniority,
      childrenCount,
      payPeriod,
    } = formData;

    const rates = calculateRates(salaryBrut, hoursPerMonth, daysWorked);
    const workedDaysPay = rates.dailyRate * daysWorked;
    const overtimePay = calculateOvertimePay(
      rates.hourlyRate,
      overtimeHoursRegular,
      overtimeHoursSunday,
      overtimeHoursNight
    );
    const deductions = calculateDeductions(salaryBrut);
    const totalRemuneration = salaryBrut + overtimePay;
    const netSalary = totalRemuneration - deductions.total;

    const paySlipData = {
      employer: {
        companyName: companyData.name || "VIGILCAM SECURITY & SERVICES SARL",
        address: companyData.address || "BP 16194 Yaoundé",
        cnpsNumber: companyData.cnpsNumber || "Non spécifié",
      },
      employee: {
        lastName: employee.name?.split(" ")[1] || "TEST123",
        firstName: employee.name?.split(" ")[0] || "",
        matricule: employee.matricule || "N/A",
        professionalClassification: employee.poste || "DRH",
        diplomas: formData.diplomas || "Non spécifié",
        echelon: formData.echelon || "Non spécifié",
        department: formData.department || "Non spécifié",
        service: formData.service || "Non spécifié",
        supervisor: formData.supervisor || "Non spécifié",
      },
      salaryDetails: {
        ...rates,
      },
      remuneration: {
        workedDays: workedDaysPay,
        overtime: overtimePay,
        total: totalRemuneration,
      },
      leaves: {
        days: parseInt(formData.leaveDays) + seniority * 0.2 + childrenCount * 2,
      },
      deductions,
      calculations: {
        taxableSalary,
        netSalary,
      },
      generatedAt: new Date().toISOString(),
      payPeriod,
      // Ajout des primes et indemnités
      primes: formData.primes,
      indemnites: formData.indemnites,
    };
    console.log(`[PaySlipGenerator] Données fiche de paie générées: ${JSON.stringify(paySlipData, null, 2)}`);
    return paySlipData;
  };

  const generateContractData = () => {
    console.log("[PaySlipGenerator] Début génération données contrat");
    const errors = validateInput(formData, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Certains champs pour le contrat sont incorrects. Vérifiez les erreurs.");
      return null;
    }

    const contractData = {
      salaryBrut: formData.salaryBrut,
      transportAllowance: formData.transportAllowance,
      trialPeriod: formData.trialPeriod,
      workLocation: formData.workLocation,
      hireDate: formData.hireDate,
      contractType: formData.contractType,
      companyRepresentative: formData.companyRepresentative,
      leaveDays: formData.leaveDays,
      employeeDOB: formData.employeeDOB,
      employeeFather: formData.employeeFather,
      employeeMother: formData.employeeMother,
      employeeResidence: formData.employeeResidence,
      employeeMaritalStatus: formData.employeeMaritalStatus,
      employeeEmergencyContact: formData.employeeEmergencyContact,
      employeeSpouse: formData.employeeSpouse,
      employeeClassification: formData.employeeClassification,
      generatedAt: new Date().toISOString(),
    };
    console.log(`[PaySlipGenerator] Données contrat générées: ${JSON.stringify(contractData, null, 2)}`);
    return contractData;
  };

  const generateContractPDF = async () => {
    console.log(`[PaySlipGenerator] Début génération contrat PDF pour employé: ${employee.name}`);
    try {
      const contractData = generateContractData();
      if (!contractData) return;

      const {
        employeeDOB,
        employeeFather,
        employeeMother,
        employeeResidence,
        employeeMaritalStatus,
        employeeEmergencyContact,
        employeeSpouse,
        trialPeriod,
        workLocation,
        salaryBrut,
        leaveDays,
        companyRepresentative,
        hireDate,
        contractType,
        employeeClassification,
      } = contractData;

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 20;
      const bottomMargin = 20;
      let y = topMargin;
      const lineHeight = 7;
      const sectionSpacing = 10;
      const majorSectionSpacing = 15;
      const pageWidth = doc.internal.pageSize.width;
      const textWidth = pageWidth - leftMargin - rightMargin;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(escapeText(companyData.name || "VIGILCAM SECURITY & SERVICES SARL"), leftMargin, y);
      y += lineHeight;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(escapeText(companyData.address || "BP 16194 Yaoundé"), leftMargin, y);
      y += lineHeight;
      doc.text(`Tél: ${escapeText(companyData.phone || "22214081")}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Représenté par ${escapeText(companyRepresentative)}, Directeur Général`, leftMargin, y);
      y += lineHeight;
      doc.text(`N° d'immatriculation CNPS: ${escapeText(companyData.cnpsNumber || "Non spécifié")}`, leftMargin, y);
      y += lineHeight;
      doc.text("CI-APRÈS DÉNOMMÉ L'EMPLOYEUR", leftMargin, y);
      y += sectionSpacing;

      if (logoData) {
        try {
          const extension = logoData.includes("image/png") ? "PNG" : "JPEG";
          doc.addImage(logoData, extension, pageWidth - rightMargin - 40, topMargin, 40, 40);
        } catch (error) {
          console.error(`[PaySlipGenerator] Erreur ajout logo: ${error.message}`);
          doc.setFillColor(200, 200, 200);
          doc.rect(pageWidth - rightMargin - 40, topMargin, 40, 40, "F");
          doc.setFontSize(8);
          doc.text("Logo non disponible", pageWidth - rightMargin - 20, topMargin + 20, { align: "center" });
          toast.warn("Erreur lors de l'ajout du logo au contrat.");
        }
      } else {
        console.warn("[PaySlipGenerator] Aucun logo disponible");
        doc.setFillColor(200, 200, 200);
        doc.rect(pageWidth - rightMargin - 40, topMargin, 40, 40, "F");
        doc.setFontSize(8);
        doc.text("Logo non disponible", pageWidth - rightMargin - 20, topMargin + 20, { align: "center" });
        toast.warn("Aucun logo chargé.");
      }

      y += majorSectionSpacing;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Et", leftMargin, y);
      y += lineHeight;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Monsieur ${escapeText(employee.name || "TEST123")}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Né le : ${escapeText(employeeDOB)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`À : ${escapeText(employee.placeOfBirth || "Non spécifié")}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Fils de : ${escapeText(employeeFather)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Et de : ${escapeText(employeeMother)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Lieu de résidence habituelle : ${escapeText(employeeResidence)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Situation de famille : ${escapeText(employeeMaritalStatus)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Nom et prénoms de l'épouse : ${escapeText(employeeSpouse || "Non applicable")}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Personne à prévenir en cas de besoin : ${escapeText(employeeEmergencyContact)}`, leftMargin, y);
      y += lineHeight;
      doc.text("CI-APRÈS DÉNOMMÉ L'EMPLOYÉ", leftMargin, y);
      y += sectionSpacing;

      doc.text("Il est établi le présent contrat qui outre les articles ci-dessous sera régi par :", leftMargin, y);
      y += lineHeight;
      doc.text("- La Loi N° 92/007 du 14 Août 1992", leftMargin + 5, y);
      y += lineHeight;
      doc.text("- Les textes pris pour son application", leftMargin + 5, y);
      y += lineHeight;
      doc.text("- La convention collective", leftMargin + 5, y);
      y += lineHeight;
      doc.text("- Le règlement intérieur de l'entreprise", leftMargin + 5, y);
      y += majorSectionSpacing;

      const articles = [
        { title: "Article 1er : Durée du contrat", content: [
          `1/ Période d'essai : ${escapeText(trialPeriod)} renouvelable une fois. Toute rupture intervenue au cours de cette période d'essai ne donne droit à aucune indemnité et peut être faite par simple lettre.`,
          `b) Durée : ${escapeText(contractType === "CDI" ? "Indéterminée" : "Déterminée")}.`,
          `2/ Effet : ${escapeText(hireDate)}, sous réserve des résultats satisfaisants de l'examen médical d'embauche.`
        ]},
        { title: "Article 2 : Fonctions", content: [
          `1/ Fonctions : ${escapeText(employee.poste || "DRH")}.`,
          `2/ Classé : ${escapeText(employeeClassification || "cdd")}.`
        ]},
        { title: "Article 3 : Lieu de travail", content: [
          `L'employé est recruté à ${escapeText(workLocation)}.`
        ]},
        { title: "Article 4 : Rémunération", content: [
          `1/ Le paiement du salaire se fera conformément aux articles 67, 68 et 69 du Code du Travail.`,
          `Salaire brut mensuel : ${parseInt(salaryBrut).toLocaleString("fr-FR")} FCFA.`
        ]},
        { title: "Article 5 : Congés", content: [
          `1/ L'employé aura droit à un congé de ${leaveDays} jours ouvrables par mois de service effectif, sous réserve des majorations de congés prévues par les textes en vigueur.`,
          `2/ La période ouvrant droit au congé est de 12 mois.`,
          `3/ Le paiement de l'allocation congé se fera conformément aux dispositions du décret n° 75/28 du 10 Janvier 1975.`
        ]},
        { title: "Article 6 : Obligation de non-concurrence", content: [
          `L'employé s'engage à consacrer tout son temps à l'exercice de son activité professionnelle. En conséquence, il s'interdit, pendant la durée du présent contrat et au moins un an après sa cessation, et ce, dans un rayon de cinquante kilomètres, toute activité professionnelle susceptible de concurrence ou de nuire à la bonne exécution du présent contrat.`
        ]},
        { title: "Article 7 : Confidentialité : Secret professionnel", content: [
          `L'employé s'interdit de divulguer ou d'utiliser à des fins personnelles toute information à caractère scientifique, technique ou commercial mise à sa disposition dans le cadre de l'exécution du présent contrat.`
        ]},
        { title: "Article 8 : Protection sociale", content: [
          `1/ L'employeur devra s'assurer à la Caisse Nationale de Prévoyance Sociale au profit de l'employé conformément à la législation en vigueur.`
        ]},
        { title: "Article 9 : Hygiène et sécurité", content: [
          `L'employeur s'engage à se conformer à toutes les prescriptions légales et réglementaires en vigueur en matière d'hygiène, de sécurité et de santé des travailleurs.`
        ]},
        { title: "Article 10 : Résiliation du contrat", content: [
          `1/ Le présent contrat pourra être résilié dans les conditions prévues aux articles 37, 39 et 43 du Code du Travail.`
        ]},
        { title: "Article 11 : Différends individuels", content: [
          `Les différends nés à l'occasion de l'exécution ou de la rupture du présent contrat relèveront de la compétence de l'Inspecteur du Travail du lieu d'exécution du contrat (art. 139 paragraphe 2) et des tribunaux prévus aux articles 138 et 139 du Code du Travail.`
        ]},
        { title: "Article 12 : Dispositions finales", content: [
          `Pour tout ce qui n'est pas précisé au présent contrat, les parties s'en remettent à la législation, à la réglementation, à la convention collective et aux usages en vigueur dans la profession au Cameroun.`
        ]},
      ];

      articles.forEach(({ title, content }, index) => {
        if (y + lineHeight + content.length * lineHeight + sectionSpacing > doc.internal.pageSize.height - bottomMargin) {
          doc.addPage();
          y = topMargin;
        }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(title, leftMargin, y);
        y += lineHeight;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        content.forEach((line) => {
          const contentH = doc.getTextDimensions(line, { maxWidth: textWidth }).h;
          if (y + contentH + sectionSpacing > doc.internal.pageSize.height - bottomMargin) {
            doc.addPage();
            y = topMargin;
          }
          doc.text(line, leftMargin + 5, y, { maxWidth: textWidth });
          y += contentH + 2;
        });
        y += sectionSpacing;
      });

      if (y + 60 > doc.internal.pageSize.height - bottomMargin) {
        doc.addPage();
        y = topMargin;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Fait à Yaoundé, le ${escapeText(hireDate)}`, leftMargin, y);
      y += majorSectionSpacing;
      doc.setFont("helvetica", "bold");
      doc.text("L'Employé", leftMargin, y);
      doc.text("L'Employeur", pageWidth - rightMargin - 60, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text("Lu et approuvé", leftMargin, y);
      doc.text("Lu et approuvé", pageWidth - rightMargin - 60, y);

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(escapeText(companyData.name || "VIGILCAM SECURITY & SERVICES SARL"), leftMargin, doc.internal.pageSize.height - 10);
        doc.text(`Page ${i}/${pageCount}`, pageWidth - rightMargin, doc.internal.pageSize.height - 10, { align: "right" });
      }

      doc.save(`contrat_travail_${escapeText(employee.name || "TEST123").replace(/\s+/g, "_")}.pdf`);
      console.log("[PaySlipGenerator] Contrat PDF sauvegardé");
      onGenerate(contractData);
      toast.success(`Contrat généré pour ${employee.name || "TEST123"} !`);
    } catch (error) {
      handleError(error, "Erreur génération contrat PDF");
    }
  };

  const generatePaySlipPDF = async (paySlipData) => {
    console.log(`[PaySlipGenerator] Début génération fiche de paie PDF pour employé: ${paySlipData.employee.firstName} ${paySlipData.employee.lastName}`);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const leftMargin = 20;
      const rightMargin = 20;
      const topMargin = 20;
      const bottomMargin = 20;
      let y = topMargin;
      const lineHeight = 7;
      const pageWidth = doc.internal.pageSize.width;
      const textWidth = pageWidth - leftMargin - rightMargin;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(escapeText(paySlipData.employer.companyName), leftMargin, y);
      y += lineHeight;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(escapeText(paySlipData.employer.address), leftMargin, y);
      y += lineHeight;
      doc.text(`N° CNPS: ${escapeText(paySlipData.employer.cnpsNumber)}`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "bold");
      doc.text("FICHE DE PAIE", leftMargin, y);
      y += lineHeight * 2;
      doc.setFont("helvetica", "normal");
      doc.text(`Matricule: ${escapeText(paySlipData.employee.matricule)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Nom & Prénoms: ${escapeText(`${paySlipData.employee.firstName} ${paySlipData.employee.lastName}`)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Date & Lieu de naissance: ${escapeText(`${formData.employeeDOB || "Non spécifié"} ${employee.placeOfBirth || "Non spécifié"}`)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Date embauche: ${escapeText(formData.hireDate)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Diplômes: ${escapeText(paySlipData.employee.diplomas)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Catégorie: ${escapeText(paySlipData.employee.professionalClassification)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Échelon: ${escapeText(paySlipData.employee.echelon)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Département: ${escapeText(paySlipData.employee.department)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Service: ${escapeText(paySlipData.employee.service)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Poste: ${escapeText(paySlipData.employee.professionalClassification)}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Superviseur: ${escapeText(paySlipData.employee.supervisor)}`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "bold");
      doc.text("DÉTAILS DE LA RÉMUNÉRATION", leftMargin, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text(`Salaire brut: ${paySlipData.salaryDetails.monthlyRate.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`Heures supplémentaires: ${paySlipData.remuneration.overtime.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`Total rémunération: ${paySlipData.remuneration.total.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight * 2;

      // --- Aperçu JSX : à placer juste après la section salaire brut/net ---
      {!isContractMode && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bloc Primes */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Primes</div>
            {formData.primes && formData.primes.length > 0 ? (
              <>
                {formData.primes.map((prime, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{prime.label ?? prime.type ?? ""}</span>
                    <span>{Number(prime.montant || 0).toLocaleString()} FCFA</span>
                  </div>
                ))}
                <div className="font-bold mt-2 flex justify-between border-t pt-2">
                  <span>Total Primes :</span>
                  <span>
                    {formData.primes.reduce((acc, p) => acc + Number(p.montant || 0), 0).toLocaleString()} FCFA
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Aucune prime</div>
            )}
          </div>
          {/* Bloc Indemnités */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Indemnités</div>
            {formData.indemnites && formData.indemnites.length > 0 ? (
              <>
                {formData.indemnites.map((indem, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{indem.label ?? indem.type ?? ""}</span>
                    <span>{Number(indem.montant || 0).toLocaleString()} FCFA</span>
                  </div>
                ))}
                <div className="font-bold mt-2 flex justify-between border-t pt-2">
                  <span>Total Indemnités :</span>
                  <span>
                    {formData.indemnites.reduce((acc, i) => acc + Number(i.montant || 0), 0).toLocaleString()} FCFA
                  </span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm">Aucune indemnité</div>
            )}
          </div>
        </div>
      )}
      // --- Export PDF : après la section rémunération, avant les déductions ---
      // ... après y += lineHeight * 2; (après total rémunération)
      const primes = paySlipData.primes || [];
      const indemnites = paySlipData.indemnites || [];
      const primesTotal = primes.reduce((acc, p) => acc + Number(p.value || p.montant || 0), 0);
      const indemnitesTotal = indemnites.reduce((acc, i) => acc + Number(i.value || i.montant || 0), 0);

      doc.setFont("helvetica", "bold");
      doc.text("Primes :", leftMargin, y);
      doc.setFont("helvetica", "normal");
      primes.forEach((p, i) => {
        doc.text(`${p.label ?? p.type ?? ""} – ${Number(p.value || p.montant || 0).toLocaleString()} FCFA`, leftMargin + 10, y + lineHeight * (i + 1));
      });
      doc.setFont("helvetica", "bold");
      doc.text(`Total Primes : ${primesTotal.toLocaleString()} FCFA`, leftMargin, y + lineHeight * (primes.length + 1));
      y += lineHeight * (primes.length + 3);

      doc.setFont("helvetica", "bold");
      doc.text("Indemnités :", leftMargin, y);
      doc.setFont("helvetica", "normal");
      indemnites.forEach((indem, j) => {
        doc.text(`${indem.label ?? indem.type ?? ""} – ${Number(indem.value || indem.montant || 0).toLocaleString()} FCFA`, leftMargin + 10, y + lineHeight * (j + 1));
      });
      doc.setFont("helvetica", "bold");
      doc.text(`Total Indemnités : ${indemnitesTotal.toLocaleString()} FCFA`, leftMargin, y + lineHeight * (indemnites.length + 1));
      y += lineHeight * (indemnites.length + 3);

      doc.setFont("helvetica", "bold");
      doc.text("DÉTAILS DES RETENUES", leftMargin, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      doc.text(`CNPS (PVID): ${paySlipData.deductions.pvid.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`IRPP: ${paySlipData.deductions.irpp.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`CAC: ${paySlipData.deductions.cac.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`CFC: ${paySlipData.deductions.cfc.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`RAV: ${paySlipData.deductions.rav.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`TDL: ${paySlipData.deductions.tdl.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`FNE: ${paySlipData.deductions.fne.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`Total retenues: ${paySlipData.deductions.total.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "bold");
      doc.text(`Net à payer: ${paySlipData.calculations.netSalary.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "normal");
      doc.text(`Période: ${paySlipData.payPeriod}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Généré le: ${displayDateWithOptions(paySlipData.generatedAt)}`, leftMargin, y);

      doc.save(`fiche_paie_${paySlipData.employee.firstName}_${paySlipData.employee.lastName}_${paySlipData.payPeriod}.pdf`);
      console.log("[PaySlipGenerator] Fiche de paie PDF sauvegardée");
      toast.success(`Fiche de paie générée pour ${paySlipData.employee.firstName} ${paySlipData.employee.lastName} !`);
    } catch (error) {
      handleError(error, "Erreur génération fiche de paie PDF");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`[PaySlipGenerator] Soumission formulaire, mode contrat: ${isContractMode}`);
    if (isContractMode) {
      generateContractPDF();
    } else {
      const paySlipData = generatePaySlipData();
      if (paySlipData) {
        onGenerate(paySlipData);
        generatePaySlipPDF(paySlipData);
        console.log(`[PaySlipGenerator] Fiche de paie générée pour ${employee.name}`);
        toast.success(`Fiche de paie de ${employee.name || "l'employé"} générée avec succès !`);
      }
    }
  };

  const onLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleLogoUpload(file, companyData.id, (dataUrl) => {
        if (dataUrl) {
          setLogoData(dataUrl);
          toast.success("Logo chargé avec succès !");
        }
      });
    }
  };

  return (
    <ModalWrapper>
      <Modal>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isContractMode
            ? `Gérer le contrat pour ${employee.name || "Nom Prénom"}`
            : `Créer une fiche de paie pour ${employee.name || "Nom Prénom"}`}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo de l'entreprise</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={onLogoChange}
                className="p-2 border border-gray-300 rounded-lg"
              />
              <FiUpload className="h-5 w-5 text-gray-600" />
            </div>
            {logoData && (
              <img src={logoData} alt="Logo Preview" className="mt-2 h-16 w-16 object-contain" />
            )}
          </div>
          <InputField
            label="Salaire brut (FCFA)"
            type="number"
            value={formData.salaryBrut}
            onChange={(e) =>
              setFormData({ ...formData, salaryBrut: parseFloat(e.target.value) || 0 })
            }
            error={formErrors.salaryBrut}
            required
            min="36270"
          />
          {!isContractMode && (
            <>
              <InputField
                label="Heures par mois"
                type="number"
                value={formData.hoursPerMonth}
                onChange={(e) =>
                  setFormData({ ...formData, hoursPerMonth: parseFloat(e.target.value) || 0 })
                }
                error={formErrors.hoursPerMonth}
                required
                min="0"
              />
              <InputField
                label="Jours travaillés"
                type="number"
                value={formData.daysWorked}
                onChange={(e) =>
                  setFormData({ ...formData, daysWorked: parseFloat(e.target.value) || 0 })
                }
                error={formErrors.daysWorked}
                required
                min="1"
                max="31"
              />
              <InputField
                label="Heures supplémentaires (régulières)"
                type="number"
                value={formData.overtimeHoursRegular}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overtimeHoursRegular: parseFloat(e.target.value) || 0,
                  })
                }
                error={formErrors.overtimeHoursRegular}
                min="0"
              />
              <InputField
                label="Heures supplémentaires (dimanche)"
                type="number"
                value={formData.overtimeHoursSunday}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overtimeHoursSunday: parseFloat(e.target.value) || 0,
                  })
                }
                error={formErrors.overtimeHoursSunday}
                min="0"
              />
              <InputField
                label="Heures supplémentaires (nuit)"
                type="number"
                value={formData.overtimeHoursNight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overtimeHoursNight: parseFloat(e.target.value) || 0,
                  })
                }
                error={formErrors.overtimeHoursNight}
                min="0"
              />
              <InputField
                label="Période de paie (YYYY-MM)"
                type="month"
                value={formData.payPeriod}
                onChange={(e) => setFormData({ ...formData, payPeriod: e.target.value })}
                error={formErrors.payPeriod}
                required
              />
              <InputField
                label="Ancienneté (années)"
                type="number"
                value={formData.seniority}
                onChange={(e) =>
                  setFormData({ ...formData, seniority: parseFloat(e.target.value) || 0 })
                }
                error={formErrors.seniority}
                required
                min="0"
              />
              <InputField
                label="Nombre d'enfants (min. 6 ans)"
                type="number"
                value={formData.childrenCount}
                onChange={(e) =>
                  setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })
                }
                error={formErrors.childrenCount}
                min="0"
              />
              <InputField
                label="Diplômes"
                type="text"
                value={formData.diplomas}
                onChange={(e) => setFormData({ ...formData, diplomas: e.target.value })}
              />
              <InputField
                label="Échelon"
                type="text"
                value={formData.echelon}
                onChange={(e) => setFormData({ ...formData, echelon: e.target.value })}
              />
              <InputField
                label="Département"
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              <InputField
                label="Service"
                type="text"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
              />
              <InputField
                label="Superviseur"
                type="text"
                value={formData.supervisor}
                onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
              />
            </>
          )}
          {isContractMode && (
            <>
              <InputField
                label="Période d'essai"
                type="text"
                value={formData.trialPeriod}
                onChange={(e) => setFormData({ ...formData, trialPeriod: e.target.value })}
                error={formErrors.trialPeriod}
                required
              />
              <InputField
                label="Lieu de travail"
                type="text"
                value={formData.workLocation}
                onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                error={formErrors.workLocation}
                required
              />
              <InputField
                label="Date d'embauche"
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                error={formErrors.hireDate}
                required
              />
              <InputField
                label="Type de contrat"
                type="select"
                value={formData.contractType}
                onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                error={formErrors.contractType}
                required
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </InputField>
              <InputField
                label="Jours de congé annuels"
                type="number"
                value={formData.leaveDays}
                onChange={(e) =>
                  setFormData({ ...formData, leaveDays: parseInt(e.target.value) || 0 })
                }
                error={formErrors.leaveDays}
                required
                min="1"
              />
              <InputField
                label="Représentant de l'entreprise"
                type="text"
                value={formData.companyRepresentative}
                onChange={(e) =>
                  setFormData({ ...formData, companyRepresentative: e.target.value })
                }
                error={formErrors.companyRepresentative}
                required
              />
              <InputField
                label="Date de naissance de l'employé"
                type="date"
                value={formData.employeeDOB}
                onChange={(e) => setFormData({ ...formData, employeeDOB: e.target.value })}
                error={formErrors.employeeDOB}
                required
              />
              <InputField
                label="Nom du père"
                type="text"
                value={formData.employeeFather}
                onChange={(e) => setFormData({ ...formData, employeeFather: e.target.value })}
                error={formErrors.employeeFather}
                required
              />
              <InputField
                label="Nom de la mère"
                type="text"
                value={formData.employeeMother}
                onChange={(e) => setFormData({ ...formData, employeeMother: e.target.value })}
                error={formErrors.employeeMother}
                required
              />
              <InputField
                label="Résidence"
                type="text"
                value={formData.employeeResidence}
                onChange={(e) => setFormData({ ...formData, employeeResidence: e.target.value })}
                error={formErrors.employeeResidence}
                required
              />
              <InputField
                label="État matrimonial"
                type="text"
                value={formData.employeeMaritalStatus}
                onChange={(e) =>
                  setFormData({ ...formData, employeeMaritalStatus: e.target.value })
                }
                error={formErrors.employeeMaritalStatus}
                required
              />
              <InputField
                label="Nom de l'épouse"
                type="text"
                value={formData.employeeSpouse}
                onChange={(e) => setFormData({ ...formData, employeeSpouse: e.target.value })}
                error={formErrors.employeeSpouse}
              />
              <InputField
                label="Contact d'urgence"
                type="text"
                value={formData.employeeEmergencyContact}
                onChange={(e) =>
                  setFormData({ ...formData, employeeEmergencyContact: e.target.value })
                }
                error={formErrors.employeeEmergencyContact}
                required
              />
              <InputField
                label="Classification professionnelle"
                type="text"
                value={formData.employeeClassification}
                onChange={(e) => setFormData({ ...formData, employeeClassification: e.target.value })}
                error={formErrors.employeeClassification}
                required
              />
            </>
          )}
          <div className="flex gap-4">
            {!isContractMode && (
              <StyledButton type="submit">
                <FiFileText className="h-4 w-4" /> Générer la fiche de paie
              </StyledButton>
            )}
            {isContractMode && (
              <StyledButton type="submit">
                <FiFile className="h-4 w-4" />{" "}
                {employee.contract ? "Modifier le contrat" : "Générer le contrat"}
              </StyledButton>
            )}
            <StyledButton variant="danger" onClick={onClose}>
              <FiX className="h-4 w-4" /> Annuler
            </StyledButton>
            {logoData && (
              <StyledButton
                variant="ghost"
                onClick={() => {
                  localStorage.removeItem(`logo_${companyData.id}`);
                  setLogoData(null);
                  console.log(`[PaySlipGenerator] Logo supprimé de localStorage pour companyId: ${companyData.id}`);
                  toast.info("Logo supprimé du stockage local.");
                }}
              >
                Supprimer le logo
              </StyledButton>
            )}
          </div>
        </form>
      </Modal>
    </ModalWrapper>
  );
};

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const Modal = styled.div`
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const InputField = ({ label, type, value, onChange, error, children, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    {type === "select" ? (
      <select
        value={value}
        onChange={onChange}
        className={`w-full p-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
        {...props}
      >
        {children}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className={`w-full p-2 border ${error ? "border-red-500" : "border-gray-300"} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
        {...props}
      />
    )}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const StyledButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background: ${({ variant }) =>
    variant === "danger" ? "#ef4444" : variant === "ghost" ? "transparent" : "#3b82f6"};
  color: ${({ variant }) => (variant === "ghost" ? "#4b5563" : "white")};
  font-weight: medium;
  &:hover {
    background: ${({ variant }) =>
      variant === "danger" ? "#dc2626" : variant === "ghost" ? "#f3f4f6" : "#2563eb"};
  }
`;

export default PaySlipGenerator;