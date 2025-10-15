// src/components/DocumentsManager.jsx
// Gestionnaire de documents RH : Offres d'emploi, Attestations, Certificats

import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiPlus, FiEdit, FiTrash2, FiEye, FiSettings } from 'react-icons/fi';
import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { generateOfferPDFCameroon } from '../utils/pdfTemplates/offerTemplateCameroon';
import { generateAttestationPDFCameroon } from '../utils/pdfTemplates/attestationTemplateCameroon';
import { generateCertificatePDFCameroon } from '../utils/pdfTemplates/certificateTemplateCameroon';
import { generateContractPDFCameroon } from '../utils/pdfTemplates/contractTemplateCameroon';
import { generateContractAmendmentPDFCameroon } from '../utils/pdfTemplates/contractAmendmentTemplateCameroon';
import { exportDocumentContract } from '../utils/exportContractPDF';
import TextCustomizationModal from './TextCustomizationModal';
import { 
  POSTES_EMPLOI, 
  CATEGORIES_PROFESSIONNELLES, 
  CATEGORIES_CNPS, 
  ECHELONS_CNPS, 
  SITUATIONS_FAMILLE,
  VILLES_CAMEROUN,
  DIPLOMES,
  SERVICES
} from '../utils/constants';

const DocumentsManager = ({ companyId, userRole = 'admin', companyData = null, employees = [] }) => {
  const [activeTab, setActiveTab] = useState('offers');
  const [documents, setDocuments] = useState({
    offers: [],
    attestations: [],
    certificates: [],
    contracts: [],
    amendments: []
  });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showTextCustomization, setShowTextCustomization] = useState(false);

  // Types de documents
  const documentTypes = {
    offers: {
      title: 'Offres d\'emploi',
      icon: FiFileText,
      color: 'blue',
      fields: [
        { key: 'title', label: 'Titre du poste', type: 'select', required: true, options: POSTES_EMPLOI },
        { key: 'category', label: 'Catégorie professionnelle', type: 'select', required: true, options: CATEGORIES_PROFESSIONNELLES },
        { key: 'echelon', label: 'Échelon CNPS', type: 'select', required: true, options: ECHELONS_CNPS },
        { key: 'location', label: 'Lieu de travail', type: 'select', required: true, options: VILLES_CAMEROUN },
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
        { key: 'city', label: 'Ville', type: 'select', required: true, options: VILLES_CAMEROUN },
        { key: 'date', label: 'Date du document', type: 'date', required: true },
        { key: 'reference', label: 'Référence', type: 'text', required: false }
      ]
    },
    attestations: {
      title: 'Attestations de virement',
      icon: FiFileText,
      color: 'green',
      fields: [
        { key: 'employeeName', label: 'Nom de l\'employé', type: 'text', required: true },
        { key: 'managerName', label: 'Nom du responsable', type: 'text', required: true },
        { key: 'bankName', label: 'Nom de la banque', type: 'text', required: true },
        { key: 'accountNumber', label: 'Numéro de compte', type: 'text', required: true },
        { key: 'city', label: 'Ville', type: 'text', required: true },
        { key: 'date', label: 'Date du document', type: 'date', required: true },
        { key: 'reference', label: 'Référence', type: 'text', required: false }
      ]
    },
    certificates: {
      title: 'Certificats de travail',
      icon: FiFileText,
      color: 'purple',
      fields: [
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
      ]
    },
    contracts: {
      title: 'Contrats de travail',
      icon: FiFileText,
      color: 'orange',
      fields: [
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
      ]
    },
    amendments: {
      title: 'Avenants au contrat',
      icon: FiFileText,
      color: 'indigo',
      fields: [
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
    }
  };

  // Remplir les données de l'employé sélectionné
  const fillEmployeeData = (employee) => {
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

  // Obtenir les valeurs par défaut selon le type de document
  const getDefaultValues = (type) => {
    const today = new Date().toISOString().split('T')[0];
    const currentDate = new Date().toLocaleDateString('fr-FR');
    
    // Utiliser les données réelles de l'entreprise si disponibles
    const employerName = companyData?.name || 'SUBSAHARA SERVICES inc (TCHAD CAMEROUN CONSTRUCTORS)';
    const employerAddress = companyData?.address || 'Douala, Cameroun';
    const employerPhone = companyData?.phone || '+237 6XX XX XX XX';
    const employerRepresentative = companyData?.representant || 'Directeur Général';
    const employerCNPS = companyData?.cnpsNumber || 'A123456789';
    const employerTaxNumber = companyData?.taxpayerNumber || 'M123456789012A';
    
    // Récupérer les données de l'employé sélectionné
    const employeeData = selectedEmployee ? fillEmployeeData(selectedEmployee) : {};
    
    switch (type) {
      case 'offers':
        return {
          city: 'Douala',
          date: today,
          reference: 'RAC',
          weeklyHours: 40,
          trialPeriod: 3,
          startTime: '08:00',
          responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 jours
          location: 'Douala',
          dailyAllowance: 5000,
          title: 'Développeur',
          category: 'Cadre moyen',
          echelon: 'Échelon C',
          salary: 150000,
          baseSalary: 100000,
          overtimeSalary: 20000,
          housingAllowance: 15000,
          transportAllowance: 10000
        };
      
      case 'attestations':
        return {
          city: 'Douala',
          date: today,
          reference: 'RAC',
          managerName: employerRepresentative,
          employeeName: employeeData.employeeName || 'Jean Dupont',
          bankName: employeeData.bankName || 'Afriland First Bank',
          accountNumber: employeeData.bankAccount || '1234567890'
        };
      
      case 'certificates':
        return {
          city: 'Douala',
          date: today,
          reference: 'RAC',
          managerName: employerRepresentative,
          hrManagerName: 'Responsable RH',
          employeeName: employeeData.employeeName || 'Jean Dupont',
          position: employeeData.employeePosition || 'Développeur',
          category: employeeData.employeeCategory || 'Cadre moyen',
          echelon: employeeData.employeeEchelon || 'Échelon C',
          startDate: employeeData.hireDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 an avant
          endDate: today
        };
      
      case 'contracts':
        return {
          city: 'Douala',
          date: today,
          employerName: employerName,
          employerBP: 'BP 12345',
          employerPhone: employerPhone,
          employerFax: '+237 2XX XX XX XX',
          employerEmail: 'contact@entreprise.cm',
          employerRepresentative: employerRepresentative,
          employerRepresentativeTitle: 'Directeur Général',
          employerCNPS: employerCNPS,
          employeeName: employeeData.employeeName || 'Jean Dupont',
          employeeBirthDate: employeeData.employeeBirthDate || '1990-01-15',
          employeeBirthPlace: employeeData.employeeBirthPlace || 'Douala',
          employeeFatherName: employeeData.employeeFatherName || 'Pierre Dupont',
          employeeMotherName: employeeData.employeeMotherName || 'Marie Dupont',
          employeeAddress: employeeData.employeeAddress || 'Quartier Akwa, Douala',
          employeeMaritalStatus: employeeData.employeeMaritalStatus || 'Célibataire',
          employeeSpouseName: employeeData.employeeSpouseName || '',
          employeeChildrenCount: employeeData.employeeChildrenCount || 0,
          employeeEmergencyContact: employeeData.employeeEmergencyContact || '+237 6XX XX XX XX',
          employeePosition: employeeData.employeePosition || 'Développeur',
          employeeCategory: employeeData.employeeCategory || 'Cadre moyen',
          employeeEchelon: employeeData.employeeEchelon || 'Échelon C',
          workplace: employeeData.workplace || 'Douala',
          totalSalary: employeeData.totalSalary || 150000,
          baseSalary: employeeData.baseSalary || 100000,
          overtimeSalary: employeeData.overtimeSalary || 20000,
          housingAllowance: employeeData.housingAllowance || 15000,
          transportAllowance: employeeData.transportAllowance || 10000,
          trialPeriod: 3,
          contractDuration: '12 mois',
          startDate: today,
          weeklyHours: 40
        };
      
      case 'amendments':
        return {
          originalContractDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours avant
          city: 'Douala',
          date: today,
          employerName: employerName,
          employerBP: 'BP 12345',
          employerPhone: employerPhone,
          employerEmail: 'contact@entreprise.cm',
          employerRepresentative: employerRepresentative,
          employerRepresentativeTitle: 'Directeur des Ressources Humaines',
          employerCNPS: employerCNPS,
          employeeName: employeeData.employeeName || 'Jean Dupont',
          employeeBirthDate: employeeData.employeeBirthDate || '1990-01-15',
          employeeBirthPlace: employeeData.employeeBirthPlace || 'Douala',
          employeeAddress: employeeData.employeeAddress || 'Quartier Akwa, Douala',
          employeeMaritalStatus: employeeData.employeeMaritalStatus || 'Célibataire',
          employeeEmergencyContact: employeeData.employeeEmergencyContact || '+237 6XX XX XX XX',
          employeePosition: employeeData.employeePosition || 'Développeur',
          employeeCategory: employeeData.employeeCategory || 'Cadre moyen',
          employeeEchelon: employeeData.employeeEchelon || 'Échelon C',
          workplace: employeeData.workplace || 'Douala',
          articleNumber: '2',
          newCategory: 'Cadre supérieur',
          newEchelon: 'Échelon D',
          remunerationArticleNumber: '3',
          totalSalary: employeeData.totalSalary || 180000,
          baseSalary: employeeData.baseSalary || 120000,
          overtimeSalary: employeeData.overtimeSalary || 25000,
          housingAllowance: employeeData.housingAllowance || 18000,
          transportAllowance: employeeData.transportAllowance || 12000,
          weeklyHours: 60,
          effectiveDate: today
        };
      
      default:
        return {};
    }
  };

  // Obtenir le placeholder pour un champ
  const getPlaceholder = (fieldKey) => {
    // Utiliser les données réelles de l'entreprise si disponibles
    const employerName = companyData?.name || 'SUBSAHARA SERVICES inc';
    const employerPhone = companyData?.phone || '+237 6XX XX XX XX';
    const employerRepresentative = companyData?.representant || 'Directeur Général';
    const employerCNPS = companyData?.cnpsNumber || 'A123456789';
    
    const placeholders = {
      // Offres d'emploi
      title: 'Ex: Développeur',
      category: 'Ex: Cadre moyen',
      echelon: 'Ex: Échelon C',
      location: 'Ex: Douala',
      salary: 'Ex: 150000',
      baseSalary: 'Ex: 100000',
      overtimeSalary: 'Ex: 20000',
      housingAllowance: 'Ex: 15000',
      transportAllowance: 'Ex: 10000',
      weeklyHours: 'Ex: 40',
      dailyAllowance: 'Ex: 5000',
      trialPeriod: 'Ex: 3',
      startTime: 'Ex: 08:00',
      city: 'Ex: Douala',
      reference: 'Ex: RAC',
      
      // Attestations
      employeeName: 'Ex: Jean Dupont',
      managerName: `Ex: ${employerRepresentative}`,
      bankName: 'Ex: Afriland First Bank',
      accountNumber: 'Ex: 1234567890',
      
      // Certificats
      hrManagerName: 'Ex: Responsable RH',
      position: 'Ex: Développeur',
      category: 'Ex: Cadre moyen',
      echelon: 'Ex: Échelon C',
      
      // Contrats
      employerName: `Ex: ${employerName}`,
      employerBP: 'Ex: BP 12345',
      employerPhone: `Ex: ${employerPhone}`,
      employerFax: 'Ex: +237 2XX XX XX XX',
      employerEmail: 'Ex: contact@entreprise.cm',
      employerRepresentative: `Ex: ${employerRepresentative}`,
      employerRepresentativeTitle: 'Ex: Directeur Général',
      employerCNPS: `Ex: ${employerCNPS}`,
      employeeBirthDate: 'Ex: 1990-01-15',
      employeeBirthPlace: 'Ex: Douala',
      employeeFatherName: 'Ex: Pierre Dupont',
      employeeMotherName: 'Ex: Marie Dupont',
      employeeAddress: 'Ex: Quartier Akwa, Douala',
      employeeMaritalStatus: 'Ex: Célibataire',
      employeeSpouseName: 'Ex: Marie Dupont',
      employeeChildrenCount: 'Ex: 2',
      employeeEmergencyContact: 'Ex: +237 6XX XX XX XX',
      employeePosition: 'Ex: Développeur',
      employeeCategory: 'Ex: Cadre moyen',
      employeeEchelon: 'Ex: Échelon C',
      workplace: 'Ex: Douala',
      totalSalary: 'Ex: 150000',
      contractDuration: 'Ex: 12 mois',
      
      // Avenants
      originalContractDate: 'Ex: 2024-01-15',
      articleNumber: 'Ex: 2',
      newCategory: 'Ex: Cadre supérieur',
      newEchelon: 'Ex: Échelon D',
      remunerationArticleNumber: 'Ex: 3',
      effectiveDate: 'Ex: 2024-02-01'
    };
    
    return placeholders[fieldKey] || '';
  };

  // Charger les documents
  const loadDocuments = async (type) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'documents'),
        where('companyId', '==', companyId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDocuments(prev => ({ ...prev, [type]: docs }));
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  // Sauvegarder un document
  const saveDocument = async (data) => {
    setLoading(true);
    try {
      const docData = {
        ...data,
        companyId,
        type: activeTab,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (editingDoc) {
        await updateDoc(doc(db, 'documents', editingDoc.id), docData);
        toast.success('Document modifié avec succès');
      } else {
        await addDoc(collection(db, 'documents'), docData);
        toast.success('Document créé avec succès');
      }

      setShowForm(false);
      setEditingDoc(null);
      setFormData({});
      loadDocuments(activeTab);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un document
  const deleteDocument = async (docId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'documents', docId));
        toast.success('Document supprimé avec succès');
        loadDocuments(activeTab);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };

  // Générer PDF
  const generatePDF = (documentData) => {
    try {
      switch (activeTab) {
        case 'offers':
          generateOfferPDFCameroon(documentData);
          break;
        case 'attestations':
          generateAttestationPDFCameroon(documentData);
          break;
        case 'certificates':
          generateCertificatePDFCameroon(documentData);
          break;
        case 'contracts':
          exportDocumentContract(documentData);
          break;
        case 'amendments':
          generateContractAmendmentPDFCameroon(documentData);
          break;
        default:
          toast.error('Type de document non supporté');
      }
      // Le toast de succès est géré par chaque fonction d'export
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error);
      toast.error('Erreur lors de la génération PDF');
    }
  };

  // Charger les documents au montage
  useEffect(() => {
    if (companyId) {
      loadDocuments(activeTab);
    }
  }, [companyId, activeTab]);

  // Rendu du formulaire
  const renderForm = () => {
    const currentType = documentTypes[activeTab];
    if (!currentType) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDoc ? 'Modifier' : 'Créer'} {currentType.title}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingDoc(null);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiEdit className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              saveDocument(formData);
            }} className="space-y-4">
              {currentType.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required={field.required}
                      placeholder={getPlaceholder(field.key)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                    >
                      <option value="">Sélectionner...</option>
                      {field.options?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[field.key] || false}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.checked })}
                        className="mr-2"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={field.required}
                      placeholder={getPlaceholder(field.key)}
                    />
                  )}
                </div>
              ))}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDoc(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sauvegarde...' : (editingDoc ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Rendu de la liste des documents
  const renderDocumentsList = () => {
    const currentDocs = documents[activeTab] || [];
    const currentType = documentTypes[activeTab];

    if (loading) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-500 animate-pulse">Chargement des documents...</p>
        </div>
      );
    }

    if (currentDocs.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <currentType.icon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Aucun {currentType.title.toLowerCase()}</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Créez votre premier document pour commencer à gérer vos {currentType.title.toLowerCase()}.
          </p>
          <button
            onClick={() => {
              setEditingDoc(null);
              const defaultValues = getDefaultValues(activeTab);
              setFormData(defaultValues);
              setShowForm(true);
            }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:scale-105"
          >
            <FiPlus className="h-5 w-5" />
            <span>Créer mon premier document</span>
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:gap-6">
        {currentDocs.map((doc, index) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-[1.01] sm:hover:scale-[1.02] overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
                <div className="flex-1">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br flex-shrink-0 ${
                      currentType.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      currentType.color === 'green' ? 'from-green-500 to-green-600' :
                      currentType.color === 'purple' ? 'from-purple-500 to-purple-600' :
                      currentType.color === 'orange' ? 'from-orange-500 to-orange-600' :
                      currentType.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
                      'from-gray-500 to-gray-600'
                    }`}>
                      <currentType.icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {doc.title || doc.employeeName || doc.position || `Document #${index + 1}`}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        📅 <span className="hidden sm:inline">Créé le </span>
                        {new Date(doc.createdAt?.seconds * 1000).toLocaleDateString('fr-FR', {
                          weekday: window.innerWidth >= 640 ? 'long' : undefined,
                          year: 'numeric',
                          month: window.innerWidth >= 640 ? 'long' : 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Informations supplémentaires - Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mt-4">
                    {doc.employeeName && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">👤</span>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">{doc.employeeName}</span>
                      </div>
                    )}
                    {doc.position && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">💼</span>
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{doc.position}</span>
                      </div>
                    )}
                    {doc.category && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">📊</span>
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{doc.category}</span>
                      </div>
                    )}
                    {doc.salary && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">💰</span>
                        <span className="text-xs sm:text-sm text-gray-700 font-medium truncate">
                          {Number(doc.salary).toLocaleString()} FCFA
                        </span>
                      </div>
                    )}
                    {doc.reference && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">🔖</span>
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{doc.reference}</span>
                      </div>
                    )}
                    {doc.city && (
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">📍</span>
                        <span className="text-xs sm:text-sm text-gray-700 truncate">{doc.city}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions - Responsive */}
                <div className="flex flex-row sm:flex-col lg:flex-col space-x-2 sm:space-x-0 sm:space-y-2 lg:ml-6">
                  <button
                    onClick={() => generatePDF(doc)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
                    title="Télécharger PDF"
                  >
                    <FiDownload className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-medium">PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setFormData(doc);
                      setShowForm(true);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
                    title="Modifier"
                  >
                    <FiEdit className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-medium hidden sm:inline">Modifier</span>
                    <span className="font-medium sm:hidden">Edit</span>
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:scale-105 text-xs sm:text-sm"
                    title="Supprimer"
                  >
                    <FiTrash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-medium hidden sm:inline">Supprimer</span>
                    <span className="font-medium sm:hidden">Del</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Barre de statut */}
            <div className={`h-1 bg-gradient-to-r ${
              currentType.color === 'blue' ? 'from-blue-500 to-blue-600' :
              currentType.color === 'green' ? 'from-green-500 to-green-600' :
              currentType.color === 'purple' ? 'from-purple-500 to-purple-600' :
              currentType.color === 'orange' ? 'from-orange-500 to-orange-600' :
              currentType.color === 'indigo' ? 'from-indigo-500 to-indigo-600' :
              'from-gray-500 to-gray-600'
            }`}></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête moderne avec indicateur temps réel - Responsive */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📄 Gestion des Documents</h2>
            </div>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Créez et gérez facilement vos documents RH professionnels
            </p>
            
            {/* Statistiques rapides - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">
                  Total: <span className="font-semibold text-blue-600">
                    {Object.values(documents).reduce((total, docs) => total + docs.length, 0)}
                  </span> documents
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">
                  Employés: <span className="font-semibold text-green-600">{employees.length}</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Boutons - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={() => setShowTextCustomization(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:scale-105 text-sm"
            >
              <FiSettings className="h-4 w-4" />
              <span className="hidden sm:inline">🎨 Personnaliser</span>
              <span className="sm:hidden">🎨</span>
            </button>
            <button
              onClick={() => {
                setEditingDoc(null);
                const defaultValues = getDefaultValues(activeTab);
                setFormData(defaultValues);
                setShowForm(true);
              }}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:scale-105 text-sm"
            >
              <FiPlus className="h-4 w-4" />
              <span className="hidden sm:inline">✨ Nouveau Document</span>
              <span className="sm:hidden">✨ Nouveau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sélecteur d'employé amélioré - Responsive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <FiEye className="h-5 w-5 text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                <span className="hidden sm:inline">Pré-remplir avec les données d'un employé:</span>
                <span className="sm:hidden">Sélectionner un employé:</span>
              </label>
            </div>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === e.target.value);
                setSelectedEmployee(employee || null);
              }}
              className="w-full sm:min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
            >
              <option value="">🔍 Sélectionner un employé...</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  👤 {employee.name} - {employee.poste}
                </option>
              ))}
            </select>
          </div>
          
          {selectedEmployee && (
            <div className="flex items-center justify-between sm:justify-start space-x-3 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  <span className="hidden sm:inline">✅ {selectedEmployee.name} sélectionné</span>
                  <span className="sm:hidden">✅ {selectedEmployee.name}</span>
                </span>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-green-600 hover:text-green-800 p-1 hover:bg-green-100 rounded"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Onglets modernisés - Responsive */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-0 overflow-x-auto scrollbar-hide">
            {Object.entries(documentTypes).map(([key, type]) => {
              const Icon = type.icon;
              const isActive = activeTab === key;
              const docCount = documents[key]?.length || 0;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center space-x-2 sm:space-x-3 py-3 sm:py-4 px-3 sm:px-6 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 min-w-0 ${
                    isActive
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium truncate">
                    <span className="hidden sm:inline">{type.title}</span>
                    <span className="sm:hidden">
                      {type.title.split(' ')[0]}
                    </span>
                  </span>
                  <span className={`py-1 px-2 sm:px-3 rounded-full text-xs font-semibold flex-shrink-0 ${
                    isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : docCount > 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {docCount}
                  </span>
                  {docCount > 0 && !isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu avec padding responsive */}
        <div className="p-4 sm:p-6">
          {renderDocumentsList()}
        </div>
      </div>

      {/* Formulaire modal */}
      {showForm && renderForm()}

      {/* Modal de personnalisation des textes */}
      <TextCustomizationModal
        isOpen={showTextCustomization}
        onClose={() => setShowTextCustomization(false)}
        documentType={activeTab}
        companyId={companyId}
        onTextsUpdated={(docType, texts) => {
          console.log('Textes mis à jour pour:', docType, texts);
          toast.success('🎨 Textes personnalisés appliqués avec succès !');
        }}
      />
    </div>
  );
};

export default DocumentsManager;
