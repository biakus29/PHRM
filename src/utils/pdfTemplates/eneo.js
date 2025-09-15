// eneoTemplate.js
// Official ENEO payslip template with detailed structure

import autoTable from 'jspdf-autotable';
import { validatePayslipData, sanitizeFileName } from './templateRegistry.js';

export function renderEneoTemplate(doc, ctx) {
  validatePayslipData(ctx.payslipData);
  
  const {
    pageWidth, pageHeight, margin, payslipData, employerName, employerAddress,
    employerCNPS, employerPhone, emp, empName, empMatricule, empPoste, 
    empCategory, empCNPS, baseSalary, transportAllowance, housingAllowance,
    overtime, bonus, representationAllowance, dirtAllowance, mealAllowance,
    primes, indemnites, d, totalGross, totalDeductions, netSalary, 
    sbt, sbc, displayDate, formatCFA
  } = ctx;

  let currentY = margin;

  // Helper function to check valid data
  const hasValue = (value) => {
    return value !== undefined && value !== null && 
           String(value).trim() !== '' && 
           !['N/A', '—', 'null', 'undefined'].includes(String(value).trim());
  };

  // Compute period dates
  let periodStart = '';
  let periodEnd = '';
  try {
    const period = String(payslipData.payPeriod || '').trim();
    if (/^\d{4}-\d{2}$/.test(period)) {
      const [year, month] = period.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      const pad = (n) => String(n).padStart(2, '0');
      periodStart = `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}/${startDate.getFullYear()}`;
      periodEnd = `${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)}/${endDate.getFullYear()}`;
    }
  } catch (e) {
    // Use raw period if parsing fails
    periodStart = payslipData.payPeriod || '';
    periodEnd = payslipData.payPeriod || '';
  }

  // Document metadata
  const bulletinNum = payslipData?.bulletinNum || 'AUTO-' + Date.now().toString().slice(-6);
  const feuillet = payslipData?.feuillet || '1 / 1';
  const bp = payslipData.employer?.bp || `B.P. ${payslipData.employer?.city || ''}`;
  const location = payslipData.employer?.location || payslipData.employer?.city || '';
  const etablis = payslipData.employer?.etablis || payslipData.employer?.name || employerName;
  
  // Employee data with fallbacks
  const employee = payslipData.employee || emp || {};
  const niu = employee.niu || employee.matricule || empMatricule || '';
  const anciennete = employee.anciennete || employee.ancienneté || '';
  const category = employee.category || employee.professionalCategory || empCategory || '';
  const classification = employee.classification || employee.grade || '';
  const horaireRef = employee.horaireRef || '173,33';
  const dateDebut = payslipData.employer?.dateDebut || employee.dateEmbauche || '';

  // Main frame
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 120);

  // Header section
  const headerY = currentY + 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  if (hasValue(periodStart)) doc.text(`Date début de paie: ${periodStart}`, margin + 2, headerY + 4);
  if (hasValue(periodEnd)) doc.text(`Date fin de paie: ${periodEnd}`, margin + 80, headerY + 4);
  if (hasValue(bulletinNum)) doc.text(`N° de bulletin: ${bulletinNum}`, margin + 2, headerY + 8);
  if (hasValue(feuillet)) doc.text(`Feuillet: ${feuillet}`, margin + 80, headerY + 8);
  
  doc.line(margin, headerY + 10, pageWidth - margin, headerY + 10);

  // Company information section
  const infoY = headerY + 12;
  if (hasValue(employerName)) doc.text(`Société: ${employerName}`, margin + 2, infoY + 4);
  if (hasValue(bp)) doc.text(`${bp}`, margin + 10, infoY + 8);
  if (hasValue(location)) doc.text(`${location}`, margin + 10, infoY + 12);
  if (hasValue(etablis)) doc.text(`Établis: ${etablis}`, margin + 2, infoY + 16);

  // Employee information box
  const empBoxX = pageWidth - margin - 80;
  if (hasValue(empMatricule)) doc.text(`Matricule: ${empMatricule}`, empBoxX, infoY + 4);
  
  doc.setFillColor(220, 220, 220);
  doc.rect(empBoxX, infoY + 6, 75, 12, 'F');
  doc.setFont('helvetica', 'bold');
  if (hasValue(empName)) doc.text(empName, empBoxX + 2, infoY + 12);
  doc.setFont('helvetica', 'normal');
  
  const empAddress = employee.address || employee.adresse || '';
  if (hasValue(empAddress)) doc.text(empAddress, empBoxX + 2, infoY + 16);

  doc.line(margin, infoY + 20, pageWidth - margin, infoY + 20);

  // Detailed employee information
  const detailY = infoY + 22;
  doc.setFontSize(7);
  if (hasValue(niu)) doc.text(`NIU: ${niu}`, margin + 2, detailY + 3);
  if (hasValue(horaireRef)) doc.text(`Horaire Ref. Mensuelle: ${horaireRef}`, pageWidth - margin - 60, detailY + 3);
  if (hasValue(employerName)) doc.text(`Convention Collective ${employerName}`, margin + 2, detailY + 7);
  if (hasValue(employerCNPS) || hasValue(dateDebut)) {
    doc.text(`N° Sec Soc: ${employerCNPS || ''} Date de début: ${dateDebut || ''}`, margin + 2, detailY + 11);
  }
  if (hasValue(dateDebut) || hasValue(anciennete) || hasValue(category)) {
    doc.text(`Date anciennetés groupe: ${dateDebut || ''} Ancienneté: ${anciennete || ''} Catégorie: ${category || ''}`, margin + 2, detailY + 15);
  }
  
  const dept = employee.department || employee.departement || '';
  if (hasValue(dept) || hasValue(classification)) {
    doc.text(`U. Travail: ${dept || ''} Classification: ${classification || ''}`, margin + 2, detailY + 19);
  }
  if (hasValue(empPoste)) doc.text(`Poste: ${empPoste}`, margin + 2, detailY + 23);
  
  doc.line(margin, detailY + 25, pageWidth - margin, detailY + 25);

  currentY = detailY + 27;

  // Payslip table data
  const tableData = [];
  const workedDays = Number(payslipData.remuneration?.workedDays) || 30;
  const hoursWorked = (workedDays * 8) / 30;

  const headers = [
    ['Désignationss', 'Nbre', 'Base', 'Taux', 'Gain', 'Retenue', 'Taux', 'Retenue(-)']
  ];
  const subHeaders = [
    ['', '', '', 'Part Salariale', '', '', 'Part Patronale', '']
  ];

  // Add salary components
  if (baseSalary > 0) tableData.push(['Salaire de base', hoursWorked.toFixed(2), formatCFA(baseSalary), '', formatCFA(baseSalary), '', '', '']);
  if (housingAllowance > 0) tableData.push(['Indemnité de Logement', hoursWorked.toFixed(2), formatCFA(housingAllowance), '', formatCFA(housingAllowance), '', '', '']);
  if (transportAllowance > 0) tableData.push(['Prime de Transport', hoursWorked.toFixed(2), formatCFA(transportAllowance), '', formatCFA(transportAllowance), '', '', '']);
  if (representationAllowance > 0) tableData.push(['Indemnité de représentation', hoursWorked.toFixed(2), formatCFA(representationAllowance), '', formatCFA(representationAllowance), '', '', '']);
  if (dirtAllowance > 0) tableData.push(['Prime de salissures', hoursWorked.toFixed(2), formatCFA(dirtAllowance), '', formatCFA(dirtAllowance), '', '', '']);
  if (mealAllowance > 0) tableData.push(['Prime de panier', hoursWorked.toFixed(2), formatCFA(mealAllowance), '', formatCFA(mealAllowance), '', '', '']);
  if (overtime > 0) tableData.push(['Heures supplémentaires', '', formatCFA(overtime), '', formatCFA(overtime), '', '', '']);
  if (bonus > 0) tableData.push(['Prime/Bonus', '', formatCFA(bonus), '', formatCFA(bonus), '', '', '']);
  
  // Add custom bonuses
  if (Array.isArray(primes)) {
    primes.forEach(prime => {
      const amount = Number(prime.montant) || 0;
      if (amount > 0) {
        tableData.push([prime.label || 'Prime', '', formatCFA(amount), '', formatCFA(amount), '', '', '']);
      }
    });
  }
  
  // Add custom allowances
  if (Array.isArray(indemnites)) {
    indemnites.forEach(indemnite => {
      const amount = Number(indemnite.montant) || 0;
      if (amount > 0) {
        tableData.push([indemnite.label || 'Indemnité', '', formatCFA(amount), '', formatCFA(amount), '', '', '']);
      }
    });
  }

  // Add deductions
  const deductions = d || {};
  const numValue = (v) => Number(v) || 0;
  if (numValue(deductions.pvid) > 0) tableData.push(['PVID (CNPS)', '', '', '', '', formatCFA(deductions.pvid), '', '']);
  if (numValue(deductions.irpp) > 0) tableData.push(['IRPP', '', formatCFA(sbt), '', '', formatCFA(deductions.irpp), '', '']);
  if (numValue(deductions.cac) > 0) tableData.push(['CAC', '', '', '', '', formatCFA(deductions.cac), '', '']);
  if (numValue(deductions.cfc) > 0) tableData.push(['CFC', '', '', '', '', formatCFA(deductions.cfc), '', '']);
  if (numValue(deductions.rav) > 0) tableData.push(['RAV', '', '', '', '', formatCFA(deductions.rav), '', '']);
  if (numValue(deductions.tdl) > 0) tableData.push(['TDL', '', '', '', '', formatCFA(deductions.tdl), '', '']);
  if (numValue(deductions.fne) > 0) tableData.push(['FNE', '', '', '', '', formatCFA(deductions.fne), '', '']);

  autoTable(doc, {
    startY: currentY,
    head: headers.concat(subHeaders),
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 7, 
      cellPadding: 1, 
      lineColor: [0, 0, 0], 
      lineWidth: 0.3 
    },
    headStyles: { 
      fillColor: [200, 200, 200], 
      textColor: [0, 0, 0], 
      fontSize: 7, 
      fontStyle: 'bold', 
      halign: 'center' 
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'right', fillColor: [200, 255, 200] },
      5: { cellWidth: 25, halign: 'right', fillColor: [255, 200, 200] },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = doc.lastAutoTable.finalY + 2;

  // Net pay block
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  const netText = `NET À PAYER : ${formatCFA(netSalary)} F CFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 6.5);
  currentY += 15;

  // Summary section
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const recapY = currentY;
  const colWidth = (pageWidth - 2 * margin) / 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Brut mensuel', margin, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCFA(totalGross), margin, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Brut imposable', margin + colWidth, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCFA(sbt), margin + colWidth, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Salaire cotis', margin + colWidth * 2, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatCFA(sbc), margin + colWidth * 2, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('AV nature', margin + colWidth * 3, recapY);
  doc.setFont('helvetica', 'normal');
  const avNature = (representationAllowance + dirtAllowance + mealAllowance) || 0;
  doc.text(formatCFA(avNature), margin + colWidth * 3, recapY + 4);

  const fileName = sanitizeFileName(empName, payslipData.payPeriod);
  doc.save(fileName);
  return { completed: true };
}