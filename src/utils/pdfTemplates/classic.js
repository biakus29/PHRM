// Template Classic - Bulletin de paie classique avec sections claires
import autoTable from 'jspdf-autotable';
import { COLORS, FONTS, setFont, hasValue, addLogoWithReservedSpace, getEmployerCustomItems } from './shared';

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
  const customPrimes = getEmployerCustomItems(payslipData?.employer?.id, 'primes');
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
  const customIndemnites = getEmployerCustomItems(payslipData?.employer?.id, 'indemnites');
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
        if (data.row && data.row.raw && data.row.raw[3] === 'separator') {
          data.cell.styles.fillColor = COLORS.orange;
          data.cell.styles.fontStyle = 'bold';
        } else if (data.row && data.row.raw && data.row.raw[3] === 'custom') {
          if (data.column.index === 1) data.cell.styles.fillColor = COLORS.blue;
        } else if (data.row && data.row.raw && data.row.raw[3] === 'standard') {
          if (data.column.index === 1) data.cell.styles.fillColor = COLORS.gains;
        }
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

export default renderClassicPayslip;
