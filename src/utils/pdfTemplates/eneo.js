// Template ENEO - Format officiel Cameroun optimisé
import autoTable from 'jspdf-autotable';
import { COLORS, FONTS, setFont, hasValue, addLogoWithReservedSpace, getEmployerCustomItems } from './shared';

export function renderEneoPayslip(doc, ctx) {
  
  const {
    pageWidth, pageHeight, margin, payslipData, employerName, employerAddress,
    employerCNPS, employerPhone, emp, empName, empMatricule, empPoste, 
    empCategory, empCNPS, baseSalary, transportAllowance, housingAllowance,
    overtime, bonus, representationAllowance, dirtAllowance, mealAllowance,
    primes, indemnites, d, totalGross, totalDeductions, netSalary, 
    sbt, sbc, displayDate, formatCFA
  } = ctx;

  // Simple number formatter
  const formatNumber = (num) => {
    if (!num || num === 0) return '';
    const rounded = Math.round(num);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  let currentY = margin;

  // Add watermark with company name (filigrane) - centré parfaitement
  const watermarkText = employerName || 'ENEO';
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(70);
  doc.setTextColor(150, 150, 150);
  
  // Centrage parfait au milieu de la page
  const watermarkX = pageWidth / 2;
  const watermarkY = pageHeight / 2;
  
  doc.text(watermarkText, watermarkX, watermarkY, {
    angle: 45,
    align: 'center',
    baseline: 'middle',
    maxWidth: pageWidth * 0.8
  });
  doc.restoreGraphicsState();

  // Logo avec espace réservé
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 35,
    position: 'center',
    reserveSpace: true,
    backgroundColor: [248, 250, 252] // Light blue-gray background
  });

  currentY += 5;

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

  // Main frame with subtle color
  doc.setFillColor(248, 250, 252); // Very light blue-gray
  doc.rect(margin, currentY, pageWidth - 2 * margin, 110, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 110);

  // Header section
  const headerY = currentY + 3;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  
  if (hasValue(periodStart)) doc.text(`Date début de paie: ${periodStart}`, margin + 2, headerY + 4);
  if (hasValue(periodEnd)) doc.text(`Date fin de paie: ${periodEnd}`, margin + 80, headerY + 4);
  if (hasValue(bulletinNum)) doc.text(`N° de bulletin: ${bulletinNum}`, margin + 2, headerY + 8);
  if (hasValue(feuillet)) doc.text(`Feuillet: ${feuillet}`, margin + 80, headerY + 8);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, headerY + 10, pageWidth - margin, headerY + 10);

  // Company information section
  const infoY = headerY + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (hasValue(employerName)) doc.text(`Société: ${employerName}`, margin + 2, infoY + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (hasValue(bp)) doc.text(`${bp}`, margin + 10, infoY + 8);
  if (hasValue(location)) doc.text(`${location}`, margin + 10, infoY + 12);
  if (hasValue(etablis)) doc.text(`Établis: ${etablis}`, margin + 2, infoY + 16);

  // Employee information box with subtle background
  const empBoxX = pageWidth - margin - 75;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (hasValue(empMatricule)) doc.text(`Matricule: ${empMatricule}`, empBoxX, infoY + 4);
  
  doc.setFillColor(235, 240, 245); // Subtle blue
  doc.rect(empBoxX, infoY + 6, 70, 12, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.rect(empBoxX, infoY + 6, 70, 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  if (hasValue(empName)) doc.text(empName, empBoxX + 2, infoY + 12);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const empAddress = employee.address || employee.adresse || '';
  if (hasValue(empAddress)) doc.text(empAddress, empBoxX + 2, infoY + 16);

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, infoY + 20, pageWidth - margin, infoY + 20);

  // Detailed employee information
  const detailY = infoY + 22;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
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
  
  // doc.line(margin, detailY + 25, pageWidth - margin, detailY + 25);

  currentY = detailY + 27;

  // Payslip table data
  const tableData = [];
  const workedDays = Number(payslipData.remuneration?.workedDays) || 30;
  const hoursWorked = (workedDays * 8) / 30;

  const headers = [
    ['Désignations', 'Nbre', 'Base', 'Taux', 'Gain', 'Retenue', 'Taux', 'Retenue(-)']
  ];
  const subHeaders = [
    ['', '', '', 'Part Salariale', '', '', 'Part Patronale', '']
  ];

  // Add salary components
  if (baseSalary > 0) tableData.push(['Salaire de base', hoursWorked.toFixed(2), formatNumber(baseSalary), '', formatNumber(baseSalary), '', '', '']);
  if (housingAllowance > 0) tableData.push(['Indemnité de Logement', hoursWorked.toFixed(2), formatNumber(housingAllowance), '', formatNumber(housingAllowance), '', '', '']);
  if (transportAllowance > 0) tableData.push(['Prime de Transport', hoursWorked.toFixed(2), formatNumber(transportAllowance), '', formatNumber(transportAllowance), '', '', '']);
  if (representationAllowance > 0) tableData.push(['Indemnité de représentation', hoursWorked.toFixed(2), formatNumber(representationAllowance), '', formatNumber(representationAllowance), '', '', '']);
  if (dirtAllowance > 0) tableData.push(['Prime de salissures', hoursWorked.toFixed(2), formatNumber(dirtAllowance), '', formatNumber(dirtAllowance), '', '', '']);
  if (mealAllowance > 0) tableData.push(['Prime de panier', hoursWorked.toFixed(2), formatNumber(mealAllowance), '', formatNumber(mealAllowance), '', '', '']);
  if (overtime > 0) tableData.push(['Heures supplémentaires', '', formatNumber(overtime), '', formatNumber(overtime), '', '', '']);
  if (bonus > 0) tableData.push(['Prime/Bonus', '', formatNumber(bonus), '', formatNumber(bonus), '', '', '']);
  
  // Add custom bonuses
  if (Array.isArray(primes)) {
    primes.forEach(prime => {
      const amount = Number(prime.montant) || 0;
      if (amount > 0) {
        tableData.push([prime.label || 'Prime', '', formatNumber(amount), '', formatNumber(amount), '', '', '']);
      }
    });
  }
  
  // Add custom allowances
  if (Array.isArray(indemnites)) {
    indemnites.forEach(indemnite => {
      const amount = Number(indemnite.montant) || 0;
      if (amount > 0) {
        tableData.push([indemnite.label || 'Indemnité', '', formatNumber(amount), '', formatNumber(amount), '', '', '']);
      }
    });
  }

  // Add deductions
  const deductions = d || {};
  const numValue = (v) => Number(v) || 0;
  if (numValue(deductions.pvid) > 0) tableData.push(['PVID (CNPS)', '', '', '', '', formatNumber(deductions.pvid), '', '']);
  if (numValue(deductions.irpp) > 0) tableData.push(['IRPP', '', formatNumber(sbt), '', '', formatNumber(deductions.irpp), '', '']);
  if (numValue(deductions.cac) > 0) tableData.push(['CAC', '', '', '', '', formatNumber(deductions.cac), '', '']);
  if (numValue(deductions.cfc) > 0) tableData.push(['CFC', '', '', '', '', formatNumber(deductions.cfc), '', '']);
  if (numValue(deductions.rav) > 0) tableData.push(['RAV', '', '', '', '', formatNumber(deductions.rav), '', '']);
  if (numValue(deductions.tdl) > 0) tableData.push(['TDL', '', '', '', '', formatNumber(deductions.tdl), '', '']);
  if (numValue(deductions.fne) > 0) tableData.push(['FNE', '', '', '', '', formatNumber(deductions.fne), '', '']);

  autoTable(doc, {
    startY: currentY,
    head: headers.concat(subHeaders),
    body: tableData,
    theme: 'plain',
    styles: { 
      font: 'helvetica', 
      fontSize: 8,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: { 
      fillColor: [230, 235, 240], // Subtle gray-blue
      textColor: [40, 60, 80],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 52, halign: 'left' },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 24, halign: 'right' }
    },
    didDrawPage: function(data) {
      // Draw only vertical lines between columns (no horizontal lines)
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
      
      // Outer border only
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
      
      // Header borders only (not between data rows)
      const header1EndY = data.table.head[0].cells[0].y + data.table.head[0].cells[0].height;
      const header2EndY = data.table.head[1].cells[0].y + data.table.head[1].cells[0].height;
      doc.line(leftX, header1EndY, rightX, header1EndY);
      doc.line(leftX, header2EndY, rightX, header2EndY);
    },
    margin: { left: margin, right: margin }
  });
  
  currentY = doc.lastAutoTable.finalY + 5;

  // Net pay block with subtle green
  doc.setFillColor(230, 245, 235); // Light green
  doc.rect(margin, currentY, pageWidth - (2 * margin), 10, 'F');
  doc.setDrawColor(100, 150, 120);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, pageWidth - (2 * margin), 10);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 80, 40); // Dark green
  const netText = `NET À PAYER : ${formatNumber(netSalary)} FCFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 6.5);
  
  currentY += 13;

  // Summary section
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const recapY = currentY;
  const colWidth = (pageWidth - 2 * margin) / 4;
  
  doc.text('Brut mensuel', margin, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(totalGross), margin, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Brut imposable', margin + colWidth, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(sbt), margin + colWidth, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Salaire cotis', margin + colWidth * 2, recapY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(sbc), margin + colWidth * 2, recapY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('AV nature', margin + colWidth * 3, recapY);
  doc.setFont('helvetica', 'normal');
  const avNature = (representationAllowance + dirtAllowance + mealAllowance) || 0;
  doc.text(formatNumber(avNature), margin + colWidth * 3, recapY + 4);

  const fileName = `ENEO_Bulletin_${(empName || 'Employe').replace(/[^a-zA-Z0-9]/g, "_")}_${String(payslipData.payPeriod || 'N_A').replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  return { completed: true };
}

export default renderEneoPayslip;