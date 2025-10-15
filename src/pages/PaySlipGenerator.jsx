import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FiFileText, FiX, FiFile, FiUpload } from "react-icons/fi";
import { computeNetPay, computeEffectiveDeductions, computeRoundedDeductions, formatCFA, computeSBT, computeSBC, computeStatutoryDeductions, computeCompletePayroll } from "../utils/payrollCalculations";
import { jsPDF } from "jspdf";
import { exportContractPDF } from "../utils/exportContractPDF";

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
    employeeDOB: employee.contract?.employeeDOB || "2025-06-02", // Mis à jour avec le PDF
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

  const calculateDeductions = (baseSalary, primes = [], indemnites = []) => {
    console.log(`[PaySlipGenerator] Calcul des retenues (centralisé) base: ${baseSalary}`);
    const statutory = computeStatutoryDeductions(
      { baseSalary },
      {},
      primes,
      indemnites
    );
    const total = Math.round(
      (Number(statutory.pvid) || 0) +
      (Number(statutory.irpp) || 0) +
      (Number(statutory.cac) || 0) +
      (Number(statutory.cfc) || 0) +
      (Number(statutory.rav) || 0) +
      (Number(statutory.tdl) || 0) +
      (Number(statutory.fne) || 0)
    );
    const deductions = { ...statutory, total };
    console.log(`[PaySlipGenerator] Résultat calcul retenues (centralisé): ${JSON.stringify(deductions)}`);
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
    // Centraliser: primes/indemnités depuis le formulaire
    const primesList = formData.primes || [];
    const indemnitesList = formData.indemnites || [];
    const salaryDetails = { baseSalary: salaryBrut };
    const payrollCalc = computeNetPay({
      salaryDetails,
      remuneration: { workedDays: daysWorked, overtime: overtimeHoursRegular + overtimeHoursSunday + overtimeHoursNight },
      deductions: {},
      primes: primesList,
      indemnites: indemnitesList
    });
    const deductions = payrollCalc.deductions;
    const totalRemuneration = payrollCalc.grossTotal; // inclut base + primes + indemnités
    const netSalary = payrollCalc.netPay;
    const taxableSalary = computeSBT(salaryDetails, {}, primesList, indemnitesList);

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
        professionalClassification: formData.employeeClassification || employee.poste || "DRH",
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
    console.log(`[PaySlipGenerator] Redirection vers générateur unifié pour employé: ${employee.name}`);
    try {
      const contractData = generateContractData();
      if (!contractData) return;

      // Normaliser les données pour l'export unifié
      const normalizedContract = {
        type: contractData.contractType, // contractType -> type
        workLocation: contractData.workLocation, // déjà correct
        baseSalary: contractData.salaryBrut, // salaryBrut -> baseSalary
        startDate: contractData.hireDate, // hireDate -> startDate
        position: employee.poste || employee.position || 'Non spécifié',
        trialPeriod: contractData.trialPeriod,
        leaveDays: contractData.leaveDays,
        // Données civiles de l'employé
        employeeDOB: contractData.employeeDOB,
        employeeFather: contractData.employeeFather,
        employeeMother: contractData.employeeMother,
        employeeResidence: contractData.employeeResidence,
        employeeMaritalStatus: contractData.employeeMaritalStatus,
        employeeEmergencyContact: contractData.employeeEmergencyContact,
        employeeSpouse: contractData.employeeSpouse,
        employeeClassification: contractData.employeeClassification
      };

      // Utiliser la fonction d'export unifiée (générateur section Documents)
      const result = await exportContractPDF(employee, companyData, normalizedContract);
      
      if (result.success) {
        // Appeler le callback original si nécessaire
        onGenerate(contractData);
      }
    } catch (error) {
      handleError(error, "Erreur génération contrat PDF unifié");
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
                    {formData.primes.reduce((acc, p) => acc + Number(p.montant ?? p.amount ?? 0), 0).toLocaleString()} FCFA
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
                    {formData.indemnites.reduce((acc, i) => acc + Number(i.montant ?? i.amount ?? 0), 0).toLocaleString()} FCFA
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
      doc.text(`CNPS (PVID) – salarié : ${paySlipData.deductions.pvid.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`IRPP : ${paySlipData.deductions.irpp.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`CAC : ${paySlipData.deductions.cac.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`CFC : ${paySlipData.deductions.cfc.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`RAV : ${paySlipData.deductions.rav.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`TDL (10% IRPP) : ${paySlipData.deductions.tdl.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`FNE : ${paySlipData.deductions.fne.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight;
      doc.text(`Total retenues : ${paySlipData.deductions.total.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "bold");
      doc.text(`Net à payer : ${paySlipData.calculations.netSalary.toLocaleString("fr-FR")} FCFA`, leftMargin, y);
      y += lineHeight * 2;

      doc.setFont("helvetica", "normal");
      doc.text(`Période : ${paySlipData.payPeriod}`, leftMargin, y);
      y += lineHeight;
      doc.text(`Généré le : ${new Date(paySlipData.generatedAt).toLocaleString("fr-FR")}`, leftMargin, y);

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