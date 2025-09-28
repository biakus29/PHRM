// Centralized payroll labels and keys to ensure consistent rendering across UI, PDF, and reports

export const LABELS = {
  remuneration: 'Rémunération',
  baseSalary: 'Salaire de base',
  allowances: 'Indemnités',
  bonuses: 'Primes',
  grossTotal: 'SBT (Taxable)',
  currency: 'FCFA',
};

// Indemnities with display label and canonical key names used in data
export const INDEMNITIES = [
  { key: 'housingAllowance', label: 'Indemnité de logement' },
  { key: 'representationAllowance', label: 'Indemnité de représentation' },
  { key: 'dirtAllowance', label: 'Prime de salissures' },
  { key: 'mealAllowance', label: 'Prime de panier' },
];

// Bonuses/Primes with display label and canonical key names
export const BONUSES = [
  { key: 'overtime', label: 'Heures supplémentaires' },
  { key: 'bonus', label: 'Prime/Bonus' },
  { key: 'primeTransport', label: 'Prime de transport' },
];

// Helper to compute gross total from provided amounts map
export function computeGrossTotal(amounts) {
  const fields = [
    'baseSalary',
    ...INDEMNITIES.map(i => i.key),
    ...BONUSES.map(b => b.key),
  ];
  return fields.reduce((sum, k) => sum + (Number(amounts?.[k]) || 0), 0);
}

// ==================== FONCTIONS DE LABELS MANQUANTES ====================

export const getPVIDLabel = () => 'PVID (CNPS)';
export const getIRPPLabel = () => 'IRPP';
export const getTDLLabel = () => 'TDL';
export const getRAVLabel = () => 'RAV';
export const getCFCLabel = () => 'CFC';
export const getFNELabel = () => 'FNE';

