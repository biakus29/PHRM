// Centralized definitions for indemnities and primes, with helpers to compute totals.
// Use these helpers across the app to ensure consistent calculations.

// Field groups (keys expected in employee/pay data objects)
export const INDEMNITIES_IMPOSABLES = [
  // Indemnities counted as taxable (exclude transport per rule)
  // Add other taxable indemnities here if needed
];

// Indemnities specifically included in CNPS SBC base (historically: transport)
export const SBC_INDEMNITIES = [
  // Indemnités non imposables mais cotisables à AJOUTER au SBC (à ne pas compter dans le SBT)
  // Par défaut: transport uniquement, pour éviter la double comptabilisation avec SBT
  "indemniteTransport",
  "primeTransport", // alias/legacy
];

export const INDEMNITIES_NON_IMPOSABLES = [
  // Indemnities excluded from SBT (per business rule)
  "indemniteTransport",
  "primeTransport",
  "indemniteNonImposable",            // legacy aggregate if provided
  "representationAllowanceDisplay",   // indemnité de représentation non-taxable
  "dirtAllowanceDisplay",             // prime de salissures non-taxable
  "mealAllowanceDisplay",             // prime de panier non-taxable
];

// Indemnités imposables (pour SBT) : incluez ici toutes les indemnités taxables
// Logement est taxable (non listée dans les exceptions)
export const INDEMNITIES_TAXABLES = [
  "housingAllowanceDisplay",
  "housingAllowance", // alias éventuel
];

export const PRIMES_IMPOSABLES = [
  // Imposable bonuses and time-related additions
  "primesImposables", // pre-aggregated, if present
  "bonus",
  "heuresSupp",
  "overtime",
  // NE PAS inclure le transport ici (indemnité cotisable, non imposable)
];

export const PRIMES_SOCIALES = [
  // Social primes (non-imposable, but included in SBC for CNPS base)
  "primesNaturesSociales",
  "primesSociales", // alias support
];

export const AVANTAGES_NATURE = [
  // Benefits in kind
  "avantagesNature",
];

// Utility: safe number
export const n = (v) => (Number(v) || 0);

// Sum a list of fields from a data object
export function sumFields(data = {}, fields = []) {
  return fields.reduce((acc, key) => acc + n(data[key]), 0);
}

// Breakdown getters
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

// Full standardized breakdown used in payroll and CNPS computations
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

// Optional: generic visibility helper (value > 0 across any records)
export function anyHasValue(records = [], field) {
  return records.some((r) => n(r?.[field]) > 0);
}
