// comptaOnlineTemplate.js
// Clean payslip template with subtle colors and proper number formatting

import autoTable from 'jspdf-autotable';
import { COLORS, FONTS, setFont, hasValue, addLogoWithReservedSpace, getEmployerCustomItems } from './shared';

export function renderComptaOnlineTemplate(doc, ctx) {
  
  const { 
    pageWidth, margin, payslipData, employerName, empName, 
    baseSalary, totalGross, netSalary, primes, indemnites, d, formatCFA 
  } = ctx;
  
  // Fonction de formatage propre des nombres
  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    const rounded = Math.round(num);
    // Format avec espaces tous les 3 chiffres : 150 000
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };
  
  // Fallbacks to ensure dynamic items always present
  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);
  
  let currentY = margin;

  // Add watermark with company name (filigrane) - centré parfaitement
  const watermarkText = employerName || 'compta online';
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

  // Logo avec espace réservé en haut à gauche
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 28,
    position: 'left',
    reserveSpace: true,
    backgroundColor: [230, 240, 250] // Light blue background
  });

  currentY += 5;

  // Simple header with subtle blue
  doc.setFillColor(230, 240, 250); // Light blue
  doc.rect(margin, currentY, pageWidth - 2*margin, 12, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(40, 80, 120); // Dark blue
  doc.text('compta online', margin + 2, currentY + 7);
  
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('BULLETIN DE SALAIRE', pageWidth/2, currentY + 7, { align: 'center' });
  currentY += 15;

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, pageWidth/2, currentY, { align: 'center' });
  currentY += 10;

  // Employee details - simple box with light gray background
  if (empName) {
    doc.setFillColor(245, 245, 245); // Very light gray
    doc.rect(pageWidth - margin - 70, currentY, 65, 20, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(pageWidth - margin - 70, currentY, 65, 20);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(empName, pageWidth - margin - 68, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (payslipData.employee?.address) {
      doc.text(payslipData.employee.address, pageWidth - margin - 68, currentY + 10);
    }
    if (payslipData.employee?.city) {
      doc.text(payslipData.employee.city, pageWidth - margin - 68, currentY + 15);
    }
  }

  currentY += 25;

  // Main payslip table
  const payslipRows = [];
  if (baseSalary > 0) payslipRows.push(['Salaire de base', '', '', formatNumber(baseSalary), '', '']);
  
  // Add custom bonuses (primes)
  if (Array.isArray(primesArr)) {
    primesArr.forEach(prime => {
      const amount = Number(prime.montant ?? prime.amount ?? prime.value) || 0;
      if (amount > 0) {
        payslipRows.push([prime.label || prime.name || prime.type || 'Prime', '', '', formatNumber(amount), '', '']);
      }
    });
  }
  
  // Add custom allowances
  if (Array.isArray(indemArr)) {
    indemArr.forEach(indemnite => {
      const amount = Number(indemnite.montant ?? indemnite.amount ?? indemnite.value) || 0;
      if (amount > 0) {
        payslipRows.push([indemnite.label || indemnite.name || indemnite.type || 'Indemnité', '', '', formatNumber(amount), '', '']);
      }
    });
  }
  
  if (totalGross > 0) payslipRows.push(['Salaire brut', '', '', formatNumber(totalGross), '', '']);
  
  // Add deductions
  if (d?.pvid > 0) payslipRows.push(['PVID (CNPS)', formatNumber(baseSalary), '4,2%', '', formatNumber(d.pvid), '']);
  if (d?.irpp > 0) payslipRows.push(['IRPP', formatNumber(baseSalary), '', '', formatNumber(d.irpp), '']);
  if (d?.cac > 0) payslipRows.push(['CAC', '', '', '', formatNumber(d.cac), '']);
  if (d?.cfc > 0) payslipRows.push(['CFC', '', '', '', formatNumber(d.cfc), '']);
  if (d?.rav > 0) payslipRows.push(['RAV', '', '', '', formatNumber(d.rav), '']);
  if (d?.tdl > 0) payslipRows.push(['TDL', '', '', '', formatNumber(d.tdl), '']);
  if (d?.fne > 0) payslipRows.push(['FNE', '', '', '', formatNumber(d.fne), '']);

  autoTable(doc, {
    startY: currentY,
    head: [['Désignation', 'Base', 'Taux', 'Gains', 'Retenues', 'Montant']],
    body: payslipRows,
    theme: 'plain',
    styles: { 
      font: 'helvetica', 
      fontSize: 8,
      cellPadding: 3,
      textColor: [0, 0, 0],
      lineWidth: 0,
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [220, 230, 240], // Subtle blue-gray
      textColor: [30, 60, 90],
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 3,
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'normal', halign: 'left', fontSize: 8 },
      1: { cellWidth: 25, halign: 'right', fontStyle: 'normal', fontSize: 7 },
      2: { cellWidth: 12, halign: 'center', fontStyle: 'normal', fontSize: 7 },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold', fontSize: 8 },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold', fontSize: 8 },
      5: { cellWidth: 25, halign: 'right', fontStyle: 'normal', fontSize: 7 }
    },
    didDrawPage: function(data) {
      // Draw only vertical lines between columns
      doc.setDrawColor(200, 200, 200); // Light gray lines
      doc.setLineWidth(0.3);
      
      const tableStartY = data.table.head[0].cells[0].y;
      const tableEndY = data.cursor.y;
      
      // Get X positions for vertical lines
      let currentX = data.settings.margin.left;
      data.table.columns.forEach((col, index) => {
        currentX += col.width;
        if (index < data.table.columns.length - 1) {
          doc.line(currentX, tableStartY, currentX, tableEndY);
        }
      });
      
      // Draw outer border
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
      
      // Draw header bottom border
      const headerEndY = data.table.head[0].cells[0].y + data.table.head[0].cells[0].height;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(leftX, headerEndY, rightX, headerEndY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Net pay - with subtle green background
  doc.setFillColor(230, 245, 235); // Light green
  doc.rect(margin, currentY, pageWidth - 2 * margin, 12, 'F');
  doc.setDrawColor(100, 150, 120);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 80, 40); // Dark green
  doc.text(`Net à payer : ${formatNumber(netSalary)} FCFA`, pageWidth/2, currentY + 8, { align: 'center' });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_ComptaOnline_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  return { completed: true };
}