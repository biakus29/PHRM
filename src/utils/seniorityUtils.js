// src/utils/seniorityUtils.js
// Utilitaire centralisé pour tous les calculs d'ancienneté et prime d'ancienneté

/**
 * Calcule l'ancienneté en années complètes entre deux dates
 * @param {string|Date} hireDate - Date d'embauche (ISO string ou Date)
 * @param {string|Date} referenceDate - Date de référence (ISO string ou Date)
 * @returns {number} Nombre d'années complètes
 */
export function calculateSeniorityYears(hireDate, referenceDate = new Date()) {
  try {
    const hire = new Date(hireDate);
    const ref = new Date(referenceDate);
    
    if (isNaN(hire) || isNaN(ref)) return 0;
    
    const diffMs = ref - hire;
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    
    return Math.max(0, years);
  } catch {
    return 0;
  }
}

/**
 * Calcule l'ancienneté en mois complets entre deux dates
 * @param {string|Date} hireDate - Date d'embauche
 * @param {string|Date} referenceDate - Date de référence
 * @returns {number} Nombre de mois complets
 */
export function calculateSeniorityMonths(hireDate, referenceDate = new Date()) {
  try {
    const hire = new Date(hireDate);
    const ref = new Date(referenceDate);
    
    if (isNaN(hire) || isNaN(ref)) return 0;
    
    const hireYM = hire.getFullYear() * 12 + hire.getMonth();
    const refYM = ref.getFullYear() * 12 + ref.getMonth();
    
    return Math.max(0, refYM - hireYM);
  } catch {
    return 0;
  }
}

/**
 * Détermine le mois anniversaire des 2 ans d'ancienneté
 * @param {string|Date} hireDate - Date d'embauche
 * @returns {Object} { year: number, month: number, yearMonth: number }
 */
export function getTwoYearAnniversary(hireDate) {
  try {
    const hire = new Date(hireDate);
    if (isNaN(hire)) return null;
    
    const anniversaryYear = hire.getFullYear() + 2;
    const anniversaryMonth = hire.getMonth(); // 0-indexed
    const yearMonth = anniversaryYear * 12 + anniversaryMonth;
    
    return {
      year: anniversaryYear,
      month: anniversaryMonth + 1, // 1-indexed pour affichage
      yearMonth
    };
  } catch {
    return null;
  }
}

/**
 * Calcule le pourcentage de prime d'ancienneté selon les règles
 * Règle: 0% avant 2 ans, 4% le mois des 2 ans (si employé créé avant), 2% après
 * @param {string|Date} hireDate - Date d'embauche
 * @param {string} payPeriod - Période de paie (format YYYY-MM)
 * @param {string|Date} employeeCreatedAt - Date de création de l'employé dans le système
 * @returns {Object} { years: number, percent: number, isAnniversaryMonth: boolean }
 */
export function calculateSeniorityPercent(hireDate, payPeriod, employeeCreatedAt = null) {
  try {
    if (!hireDate || !payPeriod) return { years: 0, percent: 0, isAnniversaryMonth: false };
    
    // Parse période de paie
    const [payYear, payMonth] = payPeriod.split('-').map(Number);
    const payYearMonth = payYear * 12 + (payMonth - 1); // Convert to 0-indexed
    
    // Calcul ancienneté
    const payDate = new Date(payYear, payMonth - 1, 1);
    const years = calculateSeniorityYears(hireDate, payDate);
    
    // Déterminer le mois anniversaire des 2 ans
    const twoYearAnniversary = getTwoYearAnniversary(hireDate);
    if (!twoYearAnniversary) return { years, percent: 0, isAnniversaryMonth: false };
    
    const isAnniversaryMonth = payYearMonth === twoYearAnniversary.yearMonth;
    
    let percent = 0;
    
    if (payYearMonth < twoYearAnniversary.yearMonth) {
      // Avant 2 ans
      percent = 0;
    } else if (isAnniversaryMonth) {
      // Mois des 2 ans exactement
      if (employeeCreatedAt) {
        const createdAt = new Date(employeeCreatedAt);
        const createdYM = createdAt.getFullYear() * 12 + createdAt.getMonth();
        // 4% seulement si l'employé n'avait pas encore 2 ans à sa création
        percent = (createdYM < twoYearAnniversary.yearMonth) ? 4 : 2;
      } else {
        // Par défaut, si pas de date de création, appliquer 2%
        percent = 2;
      }
    } else {
      // Après le mois des 2 ans
      percent = 2;
    }
    
    return { years, percent, isAnniversaryMonth };
  } catch {
    return { years: 0, percent: 0, isAnniversaryMonth: false };
  }
}

/**
 * Calcule le montant de la prime d'ancienneté
 * @param {number} baseSalary - Salaire de base
 * @param {number} percent - Pourcentage d'ancienneté
 * @returns {number} Montant de la prime (arrondi)
 */
export function calculateSeniorityAmount(baseSalary, percent) {
  const salary = Number(baseSalary) || 0;
  const rate = Number(percent) || 0;
  
  return Math.round(salary * (rate / 100));
}

/**
 * Calcul complet de la prime d'ancienneté basé sur l'expérience totale
 * @param {Object} employee - Objet employé avec seniority (années d'expérience)
 * @param {number} baseSalary - Salaire de base pour le calcul
 * @param {string} payPeriod - Période de paie (YYYY-MM) - optionnel
 * @returns {Object} { years, percent, amount, isAnniversaryMonth }
 */
export function calculateSeniorityPrime(employee, baseSalary, payPeriod) {
  // Utiliser l'ancienneté renseignée manuellement (expérience totale)
  const years = Number(employee?.seniority || employee?.seniorityYears || 0);
  
  if (years === 0) {
    return { years: 0, percent: 0, amount: 0, isAnniversaryMonth: false };
  }
  
  // Règle simplifiée basée sur l'expérience totale
  let percent = 0;
  if (years >= 2) {
    percent = 2; // 2% pour toute expérience >= 2 ans
  }
  
  const amount = calculateSeniorityAmount(baseSalary, percent);
  
  return { years, percent, amount, isAnniversaryMonth: false };
}

/**
 * Calcul de la prime d'ancienneté basé sur la date d'embauche (pour référence)
 * @param {Object} employee - Objet employé avec hireDate et createdAt
 * @param {number} baseSalary - Salaire de base pour le calcul
 * @param {string} payPeriod - Période de paie (YYYY-MM)
 * @returns {Object} { years, percent, amount, isAnniversaryMonth }
 */
export function calculateSeniorityPrimeByHireDate(employee, baseSalary, payPeriod) {
  if (!employee?.hireDate) {
    return { years: 0, percent: 0, amount: 0, isAnniversaryMonth: false };
  }
  
  const { years, percent, isAnniversaryMonth } = calculateSeniorityPercent(
    employee.hireDate,
    payPeriod,
    employee.createdAt
  );
  
  const amount = calculateSeniorityAmount(baseSalary, percent);
  
  return { years, percent, amount, isAnniversaryMonth };
}

/**
 * Formate l'affichage de l'ancienneté
 * @param {number} years - Nombre d'années
 * @param {number} months - Nombre de mois (optionnel)
 * @returns {string} Texte formaté
 */
export function formatSeniority(years, months = null) {
  if (months !== null) {
    const totalMonths = years * 12 + months;
    if (totalMonths === 0) return "Nouveau";
    if (totalMonths < 12) return `${totalMonths} mois`;
    if (totalMonths === 12) return "1 an";
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m === 0 ? `${y} an${y > 1 ? 's' : ''}` : `${y} an${y > 1 ? 's' : ''} et ${m} mois`;
  }
  
  if (years === 0) return "Nouveau";
  return `${years} an${years > 1 ? 's' : ''}`;
}

/**
 * Crée l'objet prime d'ancienneté pour les listes de primes
 * @param {Object} seniorityData - Résultat de calculateSeniorityPrime
 * @returns {Object|null} Objet prime ou null si montant = 0
 */
export function createSeniorityPrimeObject(seniorityData) {
  if (!seniorityData || seniorityData.amount <= 0) return null;
  
  return {
    label: "Prime d'ancienneté",
    montant: seniorityData.amount,
    type: "seniority",
    auto: true,
    readonly: true
  };
}
