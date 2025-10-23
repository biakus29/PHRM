// src/utils/payrollCalculations.js
// SYSTÈME DE PAIE CAMEROUNAISE - CONFORME RÉGLEMENTATION CNPS ET FISCALE
// DERNIÈRE MISE À JOUR: 26/09/2025 15:35 - NOUVEAU SYSTÈME COMPLET

import {
  getPVIDLabel,
  getIRPPLabel,
  getTDLLabel,
  getRAVLabel,
  getCFCLabel,
  getFNELabel,
} from './payrollLabels';

// ==================== CONSTANTES RÉGLEMENTAIRES ====================
export const CNPS_PLAFOND = 750000; // Plafond CNPS mensuel
export const TAUX_PVID_SALARIE = 4.2; // % salarié
export const TAUX_PVID_EMPLOYEUR = 4.2; // % employeur (Assurance Pension: 4,2% employeur + 4,2% salarié)
export const TAUX_PF_EMPLOYEUR = 7.0;   // % prestations familiales
export const TAUX_RP_EMPLOYEUR = 1.75; // % risques professionnels par défaut

// Taux risques professionnels par catégorie
export const TAUX_RP_CATEGORIES = {
  A: 1.75,  // Catégorie A (bureaux, commerce) - défaut
  B: 2.5,   // Catégorie B (industrie légère)
  C: 5.0    // Catégorie C (industrie lourde, BTP)
};

// Abattement IRPP
export const ABATTEMENT_ANNUEL = 500000;
export const ABATTEMENT_MENSUEL = ABATTEMENT_ANNUEL / 12;

// Limites d'exonération (selon textes en vigueur)
export const LIMITE_TRANSPORT = 30000;  // Limite mensuelle prime transport
export const LIMITE_PANIER = 20000;     // Limite mensuelle prime panier

// Taux autres cotisations
export const TAUX_CFC_SALARIE = 1.0;
export const TAUX_CFC_EMPLOYEUR = 1.5;
export const TAUX_FNE_SALARIE = 0.0;
export const TAUX_FNE_EMPLOYEUR = 1.0;

// ==================== HELPERS ====================
const num = (v) => (v ? Number(v) : 0);

// Simple catégorisation par libellé: retourne true si l'élément est cotisable
// Par défaut: TOUT EST COTISABLE sauf les exceptions listées (non cotisables)
const categorizeAsCotisable = (rawLabel = '') => {
  const label = String(rawLabel || '').toLowerCase();
  const nonCotisables = [
    'transport',           // prime de transport
    'panier',              // prime de panier
    'saliss',              // prime de salissure
    'deplacement',         // indemnité de déplacement
    'lait',                // indemnité de lait
    'bicyclette',          // indemnité de bicyclette
    'cyclomoteur',         // indemnité de cyclomoteur
    'representation',      // indemnité de représentation
    'kilometr',
    'scolar',
    'naissance',
  ];
  
  // Si contient un mot-clé non cotisable, retourner false
  if (nonCotisables.some(k => label.includes(k))) return false;
  
  // Par défaut: COTISABLE (tout le reste)
  return true;
};

// ==================== CALCULS CNPS ====================
export const computePVID = (sbc) =>
  Math.round(Math.min(sbc, CNPS_PLAFOND) * (TAUX_PVID_SALARIE / 100));

export const computePVIDEmployer = (sbc) =>
  Math.round(Math.min(sbc, CNPS_PLAFOND) * (TAUX_PVID_EMPLOYEUR / 100));

export const computePFEmployer = (sbc) =>
  Math.round(sbc * (TAUX_PF_EMPLOYEUR / 100));

export const computeRPEmployer = (sbc, rateRP = 1.75) =>
  Math.round(sbc * (rateRP / 100));

// Total CNPS (salarié + employeur)
export const computeTotalCNPS = (sbc) => {
  const sal = computePVID(sbc);
  const emp = computePVIDEmployer(sbc) + computePFEmployer(sbc) + computeRPEmployer(sbc);
  return { salarie: sal, employeur: emp, total: sal + emp };
};

// ==================== CFC ====================
// Crédit Foncier Camerounais : 1% salarié, 1,5% employeur sur salaire brut taxable
export const computeCFC = (sbt, salRate = 1.0, empRate = 1.5) => {
  const salarie = Math.round(sbt * (salRate / 100));
  const employeur = Math.round(sbt * (empRate / 100));
  return { salarie, employeur, total: salarie + employeur };
};

// ==================== FNE ====================
// Fonds National de l'Emploi : uniquement employeur 1.0% (salarié 0%)
export const computeFNE = (sbt, salRate = 0.0, empRate = 1.0) => {
  const sal = Math.round(sbt * (salRate / 100));
  const emp = Math.round(sbt * (empRate / 100));
  return { salarie: sal, employeur: emp, total: sal + emp };
};

// ==================== EMPLOYEUR: CHARGES PATRONALES ====================
// Calcule les charges patronales (employeur) à partir des bases et du salaire de base
// Règles: PVID/PF/RP sur salaire de base (plafond uniquement pour PVID), FNE/CFC employeur sur SBT
export const computeEmployerChargesFromBases = (sbc, sbt, { rpCategory = 'A', fneEmpRate = TAUX_FNE_EMPLOYEUR, cfcEmpRate = TAUX_CFC_EMPLOYEUR, baseSalary = undefined } = {}) => {
  const baseSBC = Math.max(0, Number(sbc) || 0);
  const baseSBT = Math.max(0, Number(sbt) || 0);
  const baseBrut = Math.max(0, Number(baseSalary)) || 0;

  // Taux RP selon la catégorie
  const rpRate = TAUX_RP_CATEGORIES[rpCategory] || TAUX_RP_CATEGORIES.A;

  // PVID sur SBC plafonné, PF/RP sur SBC total
  const pvidEmployeur = Math.round(Math.min(baseSBC, CNPS_PLAFOND) * (TAUX_PVID_EMPLOYEUR / 100));
  const prestationsFamiliales = Math.round(baseSBC * (TAUX_PF_EMPLOYEUR / 100));
  const risquesPro = Math.round(baseSBC * (rpRate / 100));

  // FNE employeur sur SBT (1% par défaut)
  const fneEmployeur = Math.round(baseSBT * (Number(fneEmpRate) / 100));
  
  // CFC employeur sur SBT (1,5% par défaut)
  const cfcEmployeur = Math.round(baseSBT * (Number(cfcEmpRate) / 100));

  const totalCNPS_Employeur = pvidEmployeur + prestationsFamiliales + risquesPro;
  const totalAutresEmployeur = fneEmployeur + cfcEmployeur;
  const totalEmployeur = totalCNPS_Employeur + totalAutresEmployeur;

  return {
    pvidEmployeur,
    prestationsFamiliales,
    risquesPro,
    fneEmployeur,
    cfcEmployeur,
    totalCNPS_Employeur,
    totalAutresEmployeur,
    totalEmployeur,
    rpRate, // Retourner le taux utilisé pour affichage
    rpCategory, // Retourner la catégorie pour affichage
  };
};

// Calcule les charges patronales (employeur) à partir des données de la fiche
export const computeEmployerCharges = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = [], options = {}) => {
  // Construire employeeData minimal pour dériver SBC/SBT via calculerBases()
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {},
  };

  // Répartition basique: transport en non-cotisable, autres en cotisable
  ;(Array.isArray(primes) ? primes : []).forEach((prime) => {
    const label = String(prime.label || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    if (label.includes('transport')) {
      employeeData.primesNonCotisables.primeTransport = (employeeData.primesNonCotisables.primeTransport || 0) + montant;
    } else {
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
    }
  });

  // Les indemnités (logement/panier/etc.) sont généralement non-cotisables pour CNPS
  ;(Array.isArray(indemnites) ? indemnites : []).forEach((ind) => {
    const montant = num(ind.montant || ind.amount);
    employeeData.primesNonCotisables[`indemnite_${Date.now()}_${Math.random()}`] = montant;
  });

  const bases = calculerBases(employeeData); // { sbc, sbt }
  return computeEmployerChargesFromBases(bases.sbc, bases.sbt, { ...options, baseSalary: num(salaryDetails.baseSalary) });
};

// ==================== RAV ====================
// Redevance Audiovisuelle : barème officiel (montants fixes en XAF)
// Table fournie:
// 0 - 50 000  => 0
// 50 001 - 100 000 => 750
// 100 001 - 200 000 => 1 950
// 200 001 - 300 000 => 3 250
// 300 001 - 400 000 => 4 550
// 400 001 - 500 000 => 5 850
// 500 001 - 600 000 => 7 150
// 600 001 - 700 000 => 8 450
// 700 001 - 800 000 => 9 750
// 800 001 - 900 000 => 11 050
// 900 001 - 1 000 000 => 12 350
// > 1 000 000 => 13 000
export const computeRAV = (sbt) => {
  const v = Math.round(Number(sbt) || 0);
  if (v <= 50000) return 0;
  if (v <= 100000) return 750;
  if (v <= 200000) return 1950;
  if (v <= 300000) return 3250;
  if (v <= 400000) return 4550;
  if (v <= 500000) return 5850;
  if (v <= 600000) return 7150;
  if (v <= 700000) return 8450;
  if (v <= 800000) return 9750;
  if (v <= 900000) return 11050;
  if (v <= 1000000) return 12350;
  return 13000;
};

// ==================== TDL ====================
// Taxe de Développement Local : barème officiel
export const computeTDL = (baseSalary) => {
  if (baseSalary <= 61750) return 0;
  if (baseSalary <= 75000) return 250;
  if (baseSalary <= 100000) return 500;
  if (baseSalary <= 125000) return 750;
  if (baseSalary <= 150000) return 1000;
  if (baseSalary <= 200000) return 1250;
  if (baseSalary <= 250000) return 1500;
  // Au-delà de 250 000, appliquer une progression (estimation)
  if (baseSalary <= 300000) return 1750;
  if (baseSalary <= 350000) return 2000;
  if (baseSalary <= 400000) return 2250;
  if (baseSalary <= 450000) return 2500;
  if (baseSalary <= 500000) return 2750;
  return 3000; // Maximum pour les très hauts salaires
};

// ==================== IRPP (OFFICIEL SUR SBC) ====================
// Formules officielles IRPP Cameroun:
// Jusqu'à 63 250: pas d'IRPP
// 63 251 - 310 000: (SBC*70% - SBC*4,2% - 41 667)*10%
// 310 001 - 429 000: 16 693 + (SBC-310 000)*70%*15%
// 429 001 - 667 000: 29 188 + (SBC-429 000)*70%*25%
// 667 001 et plus: 70 830 + (SBC-667 000)*70%*35%
export const computeIRPPFromBase = (sbc) => {
  const sbcVal = Math.max(0, Number(sbc) || 0);
  
  // Pas d'IRPP jusqu'à 63 250
  if (sbcVal <= 63250) return 0;
  
  // Tranche 1: 63 251 - 310 000
  if (sbcVal <= 310000) {
    const baseImposable = sbcVal * 0.70 - sbcVal * 0.042 - 41667;
    return Math.max(0, Math.round(baseImposable * 0.10));
  }
  
  // Tranche 2: 310 001 - 429 000
  if (sbcVal <= 429000) {
    const irpp = 16693 + (sbcVal - 310000) * 0.70 * 0.15;
    return Math.round(irpp);
  }
  
  // Tranche 3: 429 001 - 667 000
  if (sbcVal <= 667000) {
    const irpp = 29188 + (sbcVal - 429000) * 0.70 * 0.25;
    return Math.round(irpp);
  }
  
  // Tranche 4: 667 001 et plus
  const irpp = 70830 + (sbcVal - 667000) * 0.70 * 0.35;
  return Math.round(irpp);
};

// Backward compatibility: delegate SBT function name to base implementation
export const computeIRPPFromSBT = (sbtOrBase) => computeIRPPFromBase(sbtOrBase);

// ==================== SNC & IRPP SUR SNC (POUR DIPE) ====================
// SNC = 70% * SBT - PVID(base) - Abattement mensuel (500 000 / 12)
export const computeSNC = (sbt, baseSalary) => {
  const sbtVal = Math.max(0, Number(sbt) || 0);
  const base = Math.max(0, Number(baseSalary) || 0);
  const pvidSal = Math.round(Math.min(base, CNPS_PLAFOND) * (TAUX_PVID_SALARIE / 100));
  const snc = 0.70 * sbtVal - pvidSal - ABATTEMENT_MENSUEL;
  return Math.max(0, Math.round(snc));
};

// IRPP sur SNC avec barème progressif officiel (tranches mensuelles)
export const computeIRPPFromSNC = (snc) => {
  const b = Math.max(0, Number(snc) || 0);
  if (b <= 62000) return 0;
  let tax = 0;
  const t2 = 200000;
  const t3 = 300000;
  const t4 = 500000;
  // 10% 62,001 - 200,000
  if (b > 62000) tax += (Math.min(b, t2) - 62000) * 0.10;
  // 15% 200,001 - 300,000
  if (b > t2) tax += (Math.min(b, t3) - t2) * 0.15;
  // 25% 300,001 - 500,000
  if (b > t3) tax += (Math.min(b, t4) - t3) * 0.25;
  // 35% > 500,000
  if (b > t4) tax += (b - t4) * 0.35;
  return Math.round(tax);
};

// ==================== UNIFIED SNAPSHOT ====================
// Point d'entrée unifié pour toutes les vues afin d'éviter toute divergence
export function buildPayrollSnapshot({ salaryDetails = {}, remuneration = {}, primes = [], indemnites = [] } = {}) {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {}
  };

  // Normaliser les primes en cotisables vs non-cotisables
  (Array.isArray(primes) ? primes : []).forEach(prime => {
    const label = (prime.label || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    if (label.includes('transport')) {
      employeeData.primesNonCotisables.primeTransport = (employeeData.primesNonCotisables.primeTransport || 0) + montant;
    } else {
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
    }
  });

  const result = calculComplet(employeeData);

  return {
    bases: result.bases, // { salaireBrutTotal, sbc, sbt, ... }
    cnps: result.cnps,   // { pvidSalarie, pvidEmployeur, prestationsFamiliales, risquesPro, totalSalarie, totalEmployeur }
    autres: result.autres, // { cfc, fneSalarie, fneEmployeur }
    irpp: result.irpp,
    rav: result.rav,
    tdl: result.tdl,
    totalCotisationsSalarie: result.totalCotisationsSalarie,
    totalTaxes: result.totalTaxes,
    totalRetenues: result.totalRetenues,
    net: result.salaireNet,
  };
}

// ==================== OPTIONS EMPLOYEUR (Ajustements) ====================
export function applyEmployerOptionsToCNPS({ baseSalary, sbc, sbt, cnps, autres }, employerOptions = {}) {
  // Extraire options avec défauts
  const includePVID = employerOptions.includePVID !== false; // par défaut actif
  const includePF = employerOptions.includePF !== false;     // par défaut actif
  const includeRP = employerOptions.includeRP !== false;     // RP actif par défaut, décocher pour désactiver
  // FNE employeur: toujours appliqué à 1,5% (exigence)

  // Forcer le taux PVID employeur à la valeur réglementaire (4,2%)
  const ratePVID = TAUX_PVID_EMPLOYEUR;
  const ratePF = Number(employerOptions.ratePF) || TAUX_PF_EMPLOYEUR;
  const rateRP = Number(employerOptions.rateRP) || TAUX_RP_EMPLOYEUR;
  const rateFNEmp = TAUX_FNE_EMPLOYEUR;

  // Bases: selon synthèse utilisateur
  // - PVID: sur salaire de base plafonné
  // - PF: sur salaire de base
  // - RP: sur salaire de base
  const basePlafPVID = Math.min(baseSalary || 0, CNPS_PLAFOND);

  // Recalcul employeur selon options
  const pvidEmployeur = includePVID ? Math.round(basePlafPVID * (ratePVID / 100)) : 0;
  const baseForPF_RP = baseSalary || 0;
  const prestationsFamiliales = includePF ? Math.round(baseForPF_RP * (ratePF / 100)) : 0;
  const risquesPro = includeRP ? Math.round(baseForPF_RP * (rateRP / 100)) : 0;
  const totalEmployeur = pvidEmployeur + prestationsFamiliales + risquesPro;

  // FNE employeur toujours appliqué à 1,5%
  const fneEmployeur = Math.round(sbt * (rateFNEmp / 100));

  // CFC employeur toujours appliqué à 1,5%
  const cfcEmployeur = Math.round(sbt * (TAUX_CFC_EMPLOYEUR / 100));

  return {
    pvidEmployeur,
    prestationsFamiliales,
    risquesPro,
    totalEmployeur,
    fneEmployeur,
    cfcEmployeur,
  };
}

// ==================== CALCUL DES BASES (SBC/SBT) ====================
export function calculerBases(employeeData) {
  // 1. TOTAL PRIMES COTISABLES
  const totalPrimesCotisables = Object.values(employeeData.primesCotisables || {})
    .reduce((sum, prime) => sum + num(prime), 0);
  
  // 2. TOTAL PRIMES NON COTISABLES (SBT inclut le montant total sans plafonds)
  let totalPrimesNonCotisables = 0;
  let primesNonCotisablesAjustees = {};
  
  // Pour la base fiscale (SBT), inclure la totalité des indemnités/primes non cotisables
  Object.entries(employeeData.primesNonCotisables || {}).forEach(([key, value]) => {
    const montantTotal = num(value);
    primesNonCotisablesAjustees[key] = montantTotal;
    totalPrimesNonCotisables += montantTotal;
  });

  // 3. CALCULS DES BASES
  const salaireBrut = num(employeeData.salaireBrut);
  const salaireBrutTotal = salaireBrut + totalPrimesCotisables + totalPrimesNonCotisables;
  
  // SBC = Salaire brut + primes cotisables UNIQUEMENT
  const sbc = salaireBrut + totalPrimesCotisables;
  
  // SBT = SBC + primes non cotisables (base fiscale plus large)
  const sbt = sbc + totalPrimesNonCotisables;

  return { 
    salaireBrutTotal, 
    sbc, 
    sbt, 
    totalPrimesCotisables, 
    totalPrimesNonCotisables,
    primesNonCotisablesAjustees 
  };
}

// ==================== CALCULS CNPS (sur SBC) ====================
export function calculerCNPS(sbc, baseSalaryForPVID = null) {
  // PVID Salarié ET Employeur: sur SBC plafonné (salaire cotisable)
  const sbcPlafonne = Math.min(Number(sbc) || 0, CNPS_PLAFOND);
  const pvidSalarie = Math.round(sbcPlafonne * (TAUX_PVID_SALARIE / 100));
  
  // PVID Employeur: MÊME BASE que salarié (SBC plafonné)
  const pvidEmployeur = Math.round(sbcPlafonne * (TAUX_PVID_EMPLOYEUR / 100));
  
  // Prestations Familiales (employeur) et Risques Pro: sur SBC total, sans plafond
  const prestationsFamiliales = Math.round(sbc * (TAUX_PF_EMPLOYEUR / 100));
  const risquesPro = Math.round(sbc * (TAUX_RP_EMPLOYEUR / 100));
  
  return {
    pvidSalarie,
    pvidEmployeur,
    prestationsFamiliales,
    risquesPro,
    totalSalarie: pvidSalarie,
    totalEmployeur: pvidEmployeur + prestationsFamiliales + risquesPro
  };
}

// ==================== AUTRES COTISATIONS (sur SBT) ====================
export function calculerAutresCotisations(sbt) {
  // CFC - sur SBT (base fiscale) - 1% salarié, 1,5% employeur
  const cfcSalarie = Math.round(sbt * (TAUX_CFC_SALARIE / 100));
  const cfcEmployeur = Math.round(sbt * (TAUX_CFC_EMPLOYEUR / 100));
  const cfc = cfcSalarie; // Pour compatibilité avec l'ancien code (salarié uniquement)
  
  // FNE - sur SBT (base fiscale)
  const fneSalarie = Math.round(sbt * (TAUX_FNE_SALARIE / 100));
  const fneEmployeur = Math.round(sbt * (TAUX_FNE_EMPLOYEUR / 100));
  
  return { cfc, cfcSalarie, cfcEmployeur, fneSalarie, fneEmployeur };
}

// ==================== CALCUL IRPP (sur SBT) ====================
export function calculerIRPP(baseSalary) {
  // IRPP officiel directement sur salaire mensuel brut (ici: salaire de base choisi)
  const irpp = computeIRPPFromBase(baseSalary);
  return { snc: Math.round(Number(baseSalary) || 0), irpp };
}

// ==================== FONCTIONS AGRÉGÉES ====================
export const computeStatutoryDeductions = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Convertir les primes avec classification
  primes.forEach(prime => {
    const label = prime.label || prime.type || '';
    const montant = num(prime.montant || prime.amount);
    const key = `prime_${Date.now()}_${Math.random()}`;
    
    if (categorizeAsCotisable(label)) {
      employeeData.primesCotisables[key] = montant;
    } else {
      employeeData.primesNonCotisables[key] = montant;
    }
  });
  
  // Convertir les indemnités avec classification
  indemnites.forEach(ind => {
    const label = ind.label || ind.type || '';
    const montant = num(ind.montant || ind.amount);
    const key = `indemnite_${Date.now()}_${Math.random()}`;
    
    if (categorizeAsCotisable(label)) {
      employeeData.primesCotisables[key] = montant;
    } else {
      employeeData.primesNonCotisables[key] = montant;
    }
  });
  
  const result = calculComplet(employeeData);
  
  return {
    pvid: result.cnps.pvidSalarie,
    pvis: result.cnps.pvidSalarie, // Backward compatibility
    irpp: result.irpp,
    cac: Math.round(result.irpp * 0.10),
    cfc: result.autres.cfc,
    rav: result.rav,
    tdl: result.tdl,
    fne: result.autres.fneSalarie,
    total: result.totalRetenues
  };
};

export const computeTaxes = (baseSalary, sbt, sbc, taxOptions = {}) => {
  // IRPP officiel: calcul sur salaire de base
  const irpp = computeIRPPFromBase(baseSalary);

  const cfcSalRate = Number(taxOptions.cfcSalRate) || TAUX_CFC_SALARIE;
  const cfcEmpRate = Number(taxOptions.cfcEmpRate) || TAUX_CFC_EMPLOYEUR;
  const cfc = computeCFC(sbt, cfcSalRate, cfcEmpRate);

  const fneSalRate = Number(taxOptions.fneRateSal) || 0.0;
  const fneEmpRate = Number(taxOptions.fneRateEmp) || 1.0;
  const fne = computeFNE(sbt, fneSalRate, fneEmpRate);

  const rav = computeRAV(sbt);
  const tdl = computeTDL(baseSalary);

  return {
    irpp,
    cfc: cfc.salarie, // Pour compatibilité, retourner seulement la part salarié
    cfcDetail: cfc, // Détail complet (salarié + employeur)
    fne,
    rav,
    tdl,
    total: irpp + cfc.salarie + rav + tdl,
  };
};

// Pour affichage avec libellés
export const computeTaxesWithLabels = (baseSalary, sbt, sbc, taxOptions = {}) => {
  const t = computeTaxes(baseSalary, sbt, sbc, taxOptions);
  return [
    { label: getIRPPLabel(), value: t.irpp },
    { label: getCFCLabel(), value: t.cfc },
    { label: getFNELabel(), value: t.fne.salarie },
    { label: getRAVLabel(), value: t.rav },
    { label: getTDLLabel(), value: t.tdl },
  ];
};

// ==================== CALCUL COMPLET ====================
export function calculComplet(employeeData) {
  // 1. Calcul des bases avec distinction cotisable/non cotisable
  const bases = calculerBases(employeeData);
  
  // 2. Cotisations CNPS (PVID salarié doit être sur salaire de base)
  const cnps = calculerCNPS(bases.sbc, employeeData.salaireBrut);
  
  // 3. Autres cotisations (sur SBT)
  const autres = calculerAutresCotisations(bases.sbt);
  
  // 4. RAV (sur SBT) et TDL (sur salaire de base)
  const rav = computeRAV(bases.sbt);
  const tdl = computeTDL(employeeData.salaireBrut);
  
  // 5. IRPP (officiel sur SBC selon nouvelles formules)
  const { snc, irpp } = calculerIRPP(bases.sbc);
  
  // 6. RÉCAPITULATIF FINAL
  const cac = Math.round(irpp * 0.10);
  const totalCotisationsSalarie = cnps.totalSalarie + autres.cfc + autres.fneSalarie;
  const totalTaxes = rav + tdl + irpp + cac;
  const totalRetenues = totalCotisationsSalarie + totalTaxes;
  const salaireNet = bases.salaireBrutTotal - totalRetenues;
  
  return {
    bases,
    cnps,
    autres,
    rav,
    tdl,
    irpp,
    cac,
    snc,
    totalCotisationsSalarie,
    totalTaxes,
    totalRetenues,
    salaireNet
  };
}

// ==================== FONCTIONS DE COMPATIBILITÉ ====================
// Pour maintenir la compatibilité avec l'ancien système
export const computeNetPay = ({ salaryDetails = {}, remuneration = {}, deductions = {}, primes = [], indemnites = [] }) => {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {
      primeRendement: primes.find(p => p.label?.includes('rendement'))?.montant || 0,
      primeExceptionnelle: primes.find(p => p.label?.includes('exceptionnelle'))?.montant || 0,
    },
    primesNonCotisables: {
      primeTransport: primes.find(p => p.label?.includes('transport'))?.montant || 0,
    }
  };
  
  const result = calculComplet(employeeData);
  
  // Structure complète pour compatibilité avec ClientAdminDashboard
  return {
    netPay: result.salaireNet,
    totalDeductions: result.totalRetenues,
    grossTotal: result.bases.salaireBrutTotal,
    deductions: {
      pvid: result.cnps.pvidSalarie,
      pvis: result.cnps.pvidSalarie, // Backward compatibility
      irpp: result.irpp,
      cac: Math.round(result.irpp * 0.10), // CAC = 10% IRPP
      cfc: result.autres.cfc,
      rav: result.rav,
      tdl: result.tdl,
      fne: result.autres.fneSalarie,
      total: result.totalRetenues
    },
    deductionsTotal: result.totalRetenues
  };
};

// ==================== FONCTION CENTRALISÉE UNIVERSELLE ====================
// Cette fonction calcule TOUT à partir des données brutes
// À utiliser PARTOUT pour garantir la cohérence
export const computeCompletePayroll = (payslipData) => {
  const baseSalary = num(payslipData?.salaryDetails?.baseSalary || payslipData?.baseSalary || 0);
  const primes = Array.isArray(payslipData?.primes) ? payslipData.primes : [];
  const indemnites = Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : [];
  
  const salaryDetails = { baseSalary };
  const remuneration = payslipData?.remuneration || {};
  
  // Calcul des bases
  const sbc = computeSBC(salaryDetails, remuneration, primes, indemnites);
  const sbt = computeSBT(salaryDetails, remuneration, primes, indemnites);
  
  // Calcul des déductions avec calculComplet pour garantir la cohérence
  const employeeData = {
    salaireBrut: baseSalary,
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Convertir les primes avec classification
  primes.forEach(prime => {
    const label = prime.label || prime.type || '';
    const montant = num(prime.montant || prime.amount);
    const key = `prime_${Date.now()}_${Math.random()}`;
    
    if (categorizeAsCotisable(label)) {
      employeeData.primesCotisables[key] = montant;
    } else {
      employeeData.primesNonCotisables[key] = montant;
    }
  });
  
  // Convertir les indemnités avec classification
  indemnites.forEach(ind => {
    const label = ind.label || ind.type || '';
    const montant = num(ind.montant || ind.amount);
    const key = `indemnite_${Date.now()}_${Math.random()}`;
    
    if (categorizeAsCotisable(label)) {
      employeeData.primesCotisables[key] = montant;
    } else {
      employeeData.primesNonCotisables[key] = montant;
    }
  });
  
  // Calcul complet avec calculComplet
  const result = calculComplet(employeeData);
  
  // Calcul des charges employeur
  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
    baseSalary,
    rpCategory: 'A'
  });
  
  return {
    baseSalary,
    sbc: result.bases.sbc,
    sbt: result.bases.sbt,
    grossTotal: result.bases.salaireBrutTotal,
    deductions: {
      pvid: result.cnps.pvidSalarie,
      irpp: result.irpp,
      cac: result.cac,
      cfc: result.autres.cfc,
      rav: result.rav,
      tdl: result.tdl,
      fne: result.autres.fneSalarie,
      total: result.totalRetenues
    },
    netPay: result.salaireNet,
    employerCharges: {
      pvidEmployeur: employerCharges.pvidEmployeur,
      prestationsFamiliales: employerCharges.prestationsFamiliales,
      risquesPro: employerCharges.risquesPro,
      fneEmployeur: employerCharges.fneEmployeur,
      cfcEmployeur: employerCharges.cfcEmployeur,
      total: employerCharges.totalEmployeur
    },
    primes,
    indemnites
  };
};

// Fonction pour formater les montants
export const formatCFA = (amount) => {
  return `${Math.round(num(amount)).toLocaleString()} XAF`;
};

// Fonction de formatage sécurisée (évite les doublons)
export const formatAmount = (amount, includeCurrency = true) => {
  const numericValue = Math.round(num(amount));
  const formattedNumber = numericValue.toLocaleString();
  
  if (includeCurrency) {
    return `${formattedNumber} XAF`;
  }
  return formattedNumber;
};

// Fonction pour nettoyer les montants avec devise dupliquée
export const cleanCurrencyDisplay = (text) => {
  if (typeof text !== 'string') return text;
  
  // Supprimer les doublons de devise
  return text
    .replace(/FCFA\s+FCFA/g, 'XAF')
    .replace(/XAF\s+XAF/g, 'XAF')
    .replace(/FCFA\s+XAF/g, 'XAF')
    .replace(/XAF\s+FCFA/g, 'XAF')
    .replace(/FCFA/g, 'XAF')
    .trim();
};

// Fonction de sécurité pour éviter les erreurs undefined
export const safeGetDeductions = (payrollResult) => {
  if (!payrollResult) {
    return {
      pvid: 0,
      pvis: 0,
      irpp: 0,
      cac: 0,
      cfc: 0,
      rav: 0,
      tdl: 0,
      fne: 0,
      total: 0
    };
  }
  
  if (payrollResult.deductions) {
    return payrollResult.deductions;
  }
  
  // Si pas de structure deductions, créer à partir des propriétés directes
  return {
    pvid: payrollResult.pvid || 0,
    pvis: payrollResult.pvid || 0,
    irpp: payrollResult.irpp || 0,
    cac: payrollResult.cac || 0,
    cfc: payrollResult.cfc || 0,
    rav: payrollResult.rav || 0,
    tdl: payrollResult.tdl || 0,
    fne: payrollResult.fne || 0,
    total: payrollResult.total || payrollResult.totalDeductions || 0
  };
};


// Fonction computeSBT pour compatibilité - basé sur calculerBases (évite récursion)
export const computeSBT = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const employeeData = buildEmployeeDataFromInputs(salaryDetails, primes, indemnites);
  const bases = calculerBases(employeeData);
  return bases.sbt;
};

// Fonction computeSBC pour compatibilité - basé sur calculerBases (évite récursion)
export const computeSBC = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const employeeData = buildEmployeeDataFromInputs(salaryDetails, primes, indemnites);
  const bases = calculerBases(employeeData);
  return bases.sbc;
};

// Fonction getCalculs pour compatibilité CNPS
export const getCalculs = (data = {}, employerOptions = {}) => {
  const baseSalary = num(data.baseSalary || data.brut);
  const employeeData = {
    salaireBrut: baseSalary,
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Ajouter les primes si présentes
  if (data.primesArray) {
    data.primesArray.forEach(prime => {
      const montant = num(prime.montant || prime.amount);
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
    });
  }
  
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
};

// Fonction computeGrossTotal pour compatibilité - utilise computeCompletePayroll
export const computeGrossTotal = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const payslipData = { salaryDetails, remuneration, primes, indemnites };
  return computeCompletePayroll(payslipData).bases.salaireBrutTotal;
};

// Fonction validateDeductions pour compatibilité
export const validateDeductions = (deductions = {}) => {
  return {
    pvid: num(deductions.pvid),
    irpp: num(deductions.irpp),
    cfc: num(deductions.cfc),
    rav: num(deductions.rav),
    tdl: num(deductions.tdl),
    fne: num(deductions.fne),
    total: Object.values(deductions).reduce((sum, val) => sum + num(val), 0)
  };
};

// Fonction computeEffectiveDeductions pour compatibilité - alias de validateDeductions
export const computeEffectiveDeductions = validateDeductions;

// Fonction computeRoundedDeductions pour compatibilité
export const computeRoundedDeductions = (deductions = {}) => {
  const effective = validateDeductions(deductions);
  return {
    pvid: Math.round(effective.pvid),
    pvis: Math.round(effective.pvid),
    irpp: Math.round(effective.irpp),
    cac: Math.round(effective.irpp * 0.10),
    cfc: Math.round(effective.cfc),
    rav: Math.round(effective.rav),
    tdl: Math.round(effective.tdl),
    fne: Math.round(effective.fne),
    total: Math.round(effective.total)
  };
};

// Fonctions pour les totaux et résumés
export const calculateEmployerSummary = (selectedIds = [], formData = {}, employees = [], employerOptions = {}) => {
  let totalBrut = 0;
  let totalEmployeurDu = 0; // Charges à la charge de l'employeur (CNPS employeur + FNE employeur)
  let totalSalarie = 0;     // Retenues salariales (toutes retenues)
  let totalNet = 0;
  // Détail charges employeur
  let pvidEmp = 0;
  let pf = 0;
  let rp = 0;
  let fneEmp = 0;
  let cfcEmp = 0;

  selectedIds.forEach(id => {
    const data = formData[id] || {};
    const emp = Array.isArray(employees) ? employees.find(e => e.id === id) : undefined;
    const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};

    const baseSalary = num(latestPayslip.salaryDetails?.baseSalary ?? data.baseSalary ?? data.brut);
    const primesArr = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
    const indemArr = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
    const brutFromPayslip = num(latestPayslip.remuneration?.total);

    const employeeData = {
      salaireBrut: baseSalary,
      primesCotisables: {},
      primesNonCotisables: {}
    };
    // Répartition basique des éléments du payslip
    primesArr.forEach(p => {
      const label = (p.label || '').toLowerCase();
      const montant = num(p.montant || p.amount);
      if (label.includes('transport')) {
        employeeData.primesNonCotisables.primeTransport = (employeeData.primesNonCotisables.primeTransport || 0) + montant;
      } else {
        employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
      }
    });
    indemArr.forEach(i => {
      const montant = num(i.montant || i.amount);
      employeeData.primesNonCotisables[`indemnite_${Date.now()}_${Math.random()}`] = montant;
    });

    const result = calculComplet(employeeData);
    // Total brut affiché: privilégier le brut du payslip s'il est présent, sinon celui calculé
    totalBrut += brutFromPayslip || result.bases.salaireBrutTotal;
    // Employeur: appliquer options (incl. RP coché)
    const adj = applyEmployerOptionsToCNPS({ baseSalary, sbc: result.bases.sbc, sbt: result.bases.sbt, cnps: result.cnps, autres: result.autres }, employerOptions);
    const employeurThis = adj.totalEmployeur + adj.fneEmployeur + adj.cfcEmployeur;
    totalEmployeurDu += employeurThis;
    // Détail
    pvidEmp += adj.pvidEmployeur;
    pf += adj.prestationsFamiliales;
    rp += adj.risquesPro;
    fneEmp += adj.fneEmployeur;
    cfcEmp += adj.cfcEmployeur;
    // Salarié: toutes retenues du salarié
    totalSalarie += result.totalRetenues;
    totalNet += result.salaireNet;
  });

  return {
    totalBrut,
    totalEmployeurDu,
    totalSalarie,
    totalNet,
    employerBreakdown: { pvidEmp, pf, rp, fneEmp, cfcEmp },
    // Champs de compatibilité
    totalEmployeur: totalEmployeurDu,
    totalGeneral: totalEmployeurDu + totalSalarie
  };
};

export const calculateTableTotals = (selectedIds = [], formData = {}, employees = [], employerOptions = {}) => {
  let totalSBC = 0;
  let totalSBT = 0;
  let totalNet = 0;
  let brut = 0;
  let sal = 0; // Charges salarié (retenues)
  let emp = 0; // Charges employeur
  
  selectedIds.forEach(id => {
    const data = formData[id] || {};
    const empObj = Array.isArray(employees) ? employees.find(e => e.id === id) : undefined;
    const payslips = Array.isArray(empObj?.payslips) ? empObj.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};

    const baseSalary = num(latestPayslip.salaryDetails?.baseSalary ?? data.baseSalary ?? data.brut);
    const primesArr = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
    const indemArr = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
    const brutFromPayslip = num(latestPayslip.remuneration?.total);

    const employeeData = {
      salaireBrut: baseSalary,
      primesCotisables: {},
      primesNonCotisables: {}
    };
    primesArr.forEach(p => {
      const label = (p.label || '').toLowerCase();
      const montant = num(p.montant || p.amount);
      if (label.includes('transport')) {
        employeeData.primesNonCotisables.primeTransport = (employeeData.primesNonCotisables.primeTransport || 0) + montant;
      } else {
        employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
      }
    });
    indemArr.forEach(i => {
      const montant = num(i.montant || i.amount);
      employeeData.primesNonCotisables[`indemnite_${Date.now()}_${Math.random()}`] = montant;
    });

    const result = calculComplet(employeeData);
    totalSBC += result.bases.sbc;
    totalSBT += result.bases.sbt;
    totalNet += result.salaireNet;
    brut += brutFromPayslip || result.bases.salaireBrutTotal;
    sal += result.totalRetenues;
    const adj = applyEmployerOptionsToCNPS({ sbc: result.bases.sbc, sbt: result.bases.sbt, cnps: result.cnps, autres: result.autres }, employerOptions);
    emp += adj.totalEmployeur + adj.fneEmployeur + adj.cfcEmployeur;
  });
  
  return { totalSBC, totalSBT, totalNet, brut, sal, emp };
};

export const calculateTotalNet = (selectedIds = [], formData = {}) => {
  const totals = calculateTableTotals(selectedIds, formData);
  return totals.totalNet;
};

// Fonction pour calculer les taxes de tous les employés sélectionnés (pour PDF Impôts)
export const computeTaxesForEmployees = (selectedIds = [], formData = {}, employerOptions = {}, taxOptions = {}, employees = []) => {
  const rows = [];
  
  selectedIds.forEach(id => {
    const d = formData[id] || {};
    const emp = employees?.find(e => e.id === id);
    const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
    const latestPayslip = payslips[payslips.length - 1] || {};
    
    // Utiliser exactement les mêmes données que le tableau principal
    const baseSalaryValue = Number(
      latestPayslip.salaryDetails?.baseSalary ?? d.baseSalary ?? d.brut ?? emp?.baseSalary ?? 0
    );
    const salaryDetails = { baseSalary: baseSalaryValue };
    
    const remuneration = {
      total: Number(latestPayslip.remuneration?.total ?? d.brut ?? baseSalaryValue ?? 0)
    };
    
    const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
    const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
    
    // Utiliser computeCompletePayroll comme dans le tableau principal
    const payslipData = {
      salaryDetails,
      remuneration,
      primes,
      indemnites
    };
    const calc = computeCompletePayroll(payslipData);
    
    // Calculer les taxes avec les mêmes données que le tableau
    const taxes = computeTaxes(baseSalaryValue, calc.sbt, calc.sbc, taxOptions);
    
    rows.push({
      id,
      cnps: d.cnps || d.matricule || '-',
      nom: d.nom || d.name || '-',
      sbt: calc.sbt,
      sbc: calc.sbc,
      irpp: taxes.irpp,
      cac: Math.round(taxes.irpp * 0.10),
      cfc: taxes.cfc,
      rav: taxes.rav,
      tdl: taxes.tdl,
      fne: taxes.fne.salarie,
      fneEmployeur: taxes.fne.employeur
    });
  });
  
  return { rows };
};

// TRAITEMENT EN PARALLÈLE ET DÉTECTION D'ANOMALIES
// ==================================================================================

// Helper interne: construit un employeeData minimal à partir des entrées UI
const buildEmployeeDataFromInputs = (salaryDetails = {}, primes = [], indemnites = []) => {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {}
  };

  // Primes
  (Array.isArray(primes) ? primes : []).forEach((prime, index) => {
    const label = (prime.label || prime.type || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    const key = `prime_${index}`;
    if (categorizeAsCotisable(label)) employeeData.primesCotisables[key] = montant;
    else employeeData.primesNonCotisables[key] = montant;
  });

  // Indemnités
  (Array.isArray(indemnites) ? indemnites : []).forEach((ind, index) => {
    const label = (ind.label || ind.type || '').toLowerCase();
    const montant = num(ind.montant || ind.amount);
    const key = `indemnite_${index}`;
    if (categorizeAsCotisable(label)) employeeData.primesCotisables[key] = montant;
    else employeeData.primesNonCotisables[key] = montant;
  });

  return employeeData;
};

/**
 * Utilitaire pour créer les données de paie standardisées
 * @param {Object} employee - Données de l'employé
 * @returns {Object} - Données formatées pour computeCompletePayroll
 */
const createPayslipDataFromEmployee = (employee) => {
  const payslips = Array.isArray(employee.payslips) ? employee.payslips : [];
  const latestPayslip = payslips[payslips.length - 1] || {};
  
  return {
    salaryDetails: {
      baseSalary: num(employee.baseSalary)
    },
    remuneration: {
      total: num(latestPayslip.remuneration?.total || employee.baseSalary)
    },
    primes: Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [],
    indemnites: Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : []
  };
};

// ==================================================================================

/**
 * Détecte les anomalies dans les données d'un employé avant le calcul de paie
 * @param {Object} employee - Données de l'employé
 * @returns {Object} - { hasAnomalies: boolean, anomalies: string[] }
 */
export const detectPayrollAnomalies = (employee) => {
  const anomalies = [];
  
  // Vérification salaire de base
  const baseSalary = num(employee.baseSalary);
  if (!baseSalary || baseSalary <= 0) {
    anomalies.push(`Salaire de base manquant ou invalide (${baseSalary})`);
  } else if (baseSalary < 36270) { // SMIG Cameroun
    anomalies.push(`Salaire inférieur au SMIG (${baseSalary} < 36,270 FCFA)`);
  } else if (baseSalary > 10000000) { // Seuil de vérification
    anomalies.push(`Salaire exceptionnellement élevé (${baseSalary} FCFA)`);
  }
  
  // Vérification données obligatoires
  if (!employee.name?.trim()) {
    anomalies.push("Nom de l'employé manquant");
  }
  
  if (!employee.cnpsNumber?.trim()) {
    anomalies.push("Numéro CNPS manquant");
  }
  
  if (!employee.matricule?.trim()) {
    anomalies.push("Matricule employé manquant");
  }
  
  // Vérification statut employé
  if (employee.status !== 'Actif') {
    anomalies.push(`Employé non actif (statut: ${employee.status})`);
  }
  
  // Vérification primes et indemnités
  const payslips = Array.isArray(employee.payslips) ? employee.payslips : [];
  const latestPayslip = payslips[payslips.length - 1];
  
  if (latestPayslip) {
    const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
    const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
    
    // Vérification montants négatifs
    primes.forEach((prime, index) => {
      const montant = num(prime.montant || prime.amount);
      if (montant < 0) {
        anomalies.push(`Prime ${index + 1} négative (${montant})`);
      }
    });
    
    indemnites.forEach((indemnite, index) => {
      const montant = num(indemnite.montant || indemnite.amount);
      if (montant < 0) {
        anomalies.push(`Indemnité ${index + 1} négative (${montant})`);
      }
    });
  }
  
  return {
    hasAnomalies: anomalies.length > 0,
    anomalies
  };
};

/**
 * Calcule la paie d'un employé avec gestion d'erreurs optimisée
 * @param {Object} employee - Données de l'employé
 * @param {Object} options - Options de calcul
 * @returns {Promise<Object>} - Résultat du calcul ou erreur
 */
export const calculateEmployeePayrollAsync = async (employee, options = {}) => {
  try {
    // Détection d'anomalies en premier
    const anomalyCheck = detectPayrollAnomalies(employee);
    
    if (anomalyCheck.hasAnomalies && !options.ignoreAnomalies) {
      return {
        success: false,
        employeeId: employee.id,
        employeeName: employee.name,
        error: 'Anomalies détectées',
        anomalies: anomalyCheck.anomalies
      };
    }
    
    // Préparation des données pour le calcul
    const employeePayslipData = createPayslipDataFromEmployee(employee);
    
    // Calcul complet de la paie
    const payrollResult = computeCompletePayroll(employeePayslipData);
    
    // Construction de la fiche de paie finale
    const finalPayslipData = {
      id: `payslip_${employee.id}_${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      matricule: employee.matricule,
      cnpsNumber: employee.cnpsNumber,
      month: options.month || new Date().getMonth() + 1,
      year: options.year || new Date().getFullYear(),
      generatedAt: new Date().toISOString(),
      
      // Données salariales
      salaryDetails: {
        baseSalary: num(employeePayslipData?.salaryDetails?.baseSalary || 0)
      },
      
      // Éléments de rémunération détaillés
      primes: Array.isArray(employeePayslipData?.primes) ? employeePayslipData.primes : [],
      indemnites: Array.isArray(employeePayslipData?.indemnites) ? employeePayslipData.indemnites : [],
      
      // Résultats de calcul
      remuneration: {
        total: payrollResult.grossTotal
      },
      
      // Bases de calcul
      bases: {
        sbc: payrollResult.sbc,
        sbt: payrollResult.sbt
      },
      
      // Déductions
      deductions: {
        pvid: payrollResult.deductions.pvid,
        irpp: payrollResult.deductions.irpp,
        cfc: payrollResult.deductions.cfc,
        total: payrollResult.deductions.total
      },
      
      // Salaire net
      netPay: payrollResult.netPay,
      
      // Métadonnées
      calculationDetails: payrollResult,
      anomalies: anomalyCheck.anomalies
    };
    
    return {
      success: true,
      employeeId: employee.id,
      employeeName: employee.name,
      payslipData: finalPayslipData,
      anomalies: anomalyCheck.anomalies
    };
    
  } catch (error) {
    return {
      success: false,
      employeeId: employee.id,
      employeeName: employee.name || 'Inconnu',
      error: error.message || 'Erreur de calcul',
      anomalies: []
    };
  }
};

/**
 * Traite la paie de tous les employés en parallèle avec optimisations
 * @param {Array} employees - Liste des employés
 * @param {Object} options - Options de traitement
 * @param {Function} onProgress - Callback de progression
 * @returns {Promise<Object>} - Résultats du traitement
 */
export const processPayrollBatch = async (employees, options = {}, onProgress = null) => {
  const startTime = Date.now();
  const results = {
    success: [],
    errors: [],
    anomalies: [],
    summary: {
      total: employees.length,
      processed: 0,
      successful: 0,
      failed: 0,
      withAnomalies: 0,
      processingTime: 0
    }
  };
  
  // Filtrer les employés actifs seulement (sauf si forcé)
  const activeEmployees = options.includeInactive 
    ? employees 
    : employees.filter(emp => emp.status === 'Actif');
  
  results.summary.total = activeEmployees.length;
  
  if (activeEmployees.length === 0) {
    return {
      ...results,
      summary: {
        ...results.summary,
        processingTime: Date.now() - startTime
      }
    };
  }
  
  // Traitement en parallèle par chunks pour éviter la surcharge
  const chunkSize = options.chunkSize || 10; // Traiter 10 employés en parallèle max
  const chunks = [];
  
  for (let i = 0; i < activeEmployees.length; i += chunkSize) {
    chunks.push(activeEmployees.slice(i, i + chunkSize));
  }
  
  // Traitement chunk par chunk
  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    
    try {
      // Traitement parallèle du chunk
      const chunkPromises = chunk.map(employee => 
        calculateEmployeePayrollAsync(employee, options)
      );
      
      const chunkResults = await Promise.all(chunkPromises);
      
      // Traitement des résultats du chunk
      chunkResults.forEach(result => {
        results.summary.processed++;
        
        if (result.success) {
          results.success.push(result);
          results.summary.successful++;
          
          if (result.anomalies && result.anomalies.length > 0) {
            results.anomalies.push({
              employeeId: result.employeeId,
              employeeName: result.employeeName,
              anomalies: result.anomalies
            });
            results.summary.withAnomalies++;
          }
        } else {
          results.errors.push(result);
          results.summary.failed++;
          
          if (result.anomalies && result.anomalies.length > 0) {
            results.anomalies.push({
              employeeId: result.employeeId,
              employeeName: result.employeeName,
              anomalies: result.anomalies
            });
            results.summary.withAnomalies++;
          }
        }
        
        // Callback de progression
        if (onProgress) {
          onProgress({
            processed: results.summary.processed,
            total: results.summary.total,
            percentage: Math.round((results.summary.processed / results.summary.total) * 100),
            currentEmployee: result.employeeName
          });
        }
      });
      
    } catch (chunkError) {
      // En cas d'erreur sur tout le chunk
      chunk.forEach(employee => {
        results.errors.push({
          success: false,
          employeeId: employee.id,
          employeeName: employee.name || 'Inconnu',
          error: `Erreur chunk: ${chunkError.message}`,
          anomalies: []
        });
        results.summary.processed++;
        results.summary.failed++;
      });
    }
  }
  
  results.summary.processingTime = Date.now() - startTime;
  
  return results;
};

/**
 * Prépare les données pour l'écriture batch Firestore
 * @param {Array} payslipResults - Résultats des calculs de paie
 * @param {string} companyId - ID de l'entreprise
 * @returns {Array} - Chunks de données prêtes pour Firestore batch
 */
export const prepareFirestoreBatches = (payslipResults, companyId) => {
  const batches = [];
  const batchSize = 100; // Limite Firestore batch
  
  // Grouper les résultats par batch de 100
  for (let i = 0; i < payslipResults.length; i += batchSize) {
    const batchData = payslipResults.slice(i, i + batchSize);
    
    const operations = batchData.map(result => ({
      type: 'update', // ou 'set' selon le besoin
      collection: 'clients',
      docPath: `${companyId}/employees/${result.employeeId}`,
      data: {
        payslips: result.payslipData ? [result.payslipData] : [], // Ajouter à l'array existant
        lastPayrollUpdate: new Date().toISOString(),
        payrollStatus: result.success ? 'completed' : 'error'
      }
    }));
    
    batches.push({
      batchIndex: Math.floor(i / batchSize),
      operations: operations,
      size: operations.length
    });
  }
  
  return batches;
};
