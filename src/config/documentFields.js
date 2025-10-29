// src/config/documentFields.js
// Définition centralisée de tous les champs de formulaire

import { 
  POSTES_EMPLOI, 
  CATEGORIES_PROFESSIONNELLES, 
  ECHELONS_CNPS, 
  SITUATIONS_FAMILLE,
  VILLES_CAMEROUN
} from '../utils/constants';

export const DOCUMENT_FIELDS = {
  offers: [
    { key: 'templateVersion', label: 'Version du modèle', type: 'select', required: true, options: [
      { value: 'v2', label: 'Version 2 - Sursalaire conditionnel (avec ou sans)' },
      { value: 'v1', label: 'Version 1 - Sursalaire toujours affiché (ancien modèle)' }
    ]},
    { key: 'candidateName', label: 'Nom du candidat', type: 'text', required: false },
    { key: 'candidateCity', label: 'Ville du candidat', type: 'text', required: false },
    { key: 'companyCity', label: 'Ville de l\'entreprise', type: 'text', required: false },
    { key: 'title', label: 'Titre du poste', type: 'select', required: true, options: POSTES_EMPLOI },
    { key: 'contractType', label: 'Type de contrat', type: 'select', required: false, options: ['CDI','CDD','Stage','Freelance'] },
    { key: 'category', label: 'Catégorie professionnelle', type: 'select', required: true, options: CATEGORIES_PROFESSIONNELLES },
    { key: 'echelon', label: 'Échelon CNPS', type: 'select', required: true, options: ECHELONS_CNPS },
    { key: 'location', label: 'Lieu de travail', type: 'select', required: false, options: VILLES_CAMEROUN },
    { key: 'description', label: 'Description de l\'offre', type: 'textarea', required: false },
    { key: 'salary', label: 'Salaire total', type: 'number', required: true },
    { key: 'baseSalary', label: 'Salaire de base', type: 'number', required: true },
    { key: 'overtimeSalary', label: 'Sursalaire + heures sup', type: 'number', required: false },
    { key: 'housingAllowance', label: 'Indemnité de logement', type: 'number', required: false },
    { key: 'transportAllowance', label: 'Indemnité de transport', type: 'number', required: false },
    { key: 'weeklyHours', label: 'Heures hebdomadaires', type: 'number', required: true },
    { key: 'dailyAllowance', label: 'Indemnité journalière', type: 'number', required: false },
    { key: 'trialPeriod', label: 'Période d\'essai (mois)', type: 'number', required: true },
    { key: 'startDate', label: 'Date de début', type: 'date', required: true },
    { key: 'startTime', label: 'Heure de début', type: 'text', required: false },
    { key: 'responseDeadline', label: 'Date limite de réponse', type: 'date', required: true },
    { key: 'city', label: 'Ville', type: 'select', required: false, options: VILLES_CAMEROUN },
    { key: 'date', label: 'Date du document', type: 'date', required: true },
    { key: 'reference', label: 'Référence', type: 'text', required: false }
  ],

  attestations: [
    { key: 'employeeName', label: 'Nom de l\'employé', type: 'text', required: true },
    { key: 'managerName', label: 'Nom du responsable', type: 'text', required: true },
    { key: 'bankName', label: 'Nom de la banque', type: 'text', required: true },
    { key: 'accountNumber', label: 'Numéro de compte', type: 'text', required: true },
    { key: 'city', label: 'Ville', type: 'text', required: true },
    { key: 'date', label: 'Date du document', type: 'date', required: true },
    { key: 'reference', label: 'Référence', type: 'text', required: false }
  ],

  certificates: [
    { key: 'employeeName', label: 'Nom de l\'employé', type: 'text', required: true },
    { key: 'managerName', label: 'Nom du responsable', type: 'text', required: true },
    { key: 'hrManagerName', label: 'Nom du RH', type: 'text', required: true },
    { key: 'position', label: 'Poste occupé', type: 'select', required: true, options: POSTES_EMPLOI },
    { key: 'category', label: 'Catégorie professionnelle', type: 'select', required: true, options: CATEGORIES_PROFESSIONNELLES },
    { key: 'echelon', label: 'Échelon CNPS', type: 'select', required: true, options: ECHELONS_CNPS },
    { key: 'startDate', label: 'Date d\'embauche', type: 'date', required: true },
    { key: 'endDate', label: 'Date de fin', type: 'date', required: false },
    { key: 'city', label: 'Ville', type: 'select', required: true, options: VILLES_CAMEROUN },
    { key: 'date', label: 'Date du document', type: 'date', required: true },
    { key: 'reference', label: 'Référence', type: 'text', required: false }
  ],

  contracts: [
    { key: 'employerName', label: 'Nom de l\'employeur', type: 'text', required: true },
    { key: 'employerBP', label: 'BP Employeur', type: 'text', required: true },
    { key: 'employerPhone', label: 'Téléphone Employeur', type: 'text', required: true },
    { key: 'employerFax', label: 'Fax Employeur', type: 'text', required: false },
    { key: 'employerRepresentative', label: 'Représentant Employeur', type: 'text', required: true },
    { key: 'employerRepresentativeTitle', label: 'Titre du Représentant', type: 'text', required: true },
    { key: 'employerCNPS', label: 'N° CNPS Employeur', type: 'text', required: true },
    { key: 'employeeName', label: 'Nom de l\'employé', type: 'text', required: true },
    { key: 'employeeBirthDate', label: 'Date de naissance', type: 'date', required: true },
    { key: 'employeeBirthPlace', label: 'Lieu de naissance', type: 'select', required: true, options: VILLES_CAMEROUN },
    { key: 'employeeFatherName', label: 'Nom du père', type: 'text', required: true },
    { key: 'employeeMotherName', label: 'Nom de la mère', type: 'text', required: true },
    { key: 'employeeAddress', label: 'Adresse de l\'employé', type: 'text', required: true },
    { key: 'employeeMaritalStatus', label: 'Situation familiale', type: 'select', required: true, options: SITUATIONS_FAMILLE },
    { key: 'employeeSpouseName', label: 'Nom de l\'épouse', type: 'text', required: false },
    { key: 'employeeChildrenCount', label: 'Nombre d\'enfants', type: 'number', required: false },
    { key: 'employeeEmergencyContact', label: 'Personne à prévenir', type: 'text', required: true },
    { key: 'employeePosition', label: 'Poste de l\'employé', type: 'select', required: true, options: POSTES_EMPLOI },
    { key: 'employeeCategory', label: 'Catégorie professionnelle', type: 'select', required: true, options: CATEGORIES_PROFESSIONNELLES },
    { key: 'employeeEchelon', label: 'Échelon CNPS', type: 'select', required: true, options: ECHELONS_CNPS },
    { key: 'workplace', label: 'Lieu de travail', type: 'select', required: true, options: VILLES_CAMEROUN },
    { key: 'totalSalary', label: 'Salaire total', type: 'number', required: true },
    { key: 'baseSalary', label: 'Salaire de base', type: 'number', required: true },
    { key: 'overtimeSalary', label: 'Sursalaire + heures sup', type: 'number', required: false },
    { key: 'housingAllowance', label: 'Indemnité de logement', type: 'number', required: false },
    { key: 'transportAllowance', label: 'Indemnité de transport', type: 'number', required: false },
    { key: 'trialPeriod', label: 'Période d\'essai (mois)', type: 'number', required: true },
    { key: 'contractDuration', label: 'Durée du contrat', type: 'text', required: true },
    { key: 'startDate', label: 'Date de début', type: 'date', required: true }
  ],

  amendments: [
    { key: 'originalContractDate', label: 'Date du contrat original', type: 'date', required: true },
    { key: 'employerName', label: 'Nom de l\'employeur', type: 'text', required: true },
    { key: 'employerBP', label: 'BP Employeur', type: 'text', required: true },
    { key: 'employerPhone', label: 'Téléphone Employeur', type: 'text', required: true },
    { key: 'employerEmail', label: 'Email Employeur', type: 'email', required: true },
    { key: 'employerRepresentative', label: 'Représentant Employeur', type: 'text', required: true },
    { key: 'employerRepresentativeTitle', label: 'Titre du Représentant', type: 'text', required: true },
    { key: 'employerCNPS', label: 'N° CNPS Employeur', type: 'text', required: true },
    { key: 'employeeName', label: 'Nom de l\'employé', type: 'text', required: true },
    { key: 'employeeBirthDate', label: 'Date de naissance', type: 'date', required: true },
    { key: 'employeeBirthPlace', label: 'Lieu de naissance', type: 'select', required: true, options: VILLES_CAMEROUN },
    { key: 'employeeAddress', label: 'Adresse de l\'employé', type: 'text', required: true },
    { key: 'employeeMaritalStatus', label: 'Situation familiale', type: 'select', required: true, options: SITUATIONS_FAMILLE },
    { key: 'employeeEmergencyContact', label: 'Personne à prévenir', type: 'text', required: false },
    { key: 'employeePosition', label: 'Poste actuel', type: 'select', required: false, options: POSTES_EMPLOI },
    { key: 'employeeCategory', label: 'Ancienne catégorie', type: 'select', required: false, options: CATEGORIES_PROFESSIONNELLES },
    { key: 'employeeEchelon', label: 'Ancien échelon', type: 'select', required: false, options: ECHELONS_CNPS },
    { key: 'workplace', label: 'Lieu de travail', type: 'select', required: false, options: VILLES_CAMEROUN },
    { key: 'articleNumber', label: 'Numéro d\'article', type: 'text', required: true },
    { key: 'newCategory', label: 'Nouvelle catégorie', type: 'select', required: true, options: CATEGORIES_PROFESSIONNELLES },
    { key: 'newEchelon', label: 'Nouvel échelon', type: 'select', required: true, options: ECHELONS_CNPS },
    { key: 'remunerationArticleNumber', label: 'Numéro d\'article rémunération', type: 'text', required: true },
    { key: 'totalSalary', label: 'Salaire total', type: 'number', required: true },
    { key: 'baseSalary', label: 'Salaire de base', type: 'number', required: true },
    { key: 'overtimeSalary', label: 'Sursalaire + heures sup', type: 'number', required: false },
    { key: 'housingAllowance', label: 'Indemnité de logement', type: 'number', required: false },
    { key: 'transportAllowance', label: 'Indemnité de transport', type: 'number', required: false },
    { key: 'weeklyHours', label: 'Heures hebdomadaires', type: 'number', required: true },
    { key: 'effectiveDate', label: 'Date d\'effet', type: 'date', required: true }
  ]
};
