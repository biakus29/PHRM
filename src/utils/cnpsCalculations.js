// src/utils/cnpsCalculations.js
// Utilitaires de calcul spécifiques aux cotisations CNPS

import { formatFR } from "./numberUtils";
import { 
  getSBT, 
  getSBC, 
  getCalculs, 
  CNPS_CAP, 
  computeTaxes, 
  computeNetPay, 
  computePVID, 
  computeGrossTotal, 
  computeSBT, 
  computeSBC 
} from "./payrollCalculations";

/**
 * Calcule le résumé employeur pour les cotisations CNPS
 */
export function calculateEmployerSummary(selectedIds, formData, employerOptions) {
  let totalBrut = 0;
  let totalBase = 0;
  let totalPF = 0;
  let totalPVID = 0;
  let totalRP = 0;
  
  selectedIds.forEach((id) => {
    const d = formData[id];
    if (!d) return;
    const base = Math.min(getSBC(d), CNPS_CAP);
    totalBrut += Number(d.brut) || 0;
    totalBase += base;
    if (employerOptions.includePF) totalPF += base * (employerOptions.ratePF / 100);
    if (employerOptions.includePVID) totalPVID += base * (employerOptions.ratePVID / 100);
    if (employerOptions.includeRP) {
      const rpRate = employerOptions.overrideRP ? employerOptions.rateRP : (Number(d.tauxRP) || 0);
      totalRP += base * (rpRate / 100);
    }
  });
  
  const round0 = (n) => Math.round(n || 0);
  const due = round0(totalPF) + round0(totalPVID) + round0(totalRP);
  
  return {
    totalBrut: round0(totalBrut),
    totalBase: round0(totalBase),
    totalPF: round0(totalPF),
    totalPVID: round0(totalPVID),
    totalRP: round0(totalRP),
    totalEmployeurDu: due,
  };
}

/**
 * Calcule les totaux du tableau de sélection
 */
export function calculateTableTotals(selectedIds, formData, employerOptions) {
  let baseCot = 0, pf = 0, pvid = 0, rp = 0, sal = 0, emp = 0, global = 0;
  
  selectedIds.forEach((id) => {
    const d = formData[id];
    if (!d) return;
    const c = getCalculs(d, employerOptions);
    baseCot += c.baseCotisable;
    pf += c.prestationsFamilles;
    pvid += c.pvidEmployeur;
    rp += c.risquesProfessionnels;
    sal += c.cotisSalarie;
    emp += c.cotisEmployeur;
    global += c.totalGlobal;
  });
  
  const round0 = (n) => Math.round(n || 0);
  return {
    base: round0(baseCot), 
    pf: round0(pf), 
    pvid: round0(pvid), 
    rp: round0(rp),
    sal: round0(sal), 
    emp: round0(emp), 
    global: round0(global)
  };
}

/**
 * Calcule le total NET avec calcul automatique si pas de cache
 */
export function calculateTotalNet(selectedIds, formData, taxOptions) {
  let total = 0;
  
  selectedIds.forEach((id) => {
    const d = formData[id] || {};
    let netValue = Number(d.netToPay || d.net || 0);
    
    // Si pas de net sauvegardé, calculer automatiquement
    if (!netValue) {
      const baseSalary = Number(d.brut) || 0;
      const primesImposables = Number(d.primesImposables) || 0;
      const indemniteTransport = Number(d.indemniteTransport) || 0;
      const housingAllowance = Number(d.housingAllowanceDisplay) || 0;
      const representationAllowance = Number(d.representationAllowanceDisplay) || 0;
      const dirtAllowance = Number(d.dirtAllowanceDisplay) || 0;
      const mealAllowance = Number(d.mealAllowanceDisplay) || 0;
      const overtime = Number(d.overtimeDisplay) || 0;
      const bonus = Number(d.bonusDisplay) || 0;
      
      const salaryDetailsTotals = { 
        baseSalary,
        transportAllowance: indemniteTransport,
        housingAllowance,
        representationAllowance,
        dirtAllowance,
        mealAllowance
      };
      const remunerationTotals = { overtime, bonus };
      const primesTotals = primesImposables > 0 ? [{ montant: primesImposables, type: 'Primes imposables' }] : [];
      const indemnitesTotals = [
        { montant: indemniteTransport, type: 'Indemnité transport' },
        { montant: housingAllowance, type: 'Indemnité logement' },
        { montant: representationAllowance, type: 'Indemnité représentation' },
        { montant: dirtAllowance, type: 'Indemnité salissure' },
        { montant: mealAllowance, type: 'Indemnité repas' }
      ].filter(i => i.montant > 0);
      
      const autoCalc = computeNetPay({
        salaryDetails: salaryDetailsTotals,
        remuneration: remunerationTotals,
        deductions: {
          irpp: Number(d.irpp || 0),
          cfc: Number(d.cfc || 0),
          cac: Number(d.cac || 0),
          rav: Number(d.rav || 0),
          tdl: Number(d.tdl || 0),
          pvid: Number(d.pvid || d.pvis || 0) || computePVID(baseSalary)
        },
        primes: primesTotals,
        indemnites: indemnitesTotals
      });
      netValue = autoCalc.netPay || 0;
    }
    
    total += netValue;
  });
  
  return Math.round(total || 0);
}

/**
 * Colonnes fixes à afficher pour chaque employé
 */
export const getFixedAllowanceCols = () => ([
  { key: 'indemniteTransport', label: 'Indemnité Transport', source: 'field' },
  { key: 'housingAllowanceDisplay', label: 'Indemnité Logement', source: 'field' },
  { key: 'representationAllowanceDisplay', label: 'Indemnité Représentation', source: 'field' },
  { key: 'dirtAllowanceDisplay', label: 'Prime de Salissures', source: 'field' },
  { key: 'mealAllowanceDisplay', label: 'Prime de Panier', source: 'field' },
  { key: 'overtimeDisplay', label: 'Heures Supplémentaires', source: 'field' },
  { key: 'bonusDisplay', label: 'Prime/Bonus', source: 'field' },
  { key: 'primesImposables', label: 'Primes Imposables', source: 'field' },
  { key: 'primesNaturesSociales', label: 'Primes Nat. Sociales', source: 'field' },
  { key: 'avantagesNature', label: 'Avantages Nature', source: 'field' },
  { key: 'indemniteNonImposable', label: 'Indemnité Non Imposable', source: 'field' },
]);

/**
 * Génère les données pour l'export Excel
 */
export function generateExcelData(selectedIds, formData, employerOptions, cnpsEmployeur) {
  const { month, year } = require('./dateUtils').getCurrentMonthYear();
  
  return selectedIds.map(id => {
    const d = formData[id] || {};
    const c = getCalculs(d, employerOptions);
    
    return {
      'Matricule CNPS': d.cnps || '',
      'Nom': d.nom || '',
      'Poste': d.poste || '',
      'Salaire Brut': Number(d.brut) || 0,
      'Base Cotisable': c.baseCotisable,
      'PVID Employeur (4,9%)': c.pvidEmployeur,
      'Prestations Familles (7%)': c.prestationsFamilles,
      'Risques Professionnels': c.risquesProfessionnels,
      'Total Employeur': c.cotisEmployeur,
      'PVID Salarié (4,2%)': c.cotisSalarie,
      'Total Global': c.totalGlobal,
      'Mois': month,
      'Année': year,
      'Entreprise': cnpsEmployeur || ''
    };
  });
}
