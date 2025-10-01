/**
 * Calculs de paie dynamiques utilisant les paramètres fiscaux de Firestore
 * Ces fonctions remplacent les constantes hardcodées par des paramètres configurables
 */

import { loadFiscalSettings } from '../hooks/useFiscalSettings';

// Cache des paramètres pour éviter de recharger à chaque calcul
let cachedSettings = null;
let lastLoadTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Charge les paramètres fiscaux avec cache
 */
const getSettings = async () => {
  const now = Date.now();
  
  // Utiliser le cache si moins d'1 minute
  if (cachedSettings && (now - lastLoadTime) < CACHE_DURATION) {
    return cachedSettings;
  }
  
  // Recharger depuis Firestore
  cachedSettings = await loadFiscalSettings();
  lastLoadTime = now;
  return cachedSettings;
};

/**
 * Forcer le rechargement des paramètres (utile après modification par Super Admin)
 */
export const refreshFiscalSettings = async () => {
  cachedSettings = await loadFiscalSettings();
  lastLoadTime = Date.now();
  return cachedSettings;
};

/**
 * Calcul PVID Salarié avec paramètres dynamiques
 */
export const computePVIDDynamic = async (baseSalary, settings = null) => {
  const config = settings || await getSettings();
  const plafond = config.cnps.plafond;
  const taux = config.cnps.pvidSalarie;
  
  return Math.round(Math.min(baseSalary, plafond) * (taux / 100));
};

/**
 * Calcul PVID Employeur avec paramètres dynamiques
 */
export const computePVIDEmployerDynamic = async (sbc, settings = null) => {
  const config = settings || await getSettings();
  const plafond = config.cnps.plafond;
  const taux = config.cnps.pvidEmployeur;
  
  return Math.round(Math.min(sbc, plafond) * (taux / 100));
};

/**
 * Calcul Prestations Familiales avec paramètres dynamiques
 */
export const computePFEmployerDynamic = async (sbc, settings = null) => {
  const config = settings || await getSettings();
  const taux = config.cnps.prestationsFamiliales;
  
  return Math.round(sbc * (taux / 100));
};

/**
 * Calcul Risques Professionnels avec paramètres dynamiques
 */
export const computeRPEmployerDynamic = async (sbc, category = 'A', settings = null) => {
  const config = settings || await getSettings();
  const taux = config.cnps.risquesPro[category] || config.cnps.risquesPro.A;
  
  return Math.round(sbc * (taux / 100));
};

/**
 * Calcul CFC avec paramètres dynamiques
 */
export const computeCFCDynamic = async (sbt, settings = null) => {
  const config = settings || await getSettings();
  const taux = config.taxes.cfc;
  
  return Math.round(sbt * (taux / 100));
};

/**
 * Calcul FNE avec paramètres dynamiques
 */
export const computeFNEDynamic = async (sbt, settings = null) => {
  const config = settings || await getSettings();
  const taux = config.taxes.fne;
  
  return Math.round(sbt * (taux / 100));
};

/**
 * Calcul CAC avec paramètres dynamiques
 */
export const computeCACDynamic = async (irpp, settings = null) => {
  const config = settings || await getSettings();
  const taux = config.taxes.cac;
  
  return Math.round(irpp * (taux / 100));
};

/**
 * Calcul TDL avec barème dynamique
 */
export const computeTDLDynamic = async (baseSalary, settings = null) => {
  const config = settings || await getSettings();
  const bareme = config.tdl;
  
  for (const tranche of bareme) {
    if (baseSalary >= tranche.min && baseSalary <= tranche.max) {
      return tranche.montant;
    }
  }
  
  return 0;
};

/**
 * Calcul RAV avec barème dynamique
 */
export const computeRAVDynamic = async (sbt, settings = null) => {
  const config = settings || await getSettings();
  const bareme = config.rav;
  
  for (const tranche of bareme) {
    if (sbt >= tranche.min && sbt <= tranche.max) {
      return tranche.montant;
    }
  }
  
  return 0;
};

/**
 * Calcul IRPP avec barème dynamique
 */
export const computeIRPPDynamic = async (snc, settings = null) => {
  const config = settings || await getSettings();
  const bareme = config.irpp;
  
  let irpp = 0;
  let resteImposable = snc;
  
  for (let i = 0; i < bareme.length; i++) {
    const tranche = bareme[i];
    const min = tranche.min;
    const max = tranche.max === Infinity ? Infinity : tranche.max;
    const taux = tranche.taux;
    
    if (resteImposable <= 0) break;
    
    const trancheBase = max === Infinity ? resteImposable : Math.min(resteImposable, max - min);
    
    if (trancheBase > 0) {
      irpp += trancheBase * (taux / 100);
      resteImposable -= trancheBase;
    }
  }
  
  return Math.round(irpp);
};

/**
 * Calcul complet des déductions avec paramètres dynamiques
 */
export const computeStatutoryDeductionsDynamic = async (salaryDetails, remuneration, primes, indemnites, settings = null) => {
  const config = settings || await getSettings();
  
  const baseSalary = Number(salaryDetails.baseSalary) || 0;
  const sbt = remuneration.total || baseSalary;
  
  // PVID sur salaire de base plafonné
  const pvid = await computePVIDDynamic(baseSalary, config);
  
  // SNC = 70% du SBT - PVID - Abattement
  const snc = Math.max(0, (sbt * 0.7) - pvid - config.taxes.abattementMensuel);
  
  // IRPP selon barème
  const irpp = await computeIRPPDynamic(snc, config);
  
  // CAC = % de l'IRPP
  const cac = await computeCACDynamic(irpp, config);
  
  // CFC sur SBT
  const cfc = await computeCFCDynamic(sbt, config);
  
  // RAV selon barème sur SBT
  const rav = await computeRAVDynamic(sbt, config);
  
  // TDL selon barème sur salaire de base
  const tdl = await computeTDLDynamic(baseSalary, config);
  
  return {
    pvid,
    irpp,
    cac,
    cfc,
    rav,
    tdl,
    total: pvid + irpp + cac + cfc + rav + tdl
  };
};

/**
 * Calcul des cotisations CNPS employeur avec paramètres dynamiques
 */
export const computeEmployerChargesDynamic = async (sbc, sbt, rpCategory = 'A', settings = null) => {
  const config = settings || await getSettings();
  
  const pvidEmployeur = await computePVIDEmployerDynamic(sbc, config);
  const prestationsFamiliales = await computePFEmployerDynamic(sbc, config);
  const risquesPro = await computeRPEmployerDynamic(sbc, rpCategory, config);
  const fneEmployeur = await computeFNEDynamic(sbt, config);
  
  return {
    pvidEmployeur,
    prestationsFamiliales,
    risquesPro,
    fneEmployeur,
    totalCNPS: pvidEmployeur + prestationsFamiliales + risquesPro,
    totalEmployeur: pvidEmployeur + prestationsFamiliales + risquesPro + fneEmployeur
  };
};

/**
 * Fonction utilitaire pour utiliser les paramètres dans un composant React
 * Retourne une version synchrone des fonctions qui utilise les settings passés en paramètre
 */
export const createSyncCalculators = (settings) => ({
  computePVID: (baseSalary) => {
    const plafond = settings.cnps.plafond;
    const taux = settings.cnps.pvidSalarie;
    return Math.round(Math.min(baseSalary, plafond) * (taux / 100));
  },
  
  computeTDL: (baseSalary) => {
    const bareme = settings.tdl;
    for (const tranche of bareme) {
      if (baseSalary >= tranche.min && baseSalary <= tranche.max) {
        return tranche.montant;
      }
    }
    return 0;
  },
  
  computeRAV: (sbt) => {
    const bareme = settings.rav;
    for (const tranche of bareme) {
      if (sbt >= tranche.min && sbt <= tranche.max) {
        return tranche.montant;
      }
    }
    return 0;
  },
  
  computeIRPP: (snc) => {
    const bareme = settings.irpp;
    let irpp = 0;
    let resteImposable = snc;
    
    for (let i = 0; i < bareme.length; i++) {
      const tranche = bareme[i];
      const min = tranche.min;
      const max = tranche.max === Infinity ? Infinity : tranche.max;
      const taux = tranche.taux;
      
      if (resteImposable <= 0) break;
      
      const trancheBase = max === Infinity ? resteImposable : Math.min(resteImposable, max - min);
      
      if (trancheBase > 0) {
        irpp += trancheBase * (taux / 100);
        resteImposable -= trancheBase;
      }
    }
    
    return Math.round(irpp);
  },
  
  computeCFC: (sbt) => Math.round(sbt * (settings.taxes.cfc / 100)),
  computeCAC: (irpp) => Math.round(irpp * (settings.taxes.cac / 100)),
  
  settings // Exposer les settings pour accès direct si nécessaire
});

export default {
  computePVIDDynamic,
  computePVIDEmployerDynamic,
  computePFEmployerDynamic,
  computeRPEmployerDynamic,
  computeCFCDynamic,
  computeFNEDynamic,
  computeCACDynamic,
  computeTDLDynamic,
  computeRAVDynamic,
  computeIRPPDynamic,
  computeStatutoryDeductionsDynamic,
  computeEmployerChargesDynamic,
  createSyncCalculators,
  refreshFiscalSettings
};
