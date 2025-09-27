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

// ==================== CALCULS CNPS ====================
export const computePVID = (baseSalary) =>
  Math.round(Math.min(baseSalary, CNPS_PLAFOND) * (TAUX_PVID_SALARIE / 100));

export const computePVIDEmployer = (baseSalary) =>
  Math.round(Math.min(baseSalary, CNPS_PLAFOND) * (TAUX_PVID_EMPLOYEUR / 100));

export const computePFEmployer = (baseSalary) =>
  Math.round(baseSalary * (TAUX_PF_EMPLOYEUR / 100));

export const computeRPEmployer = (baseSalary, rateRP = 1.75) =>
  Math.round(baseSalary * (rateRP / 100));

// Total CNPS (salarié + employeur)
export const computeTotalCNPS = (baseSalary) => {
  const sal = computePVID(baseSalary);
  const emp = computePVIDEmployer(baseSalary) + computePFEmployer(baseSalary) + computeRPEmployer(baseSalary);
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

  // PVID/PF/RP sur salaire de base (avec plafond pour PVID uniquement)
  const pvidEmployeur = Math.round(Math.min(baseBrut, CNPS_PLAFOND) * (TAUX_PVID_EMPLOYEUR / 100));
  const prestationsFamiliales = Math.round(baseBrut * (TAUX_PF_EMPLOYEUR / 100));
  const risquesPro = Math.round(baseBrut * (rpRate / 100));

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
  if (baseSalary <= 52000) return 0;
  if (baseSalary <= 100000) return 1500;
  if (baseSalary <= 150000) return 3000;
  if (baseSalary <= 250000) return 5000;
  if (baseSalary <= 350000) return 7000;
  if (baseSalary <= 450000) return 9000;
  if (baseSalary <= 550000) return 11000;
  if (baseSalary <= 650000) return 13000;
  if (baseSalary <= 750000) return 15000;
  if (baseSalary <= 850000) return 17000;
  if (baseSalary <= 950000) return 19000;
  if (baseSalary <= 1050000) return 21000;
  if (baseSalary <= 1150000) return 23000;
  if (baseSalary <= 1250000) return 25000;
  if (baseSalary <= 1350000) return 27000;
  if (baseSalary <= 1450000) return 29000;
  if (baseSalary <= 1550000) return 31000;
  if (baseSalary <= 1650000) return 33000;
  if (baseSalary <= 1750000) return 35000;
  if (baseSalary <= 1850000) return 37000;
  if (baseSalary <= 1950000) return 39000;
  if (baseSalary <= 2050000) return 41000;
  return 50000;
};

// ==================== IRPP (OFFICIEL SUR SALAIRE DE BASE) ====================
// Barème 2024-2025 (mensuel):
// 0 - 62 000 => 0%
// 62 001 - 200 000 => 10%
// 200 001 - 300 000 => 15%
// 300 001 - 500 000 => 25%
// > 500 000 => 35%
export const computeIRPPFromBase = (baseSalary) => {
  const b = Math.max(0, Number(baseSalary) || 0);
  if (b <= 62000) return 0;
  let tax = 0;
  // 10% on 62,001 - 200,000
  const tier2Upper = 200000;
  const tier3Upper = 300000;
  const tier4Upper = 500000;
  if (b > 62000) {
    const t = Math.min(b, tier2Upper) - 62000;
    if (t > 0) tax += t * 0.10;
  }
  // 15% on 200,001 - 300,000
  if (b > tier2Upper) {
    const t = Math.min(b, tier3Upper) - tier2Upper;
    if (t > 0) tax += t * 0.15;
  }
  // 25% on 300,001 - 500,000
  if (b > tier3Upper) {
    const t = Math.min(b, tier4Upper) - tier3Upper;
    if (t > 0) tax += t * 0.25;
  }
  // 35% on > 500,000
  if (b > tier4Upper) {
    const t = b - tier4Upper;
    tax += t * 0.35;
  }
  return Math.round(tax);
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

  return {
    pvidEmployeur,
    prestationsFamiliales,
    risquesPro,
    totalEmployeur,
    fneEmployeur,
  };
}

// ==================== CALCUL DES BASES (SBC/SBT) ====================
export function calculerBases(employeeData) {
  // 1. TOTAL PRIMES COTISABLES
  const totalPrimesCotisables = Object.values(employeeData.primesCotisables || {})
    .reduce((sum, prime) => sum + num(prime), 0);
  
  // 2. TOTAL PRIMES NON COTISABLES (avec vérification des limites)
  let totalPrimesNonCotisables = 0;
  let primesNonCotisablesAjustees = {};
  
  // Vérification des limites réglementaires
  Object.entries(employeeData.primesNonCotisables || {}).forEach(([key, value]) => {
    let montantExonere = num(value);
    
    // Application des limites d'exonération
    if (key === 'primeTransport' && montantExonere > LIMITE_TRANSPORT) {
      montantExonere = LIMITE_TRANSPORT;
    } else if (key === 'primePanier' && montantExonere > LIMITE_PANIER) {
      montantExonere = LIMITE_PANIER;
    }
    
    primesNonCotisablesAjustees[key] = montantExonere;
    totalPrimesNonCotisables += montantExonere;
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
  // PVID Salarié: sur salaire de base plafonné (exigence métier)
  const pvidBase = baseSalaryForPVID != null ? Number(baseSalaryForPVID) : Number(sbc);
  const basePlafonneePVID = Math.min(pvidBase, CNPS_PLAFOND);
  const pvidSalarie = Math.round(basePlafonneePVID * (TAUX_PVID_SALARIE / 100));
  
  // PVID Employeur: sur SBC plafonné
  const basePlafonneeEmp = Math.min(sbc, CNPS_PLAFOND);
  const pvidEmployeur = Math.round(basePlafonneeEmp * (TAUX_PVID_EMPLOYEUR / 100));
  
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
  
  // Convertir les primes
  primes.forEach(prime => {
    const label = (prime.label || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    
    if (label.includes('transport')) {
      employeeData.primesNonCotisables.primeTransport = montant;
    } else {
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
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
  
  // 5. IRPP (officiel sur salaire de base)
  const { snc, irpp } = calculerIRPP(employeeData.salaireBrut);
  
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

// ==================== FONCTIONS DE COMPATIBILITÉ MANQUANTES ====================

// Alias pour CNPS_CAP
export const CNPS_CAP = CNPS_PLAFOND;

// Fonction computeSBT pour compatibilité
export const computeSBT = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Convertir les primes
  primes.forEach(prime => {
    const label = (prime.label || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    
    if (label.includes('transport')) {
      employeeData.primesNonCotisables.primeTransport = montant;
    } else {
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
    }
  });
  
  const bases = calculerBases(employeeData);
  return bases.sbt;
};

// Fonction computeSBC pour compatibilité
export const computeSBC = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const employeeData = {
    salaireBrut: num(salaryDetails.baseSalary),
    primesCotisables: {},
    primesNonCotisables: {}
  };
  
  // Convertir les primes
  primes.forEach(prime => {
    const label = (prime.label || '').toLowerCase();
    const montant = num(prime.montant || prime.amount);
    
    if (label.includes('transport')) {
      employeeData.primesNonCotisables.primeTransport = montant;
    } else {
      employeeData.primesCotisables[`prime_${Date.now()}_${Math.random()}`] = montant;
    }
  });
  
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

// Fonction computeGrossTotal pour compatibilité
export const computeGrossTotal = (salaryDetails = {}, remuneration = {}, primes = [], indemnites = []) => {
  const baseSalary = num(salaryDetails.baseSalary);
  const primesSum = primes.reduce((sum, p) => sum + num(p.montant || p.amount), 0);
  const indemSum = indemnites.reduce((sum, i) => sum + num(i.montant || i.amount), 0);
  return baseSalary + primesSum + indemSum;
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

// Fonction computeEffectiveDeductions pour compatibilité
export const computeEffectiveDeductions = (deductions = {}) => {
  return validateDeductions(deductions);
};

// Fonction computeRoundedDeductions pour compatibilité
export const computeRoundedDeductions = (deductions = {}) => {
  const effective = computeEffectiveDeductions(deductions);
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
    const employeurThis = adj.totalEmployeur + adj.fneEmployeur;
    totalEmployeurDu += employeurThis;
    // Détail
    pvidEmp += adj.pvidEmployeur;
    pf += adj.prestationsFamiliales;
    rp += adj.risquesPro;
    fneEmp += adj.fneEmployeur;
    // Salarié: toutes retenues du salarié
    totalSalarie += result.totalRetenues;
    totalNet += result.salaireNet;
  });

  return {
    totalBrut,
    totalEmployeurDu,
    totalSalarie,
    totalNet,
    employerBreakdown: { pvidEmp, pf, rp, fneEmp },
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
    emp += adj.totalEmployeur + adj.fneEmployeur;
  });
  
  return { totalSBC, totalSBT, totalNet, brut, sal, emp };
};

export const calculateTotalNet = (selectedIds = [], formData = {}) => {
  const totals = calculateTableTotals(selectedIds, formData);
  return totals.totalNet;
};

export const generateExcelData = (selectedIds = [], formData = {}, employees = []) => {
  const data = [];
  
  selectedIds.forEach(id => {
    const employee = employees.find(e => e.id === id);
    const formDataItem = formData[id] || {};
    
    if (employee) {
      const employeeData = {
        salaireBrut: num(formDataItem.baseSalary || formDataItem.brut),
        primesCotisables: {},
        primesNonCotisables: {}
      };
      
      const result = calculComplet(employeeData);
      
      data.push({
        nom: employee.name,
        matricule: employee.matricule,
        salaireBrut: result.bases.salaireBrutTotal,
        sbc: result.bases.sbc,
        sbt: result.bases.sbt,
        pvid: result.cnps.pvidSalarie,
        irpp: result.irpp,
        netPayer: result.salaireNet
      });
    }
  });
  
  return data;
};
