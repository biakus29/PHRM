// classicTemplate.js
// Template épuré sans lignes horizontales, uniquement colonnes verticales

import autoTable from 'jspdf-autotable';

export function renderClassicPayslip(doc, ctx) {
  const {
    pageWidth, pageHeight, margin, payslipData, employerName, employerAddress,
    empName, empPoste, empCNPS, baseSalary, totalGross, totalDeductions,
    netSalary, primes, indemnites, d
  } = ctx;

  const formatNumber = (num) => {
    if (!num || num === 0) return '';
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);

  let currentY = margin;
  const PW = pageWidth || doc.internal.pageSize.getWidth();
  const PH = pageHeight || doc.internal.pageSize.getHeight();

  // Filigranes
  const watermarkText = employerName || 'ENTREPRISE';
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(100, 100, 100);
  
  doc.text(watermarkText, PW / 2, PH * 0.25, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  doc.text(watermarkText, PW / 2, PH * 0.5, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  doc.text(watermarkText, PW / 2, PH * 0.75, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  
  doc.restoreGraphicsState();

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text('BULLETIN DE PAIE', margin, currentY + 5);
  
  doc.setFontSize(16);
  doc.text(payslipData.payPeriod || '01/20', PW - margin - 2, currentY + 5, { align: 'right' });

  currentY += 15;

  // Encadré jaune employeur
  const boxWidth = 90;
  const boxHeight = 25;
  
  doc.setFillColor(255, 255, 200);
  doc.rect(margin, currentY, boxWidth, boxHeight, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, boxWidth, boxHeight);

  let boxY = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(employerName || 'SOCIETE EXEMPLE', margin + 3, boxY);
  
  boxY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (employerAddress) {
    doc.text(employerAddress, margin + 3, boxY);
    boxY += 4;
  }
  if (payslipData.employer?.city) {
    doc.text(payslipData.employer.city, margin + 3, boxY);
    boxY += 4;
  }
  if (payslipData.employer?.siret) {
    doc.text(`SIRET ${payslipData.employer.siret}`, margin + 3, boxY);
  }

  // Info salarié droite
  let rightX = PW - margin - 75;
  let rightY = currentY + 5;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(empName || 'M NOM Prénom', rightX, rightY);
  
  rightY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (payslipData.employee?.address) {
    doc.text(payslipData.employee.address, rightX, rightY);
    rightY += 4;
  }
  if (payslipData.employee?.city) {
    doc.text(payslipData.employee.city, rightX, rightY);
  }

  currentY += boxHeight + 3;

  // Infos complémentaires
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Etablissement : ${employerName || 'SOCIETE EXEMPLE'}`, margin, currentY);
  currentY += 4;
  doc.text(`Période du ${payslipData.startDate || '01/01/2020'} au ${payslipData.endDate || '04/01/2020'}`, margin, currentY);
  currentY += 4;
  doc.text(`Payé le ${payslipData.paymentDate || '31/01/2020'}`, margin, currentY);

  rightY = currentY - 8;
  doc.text(`Matricule : ${payslipData.employee?.matricule || ''} N° CNPS : ${empCNPS || ''}`, rightX, rightY);
  rightY += 4;
  doc.text(`Emploi : ${empPoste || ''}`, rightX, rightY);
  rightY += 4;
  doc.text(`Contrat : ${payslipData.contractType || 'CDI'}`, rightX, rightY);

  currentY += 8;

  // TABLEAU GAINS (sans lignes horizontales)
  const gainsData = [];
  gainsData.push(['Salaire de base', formatNumber(baseSalary), '', formatNumber(baseSalary)]);
  
  if (primesArr.length > 0) {
    primesArr.forEach(prime => {
      const label = prime.label || prime.name || 'Prime';
      const amount = Number(prime.montant ?? prime.amount ?? 0);
      if (amount > 0) {
        gainsData.push([label, '', '', formatNumber(amount)]);
      }
    });
  }
  
  if (indemArr.length > 0) {
    indemArr.forEach(indemnite => {
      const label = indemnite.label || indemnite.name || 'Indemnité';
      const amount = Number(indemnite.montant ?? indemnite.amount ?? 0);
      if (amount > 0) {
        gainsData.push([label, '', '', formatNumber(amount)]);
      }
    });
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Désignation', 'Base', 'Taux', 'Montant (XAF)']],
    body: gainsData,
    foot: [['TOTAL GAINS', '', '', formatNumber(totalGross)]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: function(data) {
      // Draw only vertical lines and an outer border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);

      const tableStartY = data.table.head[0].cells[0].y;
      const tableEndY = data.cursor.y;

      let currentX = data.settings.margin.left;
      data.table.columns.forEach((col, index) => {
        currentX += col.width;
        if (index < data.table.columns.length - 1) {
          doc.line(currentX, tableStartY, currentX, tableEndY);
        }
      });

      // Outer border
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.setLineWidth(0.5);
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 3;

  // TABLEAU RETENUES (sans lignes horizontales)
  const retenuesData = [];
  
  if (d?.pvid > 0) {
    retenuesData.push(['PVID (CNPS)', formatNumber(baseSalary), '4,2%', formatNumber(d.pvid)]);
  }
  
  if (d?.irpp > 0) {
    retenuesData.push(['IRPP', formatNumber(baseSalary), '', formatNumber(d.irpp)]);
  }
  
  if (d?.cac > 0) {
    retenuesData.push(['CAC', '', '', formatNumber(d.cac)]);
  }
  
  if (d?.cfc > 0) {
    retenuesData.push(['CFC', '', '', formatNumber(d.cfc)]);
  }
  
  if (d?.rav > 0) {
    retenuesData.push(['RAV', '', '', formatNumber(d.rav)]);
  }
  
  if (d?.tdl > 0) {
    retenuesData.push(['TDL', '', '', formatNumber(d.tdl)]);
  }
  
  if (d?.fne > 0) {
    retenuesData.push(['FNE', '', '', formatNumber(d.fne)]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Désignation', 'Base', 'Taux', 'Montant (XAF)']],
    body: retenuesData,
    foot: [['TOTAL RETENUES', '', '', formatNumber(totalDeductions)]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [0, 0, 0],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: function(data) {
      // Draw only vertical lines and an outer border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);

      const tableStartY = data.table.head[0].cells[0].y;
      const tableEndY = data.cursor.y;

      let currentX = data.settings.margin.left;
      data.table.columns.forEach((col, index) => {
        currentX += col.width;
        if (index < data.table.columns.length - 1) {
          doc.line(currentX, tableStartY, currentX, tableEndY);
        }
      });

      // Outer border
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.setLineWidth(0.5);
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // NET À PAYER
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, currentY, PW - 2 * margin, 12, 'F');
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, PW - 2 * margin, 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('NET À PAYER', margin + 3, currentY + 8);
  doc.text(`${formatNumber(netSalary)} XAF`, PW - margin - 3, currentY + 8, { align: 'right' });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  
  return { completed: true };
}

export default renderClassicPayslip;


 /*
  const formatNumber = (num) => {
    if (!num || num === 0) return '';
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);

  
boxY += 5;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
if (employerAddress) {
  doc.text(employerAddress, margin + 3, boxY);
  boxY += 4;
}
if (payslipData.employer?.city) {
  doc.text(payslipData.employer.city, margin + 3, boxY);
  boxY += 4;
}
if (payslipData.employer?.siret) {
  doc.text(`SIRET ${payslipData.employer.siret}`, margin + 3, boxY);
}

// ============================================
// INFO SALARIÉ (Droite)
// ============================================
let rightX = PW - margin - 75;
let rightY = currentY + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(100, 100, 100);
  
  doc.text(watermarkText, PW / 2, PH * 0.25, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  doc.text(watermarkText, PW / 2, PH * 0.5, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  doc.text(watermarkText, PW / 2, PH * 0.75, { angle: 45, align: 'center', baseline: 'middle', maxWidth: PW * 0.7 });
  
  doc.restoreGraphicsState();

  // ============================================
  // LOGO
  // ============================================
  const logoSize = 25;
  const logoX = margin;
  const logoY = currentY;
  
  if (payslipData.logo || payslipData.employer?.logo) {
    const logoData = payslipData.logo || payslipData.employer?.logo;
    try {
      doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.setLineDash([2, 2]);
      doc.rect(logoX, logoY, logoSize, logoSize);
      doc.setLineDash([]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('LOGO', logoX + logoSize/2, logoY + logoSize/2, { align: 'center', baseline: 'middle' });
    }
  }

  currentY += logoSize + 8;

  // ============================================
  // TITRE
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(60, 60, 60);
  doc.text('BULLETIN DE SALAIRE', PW / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, PW / 2, currentY, { align: 'center' });
  doc.text(`Date : ${payslipData.generationDate || new Date().toLocaleDateString('fr-FR')}`, PW / 2, currentY + 6, { align: 'center' });

  currentY += 15;

  // ============================================
  // TABLEAU EMPLOYEUR / SALARIÉ
  // ============================================
  const infoData = [
    ['EMPLOYEUR', 'SALARIÉ'],
    [employerName || 'ENTREPRISE', empName || 'NOM Prénom'],
    [employerAddress || '', `Matricule : ${payslipData.employee?.matricule || ''}`],
    [payslipData.employer?.siret ? `SIRET : ${payslipData.employer.siret}` : '', `Poste : ${empPoste || ''}`],
    [payslipData.employer?.naf ? `NAF : ${payslipData.employer.naf}` : '', `N° CNPS : ${empCNPS || ''}`],
    ['', payslipData.employee?.department ? `Département : ${payslipData.employee.department}` : '']
  ];

  autoTable(doc, {
    startY: currentY,
    body: infoData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [150, 150, 150]
    },
    bodyStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: (PW - 2 * margin) / 2, halign: 'left' },
      1: { cellWidth: (PW - 2 * margin) / 2, halign: 'left' }
    },
    didParseCell: function(data) {
      if (data.row.index === 0) {
        data.cell.styles.fillColor = [100, 100, 100];
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
        data.cell.styles.fontSize = 10;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // ============================================
  // TABLEAU PRINCIPAL
  // ============================================
  const mainTableData = [];
  
  // RÉMUNÉRATION
  mainTableData.push({
    rubrique: 'REMUNERATION',
    base: '',
    taux: '',
    montant: '',
    isHeader: true
  });

  mainTableData.push({
    rubrique: 'Salaire de base',
    base: formatNumber(baseSalary),
    taux: '',
    montant: formatNumber(baseSalary),
    isHeader: false
  });

  const heuresSup = payslipData.overtimeHours || 0;
  if (heuresSup > 0) {
    mainTableData.push({
      rubrique: 'Heures supplémentaires',
      base: '',
      taux: '',
      montant: formatNumber(heuresSup),
      isHeader: false
    });
  }

  // PRIMES
  if (primesArr.length > 0) {
    mainTableData.push({
      rubrique: 'PRIMES',
      base: '',
      taux: '',
      montant: '',
      isHeader: true
    });

    primesArr.forEach(prime => {
      const label = prime.label || prime.name || prime.type || prime.libelle || 'Prime';
      const amount = Number(prime.montant ?? prime.amount ?? prime.value ?? 0);
      if (amount > 0) {
        mainTableData.push({
          rubrique: label,
          base: '',
          taux: '',
          montant: formatNumber(amount),
          isHeader: false
        });
      }
    });
  }

  // INDEMNITÉS
  if (indemArr.length > 0) {
    mainTableData.push({
      rubrique: 'INDEMNITES',
      base: '',
      taux: '',
      montant: '',
      isHeader: true
    });

    indemArr.forEach(indemnite => {
      const label = indemnite.label || indemnite.name || indemnite.type || indemnite.libelle || 'Indemnité';
      const amount = Number(indemnite.montant ?? indemnite.amount ?? indemnite.value ?? 0);
      if (amount > 0) {
        mainTableData.push({
          rubrique: label,
          base: '',
          taux: '',
          montant: formatNumber(amount),
          isHeader: false
        });
      }
    });
  }

  // SBT
  const sbt = payslipData.sbt || totalGross;
  mainTableData.push({
    rubrique: 'SBT (Salaire Brut Taxable)',
    base: '',
    taux: '',
    montant: formatNumber(sbt),
    isHeader: false,
    isBold: true
  });

  // DÉDUCTIONS
  mainTableData.push({
    rubrique: 'DEDUCTIONS',
    base: '',
    taux: '',
    montant: '',
    isHeader: true
  });

  if (d?.pvid > 0) mainTableData.push({
    rubrique: 'PVID (CNPS)',
    base: formatNumber(baseSalary),
    taux: '4,2%',
    montant: formatNumber(d.pvid),
    isHeader: false
  });

  if (d?.irpp > 0) mainTableData.push({
    rubrique: 'IRPP',
    base: '',
    taux: '',
    montant: formatNumber(d.irpp),
    isHeader: false
  });

  if (d?.cac > 0) mainTableData.push({
    rubrique: 'CAC',
    base: '',
    taux: '',
    montant: formatNumber(d.cac),
    isHeader: false
  });

  if (d?.cfc > 0) mainTableData.push({
    rubrique: 'CFC',
    base: '',
    taux: '',
    montant: formatNumber(d.cfc),
    isHeader: false
  });

  if (d?.rav > 0) mainTableData.push({
    rubrique: 'RAV',
    base: '',
    taux: '',
    montant: formatNumber(d.rav),
    isHeader: false
  });

  if (d?.tdl > 0) mainTableData.push({
    rubrique: 'TDL',
    base: '',
    taux: '',
    montant: formatNumber(d.tdl),
    isHeader: false
  });

  if (d?.fne > 0) mainTableData.push({
    rubrique: 'FNE',
    base: '',
    taux: '',
    montant: formatNumber(d.fne),
    isHeader: false
  });

  mainTableData.push({
    rubrique: 'TOTAL DEDUCTIONS',
    base: '',
    taux: '',
    montant: formatNumber(totalDeductions),
    isHeader: false,
    isBold: true
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Éléments de paie', 'Base', 'Taux', 'Montant (XAF)']],
    body: mainTableData.map(row => [
      row.rubrique, row.base, row.taux, row.montant
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineWidth: 0.3,
      lineColor: [150, 150, 150]
    },
    headStyles: {
      fillColor: [100, 100, 100],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didParseCell: function(data) {
      const rowIndex = data.row.index;
      if (data.section === 'body' && mainTableData[rowIndex]) {
        const rowData = mainTableData[rowIndex];
        
        if (rowData.isHeader) {
          data.cell.styles.fillColor = [220, 220, 220];
          data.cell.styles.fontStyle = 'bold';
        } else if (rowData.isBold) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // ============================================
  // NET À PAYER
  // ============================================
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, currentY, PW - 2 * margin, 14, 'F');
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, PW - 2 * margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('NET À PAYER', margin + 3, currentY + 9);
  doc.text(`${formatNumber(netSalary)} XAF`, PW - margin - 3, currentY + 9, { align: 'right' });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_Classic_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  
  return { completed: true };
}

*/