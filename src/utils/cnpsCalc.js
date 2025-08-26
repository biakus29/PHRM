// src/utils/cnpsCalc.js

// Centralized pay components breakdown
import { getPayComponents } from "./payComponents";

// Constants
export const CNPS_CAP = 750_000; // plafond base cotisable
export const RATE_PVID_SAL = 0.042; // 4.2% salarié
export const RATE_PVID_EMP = 0.049; // 4.9% employeur
export const RATE_PF_EMP = 0.07; // 7% prestations familiales (default)

// SBC: Salaire Brut + Indemnités (spécifiques SBC) + Primes imposables + Primes sociales + Avantages en nature
export const getSBC = (data = {}) => {
  const { brut, sbcIndemnites, indemImposables, primesImp, primesSoc, avNat } = getPayComponents(data);
  // sbcIndemnites couvre notamment l'indemnité de transport pour la base CNPS.
  // indemImposables est laissé pour d'éventuelles autres indemnités imposables déclarées comme telles.
  return brut + sbcIndemnites + indemImposables + primesImp + primesSoc + avNat;
};

// SBT: Brut + primes imposables + avantages nature − indemnités non imposables
export const getSBT = (data = {}) => {
  const { brut, primesImp, avNat, indemNonImposables } = getPayComponents(data);
  return Math.max(0, brut + primesImp + avNat - indemNonImposables);
};

// Main CNPS calculations
// options: { includeRP: bool, overrideRP: bool, rateRP: number }
export const getCalculs = (data = {}, options = {}) => {
  const sbc = getSBC(data);
  const baseCotisable = Math.min(sbc, CNPS_CAP);

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
