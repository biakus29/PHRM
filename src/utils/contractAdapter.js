// src/utils/contractAdapter.js
// Adaptateur unique pour convertir toutes les données de contrat vers le format 
// attendu par generateContractPDFCameroon (section Documents)

/**
 * Convertit les données d'employé, entreprise et contrat vers le format
 * attendu par generateContractPDFCameroon
 * @param {Object} employee - Données de l'employé
 * @param {Object} companyData - Données de l'entreprise
 * @param {Object} contract - Données du contrat
 * @returns {Object} Données formatées pour generateContractPDFCameroon
 */
export function toCameroonTemplateData(employee, companyData, contract) {
  // Normaliser la période d'essai
  const normalizeTrialPeriod = (trialPeriod) => {
    if (!trialPeriod) return 3; // Défaut 3 mois
    if (typeof trialPeriod === 'number') return trialPeriod;
    
    // Extraire le nombre de la chaîne "3 mois", "1 mois", etc.
    const match = trialPeriod.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 3;
  };

  // Calculer le salaire total à partir des éléments
  const calculateTotalSalary = () => {
    const baseSalary = Number(contract.baseSalary || contract.salary || contract.salaryBrut || 0);
    const transportAllowance = Number(contract.transportAllowance || 0);
    const housingAllowance = Number(contract.housingAllowance || 0);
    const overtimeSalary = Number(contract.overtimeSalary || 0);
    
    // Primes personnalisées
    let primesTotal = 0;
    if (contract.primes && Array.isArray(contract.primes)) {
      primesTotal = contract.primes.reduce((sum, prime) => {
        return sum + (Number(prime.montant || prime.amount || 0));
      }, 0);
    }
    
    // Indemnités personnalisées
    let indemnitesTotal = 0;
    if (contract.indemnites && Array.isArray(contract.indemnites)) {
      indemnitesTotal = contract.indemnites.reduce((sum, ind) => {
        return sum + (Number(ind.montant || ind.amount || 0));
      }, 0);
    }
    
    return baseSalary + transportAllowance + housingAllowance + overtimeSalary + primesTotal + indemnitesTotal;
  };

  // Déterminer la durée du contrat
  const getContractDuration = () => {
    if (contract.type === 'CDD' && contract.endDate && contract.startDate) {
      const start = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
      return `${months} mois (du ${start.toLocaleDateString('fr-FR')} au ${end.toLocaleDateString('fr-FR')})`;
    }
    return contract.type === 'CDI' ? 'Indéterminée' : (contract.duration || contract.contractDuration || 'Indéterminée');
  };

  const today = new Date().toISOString().split('T')[0];

  return {
    // Informations employeur (mapping depuis companyData)
    employerName: companyData?.name || companyData?.companyName || 'VIGILCAM SECURITY & SERVICES SARL',
    employerBP: companyData?.bp || companyData?.address || 'BP 16194',
    employerPhone: companyData?.phone || '22214081',
    employerFax: companyData?.fax || '',
    employerEmail: companyData?.email || '',
    employerRepresentative: companyData?.representant || companyData?.representative || 'Directeur Général',
    employerRepresentativeTitle: companyData?.representativeTitle || 'Directeur Général',
    employerCNPS: companyData?.cnpsNumber || 'Non spécifié',

    // Informations employé (mapping depuis employee)
    employeeName: employee?.name || 'Nom Employé',
    employeeBirthDate: employee?.dateOfBirth || employee?.birthDate || contract?.employeeDOB || '',
    employeeBirthPlace: employee?.lieuNaissance || employee?.placeOfBirth || employee?.birthPlace || contract?.employeeBirthPlace || 'Non spécifié',
    employeeFatherName: employee?.pere || employee?.fatherName || contract?.employeeFather || 'Non spécifié',
    employeeMotherName: employee?.mere || employee?.motherName || contract?.employeeMother || 'Non spécifié',
    employeeAddress: employee?.residence || employee?.address || contract?.employeeResidence || 'Non spécifié',
    employeeMaritalStatus: employee?.situation || employee?.maritalStatus || contract?.employeeMaritalStatus || 'Célibataire',
    employeeSpouseName: employee?.epouse || employee?.spouseName || contract?.employeeSpouse || '',
    employeeChildrenCount: employee?.numberOfChildren || employee?.childrenCount || contract?.employeeChildrenCount || 0,
    employeeEmergencyContact: employee?.personneAPrevenir || employee?.emergencyContact || contract?.employeeEmergencyContact || 'Non spécifié',
    
    // Informations professionnelles
    employeePosition: contract?.position || employee?.poste || employee?.position || 'Non spécifié',
    employeeCategory: contract?.category || employee?.professionalCategory || contract?.employeeClassification || 'Non spécifié',
    employeeEchelon: contract?.echelon || employee?.echelon || 'Non spécifié',
    workplace: contract?.workLocation || contract?.workPlace || contract?.workplace || employee?.workPlace || 'Yaoundé',

    // Informations contractuelles
    totalSalary: calculateTotalSalary(),
    baseSalary: Number(contract?.baseSalary || contract?.salary || contract?.salaryBrut || 0),
    overtimeSalary: Number(contract?.overtimeSalary || 0),
    housingAllowance: Number(contract?.housingAllowance || 0),
    transportAllowance: Number(contract?.transportAllowance || 0),
    
    // Primes et indemnités (format attendu par le générateur Cameroun)
    primes: contract?.primes || [],
    indemnites: contract?.indemnites || [],
    
    trialPeriod: normalizeTrialPeriod(contract?.trialPeriod),
    contractDuration: getContractDuration(),
    startDate: contract?.startDate || contract?.hireDate || today,
    endDate: contract?.endDate || '',
    
    // Informations additionnelles
    weeklyHours: contract?.weeklyHours || 40,
    leaveDays: contract?.leaveDays || 18,
    
    // Métadonnées
    city: companyData?.city || 'Yaoundé',
    date: today,
    reference: contract?.reference || 'RAC'
  };
}

/**
 * Valide que les données minimales sont présentes pour générer un contrat
 * @param {Object} employee 
 * @param {Object} companyData 
 * @param {Object} contract 
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export function validateContractData(employee, companyData, contract) {
  const errors = [];

  // Vérifications employé
  if (!employee?.name) errors.push('Le nom de l\'employé est requis');
  
  // Vérifications entreprise
  if (!companyData?.name && !companyData?.companyName) errors.push('Le nom de l\'entreprise est requis');
  
  // Vérifications contrat
  if (!contract?.type || !['CDI', 'CDD'].includes(contract.type)) {
    errors.push('Le type de contrat doit être CDI ou CDD');
  }
  
  if (!contract?.position && !employee?.poste) {
    errors.push('Le poste de l\'employé est requis');
  }
  
  if (!contract?.baseSalary && !contract?.salary && !contract?.salaryBrut) {
    errors.push('Le salaire de base est requis');
  }
  
  if (!contract?.startDate && !contract?.hireDate) {
    errors.push('La date de début de contrat est requise');
  }
  
  // Validation spécifique CDD
  if (contract?.type === 'CDD' && !contract?.endDate) {
    errors.push('La date de fin est requise pour un contrat CDD');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default { toCameroonTemplateData, validateContractData };
