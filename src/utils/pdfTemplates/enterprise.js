// enterpriseTemplate.js
// Professional clean template with subtle colors and clear formatting

import autoTable from 'jspdf-autotable';
import { COLORS, FONTS, setFont, hasValue, addLogoWithReservedSpace, getEmployerCustomItems } from './shared';

export function renderEnterpriseTemplate(doc, ctx) {
  
  const {
    pageWidth, pageHeight, margin, payslipData, employerName, employerAddress, 
    empName, empMatricule, empPoste, empCNPS, baseSalary, totalGross, 
    totalDeductions, netSalary, primes, indemnites, d, formatCFA
  } = ctx;

  // Simple number formatter
  const formatNumber = (num) => {
    if (!num || num === 0) return '';
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Ensure dynamic arrays are present
  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);

  let currentY = margin;

  // Add watermark with company name (filigrane) - centré parfaitement
  const watermarkText = employerName || 'ENTREPRISE';
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.6 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(70);
  doc.setTextColor(180, 180, 180);
  
  // Centrage parfait au milieu de la page
  const watermarkX = pageWidth / 2;
  const watermarkY = pageHeight / 2;
  
  // Rotation autour du centre
  doc.text(watermarkText, watermarkX, watermarkY, {
    angle: 45,
    align: 'center',
    baseline: 'middle',
    maxWidth: pageWidth * 0.8
  });
  doc.restoreGraphicsState();

  // Logo avec espace réservé en haut
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 30,
    position: 'center',
    reserveSpace: true,
    backgroundColor: [235, 242, 250] // Light blue background
  });

  currentY += 5;

  // Header with subtle blue background
  doc.setFillColor(235, 242, 250); // Very light blue
  doc.rect(margin, currentY, pageWidth - 2*margin, 20, 'F');
  
  // Company info (left side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  if (employerName) doc.text(employerName, margin + 2, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (employerAddress) doc.text(employerAddress, margin + 2, currentY + 10);
  if (payslipData.employer?.city) doc.text(payslipData.employer.city, margin + 2, currentY + 14);

  // Title (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 70, 120); // Dark blue
  doc.text('BULLETIN DE SALAIRE', pageWidth - margin - 2, currentY + 7, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, pageWidth - margin - 2, currentY + 14, { align: 'right' });

  currentY += 25;

  // Employee details section
  doc.setFillColor(248, 248, 248); // Very light gray
  doc.rect(margin, currentY, pageWidth - 2*margin, 22, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(margin, currentY, pageWidth - 2*margin, 22);

  // Left column - Company details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  let leftY = currentY + 4;
  if (payslipData.employer?.siret) {
    doc.text(`Siret : ${payslipData.employer.siret}`, margin + 2, leftY);
    leftY += 4;
  }
  if (payslipData.employer?.naf) {
    doc.text(`Code NAF : ${payslipData.employer.naf}`, margin + 2, leftY);
    leftY += 4;
  }

  // Right column - Employee details
  let rightY = currentY + 4;
  if (empName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(empName, pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
  }
  
  if (empCNPS) {
    doc.text(`N° CNPS : ${empCNPS}`, pageWidth - margin - 2, rightY, { align: 'right' });
    rightY += 4;
  }
  if (empPoste) {
    doc.text(`Poste : ${empPoste}`, pageWidth - margin - 2, rightY, { align: 'right' });
  }

  currentY += 28;

  // Main table
  const mainTableRows = [];
  if (baseSalary > 0) mainTableRows.push(['Salaire de base', '', '', '', formatNumber(baseSalary), '']);
  
  // Add custom bonuses
  if (Array.isArray(primesArr)) {
    primesArr.forEach(prime => {
      const amount = Number(prime.montant ?? prime.amount ?? prime.value) || 0;
      if (amount > 0) {
        mainTableRows.push([prime.label || prime.name || prime.type || 'Prime', '', '', '', formatNumber(amount), '']);
      }
    });
  }
  
  // Add custom allowances
  if (Array.isArray(indemArr)) {
    indemArr.forEach(indemnite => {
      const amount = Number(indemnite.montant ?? indemnite.amount ?? indemnite.value) || 0;
      if (amount > 0) {
        mainTableRows.push([indemnite.label || indemnite.name || indemnite.type || 'Indemnité', '', '', '', formatNumber(amount), '']);
      }
    });
  }
  
  if (totalGross > 0) mainTableRows.push(['Salaire brut', '', '', '', formatNumber(totalGross), '']);
  
  // Add deductions
  if (d?.pvid > 0) mainTableRows.push(['PVID (CNPS)', formatNumber(baseSalary), '4,2%', formatNumber(d.pvid), '', '']);
  if (d?.irpp > 0) mainTableRows.push(['IRPP', formatNumber(baseSalary), '', formatNumber(d.irpp), '', '']);
  if (d?.cac > 0) mainTableRows.push(['CAC', '', '', formatNumber(d.cac), '', '']);
  if (d?.cfc > 0) mainTableRows.push(['CFC', '', '', formatNumber(d.cfc), '', '']);
  if (d?.rav > 0) mainTableRows.push(['RAV', '', '', formatNumber(d.rav), '', '']);
  if (d?.tdl > 0) mainTableRows.push(['TDL', '', '', formatNumber(d.tdl), '', '']);
  if (d?.fne > 0) mainTableRows.push(['FNE', '', '', formatNumber(d.fne), '', '']);

  autoTable(doc, {
    startY: currentY,
    head: [['Éléments de paie', 'Base', 'Taux', 'À déduire', 'À payer', 'Charges patronales']],
    body: mainTableRows,
    theme: 'plain',
    styles: { 
      font: 'helvetica', 
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: { 
      fillColor: [220, 235, 245], // Subtle light blue
      textColor: [30, 70, 120], // Dark blue text
      fontSize: 9, 
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 65, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 34, halign: 'right' }
    },
    didDrawPage: function(data) {
      // Draw only vertical lines
      doc.setDrawColor(200, 200, 200);
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
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
      
      // Header bottom border
      const headerEndY = data.table.head[0].cells[0].y + data.table.head[0].cells[0].height;
      doc.line(leftX, headerEndY, rightX, headerEndY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // Net pay section with subtle green
  doc.setFillColor(235, 245, 240); // Very light green
  doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
  doc.setDrawColor(100, 150, 120);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 80, 40); // Dark green
  doc.text('Net à payer', margin + 3, currentY + 6.5);
  doc.text(`${formatNumber(netSalary)} FCFA`, pageWidth - margin - 3, currentY + 6.5, { align: 'right' });
  
  currentY += 15;

  // Summary table
  const summaryRows = [
    ['Mensuel', '151,67', '', formatNumber(baseSalary), formatNumber(baseSalary), formatNumber(netSalary), formatNumber(totalDeductions), formatNumber(totalGross), formatNumber(netSalary)],
    ['Annuel', '1 820', '', formatNumber(baseSalary * 12), formatNumber(baseSalary * 12), formatNumber(netSalary * 12), formatNumber(totalDeductions * 12), formatNumber(totalGross * 12), formatNumber(netSalary * 12)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['', 'Heures', 'H. suppl', 'Brut', 'Plafond SS', 'Net imposable', 'Ch. patronales', 'Coût global', 'Total versé']],
    body: summaryRows,
    theme: 'plain',
    styles: { 
      font: 'helvetica', 
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0]
    },
    headStyles: { 
      fillColor: [240, 240, 245], // Very light gray-blue
      textColor: [50, 50, 80],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 17, halign: 'right' },
      2: { cellWidth: 17, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' }
    },
    didDrawPage: function(data) {
      doc.setDrawColor(200, 200, 200);
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
      
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
      
      const headerEndY = data.table.head[0].cells[0].y + data.table.head[0].cells[0].height;
      doc.line(leftX, headerEndY, rightX, headerEndY);
    }
  });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_Enterprise_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  return { completed: true };
}