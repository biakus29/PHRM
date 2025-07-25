// Fonctions utilitaires de calcul de paie pour toute l'application
// Utilisation : import { calculateDeductions, getNetToPay } from "../utils/payrollUtils";

/**
 * Calcule toutes les déductions sociales et fiscales selon la législation camerounaise.
 * @param {Object} params
 * @param {number} params.baseSalary - Salaire de base brut
 * @param {boolean} [params.applyTDL=true] - Appliquer ou non la Taxe de Développement Local
 * @returns {Object} Toutes les déductions et leur total
 */
export function calculateDeductions({ baseSalary, applyTDL = true }) {
  // PVIS : 4,2% du salaire de base, plafonné à 750 000 FCFA
  const maxCnpsSalary = 750000;
  const cnpsRate = 0.042;
  const pvis = Math.min(baseSalary, maxCnpsSalary) * cnpsRate;

  // SNC pour IRPP (Salaire Net Catégoriel)
  // SNC = 70% du salaire de base - PVIS - abattement forfaitaire (500 000 / 12)
  const snc = baseSalary > 0 ? (baseSalary * 0.7) - pvis - (500000 / 12) : 0;

  // Calcul progressif de l'IRPP selon le barème camerounais
  let irpp = 0;
  if (baseSalary >= 62000 && snc > 0) {
    if (snc <= 166667) irpp = snc * 0.10;
    else if (snc <= 250000) irpp = 16667 + (snc - 166667) * 0.15;
    else if (snc <= 416667) irpp = 29167 + (snc - 250000) * 0.25;
    else irpp = 70833.75 + (snc - 416667) * 0.35;
  }

  // CAC = 10% de l'IRPP
  const cac = irpp * 0.1;

  // CFC = 1% du salaire brut (salaire de base)
  const cfc = baseSalary * 0.01;

  // RAV = Redevance Audio-Visuelle
  // Barème : 0 FCFA si salaire <= 50 000 FCFA, 417 FCFA seulement si salaire > 50 000 FCFA
  const rav = baseSalary > 50000 ? 417 : 0;

  // TDL = Taxe de Développement Local (optionnelle)
  // Cette taxe n'est pas systématiquement prélevée au Cameroun. Elle est appliquée uniquement si applyTDL est true.
  const tdl = applyTDL ? 0 : 0;

  // Total des déductions
  const total = pvis + irpp + cac + cfc + rav + tdl;

  return { pvis, irpp, cac, cfc, rav, tdl, total };
}

/**
 * Calcule le net à payer à partir du salaire de base, des primes, indemnités et déductions.
 * @param {Object} params
 * @param {Object} params.salaryDetails - Détail du salaire (doit contenir baseSalary)
 * @param {Array} params.primes - Liste des primes [{ type, montant }]
 * @param {Array} params.indemnites - Liste des indemnités [{ type, montant }]
 * @param {Object} params.deductions - Détail des déductions (doit contenir total)
 * @returns {number} Net à payer
 */
export function getNetToPay({ salaryDetails, primes, indemnites, deductions }) {
  // Salaire de base
  const base = Number(salaryDetails?.baseSalary || 0);
  // Primes
  const primesTotal = Array.isArray(primes) ? primes.reduce((sum, p) => sum + Number(p.montant || 0), 0) : 0;
  // Indemnités
  const indemnitesTotal = Array.isArray(indemnites) ? indemnites.reduce((sum, i) => sum + Number(i.montant || 0), 0) : 0;
  // Rémunération brute
  const remunerationBrute = base + primesTotal + indemnitesTotal;
  // Total des déductions
  const deductionsTotal = Number(deductions?.total || 0);
  // Net à payer
  return Math.max(0, remunerationBrute - deductionsTotal);
} 