// enterpriseTemplate.js
// Professional blue-themed payslip template with detailed summaries

import autoTable from 'jspdf-autotable';
// Note: Removed dependency on external templateRegistry.js

export function renderEnterpriseTemplate(doc, ctx) {
  
  const {
    pageWidth, pageHeight, margin, payslipData, employerName, employerAddress, 
    empName, empMatricule, empPoste, empCNPS, baseSalary, totalGross, 
    totalDeductions, netSalary, primes, indemnites, d, formatCFA
  } = ctx;

  // Ensure dynamic arrays are present
  const primesArr = (Array.isArray(primes) && primes.length > 0)
    ? primes
    : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  const indemArr = (Array.isArray(indemnites) && indemnites.length > 0)
    ? indemnites
    : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);

  let currentY = margin;

  // Company header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  if (employerName) doc.text(employerName, margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (employerAddress) doc.text(employerAddress, margin, currentY + 6);
  if (payslipData.employer?.city) doc.text(payslipData.employer.city, margin, currentY + 10);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('BULLETIN DE SALAIRE', pageWidth - margin - 80, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, pageWidth - margin - 80, currentY + 8);

  currentY += 25;

  // Employee details in blue box
  if (empName) {
    doc.setFillColor(150, 180, 220); // Light blue
    doc.rect(pageWidth - margin - 80, currentY, 75, 25, 'F');
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - margin - 80, currentY, 75, 25, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(empName, pageWidth - margin - 78, currentY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const empAddress = payslipData.employee?.address || payslipData.employee?.adresse;
    if (empAddress) doc.text(empAddress, pageWidth - margin - 78, currentY + 10);
    if (payslipData.employee?.city) doc.text(payslipData.employee.city, pageWidth - margin - 78, currentY + 15);
  }

  // Employee details (left side)
  doc.setFontSize(8);
  if (payslipData.employer?.siret) doc.text(`Siret : ${payslipData.employer.siret}`, margin, currentY);
  if (payslipData.employer?.naf) doc.text(`Code Naf : ${payslipData.employer.naf}`, margin, currentY + 4);
  if (empCNPS) doc.text(`N°SS : ${empCNPS}`, margin, currentY + 8);
  if (empPoste) doc.text(`Emploi : ${empPoste}`, margin, currentY + 12);
  if (payslipData.employee?.status) doc.text(`Statut professionnel : ${payslipData.employee.status}`, margin, currentY + 16);

  currentY += 35;

  // Main table with blue header
  const mainTableRows = [];
  if (baseSalary > 0) mainTableRows.push(['Salaire de base', '', '', '', formatCFA(baseSalary), '']);
  
  // Add custom bonuses
  if (Array.isArray(primesArr)) {
    const anyPrime = primesArr.some(p => (Number(p.montant ?? p.amount ?? p.value) || 0) > 0);
    if (anyPrime) mainTableRows.push(['', '', '', '', '', '']); // spacer before primes
    primesArr.forEach(prime => {
      const amount = Number(prime.montant ?? prime.amount ?? prime.value) || 0;
      if (amount > 0) {
        mainTableRows.push([prime.label || prime.name || prime.type || 'Prime', '', '', '', formatCFA(amount), '']);
      }
    });
    if (anyPrime) mainTableRows.push(['', '', '', '', '', '']); // spacer after primes
  }
  
  // Add custom allowances
  if (Array.isArray(indemArr)) {
    const anyInd = indemArr.some(i => (Number(i.montant ?? i.amount ?? i.value) || 0) > 0);
    if (anyInd) mainTableRows.push(['', '', '', '', '', '']); // spacer before indemnities
    indemArr.forEach(indemnite => {
      const amount = Number(indemnite.montant ?? indemnite.amount ?? indemnite.value) || 0;
      if (amount > 0) {
        mainTableRows.push([indemnite.label || indemnite.name || indemnite.type || 'Indemnité', '', '', '', formatCFA(amount), '']);
      }
    });
    if (anyInd) mainTableRows.push(['', '', '', '', '', '']); // spacer after indemnities
  }
  
  if (totalGross > 0) mainTableRows.push(['Salaire brut', '', '', '', formatCFA(totalGross), '']);
  
  // Add deductions
  if (d?.pvid > 0) mainTableRows.push(['PVID (CNPS)', formatCFA(baseSalary), '4,2%', formatCFA(d.pvid), '', '']);
  if (d?.irpp > 0) mainTableRows.push(['IRPP', formatCFA(baseSalary), '', formatCFA(d.irpp), '', '']);
  if (d?.cac > 0) mainTableRows.push(['CAC', '', '', formatCFA(d.cac), '', '']);
  if (d?.cfc > 0) mainTableRows.push(['CFC', '', '', formatCFA(d.cfc), '', '']);
  if (d?.rav > 0) mainTableRows.push(['RAV', '', '', formatCFA(d.rav), '', '']);
  if (d?.tdl > 0) mainTableRows.push(['TDL', '', '', formatCFA(d.tdl), '', '']);
  if (d?.fne > 0) mainTableRows.push(['FNE', '', '', formatCFA(d.fne), '', '']);

  autoTable(doc, {
    startY: currentY,
    head: [['Éléments de paie', 'Base', 'Taux', 'À déduire', 'À payer', 'Charges patronales']],
    body: mainTableRows,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 7, 
      cellPadding: 1.5,
      lineColor: [0, 0, 0], 
      lineWidth: 0.1 
    },
    headStyles: { 
      fillColor: [0, 50, 120], // Dark blue
      textColor: [255, 255, 255], 
      fontSize: 8, 
      fontStyle: 'bold' 
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 20 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 40 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // Net pay section
  doc.setFillColor(0, 50, 120);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Net à payer avant impôt sur le revenu', margin + 5, currentY + 5);
  doc.text(`${formatCFA(netSalary)}`, pageWidth - margin - 40, currentY + 5);
  
  currentY += 12;

  // Final net pay
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Net payé', margin, currentY);
  doc.text(`${formatCFA(netSalary)}`, pageWidth - margin - 40, currentY);
  
  currentY += 15;

  // Summary table at bottom
  const summaryRows = [
    ['Mensuel', '151,67', '', formatCFA(baseSalary), formatCFA(baseSalary), formatCFA(netSalary), formatCFA(totalDeductions), formatCFA(totalGross), formatCFA(netSalary)],
    ['Annuel', '1 820,04', '', formatCFA(baseSalary * 12), formatCFA(baseSalary * 12), formatCFA(netSalary * 12), formatCFA(totalDeductions * 12), formatCFA(totalGross * 12), formatCFA(netSalary * 12)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['', 'Heures', 'Heures suppl', 'Brut', 'Plafond S.S.', 'Net imposable', 'Ch. patronales', 'Coût Global', 'Total versé']],
    body: summaryRows,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 7, 
      cellPadding: 1,
      lineColor: [0, 0, 0], 
      lineWidth: 0.1 
    },
    headStyles: { 
      fillColor: [0, 50, 120], 
      textColor: [255, 255, 255], 
      fontSize: 7, 
      fontStyle: 'bold' 
    },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: 'bold' },
      1: { cellWidth: 15 },
      2: { cellWidth: 15 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
      8: { cellWidth: 20 }
    }
  });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_Enterprise_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  return { completed: true };
}