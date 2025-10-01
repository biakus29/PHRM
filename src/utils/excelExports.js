// src/utils/excelExports.js
// Fonctions d'export Excel pour CNPS et DIPE

import { 
  computeCompletePayroll, 
  computeEmployerChargesFromBases
} from './payrollCalculations';

// Helper pour convertir en nombre
const num = (v) => (v ? Number(v) : 0);

/**
 * Génère les données Excel pour la vue "Detailed" (tableau principal)
 * @param {Array} selectedIds - IDs des employés sélectionnés
 * @param {Object} formData - Données du formulaire
 * @param {Array} employees - Liste des employés
 * @param {Object} employerOptions - Options employeur (catégorie RP, etc.)
 * @returns {Array} Données formatées pour Excel
 */
export const generateExcelData = (selectedIds = [], formData = {}, employees = [], employerOptions = {}) => {
  const data = [];
  const employeesList = Array.isArray(employees) ? employees : [];
  
  selectedIds.forEach(id => {
    const employee = employeesList.find(e => e.id === id);
    const formDataItem = formData[id] || {};
    const payslips = Array.isArray(employee?.payslips) ? employee.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};
    
    if (employee) {
      // Récupérer les données du dernier bulletin comme dans le tableau
      const baseSalaryValue = Number(
        latestPayslip.salaryDetails?.baseSalary ?? formDataItem.baseSalary ?? formDataItem.brut ?? employee?.baseSalary ?? 0
      );
      const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
      const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
      
      // Utiliser computeCompletePayroll pour garantir la cohérence avec le tableau
      const payslipData = {
        salaryDetails: { baseSalary: baseSalaryValue },
        remuneration: { total: Number(latestPayslip.remuneration?.total ?? formDataItem.brut ?? baseSalaryValue ?? 0) },
        primes,
        indemnites
      };
      const calc = computeCompletePayroll(payslipData);
      
      // Calculer les totaux de primes et indemnités
      const totalPrimes = primes.reduce((sum, p) => sum + num(p.montant || p.amount), 0);
      const totalIndemnites = indemnites.reduce((sum, i) => sum + num(i.montant || i.amount), 0);
      
      // Calcul des autres déductions (comme dans le tableau detailed)
      const autresDeductions = calc.deductions.cfc + calc.deductions.cac + calc.deductions.rav + calc.deductions.tdl;
      
      data.push({
        'Nom': employee.name || '-',
        'Matricule CNPS': employee.matriculeCNPS || employee.matricule || '-',
        'Salaire Base': baseSalaryValue,
        'Brut Total': calc.grossTotal,
        'SBT': calc.sbt,
        'SBC': calc.sbc,
        'Primes & Indem.': totalPrimes + totalIndemnites,
        'IRPP': calc.deductions.irpp,
        'PVID': calc.deductions.pvid,
        'Autres Déd.': autresDeductions,
        'Net à Payer': calc.netPay
      });
    }
  });
  
  return data;
};

/**
 * Génère les données Excel pour la vue "Déclaration CNPS" (format officiel)
 * @param {Array} selectedIds - IDs des employés sélectionnés
 * @param {Object} formData - Données du formulaire
 * @param {Array} employees - Liste des employés
 * @param {Object} employerOptions - Options employeur (catégorie RP, etc.)
 * @returns {Array} Données formatées pour Excel
 */
export const generateDeclarationCNPSExcelData = (selectedIds = [], formData = {}, employees = [], employerOptions = {}) => {
  const data = [];
  const employeesList = Array.isArray(employees) ? employees : [];
  
  selectedIds.forEach(id => {
    const employee = employeesList.find(e => e.id === id);
    const formDataItem = formData[id] || {};
    const payslips = Array.isArray(employee?.payslips) ? employee.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};
    
    if (employee) {
      // Récupérer les données du dernier bulletin
      const baseSalaryValue = Number(
        latestPayslip.salaryDetails?.baseSalary ?? formDataItem.baseSalary ?? formDataItem.brut ?? employee?.baseSalary ?? 0
      );
      const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
      const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
      
      const payslipData = {
        salaryDetails: { baseSalary: baseSalaryValue },
        remuneration: { total: Number(latestPayslip.remuneration?.total ?? formDataItem.brut ?? baseSalaryValue ?? 0) },
        primes,
        indemnites
      };
      const calc = computeCompletePayroll(payslipData);
      
      // Calculs charges employeur
      const employerCharges = computeEmployerChargesFromBases(calc.sbc, calc.sbt, { 
        baseSalary: baseSalaryValue,
        rpCategory: employerOptions?.rpCategory || 'A'
      });
      
      // Total global = PVID Salarié + Total CNPS Employeur
      const totalGlobal = calc.deductions.pvid + employerCharges.totalCNPS_Employeur;
      
      data.push({
        'Matricule': employee.matriculeCNPS || employee.matricule || '-',
        'Nom Complet': employee.name || '-',
        'Base Cotisable': calc.sbc,
        'PVID Salarié': calc.deductions.pvid,
        'Prestations Familiales': employerCharges.prestationsFamiliales,
        'PVID Employeur': employerCharges.pvidEmployeur,
        'Risques Professionnels': employerCharges.risquesPro,
        'Total Global': totalGlobal
      });
    }
  });
  
  return data;
};

/**
 * Génère les données Excel pour DIPE (identique au tableau DIPE)
 * @param {Array} selectedIds - IDs des employés sélectionnés
 * @param {Object} formData - Données du formulaire
 * @param {Array} employees - Liste des employés
 * @param {Object} employerOptions - Options employeur
 * @returns {Array} Données formatées pour Excel DIPE
 */
export const generateDIPEExcelData = (selectedIds = [], formData = {}, employees = [], employerOptions = {}) => {
  const data = [];
  const employeesList = Array.isArray(employees) ? employees : [];
  
  selectedIds.forEach(id => {
    const employee = employeesList.find(e => e.id === id);
    const formDataItem = formData[id] || {};
    const payslips = Array.isArray(employee?.payslips) ? employee.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};
    
    if (employee) {
      const baseSalaryValue = Number(
        latestPayslip.salaryDetails?.baseSalary ?? formDataItem.baseSalary ?? formDataItem.brut ?? employee?.baseSalary ?? 0
      );
      const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
      const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
      
      const payslipData = {
        salaryDetails: { baseSalary: baseSalaryValue },
        remuneration: { total: Number(latestPayslip.remuneration?.total ?? formDataItem.brut ?? baseSalaryValue ?? 0) },
        primes,
        indemnites
      };
      const calc = computeCompletePayroll(payslipData);
      
      // Calculs charges employeur
      const employerCharges = computeEmployerChargesFromBases(calc.sbc, calc.sbt, { 
        baseSalary: baseSalaryValue,
        rpCategory: employerOptions?.rpCategory || 'A'
      });
      
      // Code CNPS
      const d = formDataItem;
      const mois = String(d.mois || '').padStart(2, '0');
      const annee = String(d.annee || '');
      const regime = d.regime || 'GC';
      const cnpsEmp = String(d.cnpsEmployeur || '');
      const cnpsSal = String(d.cnps || employee.matriculeCNPS || employee.matricule || '');
      const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
      const codeCNPS = `${annee}${mois}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;
      
      // Total impôts et charges
      const totalImpots = calc.deductions.irpp + calc.deductions.cac + calc.deductions.cfc + calc.deductions.rav + calc.deductions.tdl;
      const totalChargesEmployeur = employerCharges.fneEmployeur + employerCharges.cfcEmployeur;
      
      data.push({
        'Nom': employee.name || '-',
        'Code CNPS': codeCNPS,
        'IRPP': calc.deductions.irpp,
        'CAC': calc.deductions.cac,
        'CFC Salarié': calc.deductions.cfc,
        'RAV': calc.deductions.rav,
        'TDL': calc.deductions.tdl,
        'FNE Employeur': employerCharges.fneEmployeur,
        'CFC Employeur': employerCharges.cfcEmployeur,
        'Total': totalImpots + totalChargesEmployeur
      });
    }
  });
  
  return data;
};

export default { generateExcelData, generateDeclarationCNPSExcelData, generateDIPEExcelData };
