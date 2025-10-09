// src/utils/pdfTemplates/offerTemplateCameroon.js
// Template PDF pour les offres d'emploi au format Cameroun

import jsPDF from 'jspdf';
import { TextTemplateManager } from '../textTemplates';

export function generateOfferPDFCameroon(offerData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let y = 20;

  // Initialiser le gestionnaire de textes personnalisables
  const textManager = new TextTemplateManager(offerData.companyId || 'default');

  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '................';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '................';
    return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    
    if (options.align === 'center') {
      doc.text(text, x, yPos, { align: 'center' });
    } else if (options.align === 'right') {
      doc.text(text, x, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
    
    return yPos + (options.lineHeight || 6);
  };

  const addMultilineText = (text, xPos, yPos, maxWidth, options = {}) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', options.style || 'normal');
    
    lines.forEach(line => {
      yPos = addText(line, xPos, yPos, { ...options, lineHeight: options.lineHeight || 6 });
    });
    
    return yPos;
  };

  const checkPageBreak = (requiredSpace = 20) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      return margin;
    }
    return y;
  };

  // En-tête
  y = addText('À l\'attention de :', margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(`Monsieur ${offerData.candidateName || '.....................'}`, margin, y, { fontSize: 11, lineHeight: 10 });
  y = addText(offerData.candidateAddress || 'DOUALA', margin, y, { fontSize: 11, style: 'bold', lineHeight: 15 });

  // Date et lieu
  const offerDate = offerData.date ? 
    new Date(offerData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 
    '___________';
  y = addText(`${offerData.city || 'Yaoundé'}, le ${offerDate}`, pageWidth - margin, y, { 
    fontSize: 11, 
    align: 'right',
    lineHeight: 10
  });

  // Objet
  y = addText('Objet :', margin, y, { fontSize: 11, style: 'bold', lineHeight: 8 });
  y = addText('LETTRE D\'OFFRE', margin + 10, y, { fontSize: 11, style: 'bold', lineHeight: 15 });

  // Corps de la lettre
  y = checkPageBreak(30);
  
  const startDate = offerData.startDate ? 
    new Date(offerData.startDate).toLocaleDateString('fr-FR') : 
    '…………………';
  const startTime = offerData.startTime || '……';
  
  // Utiliser le texte personnalisable pour l'introduction
  const introductionText = textManager.getText('offers', 'introduction', {
    startDate: startDate,
    startTime: startTime
  });
  
  y = addMultilineText(
    introductionText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 5;

  const position = offerData.position || '……………………….';
  const category = offerData.category || '…….';
  const echelon = offerData.echelon || '…….';
  const workplace = offerData.workplace || 'Douala';
  
  // Utiliser le texte personnalisable pour la description du poste
  const positionText = textManager.getText('offers', 'positionDescription', {
    position: position,
    category: category,
    echelon: echelon,
    workplace: workplace
  });
  
  y = addMultilineText(
    positionText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 8;

  // Rémunération
  y = checkPageBreak(50);
  const totalSalary = formatAmount(offerData.totalSalary);
  
  // Utiliser le texte personnalisable pour la rémunération
  const remunerationText = textManager.getText('offers', 'remuneration', {
    totalSalary: totalSalary
  });
  
  y = addMultilineText(
    remunerationText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  const salaryItems = [
    { label: 'Salaire de base catégoriel', amount: offerData.baseSalary },
    { label: 'Sursalaire y compris forfait heures supplémentaires', amount: offerData.overtimeSalary },
    { label: 'Indemnité de logement', amount: offerData.housingAllowance },
    { label: 'Indemnité de transport', amount: offerData.transportAllowance }
  ];

  salaryItems.forEach(item => {
    const formattedAmount = formatAmount(item.amount);
    y = addText(item.label, margin, y, { fontSize: 11, lineHeight: 6 });
    y = addText(`${formattedAmount} XAF`, pageWidth - margin, y - 6, { 
      fontSize: 11, 
      align: 'right' 
    });
  });

  y += 5;

  // Durée de travail
  const weeklyHours = offerData.weeklyHours || '………';
  const workDurationText = textManager.getText('offers', 'workDuration', {
    weeklyHours: weeklyHours
  });
  
  y = addMultilineText(
    workDurationText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  // Conditions de travail
  y = checkPageBreak(30);
  const workConditionsText = textManager.getText('offers', 'workConditions');
  
  y = addMultilineText(
    workConditionsText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 5;

  const dailyAllowance = formatAmount(offerData.dailyAllowance);
  const missionExpensesText = textManager.getText('offers', 'missionExpenses', {
    dailyAllowance: dailyAllowance
  });
  
  y = addMultilineText(
    missionExpensesText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 8;

  // Période d'essai
  y = checkPageBreak(30);
  const trialPeriod = offerData.trialPeriod || '.................';
  const trialPeriodText = textManager.getText('offers', 'trialPeriod', {
    trialPeriod: trialPeriod
  });
  
  y = addMultilineText(
    trialPeriodText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  // Couverture médicale
  const medicalCoverageText = textManager.getText('offers', 'medicalCoverage');
  
  y = addMultilineText(
    medicalCoverageText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 5;

  const medicalDetailsText = textManager.getText('offers', 'medicalDetails');
  
  y = addMultilineText(
    medicalDetailsText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 8;

  // Tests médicaux
  y = checkPageBreak(30);
  const companyName = offerData.companyName || '(société)';
  const medicalTestsText = textManager.getText('offers', 'medicalTests', {
    companyName: companyName
  });
  
  y = addMultilineText(
    medicalTestsText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 3;
  
  const medicalConditionText = textManager.getText('offers', 'medicalCondition');
  
  y = addMultilineText(
    medicalConditionText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  // Conditions de validité
  const validityConditionsText = textManager.getText('offers', 'validityConditions');
  
  y = addText(validityConditionsText, margin, y, { fontSize: 11, lineHeight: 8 });

  const responseDeadline = offerData.responseDeadline ? 
    new Date(offerData.responseDeadline).toLocaleDateString('fr-FR') : 
    '…………………………………………….';
  const startWorkDate = offerData.startWorkDate ? 
    new Date(offerData.startWorkDate).toLocaleDateString('fr-FR') : 
    '…………………………………………..';

  y = addText(`•  Vous répondez avant le ${responseDeadline}`, margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(`•  Vous prenez votre poste le ${startWorkDate}`, margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText('•  Vos résultats de la visite médicale de pré-embauche sont satisfaisants', 
    margin, y, { fontSize: 11, lineHeight: 8 });

  // Acceptation
  y = checkPageBreak(40);
  const acceptanceText = textManager.getText('offers', 'acceptance');
  
  y = addMultilineText(
    acceptanceText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 6 }
  );
  y += 5;

  const additionalInfoText = textManager.getText('offers', 'additionalInfo');
  
  y = addMultilineText(
    additionalInfoText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  // Documents à fournir
  const documentsTitleText = textManager.getText('offers', 'documentsTitle');
  
  y = addText(documentsTitleText, margin, y, { fontSize: 11, lineHeight: 8 });

  const documentsList = textManager.getText('offers', 'documentsList');
  const documents = Array.isArray(documentsList) ? documentsList : [
    'Fiche de renseignements jointe à compléter',
    '1 fiche d\'état civil de chaque membre de votre famille',
    '1 extrait de casier judiciaire (validité inférieure à 3 mois)',
    'Photocopies certifiées des diplômes, avec présentation des originaux',
    '2 photos d\'identité',
    '1 relevé d\'identité bancaire, le cas échéant',
    'Plan de situation de votre domicile'
  ];

  documents.forEach(doc => {
    y = addText(`•  ${doc}`, margin, y, { fontSize: 11, lineHeight: 6 });
  });

  y += 10;

  // Formule de politesse
  y = checkPageBreak(30);
  const closingText = textManager.getText('offers', 'closing');
  
  y = addMultilineText(
    closingText,
    margin, y, contentWidth, { fontSize: 11, lineHeight: 8 }
  );

  y += 15;

  // Signature
  const midPage = pageWidth / 2;
  let yLeft = y;
  yLeft = addText('Le Directeur Général', margin, yLeft, { fontSize: 10, lineHeight: 20 });
  yLeft = addText('Signature et cachet', margin, yLeft, { fontSize: 9, style: 'italic' });

  let yRight = y;
  yRight = addText('Le Responsable RH', midPage + 10, yRight, { fontSize: 10, lineHeight: 20 });
  yRight = addText('Signature et cachet', midPage + 10, yRight, { fontSize: 9, style: 'italic' });

  // Sauvegarde
  const fileName = `Offre_Emploi_${(offerData.candidateName || 'Candidat').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateOfferPDFCameroon;