// comptaOnlineTemplate.js
// Modern purple-themed payslip template

import autoTable from 'jspdf-autotable';
// Note: Removed dependency on external templateRegistry.js

export function renderComptaOnlineTemplate(doc, ctx) {
  
  const { 
    pageWidth, margin, payslipData, employerName, empName, 
    baseSalary, totalGross, netSalary, primes, indemnites, d, formatCFA 
  } = ctx;
  // Fallbacks to ensure dynamic items always present
  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);
  
  let currentY = margin;

  // Purple header
  doc.setFillColor(170, 100, 170); // Purple color
  doc.rect(margin, currentY, 60, 15, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('compta online', margin + 2, currentY + 8);

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('BULLETIN DE SALAIRE', pageWidth/2 - 40, currentY + 8);
  currentY += 20;

  // Period
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, pageWidth/2 - 30, currentY);
  currentY += 15;

  // Employee details in purple box
  if (empName) {
    doc.setFillColor(120, 80, 120);
    doc.rect(pageWidth - margin - 80, currentY, 75, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(empName, pageWidth - margin - 78, currentY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (payslipData.employee?.address) {
      doc.text(payslipData.employee.address, pageWidth - margin - 78, currentY + 10);
    }
    if (payslipData.employee?.city) {
      doc.text(payslipData.employee.city, pageWidth - margin - 78, currentY + 15);
    }
  }

  currentY += 35;

  // Main payslip table with purple headers
  const payslipRows = [];
  if (baseSalary > 0) payslipRows.push(['Salaire de base', '', '', formatCFA(baseSalary), '']);
  
  // Add custom bonuses (primes)
  if (Array.isArray(primesArr)) {
    if (primesArr.some(p => (Number(p.montant ?? p.amount ?? p.value) || 0) > 0)) {
      payslipRows.push(['', '', '', '', '']); // spacer before primes
    }
    primesArr.forEach(prime => {
      const amount = Number(prime.montant ?? prime.amount ?? prime.value) || 0;
      if (amount > 0) {
        payslipRows.push([prime.label || prime.name || prime.type || 'Prime', '', '', formatCFA(amount), '']);
      }
    });
    if (primesArr.some(p => (Number(p.montant ?? p.amount ?? p.value) || 0) > 0)) {
      payslipRows.push(['', '', '', '', '']); // spacer after primes
    }
  }
  
  // Add custom allowances
  if (Array.isArray(indemArr)) {
    if (indemArr.some(i => (Number(i.montant ?? i.amount ?? i.value) || 0) > 0)) {
      payslipRows.push(['', '', '', '', '']); // spacer before indemnities
    }
    indemArr.forEach(indemnite => {
      const amount = Number(indemnite.montant ?? indemnite.amount ?? indemnite.value) || 0;
      if (amount > 0) {
        payslipRows.push([indemnite.label || indemnite.name || indemnite.type || 'Indemnité', '', '', formatCFA(amount), '']);
      }
    });
    if (indemArr.some(i => (Number(i.montant ?? i.amount ?? i.value) || 0) > 0)) {
      payslipRows.push(['', '', '', '', '']); // spacer after indemnities
    }
  }
  
  if (totalGross > 0) payslipRows.push(['Salaire brut', '', '', formatCFA(totalGross), '']);
  
  // Add deductions
  if (d?.pvid > 0) payslipRows.push(['PVID (CNPS)', formatCFA(baseSalary), '4,2%', formatCFA(d.pvid), '']);
  if (d?.irpp > 0) payslipRows.push(['IRPP', formatCFA(baseSalary), '', formatCFA(d.irpp), '']);
  if (d?.cac > 0) payslipRows.push(['CAC', '', '', formatCFA(d.cac), '']);
  if (d?.cfc > 0) payslipRows.push(['CFC', '', '', formatCFA(d.cfc), '']);
  if (d?.rav > 0) payslipRows.push(['RAV', '', '', formatCFA(d.rav), '']);
  if (d?.tdl > 0) payslipRows.push(['TDL', '', '', formatCFA(d.tdl), '']);
  if (d?.fne > 0) payslipRows.push(['FNE', '', '', formatCFA(d.fne), '']);

  autoTable(doc, {
    startY: currentY,
    head: [['Éléments de paie', 'Base', 'Taux', 'À payer', 'À déduire', 'Charges patronales']],
    body: payslipRows,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 8, 
      cellPadding: 2,
      lineColor: [0, 0, 0], 
      lineWidth: 0.1 
    },
    headStyles: { 
      fillColor: [120, 80, 120], 
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold' 
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 40 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Net pay highlight
  doc.setFillColor(120, 80, 120);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`Net payé : ${formatCFA(netSalary)} F CFA`, margin + 5, currentY + 6);

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_ComptaOnline_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  return { completed: true };
}