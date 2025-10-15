// src/utils/contractUtils.js
import { addMonths, addYears, format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

/**
 * Types de contrat disponibles
 */
export const CONTRACT_TYPES = {
  CDI: 'Contrat à Durée Indéterminée',
  CDD: 'Contrat à Durée Déterminée'
};

/**
 * Types de licenciement
 */
export const DISMISSAL_TYPES = {
  LICENCIEMENT_ECONOMIQUE: 'Licenciement Économique',
  LICENCIEMENT_POUR_FAUTE_GRAVE: 'Licenciement pour Faute Grave',
  LICENCIEMENT_POUR_FAUTE_SERIEUSE: 'Licenciement pour Faute Sérieuse',
  LICENCIEMENT_POUR_INAPTITUDE: 'Licenciement pour Inaptitude',
  LICENCIEMENT_POUR_MOTIF_PERSONNEL: 'Licenciement pour Motif Personnel',
  DEMISSION: 'Démission',
  RETRAIT: 'Retraite',
  FIN_CONTRAT: 'Fin de Contrat',
  RUPTURE_CONVENTIONNELLE: 'Rupture Conventionnelle'
};

/**
 * Statuts d'employé
 */
export const EMPLOYEE_STATUS = {
  ACTIVE: 'Actif',
  INACTIVE: 'Inactif',
  ON_LEAVE: 'En congé',
  DISMISSED: 'Licencié',
  RESIGNED: 'Démissionnaire',
  RETIRED: 'Retraité',
  CONTRACT_ENDED: 'Contrat terminé'
};

/**
 * Calcule la durée d'ancienneté en années, mois et jours
 */
export const calculateSeniority = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const years = differenceInYears(end, start);
  const months = differenceInMonths(end, start) % 12;
  const days = differenceInDays(end, start) % 30; // Approximation

  return { years, months, days };
};

/**
 * Formate la durée d'ancienneté
 */
export const formatSeniority = (seniority) => {
  const { years, months, days } = seniority;
  let result = '';

  if (years > 0) result += `${years} an${years > 1 ? 's' : ''}`;
  if (months > 0) result += `${result ? ' ' : ''}${months} mois`;
  if (days > 0) result += `${result ? ' ' : ''}${days} jour${days > 1 ? 's' : ''}`;

  return result || 'Moins d\'un jour';
};

/**
 * Calcule les indemnités de licenciement selon la législation camerounaise
 */
export const calculateDismissalIndemnities = (employee, dismissalType, dismissalDate = new Date()) => {
  const baseSalary = Number(employee.contract?.salary || employee.baseSalary || 0);
  const seniority = calculateSeniority(employee.contract?.startDate || employee.hireDate, dismissalDate);

  let baseIndemnity = 0;
  let additionalIndemnity = 0;
  let noticePeriod = 0;

  // Calcul de l'indemnité de base selon l'ancienneté
  if (seniority.years >= 2) {
    // Indemnité de licenciement (1 mois par année d'ancienneté)
    baseIndemnity = baseSalary * seniority.years;
  }

  // Calcul du préavis selon l'ancienneté et le type de licenciement
  if (dismissalType === DISMISSAL_TYPES.LICENCIEMENT_ECONOMIQUE) {
    if (seniority.years < 2) noticePeriod = 1; // 1 mois
    else if (seniority.years < 5) noticePeriod = 2; // 2 mois
    else if (seniority.years < 10) noticePeriod = 3; // 3 mois
    else noticePeriod = 6; // 6 mois
  } else {
    if (seniority.years < 5) noticePeriod = 1; // 1 mois
    else if (seniority.years < 10) noticePeriod = 2; // 2 mois
    else if (seniority.years < 15) noticePeriod = 3; // 3 mois
    else noticePeriod = 6; // 6 mois
  }

  // Indemnité compensatrice de préavis
  const noticeIndemnity = baseSalary * noticePeriod;

  // Indemnités supplémentaires selon le type de licenciement
  switch (dismissalType) {
    case DISMISSAL_TYPES.LICENCIEMENT_ECONOMIQUE:
      // Indemnité spéciale de licenciement économique
      additionalIndemnity = baseSalary * Math.max(3, seniority.years);
      break;
    case DISMISSAL_TYPES.LICENCIEMENT_POUR_FAUTE_GRAVE:
      // Pas d'indemnité pour faute grave
      baseIndemnity = 0;
      additionalIndemnity = 0;
      break;
    case DISMISSAL_TYPES.LICENCIEMENT_POUR_FAUTE_SERIEUSE:
      // Indemnité réduite pour faute sérieuse
      baseIndemnity = baseIndemnity * 0.5;
      break;
    case DISMISSAL_TYPES.DEMISSION:
      // Pas d'indemnité en cas de démission
      baseIndemnity = 0;
      additionalIndemnity = 0;
      break;
    case DISMISSAL_TYPES.RETRAIT:
      // Indemnité de départ à la retraite
      baseIndemnity = baseSalary * seniority.years * 0.5;
      break;
  }

  // Calcul du solde de tout compte
  const lastSalary = baseSalary; // À adapter selon les données réelles
  const leaveDays = calculateLeaveIndemnity(employee, dismissalDate);

  return {
    baseIndemnity: Math.round(baseIndemnity),
    additionalIndemnity: Math.round(additionalIndemnity),
    noticeIndemnity: Math.round(noticeIndemnity),
    leaveIndemnity: Math.round(leaveDays * (baseSalary / 30)),
    totalIndemnity: Math.round(baseIndemnity + additionalIndemnity + noticeIndemnity + (leaveDays * (baseSalary / 30))),
    noticePeriod,
    seniority
  };
};

/**
 * Calcule les congés payés restants
 */
export const calculateLeaveIndemnity = (employee, dismissalDate) => {
  // Calcul simplifié : 2.5 jours par mois travaillé
  const seniority = calculateSeniority(employee.contract?.startDate || employee.hireDate, dismissalDate);
  const totalMonths = seniority.years * 12 + seniority.months;
  const earnedLeave = totalMonths * 2.5;

  // Soustraire les congés déjà pris (données à adapter)
  const takenLeave = employee.takenLeaveDays || 0;

  return Math.max(0, earnedLeave - takenLeave);
};

/**
 * Valide un contrat
 */
export const validateContract = (contract) => {
  const errors = [];

  if (!contract.type) errors.push('Le type de contrat est requis');
  if (!contract.position) errors.push('Le poste est requis');
  if (!contract.salary || contract.salary <= 0) errors.push('Le salaire doit être supérieur à 0');
  if (!contract.startDate) errors.push('La date de début est requise');

  // Comparer au code de type ('CDD') plutôt qu'à l'étiquette
  if (contract.type === 'CDD' && !contract.endDate) {
    errors.push('La date de fin est requise pour un CDD');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Génère une référence unique pour un contrat
 */
export const generateContractReference = (employee, contractType) => {
  const date = format(new Date(), 'yyyyMMdd');
  const typeCode = contractType.substring(0, 3).toUpperCase();
  const matricule = employee.matricule || 'XXX';

  return `CTR-${typeCode}-${matricule}-${date}`;
};

/**
 * Calcule la date de fin de période d'essai
 */
export const calculateTrialPeriodEnd = (startDate, trialPeriod) => {
  const start = new Date(startDate);

  if (trialPeriod.includes('mois')) {
    const months = parseInt(trialPeriod);
    return addMonths(start, months);
  } else if (trialPeriod.includes('an')) {
    const years = parseInt(trialPeriod);
    return addYears(start, years);
  }

  return start;
};

/**
 * Vérifie si un employé est en période d'essai
 */
export const isInTrialPeriod = (employee, currentDate = new Date()) => {
  if (!employee.contract?.trialPeriod || !employee.contract?.startDate) {
    return false;
  }

  const trialEnd = calculateTrialPeriodEnd(employee.contract.startDate, employee.contract.trialPeriod);
  return currentDate <= trialEnd;
};

/**
 * Calcule la prochaine date d'augmentation salariale
 */
export const calculateNextSalaryIncrease = (lastIncreaseDate, increaseFrequency = 'annuelle') => {
  const lastIncrease = new Date(lastIncreaseDate);

  switch (increaseFrequency) {
    case 'annuelle':
      return addYears(lastIncrease, 1);
    case 'semestrielle':
      return addMonths(lastIncrease, 6);
    case 'trimestrielle':
      return addMonths(lastIncrease, 3);
    default:
      return addYears(lastIncrease, 1);
  }
};
