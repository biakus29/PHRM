// modeletemplate_optimized_enhanced.js
// Templates de bulletins de paie optimisés avec espaces logos et primes personnalisées

import autoTable from 'jspdf-autotable';
import { renderComptaOnlineTemplate } from './compta_online';
import { renderEnterpriseTemplate } from './enterprise';

// Registre central des templates de bulletins de paie
export const PAYSLIP_TEMPLATE_REGISTRY = {
  eneo: { label: 'ENEO (officiel)', renderer: renderEneoPayslip },
  classic: { label: 'Classique', renderer: renderClassicPayslip },
  bulletin_paie: { label: 'Bulletin de Paie', renderer: renderBulletinPaieTemplate },
  compta_online: { label: 'Compta Online', renderer: renderComptaOnlineTemplate },
  enterprise: { label: 'Enterprise', renderer: renderEnterpriseTemplate },
};

export function getPayslipRenderer(key = 'eneo') {
  const k = String(key || 'eneo').toLowerCase();
  return (PAYSLIP_TEMPLATE_REGISTRY[k]?.renderer) || PAYSLIP_TEMPLATE_REGISTRY['classic'].renderer;
}

export function getPayslipTemplates() {
  return Object.entries(PAYSLIP_TEMPLATE_REGISTRY).map(([value, meta]) => ({ value, label: meta.label }));
}

// Utilitaires partagés pour une meilleure consistance
const COLORS = {
  headerGray: [220, 220, 220],
  lightGray: [240, 240, 240],
  darkGray: [180, 180, 180],
  gains: [200, 255, 200],
  deductions: [255, 200, 200],
  black: [0, 0, 0],
  white: [255, 255, 255],
  yellow: [255, 255, 200],
  blue: [200, 220, 255],
  orange: [255, 220, 180]
};

const FONTS = {
  title: { family: 'helvetica', style: 'bold', size: 14 },
  subtitle: { family: 'helvetica', style: 'bold', size: 12 },
  header: { family: 'helvetica', style: 'bold', size: 10 },
  normal: { family: 'helvetica', style: 'normal', size: 9 },
  small: { family: 'helvetica', style: 'normal', size: 8 },
  tiny: { family: 'helvetica', style: 'normal', size: 7 }
};

function setFont(doc, fontConfig) {
  doc.setFont(fontConfig.family, fontConfig.style);
  doc.setFontSize(fontConfig.size);
}

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== '' && !['N/A', '—', 'undefined', 'null'].includes(String(v).trim());
}

// Fonction améliorée pour ajouter le logo avec espace réservé systématique
function addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, options = {}) {
  const {
    logoSize = 24,
    position = 'center', // 'center', 'left', 'right'
    reserveSpace = true,
    backgroundColor = null
  } = options;

  const reservedHeight = logoSize + 6; // Espace réservé même sans logo
  let logoAdded = false;

  try {
    const employerId = payslipData?.employer?.id;
    if (employerId) {
      // Tentative de récupération du logo depuis localStorage
      const logoData = localStorage.getItem(`logo_${employerId}`);
      if (logoData) {
        const extension = logoData.includes('image/png') ? 'PNG' :
                         logoData.includes('image/jpeg') ? 'JPEG' :
                         logoData.includes('image/jpg') ? 'JPEG' : null;
        
        if (extension) {
          let logoX;
          switch (position) {
            case 'left':
              logoX = margin;
              break;
            case 'right':
              logoX = pageWidth - margin - logoSize;
              break;
            case 'center':
            default:
              logoX = (pageWidth - logoSize) / 2;
          }

          // Fond pour le logo si spécifié
          if (backgroundColor) {
            doc.setFillColor(...backgroundColor);
            doc.rect(logoX - 2, currentY - 2, logoSize + 4, logoSize + 4, 'F');
          }

          doc.addImage(logoData, extension, logoX, currentY, logoSize, logoSize);
          logoAdded = true;
        }
      }
    }
  } catch (error) {
    console.warn('Erreur lors du chargement du logo:', error);
  }

  // Si aucun logo n'est ajouté mais qu'on réserve l'espace
  if (!logoAdded && reserveSpace) {
    // Dessiner un cadre en pointillés pour indiquer l'espace logo
    doc.setLineDashPattern([2, 2], 0);
    doc.setLineWidth(0.3);
    doc.setDrawColor(180, 180, 180);
    
    let logoX;
    switch (position) {
      case 'left':
        logoX = margin;
        break;
      case 'right':
        logoX = pageWidth - margin - logoSize;
        break;
      case 'center':
      default:
        logoX = (pageWidth - logoSize) / 2;
    }
    
    doc.rect(logoX, currentY, logoSize, logoSize);
    
    // Texte indicatif
    setFont(doc, { family: 'helvetica', style: 'normal', size: 6 });
    doc.setTextColor(150, 150, 150);
    doc.text('LOGO', logoX + logoSize/2 - 6, currentY + logoSize/2 + 1);
    
    // Restaurer le style normal
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(...COLORS.black);
    doc.setTextColor(...COLORS.black);
  }

  return currentY + reservedHeight;
}

// Fonction pour récupérer les primes personnalisées par employeur
function getEmployerCustomItems(payslipData, type = 'primes') {
  const customItems = [];
  const employerId = payslipData?.employer?.id;
  
  if (employerId) {
    try {
      // Récupération depuis localStorage des configurations employeur
      const employerConfig = JSON.parse(localStorage.getItem(`employer_config_${employerId}`) || '{}');
      const employerItems = employerConfig[type] || [];
      
      // Fusion avec les items du bulletin
      const payslipItems = Array.isArray(payslipData[type]) ? payslipData[type] : [];
      
      // Créer une map pour éviter les doublons
      const itemsMap = new Map();
      
      // Ajouter les items employeur (configuration par défaut)
      employerItems.forEach(item => {
        if (item.id) {
          itemsMap.set(item.id, {
            ...item,
            isDefault: true,
            montant: 0 // Montant par défaut
          });
        }
      });
      
      // Ajouter/Mettre à jour avec les items du bulletin
      payslipItems.forEach(item => {
        const itemId = item.id || item.label || item.type;
        if (itemId) {
          itemsMap.set(itemId, {
            ...itemsMap.get(itemId),
            ...item,
            isDefault: false
          });
        }
      });
      
      customItems.push(...Array.from(itemsMap.values()));
    } catch (error) {
      console.warn(`Erreur lors de la récupération des ${type} personnalisées:`, error);
      // Fallback sur les items du bulletin uniquement
      const payslipItems = Array.isArray(payslipData[type]) ? payslipData[type] : [];
      customItems.push(...payslipItems);
    }
  } else {
    // Pas d'employeur spécifique, utiliser les items du bulletin
    const payslipItems = Array.isArray(payslipData[type]) ? payslipData[type] : [];
    customItems.push(...payslipItems);
  }
  
  return customItems.filter(item => {
    const montant = Number(item.montant) || 0;
    return montant > 0 || item.isDefault; // Inclure les items par défaut même à 0
  });
}

// Template Classic optimisé avec logo et primes personnalisées
export function renderClassicPayslip(doc, ctx) {
  const {
    pageWidth,
    pageHeight,
    margin,
    payslipData,
    employerName,
    employerAddress,
    employerCNPS,
    employerPhone,
    emp,
    empName,
    empMatricule,
    empPoste,
    empCategory,
    empCNPS,
    baseSalary,
    transportAllowance,
    housingAllowance,
    overtime,
    bonus,
    representationAllowance,
    dirtAllowance,
    mealAllowance,
    d,
    totalGross,
    totalDeductions,
    netSalary,
    sbt,
    sbc,
    formatCFA,
  } = ctx;

  let currentY = ctx.currentY || margin;

  // Espace logo systématique en haut avec cadre décoratif
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 32,
    position: 'center',
    reserveSpace: true,
    backgroundColor: COLORS.lightGray
  });

  currentY += 8;

  // Titre principal centré avec meilleur espacement
  setFont(doc, FONTS.title);
  doc.setTextColor(...COLORS.black);
  const titleText = 'BULLETIN DE SALAIRE';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, currentY);
  currentY += 15;

  // Période avec style amélioré
  setFont(doc, FONTS.normal);
  const periodText = `Période : ${payslipData.payPeriod || '—'}`;
  const periodWidth = doc.getTextWidth(periodText);
  doc.text(periodText, (pageWidth - periodWidth) / 2, currentY);
  currentY += 15;

  // Table employeur/salarié optimisée
  const infoRows = [];
  const addInfoRow = (employerData, employeeData) => {
    if (hasValue(employerData) || hasValue(employeeData)) {
      infoRows.push([employerData || '', employeeData || '']);
    }
  };

  addInfoRow(hasValue(employerName) ? `Dénomination : ${employerName}` : '', 
             hasValue(empName) ? `Nom et Prénoms : ${empName}` : '');
  addInfoRow(hasValue(employerAddress) ? `Adresse : ${employerAddress}` : '',
             hasValue(empMatricule) ? `Matricule : ${empMatricule}` : '');
  addInfoRow(hasValue(employerCNPS) ? `N° CNPS : ${employerCNPS}` : '',
             hasValue(empPoste) ? `Fonction : ${empPoste}` : '');
  addInfoRow(hasValue(employerPhone) ? `Téléphone : ${employerPhone}` : '',
             hasValue(empCategory) ? `Catégorie : ${empCategory}` : '');
  if (hasValue(empCNPS)) addInfoRow('', `N° CNPS : ${empCNPS}`);

  if (infoRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['EMPLOYEUR', 'SALARIÉ']],
      body: infoRows,
      theme: 'grid',
      styles: { 
        font: 'helvetica', 
        fontSize: 9, 
        cellPadding: 3, 
        lineColor: COLORS.black, 
        lineWidth: 0.3,
        textColor: COLORS.black
      },
      headStyles: { 
        fillColor: COLORS.headerGray, 
        textColor: COLORS.black, 
        fontSize: 10, 
        fontStyle: 'bold', 
        halign: 'center',
        cellPadding: 4
      },
      columnStyles: { 
        0: { cellWidth: (pageWidth - 2 * margin) / 2, halign: 'left' }, 
        1: { cellWidth: (pageWidth - 2 * margin) / 2, halign: 'left' } 
      },
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 12;
  }

  // Section Gains avec header stylé
  doc.setFillColor(...COLORS.headerGray);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'S');
  
  setFont(doc, FONTS.header);
  doc.setTextColor(...COLORS.black);
  doc.text('GAINS ET AVANTAGES', margin + 4, currentY + 5.5);
  currentY += 12;

  // Table des gains optimisée avec primes personnalisées
  const gainsRows = [];
  const addGainRow = (label, amount, category = 'standard') => {
    if (amount > 0) {
      const bgColor = category === 'custom' ? COLORS.blue : COLORS.gains;
      gainsRows.push([label, formatCFA(amount), 'F CFA', category]);
    }
  };

  // Gains standards
  addGainRow('Salaire de base', baseSalary);
  addGainRow('Indemnité de logement', housingAllowance);
  addGainRow('Indemnité de transport', transportAllowance);
  addGainRow('Indemnité de représentation', representationAllowance);
  addGainRow('Prime de salissures', dirtAllowance);
  addGainRow('Prime de panier', mealAllowance);
  addGainRow('Heures supplémentaires', overtime);
  addGainRow('Prime/Bonus', bonus);

  // Primes personnalisées par employeur
  const customPrimes = getEmployerCustomItems(payslipData, 'primes');
  if (customPrimes.length > 0) {
    gainsRows.push(['--- PRIMES SPÉCIFIQUES ---', '', '', 'separator']);
    customPrimes.forEach(prime => {
      const montant = Number(prime.montant) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || prime.name || 'Prime personnalisée';
        addGainRow(label, montant, 'custom');
      }
    });
  }

  // Indemnités personnalisées par employeur
  const customIndemnites = getEmployerCustomItems(payslipData, 'indemnites');
  if (customIndemnites.length > 0) {
    gainsRows.push(['--- INDEMNITÉS SPÉCIFIQUES ---', '', '', 'separator']);
    customIndemnites.forEach(indemnite => {
      const montant = Number(indemnite.montant) || 0;
      if (montant > 0) {
        const label = indemnite.label || indemnite.type || indemnite.name || 'Indemnité personnalisée';
        addGainRow(label, montant, 'custom');
      }
    });
  }

  if (gainsRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['DÉSIGNATION', 'MONTANT', 'DEVISE', 'TYPE']],
      body: gainsRows,
      theme: 'grid',
      styles: { 
        font: 'helvetica', 
        fontSize: 9, 
        cellPadding: 2.5, 
        lineColor: COLORS.black, 
        lineWidth: 0.2,
        textColor: COLORS.black
      },
      headStyles: { 
        fillColor: COLORS.darkGray, 
        textColor: COLORS.white, 
        fontSize: 9, 
        fontStyle: 'bold', 
        halign: 'center' 
      },
      columnStyles: { 
        0: { cellWidth: 90, halign: 'left' }, 
        1: { cellWidth: 35, halign: 'right' }, 
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: margin, right: margin },
      didParseCell: function(data) {
        // Coloration des lignes de séparation (utiliser la colonne TYPE)
        if (data.row && data.row.raw && data.row.raw[3] === 'separator') {
          data.cell.styles.fillColor = COLORS.orange;
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row && data.row.raw && data.row.raw[3] === 'custom') {
          // Primes personnalisées en bleu
          if (data.column.index === 1) data.cell.styles.fillColor = COLORS.blue;
        } else if (data.row && data.row.raw && data.row.raw[3] === 'standard') {
          // Gains standards en vert
          if (data.column.index === 1) data.cell.styles.fillColor = COLORS.gains;
        }
        // Cacher la colonne TYPE
        if (data.column.index === 3) {
          data.cell.text = [''];
          data.cell.styles.fillColor = COLORS.white;
        }
      }
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Totaux avec mise en forme améliorée
  const drawTotalRow = (label, amount, fillColor, textColor = COLORS.black) => {
    doc.setFillColor(...fillColor);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
    doc.setLineWidth(0.3);
    doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'S');
    
    setFont(doc, FONTS.header);
    doc.setTextColor(...textColor);
    doc.text(label, margin + 4, currentY + 4);
    doc.text(`${formatCFA(amount)} F CFA`, pageWidth - margin - 50, currentY + 4);
    currentY += 8;
  };

  drawTotalRow('TOTAL BRUT', totalGross, COLORS.gains);
  drawTotalRow('SBT (Salaire Brut Taxable)', sbt, COLORS.lightGray);
  drawTotalRow('SBC (Salaire Brut Cotisable)', sbc, COLORS.lightGray);
  currentY += 4;

  // Section Déductions
  doc.setFillColor(...COLORS.headerGray);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'F');
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 8, 'S');
  
  setFont(doc, FONTS.header);
  doc.setTextColor(...COLORS.black);
  doc.text('RETENUES ET DÉDUCTIONS', margin + 4, currentY + 5.5);
  currentY += 12;

  // Table des déductions optimisée
  const deductionsRows = [];
  const addDeductionRow = (label, base, amount) => {
    if ((Number(amount) || 0) > 0) {
      deductionsRows.push([label, base, formatCFA(amount), 'F CFA']);
    }
  };

  addDeductionRow('PVID (CNPS) – salarié', `${formatCFA(baseSalary)} × 4,2%`, d?.pvid);
  addDeductionRow('IRPP', `Base: ${formatCFA(sbt)}`, d?.irpp);
  addDeductionRow('CAC', '', d?.cac);
  addDeductionRow('CFC (1% du brut)', `${formatCFA(totalGross)} × 1%`, d?.cfc);
  addDeductionRow('RAV', '', d?.rav);
  addDeductionRow('TDL (10% de l\'IRPP)', `${formatCFA(d?.irpp || 0)} × 10%`, d?.tdl);
  addDeductionRow('FNE', '', d?.fne);

  if (deductionsRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['DÉSIGNATION', 'BASE DE CALCUL', 'MONTANT', 'DEVISE']],
      body: deductionsRows,
      theme: 'grid',
      styles: { 
        font: 'helvetica', 
        fontSize: 9, 
        cellPadding: 2.5, 
        lineColor: COLORS.black, 
        lineWidth: 0.2,
        textColor: COLORS.black
      },
      headStyles: { 
        fillColor: COLORS.darkGray, 
        textColor: COLORS.white, 
        fontSize: 9, 
        fontStyle: 'bold', 
        halign: 'center' 
      },
      columnStyles: { 
        0: { cellWidth: 70, halign: 'left' }, 
        1: { cellWidth: 45, halign: 'center' }, 
        2: { cellWidth: 30, halign: 'right', fillColor: COLORS.deductions }, 
        3: { cellWidth: 25, halign: 'center' } 
      },
      margin: { left: margin, right: margin }
    });
    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Total retenues
  drawTotalRow('TOTAL RETENUES', totalDeductions, COLORS.deductions);
  currentY += 4;

  // Net à payer - Design premium
  doc.setFillColor(...COLORS.black);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 12, 'F');
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 12, 'S');
  
  setFont(doc, { family: 'helvetica', style: 'bold', size: 14 });
  doc.setTextColor(...COLORS.white);
  const netText = `NET À PAYER : ${formatCFA(netSalary)} F CFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 8);

  // Sauvegarde
  const fileName = `Bulletin_Salaire_${(empName || 'Employe').replace(/[^a-zA-Z0-9]/g, "_")}_${String(payslipData.payPeriod || 'N_A').replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  return { completed: true };
}

// Template Bulletin de Paie optimisé avec logo et primes personnalisées
export function renderBulletinPaieTemplate(doc, ctx) {
  const {
    pageWidth,
    pageHeight,
    margin,
    payslipData,
    employerName,
    employerAddress,
    employerCNPS,
    employerPhone,
    emp,
    empName,
    empMatricule,
    empPoste,
    empCategory,
    empCNPS,
    baseSalary,
    totalGross,
    totalDeductions,
    netSalary,
    d,
    formatCFA,
  } = ctx;

  let currentY = margin;
  
  // Espace logo à gauche avec informations entreprise
  const logoY = currentY;
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 28,
    position: 'left',
    reserveSpace: true
  });

  // Header avec numérotation améliorée (à côté du logo)
  setFont(doc, { family: 'helvetica', style: 'bold', size: 16 });
  doc.setTextColor(...COLORS.black);
  doc.text('BULLETIN DE PAIE', margin + 35, logoY + 15);
  
  // Numéro de bulletin dynamique
  const bulletinNum = payslipData?.bulletinNum || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  setFont(doc, FONTS.normal);
  doc.text(`N° ${bulletinNum}`, pageWidth - margin - 40, logoY + 8);
  doc.text(`Période: ${payslipData.payPeriod || '—'}`, pageWidth - margin - 40, logoY + 15);

  currentY += 8;

  // Boîte entreprise avec design amélioré
  doc.setFillColor(...COLORS.yellow);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, 105, 28, 'FD');
  
  setFont(doc, FONTS.header);
  doc.setTextColor(...COLORS.black);
  if (hasValue(employerName)) doc.text(employerName, margin + 3, currentY + 6);
  
  setFont(doc, FONTS.small);
  if (hasValue(employerAddress)) doc.text(employerAddress, margin + 3, currentY + 11);
  if (hasValue(payslipData.employer?.city)) doc.text(payslipData.employer.city, margin + 3, currentY + 16);
  if (hasValue(employerCNPS)) doc.text(`SIRET: ${employerCNPS}`, margin + 3, currentY + 21);
  if (hasValue(employerPhone)) doc.text(`Tél: ${employerPhone}`, margin + 3, currentY + 26);

  // Informations employé - Boîte alignée avec logo à droite
  const empBoxX = pageWidth - margin - 75;
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 20,
    position: 'right',
    reserveSpace: false
  }) - 28; // Retour pour alignment avec la boîte

  doc.setLineWidth(0.3);
  doc.rect(empBoxX, currentY, 75, 28, 'S');
  
  setFont(doc, FONTS.header);
  if (hasValue(empName)) doc.text(empName, empBoxX + 3, currentY + 6);
  
  setFont(doc, FONTS.small);
  const empAddress = emp.address || emp.adresse;
  if (hasValue(empAddress)) doc.text(empAddress, empBoxX + 3, currentY + 11);
  if (hasValue(emp.city)) doc.text(emp.city, empBoxX + 3, currentY + 16);
  if (hasValue(empMatricule)) doc.text(`Mat: ${empMatricule}`, empBoxX + 3, currentY + 21);
  if (hasValue(empCNPS)) doc.text(`N° SS: ${empCNPS}`, empBoxX + 3, currentY + 26);

  currentY += 35;

  // Détails emploi en colonnes organisées
  setFont(doc, FONTS.small);
  const leftCol = margin;
  const rightCol = pageWidth - margin - 85;
  
  if (hasValue(employerName)) doc.text(`Établissement: ${employerName}`, leftCol, currentY);
  if (hasValue(empMatricule)) doc.text(`Matricule: ${empMatricule}`, rightCol, currentY);
  currentY += 5;
  
  if (hasValue(payslipData.payPeriod)) doc.text(`Période: ${payslipData.payPeriod}`, leftCol, currentY);
  if (hasValue(empPoste)) doc.text(`Emploi: ${empPoste}`, rightCol, currentY);
  currentY += 5;
  
  if (hasValue(payslipData.generatedAt)) {
    const payDate = new Date(payslipData.generatedAt).toLocaleDateString('fr-FR');
    doc.text(`Payé le: ${payDate}`, leftCol, currentY);
  }
  if (hasValue(empCategory)) doc.text(`Catégorie: ${empCategory}`, rightCol, currentY);
  currentY += 10;

  // Table principale optimisée avec primes personnalisées
  const tableData = [];
  
  // Section gains avec séparateurs visuels
  tableData.push(['═══ GAINS ═══', '', '', '', '', '']);
  
  if (baseSalary > 0) tableData.push(['Salaire de base', '', '', formatCFA(baseSalary), '', 'Mensuel']);
  
  // Primes personnalisées par employeur avec regroupement
  const customPrimes = getEmployerCustomItems(payslipData, 'primes');
  if (customPrimes.length > 0) {
    tableData.push(['─── Primes Spécifiques ───', '', '', '', '', '']);
    customPrimes.forEach(prime => {
      const montant = Number(prime.montant) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || prime.name || 'Prime';
        const description = prime.description ? ` (${prime.description})` : '';
        tableData.push([`${label}${description}`, '', '', formatCFA(montant), '', prime.frequency || 'Variable']);
      }
    });
  }
  
  // Indemnités personnalisées par employeur avec regroupement
  const customIndemnites = getEmployerCustomItems(payslipData, 'indemnites');
  if (customIndemnites.length > 0) {
    tableData.push(['─── Indemnités Spécifiques ───', '', '', '', '', '']);
    customIndemnites.forEach(indemnite => {
      const montant = Number(indemnite.montant) || 0;
      if (montant > 0) {
        const label = indemnite.label || indemnite.type || indemnite.name || 'Indemnité';
        const description = indemnite.description ? ` (${indemnite.description})` : '';
        tableData.push([`${label}${description}`, '', '', formatCFA(montant), '', indemnite.frequency || 'Fixe']);
      }
    });
  }
  
  // Total gains
  tableData.push(['', '', '', '───────────', '', '']);
  tableData.push(['TOTAL GAINS', '', '', formatCFA(totalGross), '', 'F CFA']);
  tableData.push(['', '', '', '', '', '']);

  // Section retenues
  const hasDeductions = d?.pvid > 0 || d?.irpp > 0 || d?.cac > 0 || d?.cfc > 0 || d?.rav > 0 || d?.tdl > 0 || d?.fne > 0;
  if (hasDeductions) {
    tableData.push(['═══ RETENUES ═══', '', '', '', '', '']);
    
    if (d?.pvid > 0) tableData.push(['PVID (CNPS)', formatCFA(baseSalary), '4,2%', formatCFA(d.pvid), '', 'Salarié']);
    if (d?.irpp > 0) tableData.push(['IRPP', '', 'Variable', formatCFA(d.irpp), '', 'Progressif']);
    if (d?.cac > 0) tableData.push(['CAC', '', '', formatCFA(d.cac), '', 'Fixe']);
    if (d?.cfc > 0) tableData.push(['CFC', formatCFA(totalGross), '1%', formatCFA(d.cfc), '', 'Proportionnel']);
    if (d?.rav > 0) tableData.push(['RAV', '', '', formatCFA(d.rav), '', 'Variable']);
    if (d?.tdl > 0) tableData.push(['TDL', formatCFA(d.irpp), '10%', formatCFA(d.tdl), '', 'IRPP']);
    if (d?.fne > 0) tableData.push(['FNE', '', '', formatCFA(d.fne), '', 'Formation']);
    
    tableData.push(['', '', '', '───────────', '', '']);
    tableData.push(['TOTAL RETENUES', '', '', formatCFA(totalDeductions), '', 'F CFA']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Désignation', 'Base', 'Taux', 'Montant', 'Cumul', 'Nature']],
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 8, 
      cellPadding: 2, 
      lineColor: COLORS.black, 
      lineWidth: 0.2,
      textColor: COLORS.black
    },
    headStyles: { 
      fillColor: COLORS.darkGray, 
      textColor: COLORS.white, 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      // Coloration des lignes de séparation
      if (data.cell.text[0]?.includes('═══')) {
        data.cell.styles.fillColor = COLORS.headerGray;
        data.cell.styles.fontStyle = 'bold';
      } else if (data.cell.text[0]?.includes('───')) {
        if (data.cell.text[0].includes('Spécifiques')) {
          data.cell.styles.fillColor = COLORS.blue;
        } else {
          data.cell.styles.fillColor = COLORS.lightGray;
        }
      }
      // Coloration des montants
      if (data.column.index === 3 && data.cell.text[0]?.includes('F CFA')) {
        data.cell.styles.fillColor = data.row.index < tableData.length / 2 ? COLORS.gains : COLORS.deductions;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // Net à payer premium
  doc.setFillColor(...COLORS.black);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 12, 'F');
  doc.setLineWidth(0.8);
  doc.rect(margin - 1, currentY - 1, pageWidth - 2 * margin + 2, 14, 'S');
  
  setFont(doc, { family: 'helvetica', style: 'bold', size: 14 });
  doc.setTextColor(...COLORS.white);
  const netText = `NET À PAYER: ${formatCFA(netSalary)} F CFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 8);

  const fileName = `Bulletin_Paie_${(empName || 'Employe').replace(/[^a-zA-Z0-9]/g, "_")}_${(payslipData.payPeriod || 'N_A').replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  return { completed: true };
}

// Template ENEO optimisé avec logo et primes personnalisées (le plus professionnel)
export function renderEneoPayslip(doc, ctx) {
  const {
    pageWidth,
    pageHeight,
    margin,
    payslipData,
    employerName,
    employerAddress,
    employerCNPS,
    employerPhone,
    emp,
    empName,
    empMatricule,
    empPoste,
    empCategory,
    empCNPS,
    baseSalary,
    transportAllowance,
    housingAllowance,
    overtime,
    bonus,
    representationAllowance,
    dirtAllowance,
    mealAllowance,
    d,
    totalGross,
    totalDeductions,
    netSalary,
    sbt,
    sbc,
    formatCFA,
  } = ctx;

  let currentY = ctx.currentY || margin;

  // Logo ENEO avec espace réservé et style professionnel
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 35,
    position: 'center',
    reserveSpace: true,
    backgroundColor: COLORS.white
  });

  currentY += 5;

  // Calcul des dates de période
  let periodStart = '', periodEnd = '';
  try {
    const p = String(payslipData.payPeriod || '').trim();
    if (/^\d{4}-\d{2}$/.test(p)) {
      const [year, month] = p.split('-').map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      periodStart = start.toLocaleDateString('fr-FR');
      periodEnd = end.toLocaleDateString('fr-FR');
    }
  } catch {}

  // Données avec valeurs par défaut améliorées
  const bulletinNum = payslipData?.bulletinNum || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const feuillet = payslipData?.feuillet || '1 / 1';
  const bp = payslipData.employer?.bp || 'B.P. Non renseigné';
  const location = payslipData.employer?.location || 'Yaoundé, Cameroun';
  const etablis = payslipData.employer?.etablis || 'Établissement principal';
  const niu = emp.niu || 'NIU non renseigné';
  const anciennete = emp.anciennete || emp.ancienneté || 'Non renseignée';
  const category = emp.category || emp.professionalCategory || empCategory || 'Non classé';
  const classification = emp.classification || 'Non classé';
  const horaireRef = emp.horaireRef || '173,33 h';
  const dateDebut = payslipData.employer?.dateDebut || new Date().toLocaleDateString('fr-FR');

  // Cadre principal avec bordure renforcée
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 130);
  
  // Ligne de séparation interne
  doc.setLineWidth(0.3);
  doc.rect(margin + 1, currentY + 1, pageWidth - 2 * margin - 2, 128, 'S');

  const headerY = currentY + 3;

  // En-tête avec informations de paie - Layout amélioré
  setFont(doc, FONTS.small);
  doc.setTextColor(...COLORS.black);
  
  const leftHeaderX = margin + 3;
  const rightHeaderX = margin + 90;
  
  if (hasValue(periodStart)) doc.text(`Date début de paie: ${periodStart}`, leftHeaderX, headerY + 5);
  if (hasValue(periodEnd)) doc.text(`Date fin de paie: ${periodEnd}`, rightHeaderX, headerY + 5);
  if (hasValue(bulletinNum)) doc.text(`N° de bulletin: ${bulletinNum}`, leftHeaderX, headerY + 10);
  if (hasValue(feuillet)) doc.text(`Feuillet: ${feuillet}`, rightHeaderX, headerY + 10);

  // Ligne de séparation
  doc.setLineWidth(0.4);
  doc.line(margin + 2, headerY + 13, pageWidth - margin - 2, headerY + 13);

  // Section entreprise avec mise en forme améliorée
  const companyY = headerY + 16;
  setFont(doc, FONTS.normal);
  
  if (hasValue(employerName)) {
    setFont(doc, FONTS.header);
    doc.text(`Société: ${employerName}`, leftHeaderX, companyY);
    setFont(doc, FONTS.small);
  }
  
  if (hasValue(employerAddress)) doc.text(employerAddress, leftHeaderX + 5, companyY + 5);
  if (hasValue(bp)) doc.text(bp, leftHeaderX + 5, companyY + 9);
  if (hasValue(location)) doc.text(location, leftHeaderX + 5, companyY + 13);
  if (hasValue(etablis)) doc.text(`Établis: ${etablis}`, leftHeaderX, companyY + 17);

  // Section employé avec boîte mise en valeur
  const empBoxX = pageWidth - margin - 85;
  const empBoxWidth = 80;
  
  // Bordure pour les infos employé
  doc.setLineWidth(0.3);
  doc.rect(empBoxX, companyY - 2, empBoxWidth, 22, 'S');
  
  if (hasValue(empMatricule)) doc.text(`Matricule: ${empMatricule}`, empBoxX + 2, companyY + 2);
  
  // Nom employé avec fond gris
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(empBoxX + 1, companyY + 4, empBoxWidth - 2, 8, 'F');
  setFont(doc, FONTS.header);
  if (hasValue(empName)) doc.text(empName, empBoxX + 3, companyY + 9);
  
  setFont(doc, FONTS.small);
  const empAddress = emp.address || emp.adresse;
  if (hasValue(empAddress)) doc.text(empAddress, empBoxX + 2, companyY + 14);
  if (hasValue(emp.city)) doc.text(emp.city, empBoxX + 2, companyY + 18);

  // Ligne de séparation
  doc.setLineWidth(0.4);
  doc.line(margin + 2, companyY + 22, pageWidth - margin - 2, companyY + 22);

  // Détails employé organisés en colonnes
  const detailY = companyY + 26;
  setFont(doc, FONTS.tiny);
  
  const col1X = leftHeaderX;
  const col2X = leftHeaderX + 65;
  const col3X = leftHeaderX + 130;
  
  if (hasValue(niu)) doc.text(`NIU: ${niu}`, col1X, detailY);
  if (hasValue(horaireRef)) doc.text(`Horaire Réf: ${horaireRef}`, col2X, detailY);
  if (hasValue(empCNPS)) doc.text(`N° CNPS: ${empCNPS}`, col3X, detailY);
  
  // Convention collective
  if (hasValue(employerName)) {
    doc.text(`Convention Collective ${employerName} du 27 octobre 2022`, col1X, detailY + 4);
  }
  
  if (hasValue(employerCNPS) || hasValue(dateDebut)) {
    doc.text(`N° Employeur: ${employerCNPS || 'N/A'} • Date début: ${dateDebut}`, col1X, detailY + 8);
  }
  
  if (hasValue(anciennete) || hasValue(category)) {
    doc.text(`Ancienneté: ${anciennete} • Catégorie: ${category}`, col1X, detailY + 12);
  }
  
  const dept = emp.department || emp.departement;
  if (hasValue(dept) || hasValue(classification)) {
    doc.text(`Département: ${dept || 'N/A'} • Classification: ${classification}`, col1X, detailY + 16);
  }
  
  if (hasValue(empPoste)) {
    setFont(doc, FONTS.small);
    doc.text(`Poste occupé: ${empPoste}`, col1X, detailY + 20);
  }

  // Ligne de séparation finale
  doc.setLineWidth(0.4);
  doc.line(margin + 2, detailY + 23, pageWidth - margin - 2, detailY + 23);

  currentY = detailY + 27;

  // Table principale ENEO optimisée avec primes personnalisées
  const tableData = [];
  const workedDays = Number(payslipData.remuneration?.workedDays) || 30;
  const monthlyHours = 173.33; // Heures mensuelles standard
  const workedHours = (workedDays * monthlyHours) / 30;

  // Headers avec sous-headers pour clarté
  const headers = [
    ['Désignation', 'Qté', 'Base', 'Taux Sal.', 'Gains', 'Retenues', 'Taux Patr.', 'Charges']
  ];

  // Ajout des gains standards
  const addGainRow = (designation, quantity, base, taux, montant) => {
    if (montant > 0) {
      tableData.push([
        designation,
        quantity || '',
        base || '',
        taux || '',
        formatCFA(montant),
        '',
        '',
        ''
      ]);
    }
  };

  addGainRow('Salaire de base', workedHours.toFixed(1) + 'h', formatCFA(baseSalary), '', baseSalary);
  addGainRow('Indemnité de Logement', workedHours.toFixed(1) + 'h', formatCFA(housingAllowance), '', housingAllowance);
  addGainRow('Prime de Transport', workedHours.toFixed(1) + 'h', formatCFA(transportAllowance), '', transportAllowance);
  addGainRow('Indemnité de représentation', workedHours.toFixed(1) + 'h', formatCFA(representationAllowance), '', representationAllowance);
  addGainRow('Prime de salissures', workedHours.toFixed(1) + 'h', formatCFA(dirtAllowance), '', dirtAllowance);
  addGainRow('Prime de panier', workedHours.toFixed(1) + 'h', formatCFA(mealAllowance), '', mealAllowance);
  addGainRow('Heures supplémentaires', '', formatCFA(overtime), '', overtime);
  addGainRow('Prime/Bonus', '', formatCFA(bonus), '', bonus);

  // Primes personnalisées par employeur avec style ENEO
  const customPrimes = getEmployerCustomItems(payslipData, 'primes');
  if (customPrimes.length > 0) {
    // Séparateur pour primes spécifiques
    tableData.push(['═══ PRIMES SPÉCIFIQUES EMPLOYEUR ═══', '', '', '', '', '', '', '']);
    
    customPrimes.forEach(prime => {
      const montant = Number(prime.montant) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || prime.name || 'Prime spéc.';
        const baseCalc = prime.baseCalcul || prime.base || '';
        const taux = prime.taux || prime.rate || '';
        const quantity = prime.quantity || prime.quantite || '';
        
        addGainRow(
          label, 
          quantity, 
          baseCalc ? formatCFA(baseCalc) : '', 
          taux ? `${taux}%` : '', 
          montant
        );
      }
    });
  }

  // Indemnités personnalisées par employeur
  const customIndemnites = getEmployerCustomItems(payslipData, 'indemnites');
  if (customIndemnites.length > 0) {
    // Séparateur pour indemnités spécifiques
    tableData.push(['═══ INDEMNITÉS SPÉCIFIQUES EMPLOYEUR ═══', '', '', '', '', '', '', '']);
    
    customIndemnites.forEach(indemnite => {
      const montant = Number(indemnite.montant) || 0;
      if (montant > 0) {
        const label = indemnite.label || indemnite.type || indemnite.name || 'Indemnité spéc.';
        const baseCalc = indemnite.baseCalcul || indemnite.base || '';
        const taux = indemnite.taux || indemnite.rate || '';
        const quantity = indemnite.quantity || indemnite.quantite || '';
        
        addGainRow(
          label, 
          quantity, 
          baseCalc ? formatCFA(baseCalc) : '', 
          taux ? `${taux}%` : '', 
          montant
        );
      }
    });
  }

  // Ligne de total gains
  if (totalGross > 0) {
    tableData.push(['', '', '', 'TOTAL GAINS →', formatCFA(totalGross), '', '', '']);
    tableData.push(['', '', '', '', '', '', '', '']); // Séparateur
  }

  // Ajout des déductions avec calculs détaillés
  const addDeductionRow = (designation, base, taux, montant, tauxPatronal, chargePatronale) => {
    if ((Number(montant) || 0) > 0) {
      tableData.push([
        designation,
        '',
        base || '',
        taux || '',
        '',
        formatCFA(montant),
        tauxPatronal || '',
        chargePatronale ? formatCFA(chargePatronale) : ''
      ]);
    }
  };

  const n = (v) => Number(v) || 0;
  addDeductionRow('PVID (CNPS)', formatCFA(baseSalary), '4,2%', d?.pvid, '7,5%', Math.round((baseSalary * 0.075) || 0));
  addDeductionRow('IRPP', formatCFA(sbt), 'Progressif', d?.irpp);
  addDeductionRow('CAC', '', 'Variable', d?.cac);
  addDeductionRow('CFC (Formation)', formatCFA(totalGross), '1%', d?.cfc, '1,2%', Math.round((totalGross * 0.012) || 0));
  addDeductionRow('RAV (Retraite)', '', 'Variable', d?.rav);
  addDeductionRow('TDL (10% IRPP)', formatCFA(d?.irpp), '10%', d?.tdl);
  addDeductionRow('FNE (Formation)', '', 'Variable', d?.fne, '0,5%', Math.round((totalGross * 0.005) || 0));

  // Déductions personnalisées par employeur
  const customDeductions = getEmployerCustomItems(payslipData, 'deductions');
  if (customDeductions.length > 0) {
    tableData.push(['═══ RETENUES SPÉCIFIQUES EMPLOYEUR ═══', '', '', '', '', '', '', '']);
    
    customDeductions.forEach(deduction => {
      const montant = Number(deduction.montant) || 0;
      if (montant > 0) {
        const label = deduction.label || deduction.type || deduction.name || 'Retenue spéc.';
        const baseCalc = deduction.baseCalcul || deduction.base || '';
        const taux = deduction.taux || deduction.rate || '';
        
        addDeductionRow(
          label, 
          baseCalc ? formatCFA(baseCalc) : '', 
          taux ? `${taux}%` : '', 
          montant
        );
      }
    });
  }

  // Total déductions
  if (totalDeductions > 0) {
    tableData.push(['', '', '', '', '', '', '', '']); // Séparateur
    tableData.push(['', '', '', 'TOTAL RETENUES →', '', formatCFA(totalDeductions), '', '']);
  }

  autoTable(doc, {
    startY: currentY,
    head: headers,
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 6.8, 
      cellPadding: 1.2,
      overflow: 'linebreak', 
      lineColor: COLORS.black, 
      lineWidth: 0.3,
      textColor: COLORS.black
    },
    headStyles: { 
      fillColor: COLORS.darkGray, 
      textColor: COLORS.white, 
      fontSize: 7.5, 
      fontStyle: 'bold', 
      halign: 'center',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 42, halign: 'left' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 22, halign: 'right', fillColor: COLORS.gains },
      5: { cellWidth: 22, halign: 'right', fillColor: COLORS.deductions },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 20, halign: 'right', fillColor: [240, 240, 240] }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      // Mise en forme des totaux et séparateurs
      if (data.cell.text[0]?.includes('TOTAL')) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = COLORS.headerGray;
      } else if (data.cell.text[0]?.includes('═══')) {
        data.cell.styles.fillColor = data.cell.text[0].includes('SPÉCIFIQUES') ? COLORS.orange : COLORS.headerGray;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 6;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 4;

  // Net à payer - Design ENEO signature
  const netBoxHeight = 12;
  doc.setFillColor(...COLORS.black);
  doc.rect(margin, currentY, pageWidth - (2 * margin), netBoxHeight, 'F');
  
  // Bordure dorée pour effet premium
  doc.setLineWidth(1);
  doc.setDrawColor(255, 215, 0); // Or
  doc.rect(margin - 1, currentY - 1, pageWidth - (2 * margin) + 2, netBoxHeight + 2, 'S');
  
  setFont(doc, { family: 'helvetica', style: 'bold', size: 14 });
  doc.setTextColor(...COLORS.white);
  const netText = `NET À PAYER : ${formatCFA(netSalary)} F CFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 8);

  currentY += netBoxHeight + 6;

  // Section récapitulative en bas - Layout amélioré
  doc.setDrawColor(...COLORS.black);
  doc.setLineWidth(0.3);
  doc.setTextColor(...COLORS.black);
  
  const recapY = currentY;
  const colWidth = (pageWidth - 2 * margin) / 4;
  
  // Cadres pour chaque total
  for (let i = 0; i < 4; i++) {
    doc.rect(margin + (i * colWidth), recapY, colWidth, 12, 'S');
  }
  
  setFont(doc, FONTS.small);
  
  // Brut mensuel
  doc.setFillColor(...COLORS.gains);
  doc.rect(margin + 1, recapY + 1, colWidth - 2, 5, 'F');
  setFont(doc, { family: 'helvetica', style: 'bold', size: 8 });
  doc.text('BRUT MENSUEL', margin + 2, recapY + 4);
  setFont(doc, FONTS.small);
  doc.text(formatCFA(totalGross), margin + 2, recapY + 9);

  // Brut imposable
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(margin + colWidth + 1, recapY + 1, colWidth - 2, 5, 'F');
  setFont(doc, { family: 'helvetica', style: 'bold', size: 8 });
  doc.text('BRUT IMPOSABLE', margin + colWidth + 2, recapY + 4);
  setFont(doc, FONTS.small);
  doc.text(formatCFA(sbt), margin + colWidth + 2, recapY + 9);

  // Salaire cotisable
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(margin + (colWidth * 2) + 1, recapY + 1, colWidth - 2, 5, 'F');
  setFont(doc, { family: 'helvetica', style: 'bold', size: 8 });
  doc.text('SALAIRE COTISABLE', margin + (colWidth * 2) + 2, recapY + 4);
  setFont(doc, FONTS.small);
  doc.text(formatCFA(sbc), margin + (colWidth * 2) + 2, recapY + 9);

  // Avantages en nature
  doc.setFillColor(200, 255, 255);
  doc.rect(margin + (colWidth * 3) + 1, recapY + 1, colWidth - 2, 5, 'F');
  setFont(doc, { family: 'helvetica', style: 'bold', size: 8 });
  doc.text('AVANTAGES NATURE', margin + (colWidth * 3) + 2, recapY + 4);
  setFont(doc, FONTS.small);
  const avNature = (representationAllowance + dirtAllowance + mealAllowance) || 0;
  doc.text(formatCFA(avNature), margin + (colWidth * 3) + 2, recapY + 9);

  // Signature et date avec informations personnalisées
  currentY += 20;
  setFont(doc, FONTS.tiny);
  doc.text(`Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, currentY);
  
  const serviceRH = payslipData.employer?.serviceRH || 'Service RH';
  doc.text(`${serviceRH} - Bulletin officiel`, pageWidth - margin - 80, currentY);
  
  // Informations de contact employeur en bas
  currentY += 4;
  if (hasValue(employerPhone) || hasValue(payslipData.employer?.email)) {
    const contactInfo = [];
    if (hasValue(employerPhone)) contactInfo.push(`Tél: ${employerPhone}`);
    if (hasValue(payslipData.employer?.email)) contactInfo.push(`Email: ${payslipData.employer.email}`);
    doc.text(contactInfo.join(' • '), margin, currentY);
  }

  // Sauvegarde
  const fileName = `ENEO_Bulletin_${(empName || 'Employe').replace(/[^a-zA-Z0-9]/g, "_")}_${String(payslipData.payPeriod || 'N_A').replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);

  return { completed: true };
}

// Fonctions utilitaires pour la gestion des configurations employeur
export function saveEmployerConfig(employerId, config) {
  try {
    const existingConfig = getEmployerConfig(employerId);
    const mergedConfig = { ...existingConfig, ...config };
    localStorage.setItem(`employer_config_${employerId}`, JSON.stringify(mergedConfig));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la configuration employeur:', error);
    return false;
  }
}

export function getEmployerConfig(employerId) {
  try {
    const config = localStorage.getItem(`employer_config_${employerId}`);
    return config ? JSON.parse(config) : {};
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration employeur:', error);
    return {};
  }
}

export function addEmployerCustomItem(employerId, type, item) {
  try {
    const config = getEmployerConfig(employerId);
    if (!config[type]) config[type] = [];
    
    // Vérifier si l'item existe déjà
    const existingIndex = config[type].findIndex(existing => 
      existing.id === item.id || 
      existing.label === item.label || 
      existing.name === item.name
    );
    
    if (existingIndex >= 0) {
      // Mettre à jour l'item existant
      config[type][existingIndex] = { ...config[type][existingIndex], ...item };
    } else {
      // Ajouter le nouvel item
      config[type].push({
        ...item,
        id: item.id || `${type}_${Date.now()}`,
        dateCreated: new Date().toISOString()
      });
    }
    
    return saveEmployerConfig(employerId, config);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un item personnalisé:', error);
    return false;
  }
}

export function removeEmployerCustomItem(employerId, type, itemId) {
  try {
    const config = getEmployerConfig(employerId);
    if (!config[type]) return true;
    
    config[type] = config[type].filter(item => 
      item.id !== itemId && 
      item.label !== itemId && 
      item.name !== itemId
    );
    
    return saveEmployerConfig(employerId, config);
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un item personnalisé:', error);
    return false;
  }
}

// Fonction pour sauvegarder/récupérer les logos employeurs
export function saveEmployerLogo(employerId, logoData) {
  try {
    localStorage.setItem(`logo_${employerId}`, logoData);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du logo:', error);
    return false;
  }
}

export function getEmployerLogo(employerId) {
  try {
    return localStorage.getItem(`logo_${employerId}`);
  } catch (error) {
    console.error('Erreur lors de la récupération du logo:', error);
    return null;
  }
}

export function removeEmployerLogo(employerId) {
  try {
    localStorage.removeItem(`logo_${employerId}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du logo:', error);
    return false;
  }
}

// Fonction pour prévisualiser les templates avec logos et primes
export function previewTemplate(templateKey, payslipData) {
  try {
    const renderer = getPayslipRenderer(templateKey);
    
    // Créer un contexte de prévisualisation avec données factices
    const previewContext = {
      pageWidth: 210,
      pageHeight: 297,
      margin: 15,
      payslipData: {
        ...payslipData,
        payPeriod: payslipData.payPeriod || '2024-03',
        bulletinNum: payslipData.bulletinNum || 'PREV-2024-001'
      },
      employerName: payslipData.employer?.name || 'Société Exemple',
      employerAddress: payslipData.employer?.address || '123 Rue Exemple',
      employerCNPS: payslipData.employer?.cnps || '123456789',
      employerPhone: payslipData.employer?.phone || '+237 123 456 789',
      emp: payslipData.employee || {
        name: 'Employé Exemple',
        matricule: 'EMP001',
        poste: 'Développeur',
        category: 'Cadre'
      },
      empName: payslipData.employee?.name || 'Employé Exemple',
      empMatricule: payslipData.employee?.matricule || 'EMP001',
      empPoste: payslipData.employee?.poste || 'Développeur',
      empCategory: payslipData.employee?.category || 'Cadre',
      baseSalary: 500000,
      totalGross: 750000,
      totalDeductions: 150000,
      netSalary: 600000,
      sbt: 700000,
      sbc: 500000,
      formatCFA: (amount) => new Intl.NumberFormat('fr-FR').format(amount || 0),
      d: {
        pvid: 21000,
        irpp: 85000,
        cac: 1000,
        cfc: 7500,
        tdl: 8500
      }
    };
    
    return {
      hasLogo: !!getEmployerLogo(payslipData.employer?.id),
      customPrimes: getEmployerCustomItems(payslipData, 'primes'),
      customIndemnites: getEmployerCustomItems(payslipData, 'indemnites'),
      customDeductions: getEmployerCustomItems(payslipData, 'deductions'),
      previewData: previewContext
    };
  } catch (error) {
    console.error('Erreur lors de la prévisualisation:', error);
    return null;
  }
}

// Export des utilitaires pour la configuration des templates
export const TemplateUtils = {
  saveEmployerConfig,
  getEmployerConfig,
  addEmployerCustomItem,
  removeEmployerCustomItem,
  saveEmployerLogo,
  getEmployerLogo,
  removeEmployerLogo,
  getEmployerCustomItems,
  previewTemplate,
  COLORS,
  FONTS
};

// Configuration par défaut pour les nouveaux employeurs
export const DEFAULT_EMPLOYER_CONFIG = {
  primes: [
    {
      id: 'prime_performance',
      label: 'Prime de Performance',
      type: 'performance',
      description: 'Prime basée sur les objectifs atteints',
      frequency: 'Mensuel',
      isDefault: true,
      montant: 0
    },
    {
      id: 'prime_anciennete',
      label: 'Prime d\'Ancienneté', 
      type: 'anciennete',
      description: 'Prime basée sur l\'ancienneté dans l\'entreprise',
      frequency: 'Mensuel',
      isDefault: true,
      montant: 0
    }
  ],
  indemnites: [
    {
      id: 'indemnite_mission',
      label: 'Indemnité de Mission',
      type: 'mission',
      description: 'Indemnité pour missions spéciales',
      frequency: 'Variable',
      isDefault: true,
      montant: 0
    },
    {
      id: 'indemnite_formation',
      label: 'Indemnité de Formation',
      type: 'formation', 
      description: 'Indemnité pour participation aux formations',
      frequency: 'Variable',
      isDefault: true,
      montant: 0
    }
  ],
  deductions: [
    {
      id: 'retenue_avance',
      label: 'Retenue sur Avance',
      type: 'avance',
      description: 'Remboursement d\'avance sur salaire',
      frequency: 'Variable',
      isDefault: true,
      montant: 0
    }
  ]
};

// Fonction d'initialisation pour nouveaux employeurs
export function initializeEmployerConfig(employerId, customConfig = {}) {
  try {
    const existingConfig = getEmployerConfig(employerId);
    
    if (Object.keys(existingConfig).length === 0) {
      // Nouveau employeur, appliquer la configuration par défaut
      const initialConfig = {
        ...DEFAULT_EMPLOYER_CONFIG,
        ...customConfig,
        dateCreated: new Date().toISOString(),
        version: '1.0'
      };
      
      return saveEmployerConfig(employerId, initialConfig);
    }
    
    return true; // Configuration existante, pas de modification
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la configuration employeur:', error);
    return false;
  }
}

// Export des utilitaires principaux (les renderers sont déjà exportés via `export function ...`)
export {
  addLogoWithReservedSpace,
  getEmployerCustomItems,
  hasValue,
  setFont
};