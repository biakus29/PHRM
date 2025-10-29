// src/utils/documentHelpers.js
// Fonctions utilitaires pour les documents

/**
 * Extrait le département d'un document
 */
export const getDocDepartment = (doc, employees = []) => {
  const direct = doc.department || doc.departement || doc.service || doc.services;
  if (direct) return direct;
  
  const empName = doc.employeeName || doc.nomEmploye || doc.employee?.name;
  if (!empName) return '';
  
  const emp = employees.find(e => 
    (e.name || e.nom || '').toLowerCase() === String(empName).toLowerCase()
  );
  
  if (!emp) return '';
  return emp.department || emp.departement || emp.service || emp.services || '';
};

/**
 * Remplit les données d'un employé pour un formulaire
 */
export const fillEmployeeData = (employee) => {
  if (!employee) return {};
  
  return {
    employeeName: employee.name || employee.nom || '',
    employeeBirthDate: employee.dateOfBirth || employee.birthDate || employee.dateNaissance || '',
    employeeBirthPlace: employee.lieuNaissance || employee.placeOfBirth || employee.birthPlace || employee.lieuDeNaissance || '',
    employeeFatherName: employee.pere || employee.fatherName || employee.nomPere || '',
    employeeMotherName: employee.mere || employee.motherName || employee.nomMere || '',
    employeeAddress: employee.residence || employee.address || employee.adresse || '',
    employeeMaritalStatus: employee.situation || employee.maritalStatus || employee.situationFamiliale || '',
    employeeSpouseName: employee.epouse || employee.spouseName || employee.nomEpouse || '',
    employeeChildrenCount: employee.numberOfChildren || employee.childrenCount || employee.nombreEnfants || 0,
    employeeEmergencyContact: employee.personneAPrevenir || employee.emergencyContact || employee.contactUrgence || '',
    employeePosition: employee.poste || employee.position || employee.fonction || '',
    employeeCategory: employee.professionalCategory || employee.category || employee.categorieProfessionnelle || '',
    employeeEchelon: employee.echelon || employee.echelonCNPS || '',
    workplace: employee.workPlace || employee.workplace || employee.lieuTravail || '',
    totalSalary: employee.baseSalary || employee.salary || employee.salaire || employee.salaireTotal || 0,
    baseSalary: employee.baseSalary || employee.salary || employee.salaire || employee.salaireDeBase || 0,
    transportAllowance: employee.transportAllowance || employee.indemniteTransport || employee.primeTransport || 0,
    housingAllowance: employee.housingAllowance || employee.indemniteLogement || employee.primeLogement || 0,
    overtimeSalary: employee.overtimeSalary || employee.sursalaire || employee.heuresSupplementaires || 0,
    cnpsNumber: employee.cnpsNumber || employee.numeroCNPS || '',
    matricule: employee.matricule || employee.numeroMatricule || '',
    email: employee.email || employee.courriel || '',
    phone: employee.phone || employee.telephone || employee.contact || ''
  };
};

/**
 * Génère les valeurs par défaut pour un type de document
 */
export const getDefaultValues = (documentType, companyData = null, selectedEmployee = null) => {
  const today = new Date().toISOString().split('T')[0];
  const employerName = companyData?.name || 'SUBSAHARA SERVICES inc';
  const employerPhone = companyData?.phone || '+237 6XX XX XX XX';
  const employerRepresentative = companyData?.representant || 'Directeur Général';
  const employerCNPS = companyData?.cnpsNumber || 'A123456789';
  
  const employeeData = selectedEmployee ? fillEmployeeData(selectedEmployee) : {};
  
  const defaults = {
    offers: {
      templateVersion: 'v2',
      candidateName: '',
      candidateCity: '',
      companyCity: '',
      city: '',
      date: today,
      reference: '',
      weeklyHours: 40,
      trialPeriod: 3,
      startTime: '08:00',
      responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: '',
      dailyAllowance: 0,
      title: '',
      category: '',
      echelon: '',
      salary: 0,
      baseSalary: 0,
      overtimeSalary: 0,
      housingAllowance: 0,
      transportAllowance: 0
    },
    attestations: {
      city: 'Douala',
      date: today,
      reference: 'RAC',
      managerName: employerRepresentative,
      employeeName: employeeData.employeeName || '',
      bankName: '',
      accountNumber: ''
    },
    certificates: {
      city: 'Douala',
      date: today,
      reference: 'RAC',
      managerName: employerRepresentative,
      hrManagerName: 'Responsable RH',
      employeeName: employeeData.employeeName || '',
      position: employeeData.employeePosition || '',
      category: employeeData.employeeCategory || '',
      echelon: employeeData.employeeEchelon || '',
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: today
    },
    contracts: {
      city: 'Douala',
      date: today,
      employerName,
      employerBP: 'BP 12345',
      employerPhone,
      employerFax: '',
      employerEmail: '',
      employerRepresentative,
      employerRepresentativeTitle: 'Directeur Général',
      employerCNPS,
      ...employeeData,
      trialPeriod: 3,
      contractDuration: '12 mois',
      startDate: today,
      weeklyHours: 40
    },
    amendments: {
      originalContractDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      city: 'Douala',
      date: today,
      employerName,
      employerBP: 'BP 12345',
      employerPhone,
      employerEmail: '',
      employerRepresentative,
      employerRepresentativeTitle: 'Directeur des Ressources Humaines',
      employerCNPS,
      ...employeeData,
      articleNumber: '2',
      newCategory: 'Cadre supérieur',
      newEchelon: 'Échelon D',
      remunerationArticleNumber: '3',
      weeklyHours: 40,
      effectiveDate: today
    }
  };
  
  return defaults[documentType] || {};
};

/**
 * Formate un montant en FCFA
 */
export const formatCurrency = (amount) => {
  return `${Number(amount || 0).toLocaleString()} FCFA`;
};

/**
 * Formate une date au format français
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
