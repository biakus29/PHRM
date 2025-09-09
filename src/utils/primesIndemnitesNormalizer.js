// src/utils/primesIndemnitesNormalizer.js
// Utilitaire pour normaliser et harmoniser les primes/indemnités

/**
 * Parser robuste pour convertir toute valeur en nombre
 */
export const parseAmount = (v) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const clean = v.replace(/[^\d.-]/g, '');
    const n = Number(clean);
    return isFinite(n) ? n : 0;
  }
  return Number(v) || 0;
};

/**
 * Extrait le montant d'un objet prime/indemnité selon différentes clés possibles
 */
export const extractAmount = (item) => {
  if (!item) return 0;
  return parseAmount(
    item.montant ?? 
    item.amount ?? 
    item.value ?? 
    item.total ?? 
    item.somme ?? 
    0
  );
};

/**
 * Normalise les données de primes depuis différentes sources
 */
export const normalizePrimes = (data) => {
  // Priorité 1: tableaux dynamiques
  if (Array.isArray(data.primesArray) && data.primesArray.length > 0) {
    return data.primesArray;
  }
  if (Array.isArray(data.primes) && data.primes.length > 0) {
    return data.primes;
  }
  
  // Priorité 2: champs fixes convertis en tableau
  const primes = [];
  
  const primesImposables = parseAmount(data.primesImposables || data.totalPrimes);
  if (primesImposables > 0) {
    primes.push({ label: 'Primes imposables', montant: primesImposables, type: 'prime' });
  }
  
  const overtime = parseAmount(data.overtimeDisplay || data.overtime);
  if (overtime > 0) {
    primes.push({ label: 'Heures supplémentaires', montant: overtime, type: 'prime' });
  }
  
  const bonus = parseAmount(data.bonusDisplay || data.bonus);
  if (bonus > 0) {
    primes.push({ label: 'Prime/Bonus', montant: bonus, type: 'prime' });
  }
  
  return primes;
};

/**
 * Normalise les données d'indemnités depuis différentes sources
 */
export const normalizeIndemnites = (data) => {
  // Priorité 1: tableaux dynamiques
  if (Array.isArray(data.indemnitesArray) && data.indemnitesArray.length > 0) {
    return data.indemnitesArray;
  }
  if (Array.isArray(data.indemnites) && data.indemnites.length > 0) {
    return data.indemnites;
  }
  
  // Priorité 2: champs fixes convertis en tableau
  const indemnites = [];
  
  const transport = parseAmount(data.indemniteTransport || data.transportAllowance);
  if (transport > 0) {
    indemnites.push({ label: 'Indemnité transport', montant: transport, type: 'indemnite' });
  }
  
  const logement = parseAmount(data.housingAllowanceDisplay || data.housingAllowance);
  if (logement > 0) {
    indemnites.push({ label: 'Indemnité logement', montant: logement, type: 'indemnite' });
  }
  
  const representation = parseAmount(data.representationAllowanceDisplay || data.representationAllowance);
  if (representation > 0) {
    indemnites.push({ label: 'Indemnité représentation', montant: representation, type: 'indemnite' });
  }
  
  const salissure = parseAmount(data.dirtAllowanceDisplay || data.dirtAllowance);
  if (salissure > 0) {
    indemnites.push({ label: 'Indemnité salissure', montant: salissure, type: 'indemnite' });
  }
  
  const repas = parseAmount(data.mealAllowanceDisplay || data.mealAllowance);
  if (repas > 0) {
    indemnites.push({ label: 'Indemnité repas', montant: repas, type: 'indemnite' });
  }
  
  const nonImposable = parseAmount(data.indemniteNonImposable);
  if (nonImposable > 0) {
    indemnites.push({ label: 'Indemnités non imposables', montant: nonImposable, type: 'indemnite' });
  }
  
  return indemnites;
};

/**
 * Calcule le total des primes
 */
export const calculatePrimesTotal = (data) => {
  const primes = normalizePrimes(data);
  return primes.reduce((sum, prime) => sum + extractAmount(prime), 0);
};

/**
 * Calcule le total des indemnités
 */
export const calculateIndemnitesTotal = (data) => {
  const indemnites = normalizeIndemnites(data);
  return indemnites.reduce((sum, indemnite) => sum + extractAmount(indemnite), 0);
};

/**
 * Calcule le total primes + indemnités
 */
export const calculatePrimesIndemnitesTotal = (data) => {
  return calculatePrimesTotal(data) + calculateIndemnitesTotal(data);
};

/**
 * Retourne un objet normalisé avec tous les détails
 */
export const getNormalizedPrimesIndemnites = (data) => {
  const primes = normalizePrimes(data);
  const indemnites = normalizeIndemnites(data);
  
  return {
    primes,
    indemnites,
    primesTotal: primes.reduce((sum, p) => sum + extractAmount(p), 0),
    indemnitesTotal: indemnites.reduce((sum, i) => sum + extractAmount(i), 0),
    total: primes.reduce((sum, p) => sum + extractAmount(p), 0) + 
           indemnites.reduce((sum, i) => sum + extractAmount(i), 0)
  };
};
