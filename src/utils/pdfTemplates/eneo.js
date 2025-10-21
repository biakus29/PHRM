// eneoTemplate.js
// Template ENEO standard avec colonnes sans lignes horizontales

import autoTable from 'jspdf-autotable';
import { addLogoWithReservedSpace } from './shared';

export function renderEneoPayslip(doc, ctx) {
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

  // Logo (via util partagé)
  currentY = addLogoWithReservedSpace(doc, payslipData, PW, margin, currentY, {
    logoSize: 25,
    position: 'left',
    reserveSpace: true
  }) + 8;

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(60, 60, 60);
  doc.text('BULLETIN DE SALAIRE', PW / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, PW / 2, currentY, { align: 'center' });

  currentY += 12;

  // Cadre info général
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, PW - 2 * margin, 55, 'F');
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, PW - 2 * margin, 55);

  let infoY = currentY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  // Dates
  doc.text(`Date début : ${payslipData.startDate || '01/01/2020'}`, margin + 3, infoY);
  doc.text(`Date fin : ${payslipData.endDate || '31/01/2020'}`, margin + 80, infoY);
  infoY += 4;
  doc.text(`N° bulletin : ${payslipData.bulletinNum || 'AUTO-001'}`, margin + 3, infoY);
  doc.text(`Feuillet : ${payslipData.feuillet || '1/1'}`, margin + 80, infoY);

  infoY += 8;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, infoY, PW - margin, infoY);

  infoY += 5;
  // Société
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`Société : ${employerName || 'ENTREPRISE'}`, margin + 3, infoY);
  
  infoY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (employerAddress) {
    doc.text(employerAddress, margin + 5, infoY);
    infoY += 4;
  }
  if (payslipData.employer?.city) {
    doc.text(payslipData.employer.city, margin + 5, infoY);
  }

  // Encadré salarié
  const empBoxX = PW - margin - 75;
  const empBoxY = currentY + 20;
  
  doc.setFillColor(235, 240, 245);
  doc.rect(empBoxX, empBoxY, 70, 18, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.3);
  doc.rect(empBoxX, empBoxY, 70, 18);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(empName || 'NOM Prénom', empBoxX + 3, empBoxY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Matricule : ${payslipData.employee?.matricule || ''}`, empBoxX + 3, empBoxY + 10);
  doc.text(`Poste : ${empPoste || ''}`, empBoxX + 3, empBoxY + 14);

  infoY = empBoxY + 22;
  doc.setFontSize(7);
  doc.text(`N° CNPS : ${empCNPS || ''}`, margin + 3, infoY);
  infoY += 4;
  doc.text(`Département : ${payslipData.employee?.department || ''}`, margin + 3, infoY);

  currentY += 60;

  // TABLEAU GAINS
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
    head: [['ÉLÉMENTS DE RÉMUNÉRATION', 'BASE', 'TAUX', 'MONTANT (XAF)']],
    body: gainsData,
    foot: [['TOTAL BRUT', '', '', formatNumber(totalGross)]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: {
      fillColor: [230, 235, 240],
      textColor: [40, 60, 80],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [248, 250, 252],
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
      
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.setLineWidth(0.5);
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 5;

  // TABLEAU DÉDUCTIONS
  const deductionsData = [];
  
  if (d?.pvid > 0) deductionsData.push(['PVID (CNPS)', formatNumber(baseSalary), '4,2%', formatNumber(d.pvid)]);
  if (d?.irpp > 0) deductionsData.push(['IRPP', '', '', formatNumber(d.irpp)]);
  if (d?.cac > 0) deductionsData.push(['CAC', '', '', formatNumber(d.cac)]);
  if (d?.cfc > 0) deductionsData.push(['CFC', '', '', formatNumber(d.cfc)]);
  if (d?.rav > 0) deductionsData.push(['RAV', '', '', formatNumber(d.rav)]);
  if (d?.tdl > 0) deductionsData.push(['TDL', '', '', formatNumber(d.tdl)]);
  if (d?.fne > 0) deductionsData.push(['FNE', '', '', formatNumber(d.fne)]);

  autoTable(doc, {
    startY: currentY,
    head: [['DÉDUCTIONS ET RETENUES', 'BASE', 'TAUX', 'MONTANT (XAF)']],
    body: deductionsData,
    foot: [['TOTAL RETENUES', '', '', formatNumber(totalDeductions)]],
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      lineWidth: 0
    },
    headStyles: {
      fillColor: [230, 235, 240],
      textColor: [40, 60, 80],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [248, 250, 252],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' }
    },
    didDrawPage: function(data) {
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
      
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.setLineWidth(0.5);
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // NET À PAYER
  doc.setFillColor(230, 245, 235);
  doc.rect(margin, currentY, PW - 2 * margin, 12, 'F');
  doc.setDrawColor(100, 150, 120);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, PW - 2 * margin, 12);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 80, 40);
  const netText = `NET À PAYER : ${formatNumber(netSalary)} XAF`;
  doc.text(netText, PW / 2, currentY + 8, { align: 'center' });

  currentY += 16;

  // Récapitulatif
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const colWidth = (PW - 2 * margin) / 4;
  
  doc.text('Brut mensuel', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(totalGross), margin, currentY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('SBT', margin + colWidth, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(payslipData.sbt || totalGross), margin + colWidth, currentY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('SBC', margin + colWidth * 2, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatNumber(payslipData.sbc || baseSalary), margin + colWidth * 2, currentY + 4);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Heures', margin + colWidth * 3, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(String(payslipData.workedDays || 30), margin + colWidth * 3, currentY + 4);

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_ENEO_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  
  return { completed: true };
}

export default renderEneoPayslip;