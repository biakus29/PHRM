// src/utils/pdfTemplates/contractAmendmentTemplateCameroon.js
// Template PDF pour les avenants au contrat de travail au format Cameroun

import jsPDF from 'jspdf';
import { addLogoWithReservedSpace } from './shared';

export function generateContractAmendmentPDFCameroon(amendmentData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (2 * margin);
  let y = 20;

  // Logo en haut du document (gauche)
  try {
    const employerId = amendmentData.employerId || amendmentData.employerEmail || amendmentData.employerName || 'default';
    y = addLogoWithReservedSpace(
      doc,
      { employer: { id: employerId } },
      pageWidth,
      margin,
      y,
      { position: 'left', logoSize: 28, reserveSpace: true }
    );
    y += 4;
  } catch (e) { /* ignore logo errors */ }

  // Fonction pour formater les montants en XAF
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '................';
    // Convertir en nombre si c'est une string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '................';
    
    // Formater avec des espaces comme séparateurs de milliers
    return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Déterminer la civilité (Monsieur/Madame/Mademoiselle)
  const computeCivility = (data) => {
    const gender = String(data.gender || data.employeeGender || '').toLowerCase();
    const marital = String(data.employeeMaritalStatus || data.maritalStatus || '').toLowerCase();
    if (gender.startsWith('f')) {
      if (marital.includes('célib') || marital.includes('single') || marital.includes('demois')) return 'Mademoiselle';
      return 'Madame';
    }
    if (gender.startsWith('m')) return 'Monsieur';
    return data.civility || 'Monsieur/Madame';
  };

  // Fonction pour ajouter du texte avec gestion de la position Y
  const addText = (text, x, yPos, options = {}) => {
    const fontSize = options.fontSize || 11;
    doc.setFontSize(fontSize);
    
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    
    if (options.align === 'center') {
      doc.text(text, x, yPos, { align: 'center' });
    } else if (options.align === 'right') {
      doc.text(text, x, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
    
    return yPos + (options.lineHeight || 5);
  };

  // Fonction pour ajouter une ligne de rémunération avec alignement en colonnes
  const addSalaryLine = (label, amount, englishLabel, yPos) => {
    // Label français
    y = addText(`- ${label}`, margin, yPos, { fontSize: 11, lineHeight: 5 });
    
    // Montant aligné à droite - utiliser align: 'right' pour un alignement parfait
    const formattedAmount = formatAmount(amount);
    y = addText(formattedAmount, pageWidth - margin, y - 5, { 
      fontSize: 11, 
      align: 'right',
      lineHeight: 5
    });
    
    // Label anglais
    y = addText(englishLabel, margin + 5, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
    
    return y;
  };

  // Fonction pour calculer le salaire total à partir des éléments
  const calculateTotalSalary = (amendmentData) => {
    const baseSalary = Number(amendmentData.baseSalary) || 0;
    const transportAllowance = Number(amendmentData.transportAllowance) || 0;
    const housingAllowance = Number(amendmentData.housingAllowance) || 0;
    const overtimeSalary = Number(amendmentData.overtimeSalary) || 0;
    
    // Primes personnalisées
    let primesTotal = 0;
    if (amendmentData.primes && Array.isArray(amendmentData.primes)) {
      primesTotal = amendmentData.primes.reduce((sum, prime) => {
        return sum + (Number(prime.montant || prime.amount) || 0);
      }, 0);
    }
    
    // Indemnités personnalisées
    let indemnitesTotal = 0;
    if (amendmentData.indemnites && Array.isArray(amendmentData.indemnites)) {
      indemnitesTotal = amendmentData.indemnites.reduce((sum, ind) => {
        return sum + (Number(ind.montant || ind.amount) || 0);
      }, 0);
    }
    
    return baseSalary + transportAllowance + housingAllowance + overtimeSalary + primesTotal + indemnitesTotal;
  };

  // Fonction pour vérifier si on doit changer de page
  const checkPageBreak = (requiredSpace = 20) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      return margin;
    }
    return y;
  };

  // ============================================
  // TITRE PRINCIPAL
  // ============================================
  y = addText('AVENANT AU CONTRAT DE TRAVAIL DU', pageWidth / 2, y, { 
    fontSize: 13, 
    style: 'bold',
    align: 'center',
    lineHeight: 6
  });
  
  const originalDate = amendmentData.originalContractDate ? 
    new Date(amendmentData.originalContractDate).toLocaleDateString('fr-FR') : 
    '...............,...';
  y = addText(originalDate, pageWidth / 2, y, { 
    fontSize: 13, 
    style: 'bold',
    align: 'center',
    lineHeight: 8
  });

  // ============================================
  // ENTRE LES SOUSSIGNÉS
  // ============================================
  y = checkPageBreak(15);
  y = addText('ENTRE LES SOUSSIGNÉS', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('Between the undersigned', margin, y, { 
    fontSize: 10, 
    style: 'italic',
    lineHeight: 8
  });

  // ============================================
  // INFORMATIONS EMPLOYEUR
  // ============================================
  y = checkPageBreak(60);
  y = addText(amendmentData.employerName || '', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('(Nom et Prénoms ou Raison Sociale)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Full Name or Firm\'s Name)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  const addressLine = `Adresse Complète :  ${amendmentData.employerBP || '................'} Tél : ${amendmentData.employerPhone || '...................'} E-mail : ${amendmentData.employerEmail || '.......................'}`;
  y = addText(addressLine, margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Full Address', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Représenté par ${amendmentData.employerRepresentative || '........................................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Represented by', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Qualité ${amendmentData.employerRepresentativeTitle || '......................................................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Title', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`N° d'immatriculation CNPS ${amendmentData.employerCNPS || '..................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Registration Number', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  y = addText('CI-APRES DÉNOMMÉ L\'EMPLOYEUR', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('Hereinafter called (the employer)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText('D\'une part', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Et', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('On the one hand and', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  // ============================================
  // INFORMATIONS EMPLOYÉ
  // ============================================
  y = checkPageBreak(80);
  y = addText(`${computeCivility(amendmentData)} ${amendmentData.employeeName || '.......................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('(Nom et Prénoms)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Full in full)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  const birthDate = amendmentData.employeeBirthDate ? 
    new Date(amendmentData.employeeBirthDate).toLocaleDateString('fr-FR') : 
    '...............................................................';
  y = addText(`Né le ${birthDate}`, margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Born on', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`À ${amendmentData.employeeBirthPlace || '.........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('At', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Lieu de résidence habituel ${amendmentData.employeeAddress || '............................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Usual place of residence', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Situation de famille ${amendmentData.employeeMaritalStatus || '........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Family status', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  // Ajouter les informations de contact d'urgence si disponibles
  if (amendmentData.employeeEmergencyContact) {
    y = addText(`Personne à prévenir : ${amendmentData.employeeEmergencyContact}`, margin, y, { 
      fontSize: 11, 
      lineHeight: 5 
    });
    y = addText('Emergency contact', margin, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
  }

  // Ajouter le poste actuel si disponible
  if (amendmentData.employeePosition) {
    y = addText(`Poste actuel : ${amendmentData.employeePosition}`, margin, y, { 
      fontSize: 11, 
      lineHeight: 5 
    });
    y = addText('Current position', margin, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
  }

  y = addText('CI APRES DENOMME L\'EMPLOYE', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('Hereinafter called "the employee"', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText('D\'AUTRE PART', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('On the other hand', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  // ============================================
  // ACCORD
  // ============================================
  y = checkPageBreak(15);
  y = addText('Il a été arrêté et convenu ce qui suit', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('It has been agreed the following', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 10
  });

  // ============================================
  // ARTICLE - CLASSIFICATION
  // ============================================
  y = checkPageBreak(50);
  y = addText(`ARTICLE ${amendmentData.articleNumber || '.............'} (nouveau)`, 
    margin, y, { fontSize: 11, style: 'bold', lineHeight: 7 });

  // Afficher l'ancienne classification si disponible
  if (amendmentData.employeeCategory && amendmentData.employeeEchelon) {
    y = addText(`1/ (ancien) Vous étiez précédemment classé à la Catégorie ${amendmentData.employeeCategory} Échelon ${amendmentData.employeeEchelon}`, 
      margin, y, { fontSize: 11, lineHeight: 5 });
    y = addText('You were previously placed in category', margin, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
  }

  const categoryLine = `${amendmentData.employeeCategory && amendmentData.employeeEchelon ? '2' : '1'}/ (nouveau) Vous êtes désormais classé à la Catégorie ${amendmentData.newCategory || '.......'} Échelon ${amendmentData.newEchelon || '........'}`;
  y = addText(categoryLine, margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('You are placed in category                                              Incremental position', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 5 });
  y = addText('de la classification du secteur secondaire.', margin, y, { 
    fontSize: 11, 
    lineHeight: 5
  });
  y = addText('Of the classification of the secondary sector', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 10
  });

  // ============================================
  // ARTICLE - RÉMUNÉRATION
  // ============================================
  y = checkPageBreak(100);
  y = addText(`ARTICLE ${amendmentData.remunerationArticleNumber || '...............'} (nouveau) RÉMUNÉRATION`, 
    margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('        REMUNERATION', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  // Afficher l'ancienne rémunération si disponible
  if (amendmentData.employeeTotalSalary || amendmentData.employeeBaseSalary) {
    const oldTotalSalary = amendmentData.employeeTotalSalary || amendmentData.employeeBaseSalary;
    const oldTotalSalaryFormatted = formatAmount(oldTotalSalary);
    y = addText(`1/ (ancien) L'employé(e) percevait précédemment une rémunération mensuelle brute totale de`, 
      margin, y, { fontSize: 11, lineHeight: 5 });
    y = addText(`XAF ${oldTotalSalaryFormatted}`, margin, y, { 
      fontSize: 11, 
      style: 'bold',
      lineHeight: 5 
    });
    y = addText('The employee previously received a total monthly gross remuneration of', 
      margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });
  }

  // Calculer le salaire total si pas fourni
  const calculatedTotalSalary = amendmentData.totalSalary || calculateTotalSalary(amendmentData);
  const totalSalaryFormatted = formatAmount(calculatedTotalSalary);
  
  const effectiveDate = amendmentData.effectiveDate ? 
    new Date(amendmentData.effectiveDate).toLocaleDateString('fr-FR') : 
    '............................';

  y = addText(`${amendmentData.employeeTotalSalary || amendmentData.employeeBaseSalary ? '2' : '1'}/ (nouveau) L'employé(e) percevra désormais une rémunération mensuelle brute totale de`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText(`XAF ${totalSalaryFormatted} (${totalSalaryFormatted} XAF), se décomposant comme suit; et ce avec effet au ${effectiveDate}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The employee\'s remuneration shall be broken down as follows', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 7 });

  // Afficher l'ancienne rémunération détaillée si disponible
  if (amendmentData.employeeBaseSalary || amendmentData.employeeOvertimeSalary || 
      amendmentData.employeeHousingAllowance || amendmentData.employeeTransportAllowance ||
      (amendmentData.employeePrimes && amendmentData.employeePrimes.length > 0) ||
      (amendmentData.employeeIndemnites && amendmentData.employeeIndemnites.length > 0)) {
    y = addText('Ancienne rémunération détaillée :', margin, y, { 
      fontSize: 11, 
      style: 'bold',
      lineHeight: 5
    });
    y = addText('Previous detailed remuneration:', margin, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
    
    if (amendmentData.employeeBaseSalary) {
      y = addSalaryLine('Salaire de base', amendmentData.employeeBaseSalary, 'Basic wage', y);
    }
    
    if (amendmentData.employeeOvertimeSalary) {
      y = addSalaryLine('Sursalaire', amendmentData.employeeOvertimeSalary, 'Overtime allowance', y);
    }
    
    if (amendmentData.employeeHousingAllowance) {
      y = addSalaryLine('Indemnité de logement', amendmentData.employeeHousingAllowance, 'Housing allowance', y);
    }
    
    if (amendmentData.employeeTransportAllowance) {
      y = addSalaryLine('Indemnité de transport', amendmentData.employeeTransportAllowance, 'Transport allowance', y);
    }

    // Anciennes primes personnalisées si disponibles
    if (amendmentData.employeePrimes && Array.isArray(amendmentData.employeePrimes) && amendmentData.employeePrimes.length > 0) {
      amendmentData.employeePrimes.forEach(prime => {
        const montant = Number(prime.montant || prime.amount) || 0;
        if (montant > 0) {
          const label = prime.label || prime.type || 'Prime';
          y = addSalaryLine(label, montant, 'Bonus', y);
        }
      });
    }

    // Anciennes indemnités personnalisées si disponibles
    if (amendmentData.employeeIndemnites && Array.isArray(amendmentData.employeeIndemnites) && amendmentData.employeeIndemnites.length > 0) {
      amendmentData.employeeIndemnites.forEach(ind => {
        const montant = Number(ind.montant || ind.amount) || 0;
        if (montant > 0) {
          const label = ind.label || ind.type || 'Indemnité';
          y = addSalaryLine(label, montant, 'Allowance', y);
        }
      });
    }
    
    y += 3;
  }

  // Nouvelle rémunération détaillée
  y = addText('Nouvelle rémunération détaillée :', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('New detailed remuneration:', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  // Éléments de rémunération avec alignement en colonnes
  y = addSalaryLine('Salaire de base', amendmentData.baseSalary, 'Basic wage', y);
  
  y = addSalaryLine('Sursalaire y compris forfait horaires supplémentaires', 
    amendmentData.overtimeSalary, 'Complementary wage including overtime-fixed allowances', y);
  
  y = addSalaryLine('Indemnité de logement', amendmentData.housingAllowance, 'Housing indemnity', y);
  
  y = addSalaryLine('Indemnités de transport', amendmentData.transportAllowance, 'Transport indemnity', y);

  // Primes personnalisées si disponibles
  if (amendmentData.primes && Array.isArray(amendmentData.primes) && amendmentData.primes.length > 0) {
    amendmentData.primes.forEach(prime => {
      const montant = Number(prime.montant || prime.amount) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || 'Prime';
        y = addSalaryLine(label, montant, 'Bonus', y);
      }
    });
  }

  // Indemnités personnalisées si disponibles
  if (amendmentData.indemnites && Array.isArray(amendmentData.indemnites) && amendmentData.indemnites.length > 0) {
    amendmentData.indemnites.forEach(ind => {
      const montant = Number(ind.montant || ind.amount) || 0;
      if (montant > 0) {
        const label = ind.label || ind.type || 'Indemnité';
        y = addSalaryLine(label, montant, 'Allowance', y);
      }
    });
  }

  y += 2;

  const weeklyHours = amendmentData.weeklyHours || '60';
  y = addText(`La détermination de cette rémunération prend en considération une durée hebdomadaire forfaitaire de travail de ${weeklyHours} heures par semaine.`, 
    margin, y, { fontSize: 11, lineHeight: 7 });

  // Ajouter le lieu de travail si disponible
  if (amendmentData.workplace) {
    y = addText(`Lieu de travail : ${amendmentData.workplace}`, margin, y, { 
      fontSize: 11, 
      lineHeight: 5 
    });
    y = addText('Workplace:', margin, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
  }

  y = addText('(Le reste sans changement)', margin, y, { 
    fontSize: 11, 
    lineHeight: 12
  });

  // ============================================
  // FAIT À ... LE ...
  // ============================================
  y = checkPageBreak(40);
  const signingDate = amendmentData.date ? 
    new Date(amendmentData.date).toLocaleDateString('fr-FR') : 
    '…………….';
  const placeOfSigning = amendmentData.city || '…………';
  
  y = addText(`FAIT À ${placeOfSigning} LE ${signingDate}`, 
    margin, y, { fontSize: 11, lineHeight: 12 });

  // ============================================
  // SIGNATURES
  // ============================================
  y = checkPageBreak(50);
  const midPage = pageWidth / 2;
  
  // Colonne gauche - L'EMPLOYÉ
  let yLeft = y;
  yLeft = addText('L\'EMPLOYE', margin, yLeft, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  yLeft = addText('THE EMPLOYEE', margin, yLeft, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 5
  });
  yLeft = addText('Lu et approuvé', margin, yLeft, { 
    fontSize: 10,
    lineHeight: 5
  });
  yLeft = addText('Read and approved', margin, yLeft, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 15
  });
  
  // Colonne droite - L'EMPLOYEUR
  let yRight = y;
  yRight = addText('L\'EMPLOYEUR', midPage + 10, yRight, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  yRight = addText('THE EMPLOYER', midPage + 10, yRight, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 5
  });
  yRight = addText('Lu et approuvé', midPage + 10, yRight, { 
    fontSize: 10,
    lineHeight: 5
  });
  yRight = addText('Read and approved', midPage + 10, yRight, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 15
  });

  // Sauvegarde
  // S'assurer d'au moins 4 pages en comblant avec des annexes (contenu structuré)
  try {
    const minPages = 4;
    let currentPages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : 1;
    while (currentPages < minPages) {
      doc.addPage();
      let yFill = margin;
      yFill = addText('ANNEXES', margin, yFill, { fontSize: 12, style: 'bold', lineHeight: 8 });
      yFill = addText('Informations complémentaires', margin, yFill, { fontSize: 10, style: 'italic', lineHeight: 8 });
      for (let i = 1; i <= 28; i++) {
        yFill = addText(`${i}. ........................................................................................................`, margin, yFill, { fontSize: 10, lineHeight: 6 });
        if (yFill > pageHeight - margin - 10) break;
      }
      currentPages++;
    }
  } catch (e) { /* ignore */ }

  const fileName = `Avenant_Contrat_${(amendmentData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateContractAmendmentPDFCameroon;