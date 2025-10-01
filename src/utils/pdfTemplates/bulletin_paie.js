// Template Bulletin de Paie - Style français avec en-tête jaune
import autoTable from 'jspdf-autotable';
import { COLORS, FONTS, setFont, hasValue, addLogoWithReservedSpace, getEmployerCustomItems } from './shared';

export function renderBulletinPaieTemplate(doc, ctx) {
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
    totalGross,
    totalDeductions,
    netSalary,
    d,
    formatCFA,
  } = ctx;

  let currentY = margin;
  
  // Espace logo à gauche avec informations entreprise
  const logoY = currentY;
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 28,
    position: 'left',
    reserveSpace: true
  });

  // Header avec numérotation améliorée (à côté du logo)
  setFont(doc, { family: 'helvetica', style: 'bold', size: 16 });
  doc.setTextColor(...COLORS.black);
  doc.text('BULLETIN DE PAIE', margin + 35, logoY + 15);
  
  // Numéro de bulletin dynamique
  const bulletinNum = payslipData?.bulletinNum || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  setFont(doc, FONTS.normal);
  doc.text(`N° ${bulletinNum}`, pageWidth - margin - 40, logoY + 8);
  doc.text(`Période: ${payslipData.payPeriod || '—'}`, pageWidth - margin - 40, logoY + 15);

  currentY += 8;

  // Boîte entreprise avec design amélioré
  doc.setFillColor(...COLORS.yellow);
  doc.setLineWidth(0.5);
  doc.rect(margin, currentY, 105, 28, 'FD');
  
  setFont(doc, FONTS.header);
  doc.setTextColor(...COLORS.black);
  if (hasValue(employerName)) doc.text(employerName, margin + 3, currentY + 6);
  
  setFont(doc, FONTS.small);
  if (hasValue(employerAddress)) doc.text(employerAddress, margin + 3, currentY + 11);
  if (hasValue(payslipData.employer?.city)) doc.text(payslipData.employer.city, margin + 3, currentY + 16);
  if (hasValue(employerCNPS)) doc.text(`SIRET: ${employerCNPS}`, margin + 3, currentY + 21);
  if (hasValue(employerPhone)) doc.text(`Tél: ${employerPhone}`, margin + 3, currentY + 26);

  // Informations employé - Boîte alignée avec logo à droite
  const empBoxX = pageWidth - margin - 75;
  currentY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize: 20,
    position: 'right',
    reserveSpace: false
  }) - 28; // Retour pour alignment avec la boîte

  doc.setLineWidth(0.3);
  doc.rect(empBoxX, currentY, 75, 28, 'S');
  
  setFont(doc, FONTS.header);
  if (hasValue(empName)) doc.text(empName, empBoxX + 3, currentY + 6);
  
  setFont(doc, FONTS.small);
  const empAddress = emp.address || emp.adresse;
  if (hasValue(empAddress)) doc.text(empAddress, empBoxX + 3, currentY + 11);
  if (hasValue(emp.city)) doc.text(emp.city, empBoxX + 3, currentY + 16);
  if (hasValue(empMatricule)) doc.text(`Mat: ${empMatricule}`, empBoxX + 3, currentY + 21);
  if (hasValue(empCNPS)) doc.text(`N° SS: ${empCNPS}`, empBoxX + 3, currentY + 26);

  currentY += 35;

  // Détails emploi en colonnes organisées
  setFont(doc, FONTS.small);
  const leftCol = margin;
  const rightCol = pageWidth - margin - 85;
  
  if (hasValue(employerName)) doc.text(`Établissement: ${employerName}`, leftCol, currentY);
  if (hasValue(empMatricule)) doc.text(`Matricule: ${empMatricule}`, rightCol, currentY);
  currentY += 5;
  
  if (hasValue(payslipData.payPeriod)) doc.text(`Période: ${payslipData.payPeriod}`, leftCol, currentY);
  if (hasValue(empPoste)) doc.text(`Emploi: ${empPoste}`, rightCol, currentY);
  currentY += 5;
  
  if (hasValue(payslipData.generatedAt)) {
    const payDate = new Date(payslipData.generatedAt).toLocaleDateString('fr-FR');
    doc.text(`Payé le: ${payDate}`, leftCol, currentY);
  }
  if (hasValue(empCategory)) doc.text(`Catégorie: ${empCategory}`, rightCol, currentY);
  currentY += 10;

  // Table principale optimisée avec primes personnalisées
  const tableData = [];
  
  // Section gains avec séparateurs visuels
  tableData.push([]);
  
  if (baseSalary > 0) tableData.push(['Salaire de base', '', '', formatCFA(baseSalary), '', 'Mensuel']);
  
  // Primes personnalisées par employeur avec regroupement
  const customPrimes = getEmployerCustomItems(payslipData?.employer?.id, 'primes');
  if (customPrimes.length > 0) {
    customPrimes.forEach(prime => {
      const montant = Number(prime.montant) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || prime.name || 'Prime';
        const description = prime.description ? ` (${prime.description})` : '';
        tableData.push([`${label}${description}`, '', '', formatCFA(montant), '', prime.frequency || 'Variable']);
      }
    });
  }
  
  // Indemnités personnalisées par employeur avec regroupement
  const customIndemnites = getEmployerCustomItems(payslipData?.employer?.id, 'indemnites');
  if (customIndemnites.length > 0) {
    tableData.push([]);
    customIndemnites.forEach(indemnite => {
      const montant = Number(indemnite.montant) || 0;
      if (montant > 0) {
        const label = indemnite.label || indemnite.type || indemnite.name || 'Indemnité';
        const description = indemnite.description ? ` (${indemnite.description})` : '';
        tableData.push([`${label}${description}`, '', '', formatCFA(montant), '', indemnite.frequency || 'Fixe']);
      }
    });
  }
  
  // Total gains
  tableData.push([]);
  tableData.push(['TOTAL GAINS', '', '', formatCFA(totalGross), '', 'F CFA']);
  tableData.push(['', '', '', '', '', '']);

  // Section retenues
  const hasDeductions = d?.pvid > 0 || d?.irpp > 0 || d?.cac > 0 || d?.cfc > 0 || d?.rav > 0 || d?.tdl > 0 || d?.fne > 0;
  if (hasDeductions) {
    tableData.push(['RETENUES']);
    
    if (d?.pvid > 0) tableData.push(['PVID (CNPS)', formatCFA(baseSalary), '4,2%', formatCFA(d.pvid), '', 'Salarié']);
    if (d?.irpp > 0) tableData.push(['IRPP', '', 'Variable', formatCFA(d.irpp), '', 'Progressif']);
    if (d?.cac > 0) tableData.push(['CAC', '', '', formatCFA(d.cac), '', 'Fixe']);
    if (d?.cfc > 0) tableData.push(['CFC', formatCFA(totalGross), '1%', formatCFA(d.cfc), '', 'Proportionnel']);
    if (d?.rav > 0) tableData.push(['RAV', '', '', formatCFA(d.rav), '', 'Variable']);
    if (d?.tdl > 0) tableData.push(['TDL', formatCFA(d.irpp), '10%', formatCFA(d.tdl), '', 'IRPP']);
    if (d?.fne > 0) tableData.push(['FNE', '', '', formatCFA(d.fne), '', 'Formation']);
    
    tableData.push([]);
    tableData.push(['TOTAL RETENUES', '', '', formatCFA(totalDeductions), '', 'F CFA']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Désignation', 'Base', 'Taux', 'Montant', 'Cumul', 'Nature']],
    body: tableData,
    theme: 'grid',
    styles: { 
      font: 'helvetica', 
      fontSize: 8, 
      cellPadding: 2, 
      lineColor: COLORS.black, 
      lineWidth: 0.2,
      textColor: COLORS.black
    },
    headStyles: { 
      fillColor: COLORS.darkGray, 
      textColor: COLORS.white, 
      fontSize: 8, 
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 55, halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    didParseCell: function(data) {
      // Coloration des lignes de séparation
      if (data.cell.text[0]?.includes('═══')) {
        data.cell.styles.fillColor = COLORS.headerGray;
        data.cell.styles.fontStyle = 'bold';
      } else if (data.cell.text[0]?.includes('───')) {
        if (data.cell.text[0].includes('Spécifiques')) {
          data.cell.styles.fillColor = COLORS.blue;
        } else {
          data.cell.styles.fillColor = COLORS.lightGray;
        }
      }
      // Coloration des montants
      if (data.column.index === 3 && data.cell.text[0]?.includes('F CFA')) {
        data.cell.styles.fillColor = data.row.index < tableData.length / 2 ? COLORS.gains : COLORS.deductions;
      }
    }
  });

  currentY = doc.lastAutoTable.finalY + 12;

  // Net à payer premium
  doc.setFillColor(...COLORS.black);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 12, 'F');
  doc.setLineWidth(0.8);
  doc.rect(margin - 1, currentY - 1, pageWidth - 2 * margin + 2, 14, 'S');
  
  setFont(doc, { family: 'helvetica', style: 'bold', size: 14 });
  doc.setTextColor(...COLORS.white);
  const netText = `NET À PAYER: ${formatCFA(netSalary)} F CFA`;
  const netTextWidth = doc.getTextWidth(netText);
  doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 8);

  const fileName = `Bulletin_Paie_${(empName || 'Employe').replace(/[^a-zA-Z0-9]/g, "_")}_${(payslipData.payPeriod || 'N_A').replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(fileName);
  return { completed: true };
}

export default renderBulletinPaieTemplate;
