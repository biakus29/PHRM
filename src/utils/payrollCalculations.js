// src/utils/payrollCalculations.js
// Centralized payroll calculation utilities for PRHM

import { INDEMNITIES, BONUSES } from './payrollLabels';

/**
 * Normalizes a value to a number, defaulting to 0
 */
const num = (value) => Number(value) || 0;

// =============================
// CNPS constants and helpers
// =============================
export const CNPS_CAP = 750_000; // plafond base cotisable
export const RATE_PVID_SAL = 0.042; // 4.2% salarié
export const RATE_PVID_EMP = 0.049; // 4.9% employeur
export const RATE_PF_EMP = 0.07;   // 7% prestations familiales (default)

// Catégorisation unifiée des montants (primes/indemnités)
// data: { brut, primesArray, indemnitesArray, ...fields }
export function categorizeAmounts(data = {}) {
  const primes = Array.isArray(data.primesArray) ? data.primesArray : [];
  const indemnites = Array.isArray(data.indemnitesArray) ? data.indemnitesArray : [];

  let primesImposables = 0;          // va dans SBT
  let indemnitesCotisables = 0;      // s'ajoute au SBT pour SBC (hors transport désormais)
  let indemnitesNonImposables = 0;   // hors SBT

  // Helpers de détection par libellé (uniformisation par type)
  const isTransportLike = (lbl) =>
    lbl.includes('transport') ||
    lbl.includes('transports') ||
    lbl.includes('frais de transport') ||
    lbl.includes('deplacement') ||
    lbl.includes('déplacement');
  const isHousingLike = (lbl) =>
    lbl.includes('logement') || lbl.includes('housing') || lbl.includes('loyer');
  const isRepresentationLike = (lbl) =>
    lbl.includes('represent') || lbl.includes('représent');
  const isMealLike = (lbl) =>
    lbl.includes('repas') || lbl.includes('meal') || lbl.includes('panier') || lbl.includes('cantine');
  const isDirtLike = (lbl) =>
    lbl.includes('saliss') || lbl.includes('salubre') || lbl.includes('insalubr') || lbl.includes('dirt');
  const isMilkLike = (lbl) => lbl.includes('lait');
  const isBicycleLike = (lbl) => lbl.includes('bicyclette') || lbl.includes('cyclomoteur') || lbl.includes('moto') || lbl.includes('vélo') || lbl.includes('velo');
  const isPrimeImposableLike = (lbl) =>
    lbl.includes('heure sup') ||
    lbl.includes('heures sup') ||
    lbl.includes('hs') ||
    lbl.includes('overtime') ||
    lbl.includes('prime') ||
    lbl.includes('bonus') ||
    lbl.includes('rendement') ||
    lbl.includes('gratification') ||
    lbl.includes('anciennet');

  // 1) Parcours des tableaux dynamiques
  primes.forEach((p) => {
    const lbl = (p.label || p.name || p.type || '').toString().toLowerCase();
    const val = Number(p.amount || p.value || p.montant || 0) || 0;

    // 1.a Uniformisation: reclasser par type, même si saisi comme prime
    if (isTransportLike(lbl) || isRepresentationLike(lbl) || isMealLike(lbl) || isDirtLike(lbl) || isMilkLike(lbl) || isBicycleLike(lbl)) {
      // Nouvelle règle: imposables (SBT) mais non cotisables (exclus SBC)
      primesImposables += val; // compte dans SBT
      return; // NE PAS ajouter à indemnitesCotisables
    }
    if (isHousingLike(lbl)) {
      // Logement: imposable et cotisable
      primesImposables += val;      // pour SBT
      indemnitesCotisables += val;  // pour SBC
      return;
    }

    if (isPrimeImposableLike(lbl)) {
      // Primes imposables et cotisables (hors frais pros)
      primesImposables += val;
      indemnitesCotisables += val;
    }
  });

  indemnites.forEach((i) => {
    const lbl = (i.label || i.name || i.type || '').toString().toLowerCase();
    const val = Number(i.amount || i.value || i.montant || 0) || 0;
    if (isTransportLike(lbl) || isRepresentationLike(lbl) || isMealLike(lbl) || isDirtLike(lbl) || isMilkLike(lbl) || isBicycleLike(lbl)) {
      // Nouvelle règle: imposables (SBT) mais non cotisables
      primesImposables += val; // compte dans SBT
      return; // NE PAS ajouter à indemnitesCotisables
    }
    if (isHousingLike(lbl)) {
      // Logement: imposable et cotisable
      primesImposables += val;      // pour SBT
      indemnitesCotisables += val;  // pour SBC
      return;
    }
    // Par défaut: NI
    indemnitesNonImposables += val;
  });

  // 2) Prise en compte des champs fixes de l'UI si présents
  // Primes imposables (ex: heures sup + bonus agrégés)
  primesImposables += Number(data.primesImposables || 0) || 0;
  const _otDisp = Number(data.overtimeDisplay || 0) || 0;
  const _bonusDisp = Number(data.bonusDisplay || 0) || 0;
  // Heures sup et bonus: imposables et cotisables (hors liste frais pros)
  primesImposables += _otDisp;
  indemnitesCotisables += _otDisp;
  primesImposables += _bonusDisp;
  indemnitesCotisables += _bonusDisp;

  // Transport (champ fixe) = imposable mais non cotisable selon la règle fournie
  primesImposables += Number(data.indemniteTransport || 0) || 0;

  // Indemnités explicites (affichage)
  // Logement: imposable et cotisable
  const _housingDisp = Number(data.housingAllowanceDisplay || 0) || 0;
  primesImposables += _housingDisp;      // pour SBT
  indemnitesCotisables += _housingDisp;  // pour SBC
  // Reclassification selon la nouvelle règle: imposables (SBT) mais non cotisables
  primesImposables += Number(data.representationAllowanceDisplay || 0) || 0;
  primesImposables += Number(data.dirtAllowanceDisplay || 0) || 0;
  primesImposables += Number(data.mealAllowanceDisplay || 0) || 0;

  // Champs agrégés
  indemnitesNonImposables += Number(data.indemniteNonImposable || 0) || 0;

  return { primesImposables, indemnitesCotisables, indemnitesNonImposables };
}

// SBT (Salaire Brut Taxable): Salaire de base + éléments imposables (primes imposables)
// IMPORTANT: la base = salaire de base uniquement (pas le brut total)
export const getSBT = (data = {}) => {
  const base = Number((data.salaryDetails && data.salaryDetails.baseSalary) || data.baseSalary || 0) || 0;
  const { primesImposables } = categorizeAmounts(data);
  return Math.max(0, Math.round(base + primesImposables));
};

// SBC (Salaire Brut Cotisable): Base (salaire de base) + éléments cotisables uniquement, plafonné à CNPS_CAP
export const getSBC = (data = {}) => {
  const { indemnitesCotisables } = categorizeAmounts(data);
  const base = Number((data.salaryDetails && data.salaryDetails.baseSalary) || data.baseSalary || 0) || 0;
  return Math.min(CNPS_CAP, Math.round(base + indemnitesCotisables));
};

// Main CNPS calculations
// options: { includeRP: bool, overrideRP: bool, rateRP: number }
export const getCalculs = (data = {}, options = {}) => {
  const sbc = getSBC(data); // déjà plafonné via getSBC
  const baseCotisable = sbc;

  const cotisSalarie = Math.round(baseCotisable * RATE_PVID_SAL);

  const rpRate = options.includeRP
    ? (options.overrideRP ? Number(options.rateRP) || 0 : (Number(data.tauxRP) || 0))
    : 0;

  const pvidEmployeur = Math.round(baseCotisable * RATE_PVID_EMP);
  const prestationsFamilles = Math.round(baseCotisable * RATE_PF_EMP);
  const risquesProfessionnels = Math.round(baseCotisable * (rpRate / 100));
  const cotisEmployeur = pvidEmployeur + prestationsFamilles + risquesProfessionnels;

  return {
    sbc,
    baseCotisable,
    cotisSalarie,
    pvidEmployeur,
    prestationsFamilles,
    risquesProfessionnels,
    cotisEmployeur,
    totalGlobal: cotisSalarie + cotisEmployeur,
  };
};

/**
 * Computes effective deductions with TDL fallback (10% of IRPP)
 * @param {Object} deductions - Raw deductions object
 * @returns {Object} Normalized deductions with TDL fallback
 */
export function computeEffectiveDeductions(deductions = {}) {
  const pvid = num(deductions.pvid || deductions.pvis);
  const irpp = num(deductions.irpp);
  const cac = num(deductions.cac);
  const cfc = num(deductions.cfc);
  const rav = num(deductions.rav);
  const advance = num(deductions.advance);
  const other = num(deductions.other);
  const fne = num(deductions.fne);

  // TDL fallback: 10% of IRPP if missing/0 and IRPP > 0
  const tdl = irpp > 0 && num(deductions.tdl) === 0 ? Math.round(irpp * 0.10) : num(deductions.tdl);

  const total = pvid + irpp + cac + cfc + rav + tdl + advance + other + fne;

  return {
    pvid,
    pvis: pvid, // Backward compatibility
    irpp,
    cac,
    cfc,
    rav,
    tdl,
    advance,
    other,
    fne,
    total,
  };
}

// =============================
// Cameroon-specific tax helpers
// =============================

/**
 * Computes IRPP from SBT and employee PVID using Cameroon monthly brackets.
 * IRPP = 0 if SBT < 62,000 FCFA. SNC = 70% SBT - PVID - 500,000/12.
 */
export function computeIRPPFromSBT(sbt, pvid) {
  const base = num(sbt);
  if (base <= 0 || base < 62_000) return 0;
  const monthlyAbattement = ABATTEMENT_MENSUEL; // 500,000 / 12
  const snc = Math.max(0, base * 0.7 - num(pvid) - monthlyAbattement);

  let irpp = 0;
  if (snc > 416_667) {
    irpp = 70_833.75 + (snc - 416_667) * 0.35;
  } else if (snc > 250_000) {
    irpp = 29_167 + (snc - 250_000) * 0.25;
  } else if (snc > 166_667) {
    irpp = 16_667 + (snc - 166_667) * 0.15;
  } else if (snc > 0) {
    irpp = snc * 0.1;
  } else {
    irpp = 0;
  }
  return Math.round(irpp);
}

/**
 * Computes RAV using the official bracket table from gross salary.
 */
export function computeRAV(grossSalary) {
  const g = Math.round(num(grossSalary));
  if (g < 50_000) return 0;
  if (g <= 100_000) return 750;
  if (g <= 200_000) return 1_950;
  if (g <= 300_000) return 3_250;
  if (g <= 400_000) return 4_550;
  if (g <= 500_000) return 5_850;
  if (g <= 600_000) return 7_150;
  if (g <= 700_000) return 8_450;
  if (g <= 800_000) return 9_750;
  if (g <= 900_000) return 11_050;
  if (g <= 1_000_000) return 12_350;
  return 13_000;
}

/**
 * Computes TDL (Taxe de Déclaration Libre) using official Cameroon forfait brackets.
 * TDL is a flat municipal tax based on monthly base salary brackets.
 * @param {number} baseSalary - Monthly base salary in FCFA
 * @returns {number} TDL amount in FCFA
 */
export function computeTDL(baseSalary) {
  const s = num(baseSalary);
  
  // Barème officiel TDL Cameroun selon documentation fournie
  if (s <= 61750) return 0;                    // Exonération
  if (s <= 75000) return 250;                  // 62 000 - 75 000
  if (s <= 100000) return 500;                 // 75 250 - 100 000
  if (s <= 125000) return 750;                 // 100 250 - 125 000
  if (s <= 151000) return 1000;                // 125 250 - 151 000
  if (s <= 200000) return 1250;                // 151 000 - 200 000
  if (s <= 250000) return 1500;                // 200 250 - 250 000
  if (s <= 300000) return 2000;                // 250 250 - 300 000 (saut +500)
  if (s <= 492000) return 2250;                // 300 250 - 492 000
  
  // À partir de 492 250 FCFA: TDL = 2 500 FCFA (stable jusqu'à ~1 650 000)
  return 2500;
}

/**
 * Computes all statutory deductions from details and remuneration using centralized rules:
 * - PVID: 4.2% of base salary (capped at 750,000)
 * - IRPP: on SNC from SBT
 * - CAC: 10% of IRPP if IRPP > 0
 * - TDL: Forfait municipal par tranches de salaire de base
 * - CFC: 1% of gross salary
 * - FNE: 1% of gross salary (employee), 1.5% (employer) [employer not returned here]
 * - RAV: bracket table on gross salary
 */
export function computeStatutoryDeductions(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const baseSalary = num(salaryDetails.baseSalary);
  const gross = computeGrossTotal(salaryDetails, remuneration, primes, indemnites);
  const sbt = computeSBT(salaryDetails, remuneration, primes, indemnites);
  const pvid = computePVID(baseSalary);
  const irpp = computeIRPPFromSBT(sbt, pvid);
  const cac = irpp > 0 ? Math.round(irpp * 0.10) : 0;
  // Politique centralisée: TDL = 10% de l'IRPP (cohérent avec toute l'app)
  const tdl = irpp > 0 ? Math.round(irpp * 0.10) : 0;
  const cfc = Math.round(gross * 0.01); // 1% of gross (part salarié)
  // L'employé ne paie pas le FNE dans la fiche de paie: part salarié = 0 ici
  const fne = 0;
  const rav = computeRAV(gross);

  return { pvid, pvis: pvid, irpp, cac, tdl, cfc, fne, rav };
}

/**
 * Computes rounded deductions for display and calculations
 * @param {Object} deductions - Raw deductions object
 * @returns {Object} Rounded deductions
 */
export function computeRoundedDeductions(deductions = {}) {
  const eff = computeEffectiveDeductions(deductions);
  return {
    pvid: Math.round(eff.pvid),
    pvis: Math.round(eff.pvid), // Backward compatibility
    irpp: Math.round(eff.irpp),
    cac: Math.round(eff.cac),
    cfc: Math.round(eff.cfc),
    rav: Math.round(eff.rav),
    tdl: Math.round(eff.tdl),
    advance: Math.round(eff.advance),
    other: Math.round(eff.other),
    fne: Math.round(eff.fne),
    total: Math.round(eff.total),
  };
}

/**
 * Computes gross total from salary details and remuneration
 * @param {Object} salaryDetails - Salary details object
 * @param {Object} remuneration - Remuneration object
 * @param {Array} primes - Array of bonuses
 * @param {Array} indemnites - Array of allowances
 * @returns {number} Total gross amount
 */
export function computeGrossTotal(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const baseSalary = num(salaryDetails.baseSalary);
  
  // Standard allowances and bonuses
  const standardGross = INDEMNITIES.reduce((sum, item) => {
    return sum + num(salaryDetails[item.key] || remuneration[item.key]);
  }, 0) + BONUSES.reduce((sum, item) => {
    return sum + num(salaryDetails[item.key] || remuneration[item.key]);
  }, 0);

  // Dynamic primes and indemnites
  const primesSum = Array.isArray(primes) 
    ? primes.reduce((sum, p) => sum + num(p?.montant ?? p?.amount ?? p?.value ?? p?.total ?? p?.somme), 0)
    : 0;
  
  const indemSum = Array.isArray(indemnites)
    ? indemnites.reduce((sum, i) => sum + num(i?.montant ?? i?.amount ?? i?.value ?? i?.total ?? i?.somme), 0)
    : 0;

  // Overtime
  const overtime = num(remuneration.overtime);

  // Use provided total if higher, otherwise calculate
  const calculatedTotal = baseSalary + standardGross + primesSum + indemSum + overtime;
  const providedTotal = num(remuneration.total);
  
  return Math.max(calculatedTotal, providedTotal);
}

/**
 * Computes PVID based on base salary only (4.2% capped at 750,000 FCFA)
 * @param {number} baseSalary - Base salary amount
 * @returns {number} PVID amount
 */
export function computePVID(baseSalary) {
  const base = Math.min(num(baseSalary), 750000);
  return Math.round(base * 0.042);
}

/**
 * Computes net pay using centralized logic
 * @param {Object} params - Parameters object
 * @param {Object} params.salaryDetails - Salary details
 * @param {Object} params.remuneration - Remuneration details
 * @param {Object} params.deductions - Deductions
 * @param {Array} params.primes - Bonuses array
 * @param {Array} params.indemnites - Allowances array
 * @returns {Object} Net pay calculation result
 */
export function computeNetPay({ salaryDetails = {}, remuneration = {}, deductions = {}, primes = [], indemnites = [] }) {
  const grossTotal = computeGrossTotal(salaryDetails, remuneration, primes, indemnites);
  
  // Ensure PVID is calculated correctly from base salary only
  const baseSalary = num(salaryDetails.baseSalary);
  const correctedDeductions = {
    ...deductions,
    pvid: computePVID(baseSalary),
    pvis: computePVID(baseSalary) // Backward compatibility
  };
  
  const effectiveDeductions = computeEffectiveDeductions(correctedDeductions);
  const roundedDeductions = computeRoundedDeductions(correctedDeductions);
  
  const netPay = Math.max(0, Math.round(grossTotal) - Math.round(effectiveDeductions.total));

  return {
    grossTotal: Math.round(grossTotal),
    deductions: effectiveDeductions,
    roundedDeductions,
    deductionsTotal: Math.round(effectiveDeductions.total),
    netPay,
  };
}

/**
 * Computes SBT (Salaire Brut Taxable) for tax calculations
 * @param {Object} salaryDetails - Salary details
 * @param {Object} remuneration - Remuneration details
 * @param {Array} primes - Array of bonuses
 * @param {Array} indemnites - Array of allowances
 * @returns {number} SBT amount
 */
export function computeSBT(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const baseData = {
    ...salaryDetails,
    ...remuneration,
    brut: num(salaryDetails.baseSalary),
    baseSalary: num(salaryDetails.baseSalary),
    primesArray: primes,
    indemnitesArray: indemnites,
  };
  return Math.round(getSBT(baseData));
}

/**
 * Computes SBC (Salaire Brut Cotisable) for CNPS calculations
 * @param {Object} salaryDetails - Salary details
 * @param {Object} remuneration - Remuneration details
 * @param {Array} primes - Array of bonuses
 * @param {Array} indemnites - Array of allowances
 * @returns {number} SBC amount (capped at CNPS_CAP)
 */
export function computeSBC(salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) {
  const baseData = {
    ...salaryDetails,
    ...remuneration,
    brut: num(salaryDetails.baseSalary),
    baseSalary: num(salaryDetails.baseSalary),
    primesArray: primes,
    indemnitesArray: indemnites,
  };
  return Math.round(Math.min(getSBC(baseData), CNPS_CAP));
}

/**
 * Validates deductions against expected values
 * @param {Object} deductions - Deductions to validate
 * @param {number} baseSalary - Base salary for validation
 * @returns {Array} Array of validation warnings
 */
export function validateDeductions(deductions = {}, baseSalary = 0) {
  const warnings = [];
  const pvid = num(deductions.pvid || deductions.pvis);
  const irpp = num(deductions.irpp);
  
  // PVID validation (4.2% of salary capped at 750,000 FCFA)
  const pvidBase = Math.min(num(baseSalary), 750000);
  const expectedPvid = Math.round(pvidBase * 0.042);
  
  if (Math.abs(pvid - expectedPvid) > 1) {
    warnings.push(`PVID: ${pvid.toLocaleString()} FCFA (attendu: ${expectedPvid.toLocaleString()} FCFA, 4,2% plafonné à 750 000)`);
  }
  
  // IRPP validation (basic check)
  if (irpp > baseSalary * 0.3) {
    warnings.push(`IRPP: ${irpp.toLocaleString()} FCFA (semble élevé)`);
  }
  
  return warnings;
}

/**
 * Formats amount for display in CFA
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
export function formatCFA(amount) {
  const num = Number(amount) || 0;
  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Legacy compatibility - maps to computeNetPay
 * @deprecated Use computeNetPay instead
 */
export function getNetToPay({ remunerationTotal = 0, deductions = {}, extraDeductions = {} }) {
  const effectiveDeductions = computeEffectiveDeductions(deductions);
  const roundedDeductions = computeRoundedDeductions(deductions);
  const extraSum = Object.values(extraDeductions || {}).reduce((sum, val) => sum + Math.round(Number(val || 0)), 0);
  const deductionsTotal = Math.round(Number(roundedDeductions.total || 0)) + extraSum;
  const netToPay = Math.max(0, Math.round(Number(remunerationTotal || 0)) - deductionsTotal);
  return { netToPay, deductionsTotal, normalized: effectiveDeductions, rounded: roundedDeductions };
}

// =============================
// Taxes (Impôts) calculations
// =============================
const ABATTEMENT_ANNUEL = 500_000; // FCFA
const ABATTEMENT_MENSUEL = ABATTEMENT_ANNUEL / 12;

export const computeTaxes = (
  selectedIds = [],
  formData = {},
  employerOptions = {},
  taxOptions = { cfcRate: 1.0, fneRate: 1.0, tdlBase: 'irpp', tdlRate: 10, irppBase: 'baseSalary' }
) => {
  const rows = [];
  let totals = { sbt: 0, sbc: 0, irpp: 0, cac: 0, cfc: 0, tdl: 0, fneSal: 0, fneEmp: 0 };

  selectedIds.forEach((id) => {
    const d = formData[id] || {};
    // Déterminer un salaire de base canonique depuis les données de l'employé
    // Priorités: baseSalary -> salaireBase -> base -> salaire -> brutBase -> brut (fallback)
    const baseSalary = Number(
      d.baseSalary ?? d.salaireBase ?? d.base ?? d.salaire ?? d.brutBase ?? d.brut ?? 0
    ) || 0;

    // Utiliser les calculs centralisés pour cohérence
    const payrollCalc = computeNetPay({
      salaryDetails: { baseSalary },
      remuneration: {
        overtime: d.overtimeDisplay || 0,
        total: d.brut || 0,
      },
      deductions: {},
      primes: Array.isArray(d.primesArray)
        ? d.primesArray
        : [
            { montant: d.overtimeDisplay || 0, type: 'Heures supplémentaires' },
            { montant: d.bonusDisplay || 0, type: 'Prime/Bonus' },
          ].filter((p) => p.montant > 0),
      indemnites: Array.isArray(d.indemnitesArray)
        ? d.indemnitesArray
        : [
            { montant: d.indemniteTransport || 0, type: 'Indemnité transport' },
            { montant: d.housingAllowanceDisplay || 0, type: 'Indemnité logement' },
            { montant: d.representationAllowanceDisplay || 0, type: 'Indemnité représentation' },
            { montant: d.dirtAllowanceDisplay || 0, type: 'Indemnité salissure' },
            { montant: d.mealAllowanceDisplay || 0, type: 'Indemnité repas' },
          ].filter((i) => i.montant > 0),
    });

    // IMPORTANT: SBT/SBC doivent provenir des helpers centralisés pour correspondre aux fiches de paie
    const primesArr = Array.isArray(d.primesArray)
      ? d.primesArray
      : [
          { montant: d.overtimeDisplay || 0, type: 'Heures supplémentaires' },
          { montant: d.bonusDisplay || 0, type: 'Prime/Bonus' },
        ].filter((p) => p.montant > 0);
    const indemArr = Array.isArray(d.indemnitesArray)
      ? d.indemnitesArray
      : [
          { montant: d.indemniteTransport || 0, type: 'Indemnité transport' },
          { montant: d.housingAllowanceDisplay || 0, type: 'Indemnité logement' },
          { montant: d.representationAllowanceDisplay || 0, type: 'Indemnité représentation' },
          { montant: d.dirtAllowanceDisplay || 0, type: 'Indemnité salissure' },
          { montant: d.mealAllowanceDisplay || 0, type: 'Indemnité repas' },
        ].filter((i) => i.montant > 0);

    const sbt = computeSBT({ baseSalary }, { overtime: d.overtimeDisplay || 0, total: d.brut || 0 }, primesArr, indemArr);
    const sbc = computeSBC({ baseSalary }, { overtime: d.overtimeDisplay || 0, total: d.brut || 0 }, primesArr, indemArr);
    const pvidSal = computePVID(baseSalary); // PVID correct (4.2% du salaire de base)

    // SNC mensuel: par défaut basé sur le salaire de base pour coller à la fiche de paie
    // Optionnellement, peut être basé sur SBT si taxOptions.irppBase === 'sbt'
    const irppBase = (taxOptions?.irppBase || 'baseSalary').toLowerCase();
    const baseForIRPP = irppBase === 'sbt' ? sbt : baseSalary;
    let snc = 0.7 * baseForIRPP - pvidSal - ABATTEMENT_MENSUEL;
    // Seuil d'imposition: appliquer le seuil sur la base retenue
    if (baseForIRPP < 62_000) snc = 0; // En dessous de 62 000, IRPP = 0
    snc = Math.max(0, snc);

    // Barème IRPP mensuel
    let irpp = 0;
    if (snc > 416_667) {
      irpp = 70_833.75 + (snc - 416_667) * 0.35;
    } else if (snc > 250_000) {
      irpp = 29_167 + (snc - 250_000) * 0.25;
    } else if (snc > 166_667) {
      irpp = 16_667 + (snc - 166_667) * 0.15;
    } else if (snc > 0) {
      irpp = snc * 0.1;
    } else {
      irpp = 0;
    }
    irpp = Math.round(irpp);

    const cac = Math.round(irpp * 0.1); // 10% de l'IRPP (Centimes additionnels communaux)
    // TDL toujours 10% de l'IRPP pour cohérence
    const tdl = Math.round(irpp * 0.1);
    const cfc = Math.round(sbc * ((Number(taxOptions.cfcRate) || 2.5) / 100));
    const fneRate = Number(taxOptions.fneRate) || 1.0;
    const fneSal = Math.round(sbt * (fneRate / 100)); // salarié
    const fneEmp = Math.round(sbt * ((fneRate * 1.5) / 100)); // employeur = 1.5 × fneRate

    rows.push({ id, matricule: d.cnps, nom: d.nom, sbt, sbc, irpp, cac, tdl, cfc, fneSal, fneEmp });

    totals.sbt += sbt;
    totals.sbc += sbc;
    totals.irpp += irpp;
    totals.cac += cac;
    totals.tdl += tdl;
    totals.cfc += cfc;
    totals.fneSal += fneSal;
    totals.fneEmp += fneEmp;
  });

  const round0 = (n) => Math.round(n || 0);
  totals = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, round0(v)]));
  return { rows, totals };
};

// =============================
// Pay components helpers
// =============================
export const INDEMNITIES_IMPOSABLES = [];

// Indemnities specifically included in CNPS SBC base (historically: transport)
export const SBC_INDEMNITIES = [
  'indemniteTransport',
  'primeTransport',
];

export const INDEMNITIES_NON_IMPOSABLES = [
  'indemniteTransport',
  'primeTransport',
  'indemniteNonImposable',
  'representationAllowanceDisplay',
  'dirtAllowanceDisplay',
  'mealAllowanceDisplay',
];

export const INDEMNITIES_TAXABLES = [
  'housingAllowanceDisplay',
  'housingAllowance',
];

export const PRIMES_IMPOSABLES = [
  'primesImposables',
  'bonus',
  'heuresSupp',
  'overtime',
];

export const PRIMES_SOCIALES = [
  'primesNaturesSociales',
  'primesSociales',
];

export const AVANTAGES_NATURE = [
  'avantagesNature',
];

export const n = (v) => Number(v) || 0;

export function sumFields(data = {}, fields = []) {
  return fields.reduce((acc, key) => acc + n(data[key]), 0);
}

export function getIndemnitesImposables(data = {}) {
  return sumFields(data, INDEMNITIES_IMPOSABLES);
}

export function getIndemnitesNonImposables(data = {}) {
  return sumFields(data, INDEMNITIES_NON_IMPOSABLES);
}

export function getIndemnitesTaxables(data = {}) {
  return sumFields(data, INDEMNITIES_TAXABLES);
}

export function getPrimesImposables(data = {}) {
  return sumFields(data, PRIMES_IMPOSABLES);
}

export function getPrimesSociales(data = {}) {
  return sumFields(data, PRIMES_SOCIALES);
}

export function getAvantagesNature(data = {}) {
  return sumFields(data, AVANTAGES_NATURE);
}

export function getSbcIndemnites(data = {}) {
  return sumFields(data, SBC_INDEMNITIES);
}

export function getPayComponents(data = {}) {
  const indemImposables = getIndemnitesImposables(data);
  const indemNonImposables = getIndemnitesNonImposables(data);
  const indemTaxables = getIndemnitesTaxables(data);
  const primesImp = getPrimesImposables(data);
  const primesSoc = getPrimesSociales(data);
  const avNat = getAvantagesNature(data);
  const sbcIndemnites = getSbcIndemnites(data);
  const brut = n(data.brut) || n(data.baseSalary);
  return {
    brut,
    indemImposables,
    indemNonImposables,
    indemTaxables,
    primesImp,
    primesSoc,
    avNat,
    sbcIndemnites,
  };
}

export function anyHasValue(records = [], field) {
  return records.some((r) => n(r?.[field]) > 0);
}
