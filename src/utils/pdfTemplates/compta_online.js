// comptaOnlineTemplate.js
// Template simple avec colonnes, sans lignes, couleurs standards

import autoTable from 'jspdf-autotable';
import { addLogoWithReservedSpace } from './shared';

export function renderComptaOnlineTemplate(doc, ctx) {
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

  // ============================================
  // FILIGRANE ENTREPRISE (gris, 3 fois)
  // ============================================
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

  // ============================================
  // LOGO ENTREPRISE (via util partagé, espace réservé)
  // ============================================
  currentY = addLogoWithReservedSpace(doc, payslipData, PW, margin, currentY, {
    logoSize: 28,
    position: 'left',
    reserveSpace: true
  });

  // ============================================
  // TITRE (centré)
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('BULLETIN DE SALAIRE', PW / 2, currentY + 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, PW / 2, currentY + 12, { align: 'center' });

  currentY += 20;

  // ============================================
  // INFORMATIONS EMPLOYEUR (Gauche)
  // ============================================
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, 85, 28);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(employerName || 'ENTREPRISE', margin + 3, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  if (employerAddress) doc.text(employerAddress, margin + 3, currentY + 10);
  if (payslipData.employer?.city) doc.text(payslipData.employer.city, margin + 3, currentY + 14);
  if (payslipData.employer?.siret) doc.text(`Siret : ${payslipData.employer.siret}`, margin + 3, currentY + 19);
  if (payslipData.employer?.naf) doc.text(`NAF : ${payslipData.employer.naf}`, margin + 3, currentY + 24);

  // ============================================
  // INFORMATIONS SALARIÉ (Droite)
  // ============================================
  doc.setFillColor(90, 90, 90);
  doc.rect(PW - margin - 75, currentY, 75, 28, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(empName || 'NOM Prénom', PW - margin - 72, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Matricule : ${payslipData.employee?.matricule || ''}`, PW - margin - 72, currentY + 11);
  doc.text(`Poste : ${empPoste || ''}`, PW - margin - 72, currentY + 17);
  if (payslipData.employee?.department) {
    doc.text(`Dépt : ${payslipData.employee.department}`, PW - margin - 72, currentY + 23);
  }

  currentY += 32;

  // ============================================
  // INFOS COMPLÉMENTAIRES
  // ============================================
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('N° CNPS :', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(empCNPS || '', margin + 17, currentY);
  
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Jours travaillés :', margin, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payslipData.workedDays || 30} jours`, margin + 28, currentY);

  currentY += 8;

  // ============================================
  // TABLEAU PRINCIPAL - Colonnes uniquement
  // ============================================
  const mainTableData = [];
  
  mainTableData.push(['REMUNERATION', '', '', '']);
  mainTableData.push(['Salaire de base', formatNumber(baseSalary), '', formatNumber(baseSalary)]);
  
  const heuresSup = payslipData.overtimeHours || 0;
  if (heuresSup > 0) {
    mainTableData.push(['Heures supplémentaires', '', '', formatNumber(heuresSup)]);
  }
  
  if (primesArr.length > 0) {
    mainTableData.push(['PRIMES', '', '', '']);
    primesArr.forEach(prime => {
      const label = prime.label || prime.name || 'Prime';
      const amount = Number(prime.montant ?? prime.amount ?? 0);
      if (amount > 0) {
        mainTableData.push([label, '', '', formatNumber(amount)]);
      }
    });
  }
  
  if (indemArr.length > 0) {
    mainTableData.push(['INDEMNITES', '', '', '']);
    indemArr.forEach(indemnite => {
      const label = indemnite.label || indemnite.name || 'Indemnité';
      const amount = Number(indemnite.montant ?? indemnite.amount ?? 0);
      if (amount > 0) {
        mainTableData.push([label, '', '', formatNumber(amount)]);
      }
    });
  }
  
  const sbt = payslipData.sbt || totalGross;
  mainTableData.push(['SBT (Salaire Brut Taxable)', '', '', formatNumber(sbt)]);
  
  mainTableData.push(['DEDUCTIONS', '', '', '']);
  
  if (d?.pvid > 0) mainTableData.push(['PVID (CNPS)', formatNumber(baseSalary), '4,2%', formatNumber(d.pvid)]);
  if (d?.irpp > 0) mainTableData.push(['IRPP', '', '', formatNumber(d.irpp)]);
  if (d?.cac > 0) mainTableData.push(['CAC', '', '', formatNumber(d.cac)]);
  if (d?.cfc > 0) mainTableData.push(['CFC', '', '', formatNumber(d.cfc)]);
  if (d?.rav > 0) mainTableData.push(['RAV', '', '', formatNumber(d.rav)]);
  if (d?.tdl > 0) mainTableData.push(['TDL', '', '', formatNumber(d.tdl)]);
  if (d?.fne > 0) mainTableData.push(['FNE', '', '', formatNumber(d.fne)]);
  
  mainTableData.push(['TOTAL DEDUCTIONS', '', '', formatNumber(totalDeductions)]);

  autoTable(doc, {
    startY: currentY,
    head: [['Libellé', 'Base', 'Taux', 'Montant (XAF)']],
    body: mainTableData,
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      lineWidth: 0 // Pas de lignes horizontales
    },
    headStyles: {
      fillColor: [100, 100, 100], // Gris foncé
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0
    },
    columnStyles: {
      0: { cellWidth: 90, halign: 'left' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: function(data) {
      // SEULEMENT des lignes verticales entre colonnes
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      
      const tableStartY = data.table.head[0].cells[0].y;
      const tableEndY = data.cursor.y;
      
      let currentX = data.settings.margin.left;
      data.table.columns.forEach((col, index) => {
        currentX += col.width;
        if (index < data.table.columns.length - 1) {
          // Lignes verticales uniquement
          doc.line(currentX, tableStartY, currentX, tableEndY);
        }
      });
      
      // Bordure extérieure du tableau
      const leftX = data.settings.margin.left;
      const rightX = currentX;
      doc.setLineWidth(0.5);
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // ============================================
  // NET À PAYER (gris)
  // ============================================
  doc.setFillColor(220, 220, 220);
  doc.rect(margin, currentY, PW - 2 * margin, 14, 'F');
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, PW - 2 * margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('NET À PAYER', margin + 3, currentY + 9);
  doc.text(`${formatNumber(netSalary)} XAF`, PW - margin - 3, currentY + 9, { align: 'right' });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Bulletin_ComptaOnline_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  
  return { completed: true };
}