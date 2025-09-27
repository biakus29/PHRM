// src/utils/payrollAdapter.js
// Adaptateur pour faciliter la transition vers le nouveau système de paie
// CRÉÉ: 26/09/2025 15:43 - ADAPTATEUR DE COMPATIBILITÉ

import { 
  calculComplet, 
  calculerBases,
  calculerCNPS,
  calculerAutresCotisations,
  calculerIRPP,
  computeRAV,
  computeTDL,
  computePVID,
  computeCFC,
  computeFNE,
  computeIRPPFromSBT,
  CNPS_PLAFOND,
  formatCFA
} from './payrollCalculations.js';

// ==================== FONCTIONS D'ADAPTATION ====================

/**
 * Convertit les données de l'ancien format vers le nouveau format
 */
export function convertToNewFormat(salaryDetails = {}, primes = [], indemnites = []) {
  const baseSalary = Number(salaryDetails.baseSalary || 0);
  
  // Séparer les primes cotisables et non cotisables
  const primesCotisables = {};
  const primesNonCotisables = {};
  
  primes.forEach(prime => {
    const label = (prime.label || '').toLowerCase();
    const montant = Number(prime.montant || prime.amount || 0);
    
    if (label.includes('transport')) {
      primesNonCotisables.primeTransport = montant;
    } else if (label.includes('rendement')) {
      primesCotisables.primeRendement = montant;
    } else if (label.includes('exceptionnelle')) {
      primesCotisables.primeExceptionnelle = montant;
    } else if (label.includes('ancienneté') || label.includes('anciennete')) {
      primesCotisables.primeAnciennete = montant;
    } else if (label.includes('responsabilité') || label.includes('responsabilite')) {
      primesCotisables.primeResponsabilite = montant;
    } else if (label.includes('panier') || label.includes('repas')) {
      primesNonCotisables.primePanier = montant;
    } else {
      // Par défaut, considérer comme cotisable
      primesCotisables[`prime_${Date.now()}`] = montant;
    }
  });
  
  return {
    salaireBrut: baseSalary,
    primesCotisables,
    primesNonCotisables
  };
}

/**
 * Adaptateur pour computeNetPay - maintient la compatibilité
 */
export function computeNetPayAdapter({ salaryDetails = {}, remuneration = {}, deductions = {}, primes = [], indemnites = [] }) {
  const employeeData = convertToNewFormat(salaryDetails, primes, indemnites);
  const result = calculComplet(employeeData);
  
  return {
    netPay: result.salaireNet,
    totalDeductions: result.totalRetenues,
    grossTotal: result.bases.salaireBrutTotal,
    // Détails pour compatibilité
    deductions: {
      pvid: result.cnps.pvidSalarie,
      irpp: result.irpp,
      cfc: result.autres.cfc,
      rav: result.rav,
      tdl: result.tdl,
      fne: result.autres.fneSalarie
    }
  };
}

/**
 * Adaptateur pour computeStatutoryDeductions
 */
export function computeStatutoryDeductionsAdapter(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const employeeData = convertToNewFormat(salaryDetails, primes, indemnites);
  const result = calculComplet(employeeData);
  
  return {
    pvid: result.cnps.pvidSalarie,
    pvis: result.cnps.pvidSalarie, // Backward compatibility
    irpp: result.irpp,
    cac: Math.round(result.irpp * 0.10), // CAC = 10% IRPP
    cfc: result.autres.cfc,
    rav: result.rav,
    tdl: result.tdl,
    fne: result.autres.fneSalarie,
    total: result.totalRetenues
  };
}

/**
 * Adaptateur pour computeSBT
 */
export function computeSBTAdapter(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const employeeData = convertToNewFormat(salaryDetails, primes, indemnites);
  const bases = calculerBases(employeeData);
  return bases.sbt;
}

/**
 * Adaptateur pour computeSBC
 */
export function computeSBCAdapter(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const employeeData = convertToNewFormat(salaryDetails, primes, indemnites);
  const bases = calculerBases(employeeData);
  return bases.sbc;
}

/**
 * Adaptateur pour getCalculs (CNPS)
 */
export function getCalculsAdapter(data = {}, employerOptions = {}) {
  const employeeData = convertToNewFormat(
    { baseSalary: data.baseSalary || data.brut },
    data.primesArray || [],
    data.indemnitesArray || []
  );
  
  const bases = calculerBases(employeeData);
  const cnps = calculerCNPS(bases.sbc);
  
  return {
    sbt: bases.sbt,
    sbc: bases.sbc,
    pvidSal: cnps.pvidSalarie,
    pvidEmp: cnps.pvidEmployeur,
    prestationsFamiliales: cnps.prestationsFamiliales,
    risquesPro: cnps.risquesPro,
    totalSalarie: cnps.totalSalarie,
    totalEmployeur: cnps.totalEmployeur,
    totalGeneral: cnps.totalSalarie + cnps.totalEmployeur
  };
}

/**
 * Adaptateur pour computeTaxes
 */
export function computeTaxesAdapter(baseSalary, sbt, sbc, taxOptions = {}) {
  const employeeData = {
    salaireBrut: baseSalary,
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Reconstituer les primes à partir de SBT/SBC
  const primesCotisables = sbc - baseSalary;
  const primesNonCotisables = sbt - sbc;
  
  if (primesCotisables > 0) {
    employeeData.primesCotisables.primeGenerique = primesCotisables;
  }
  if (primesNonCotisables > 0) {
    employeeData.primesNonCotisables.primeGenerique = primesNonCotisables;
  }
  
  const result = calculComplet(employeeData);
  
  return {
    irpp: result.irpp,
    cfc: result.autres.cfc,
    fne: {
      salarie: result.autres.fneSalarie,
      employeur: result.autres.fneEmployeur,
      total: result.autres.fneSalarie + result.autres.fneEmployeur
    },
    rav: result.rav,
    tdl: result.tdl,
    total: result.irpp + result.autres.cfc + result.autres.fneSalarie + result.rav + result.tdl
  };
}

// ==================== EXPORTS POUR COMPATIBILITÉ ====================
export {
  // Nouvelles fonctions principales
  calculComplet,
  calculerBases,
  calculerCNPS,
  calculerAutresCotisations,
  calculerIRPP,
  
  // Fonctions individuelles
  computeRAV,
  computeTDL,
  computePVID,
  computeCFC,
  computeFNE,
  computeIRPPFromSBT,
  
  // Constantes
  CNPS_PLAFOND,
  
  // Utilitaires
  formatCFA
};

// Aliases pour compatibilité totale
export const computeNetPay = computeNetPayAdapter;
export const computeStatutoryDeductions = computeStatutoryDeductionsAdapter;
export const computeSBT = computeSBTAdapter;
export const computeSBC = computeSBCAdapter;
export const getCalculs = getCalculsAdapter;
export const computeTaxes = computeTaxesAdapter;
