// Utilitaires pour la gestion des dates dans le dashboard

export function formatDateOfBirthInput(value) {
  // Si l'utilisateur tape 8 chiffres d'affilée, on formate automatiquement
  const onlyDigits = value.replace(/\D/g, "");
  if (onlyDigits.length === 8) {
    return `${onlyDigits.slice(0, 2)}/${onlyDigits.slice(2, 4)}/${onlyDigits.slice(4, 8)}`;
  }
  // Sinon, on retourne la valeur telle quelle
  const v = value.replace(/[^\d/]/g, "");
  return v;
}

export function validateDateOfBirth(value) {
  // Format attendu : JJ/MM/AAAA
  if (!value) return "";
  const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d\d$/;
  if (!regex.test(value)) {
    return "Format invalide. Utilisez JJ/MM/AAAA";
  }
  return "";
}

// Fonction pour convertir le format français (JJ/MM/AAAA) en format ISO
export function convertFrenchDateToISO(frenchDate) {
  if (!frenchDate || !frenchDate.trim()) return null;
  
  // Vérifier le format français
  const frenchRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = frenchDate.match(frenchRegex);
  
  if (!match) return null;
  
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// Fonction utilitaire pour s'assurer que tous les nouveaux champs sont présents
export const ensureEmployeeFields = (employee) => {
  return {
    ...employee,
    // S'assurer que les nouveaux champs sont présents même s'ils n'existent pas encore
    name: employee.name || "",
    email: employee.email || "",
    phone: employee.phone || "",
    address: employee.address || "",
    poste: employee.poste || "",
    professionalCategory: employee.professionalCategory || "",
    baseSalary: employee.baseSalary || 0,
    dailyRate: employee.dailyRate || 0,
    hourlyRate: employee.hourlyRate || 0,
    hireDate: employee.hireDate || "",
    contractType: employee.contractType || "CDI",
    hasTrialPeriod: employee.hasTrialPeriod || false,
    trialPeriodDuration: employee.trialPeriodDuration || "",
    cnpsNumber: employee.cnpsNumber || "",
    matricule: employee.matricule || "",
    dateOfBirth: employee.dateOfBirth || "",
    placeOfBirth: employee.placeOfBirth || "",
    nationality: employee.nationality || "Camerounaise",
    maritalStatus: employee.maritalStatus || "",
    numberOfChildren: employee.numberOfChildren || 0,
    emergencyContact: employee.emergencyContact || "",
    emergencyPhone: employee.emergencyPhone || "",
    bankAccount: employee.bankAccount || "",
    bankName: employee.bankName || "",
    // Champs pour les indemnités
    transportAllowance: employee.transportAllowance || 0,
    housingAllowance: employee.housingAllowance || 0,
    representationAllowance: employee.representationAllowance || 0,
    dirtAllowance: employee.dirtAllowance || 0,
    mealAllowance: employee.mealAllowance || 0,
    // Champs pour les déductions
    deductions: employee.deductions || {
      pvis: 0,
      irpp: 0,
      cac: 0,
      cfc: 0,
      rav: 0,
      tdl: 0,
      advance: 0,
      other: 0
    },
    // Champs pour les primes et indemnités dynamiques
    primes: employee.primes || [],
    indemnites: employee.indemnites || [],
    // Autres champs
    isActive: employee.isActive !== undefined ? employee.isActive : true,
    profileImage: employee.profileImage || null,
    contractFile: employee.contractFile || null,
    documents: employee.documents || [],
    notes: employee.notes || "",
    createdAt: employee.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};
