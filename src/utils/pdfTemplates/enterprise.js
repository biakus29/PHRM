// enterprise.js
// Template de fiche de paie avec alternance bleu ciel/blanc

import autoTable from 'jspdf-autotable';
import { addLogoWithReservedSpace } from './shared';

export function renderEnterpriseTemplate(doc, ctx) {
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

  const employer = (payslipData && payslipData.employer) || {};
  const companyName = employerName || employer.name || employer.companyName || employer.raisonSociale || 'ENTREPRISE';
  const companyAddress = employerAddress || employer.address || ((employer.addressLine1 || '') + (employer.addressLine2 ? ' ' + employer.addressLine2 : '')) || employer.adresse || '';
  const companyCity = employer.city || employer.ville || '';
  const companySiret = employer.siret || employer.siren || employer.rc || '';
  const companyNaf = employer.naf || employer.ape || '';
  const companyPhone = employer.phone || employer.telephone || '';
  const companyEmail = employer.email || '';
  const companyCNPS = employer.cnpsNumber || employer.cnps || ctx.employerCNPS || '';

  const logoCandidate = (payslipData && payslipData.logo) || employer.logo || employer.logoDataUrl || employer.logoBase64 || '';
  const isDataUrl = typeof logoCandidate === 'string' && /^data:image\/(png|jpe?g);base64,/i.test(logoCandidate);
  const imageType = isDataUrl && /jpeg|jpg/i.test(logoCandidate) ? 'JPEG' : 'PNG';

  let currentY = margin;

  // Zone/logo en haut à gauche: d'abord via util partagé (localStorage), puis fallback data URL, sinon placeholder
  const logoSize = 25;
  const logoX = margin;
  const logoY = currentY;

  const employerId = payslipData?.employer?.id;
  const nextY = addLogoWithReservedSpace(doc, payslipData, pageWidth, margin, currentY, {
    logoSize,
    position: 'left',
    reserveSpace: true
  });

  // Déterminer si un logo a été trouvé via localStorage
  let hadLocalStorageLogo = false;
  try {
    if (employerId) {
      hadLocalStorageLogo = !!localStorage.getItem(`logo_${employerId}`);
    }
  } catch {}

  if (!hadLocalStorageLogo) {
    if (isDataUrl) {
      try {
        doc.addImage(logoCandidate, imageType, logoX, logoY, logoSize, logoSize);
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
    } else {
      // Placeholder si aucun logo utilisable
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

  currentY = nextY; // avancer après la zone logo réservée

  // Filigrane de l'entreprise répété - bien visible
  const watermarkText = companyName || 'ENTREPRISE';
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(60);
  doc.setTextColor(100, 100, 100); // Gris simple
  
  // Filigrane en diagonale - répété 3 fois verticalement
  const watermarkX = pageWidth / 2;
  
  // Premier filigrane (haut)
  doc.text(watermarkText, watermarkX, pageHeight * 0.25, {
    angle: 45,
    align: 'center',
    baseline: 'middle',
    maxWidth: pageWidth * 0.7
  });
  
  // Deuxième filigrane (milieu)
  doc.text(watermarkText, watermarkX, pageHeight * 0.5, {
    angle: 45,
    align: 'center',
    baseline: 'middle',
    maxWidth: pageWidth * 0.7
  });
  
  // Troisième filigrane (bas)
  doc.text(watermarkText, watermarkX, pageHeight * 0.75, {
    angle: 45,
    align: 'center',
    baseline: 'middle',
    maxWidth: pageWidth * 0.7
  });
  
  doc.restoreGraphicsState();

  // Remettre la couleur du texte à noir pour la suite
  doc.setTextColor(0, 0, 0);

  // ============================================
  // SECTION INFORMATIONS EMPLOYEUR (Gauche)
  // ============================================
  doc.setDrawColor(80, 80, 80); // Gris foncé
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, currentY, 85, 30, 2, 2);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(companyName || 'ENTREPRISE', margin + 3, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  if (companyAddress) doc.text(companyAddress, margin + 3, currentY + 10);
  if (companyCity) doc.text(companyCity, margin + 3, currentY + 14);
  if (companySiret) doc.text(`Siret : ${companySiret}`, margin + 3, currentY + 19);
  if (companyNaf) doc.text(`Code NAF : ${companyNaf}`, margin + 3, currentY + 24);
  if (companyCNPS) {
    // Ajouter CNPS sous la ligne NAF si présent
    doc.text(`CNPS : ${companyCNPS}`, margin + 3, currentY + 29);
  }

  // ============================================
  // TITRE ET PÉRIODE (Droite)
  // ============================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60); // Gris foncé simple
  doc.text('FICHE DE PAIE', pageWidth - margin - 2, currentY + 8, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${payslipData.payPeriod || 'Non spécifiée'}`, pageWidth - margin - 2, currentY + 16, { align: 'right' });
  doc.text(`Date : ${payslipData.generationDate || new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 2, currentY + 22, { align: 'right' });

  currentY += 35;

  // ============================================
  // SECTION INFORMATIONS SALARIÉ (Droite)
  // ============================================
  doc.setFillColor(90, 90, 90); // Gris foncé simple
  doc.roundedRect(pageWidth - margin - 75, currentY, 75, 28, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(empName || 'NOM Prénom', pageWidth - margin - 72, currentY + 5);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Matricule : ${payslipData.employee?.matricule || ''}`, pageWidth - margin - 72, currentY + 11);
  doc.text(`Poste : ${empPoste || ''}`, pageWidth - margin - 72, currentY + 17);
  if (payslipData.employee?.department) {
    doc.text(`Département : ${payslipData.employee.department}`, pageWidth - margin - 72, currentY + 23);
  }

  // ============================================
  // INFORMATIONS COMPLÉMENTAIRES SALARIÉ (Gauche)
  // ============================================
  currentY += 2;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('N° CNPS :', margin, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(empCNPS || '', margin + 17, currentY + 5);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Jours travaillés :', margin, currentY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${payslipData.workedDays || 30} jours`, margin + 28, currentY + 11);

  currentY += 32;

  // Tableau principal
  const mainTableData = [];
  
  // Rémunération
  mainTableData.push({
    rubrique: 'REMUNERATION',
    base: '',
    taux: '',
    montant: '',
    isHeader: true,
    bgColor: [220, 220, 220] // Gris clair simple
  });

  mainTableData.push({
    rubrique: 'Salaire de base',
    base: formatNumber(baseSalary),
    taux: '',
    montant: formatNumber(baseSalary),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  // Heures supplémentaires
  const heuresSup = payslipData.overtimeHours || 0;
  if (heuresSup > 0) {
    mainTableData.push({
      rubrique: 'Heures supplémentaires',
      base: '',
      taux: '',
      montant: formatNumber(heuresSup),
      isHeader: false,
      bgColor: [255, 255, 255]
    });
  }

  // Primes (dynamiques)
  const primesArr = Array.isArray(primes) && primes.length > 0 ? primes : (Array.isArray(payslipData?.primes) ? payslipData.primes : []);
  
  if (primesArr.length > 0) {
    mainTableData.push({
      rubrique: 'PRIMES',
      base: '',
      taux: '',
      montant: '',
      isHeader: true,
      bgColor: [220, 220, 220] // Gris clair simple
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
          isHeader: false,
          bgColor: [255, 255, 255]
        });
      }
    });
  }

  // Indemnités (dynamiques)
  const indemArr = Array.isArray(indemnites) && indemnites.length > 0 ? indemnites : (Array.isArray(payslipData?.indemnites) ? payslipData.indemnites : []);
  
  if (indemArr.length > 0) {
    mainTableData.push({
      rubrique: 'INDEMNITES',
      base: '',
      taux: '',
      montant: '',
      isHeader: true,
      bgColor: [220, 220, 220] // Gris clair simple
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
          isHeader: false,
          bgColor: [255, 255, 255]
        });
      }
    });
  }

  // SBT (Salaire Brut Taxable)
  const sbt = payslipData.sbt || totalGross;
  mainTableData.push({
    rubrique: 'SBT (Salaire Brut Taxable)',
    base: '',
    taux: '',
    montant: formatNumber(sbt),
    isHeader: false,
    bgColor: [220, 220, 220], // Gris clair simple
    isBold: true
  });

  // Déductions
  mainTableData.push({
    rubrique: 'DEDUCTIONS',
    base: '',
    taux: '',
    montant: '',
    isHeader: true,
    bgColor: [220, 220, 220] // Gris clair simple
  });

  if (d?.pvid > 0) mainTableData.push({
    rubrique: 'PVID (CNPS)',
    base: formatNumber(baseSalary),
    taux: '4,2%',
    montant: formatNumber(d.pvid),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.irpp > 0) mainTableData.push({
    rubrique: 'IRPP',
    base: '',
    taux: '',
    montant: formatNumber(d.irpp),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.cac > 0) mainTableData.push({
    rubrique: 'CAC',
    base: '',
    taux: '',
    montant: formatNumber(d.cac),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.cfc > 0) mainTableData.push({
    rubrique: 'CFC',
    base: '',
    taux: '',
    montant: formatNumber(d.cfc),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.rav > 0) mainTableData.push({
    rubrique: 'RAV',
    base: '',
    taux: '',
    montant: formatNumber(d.rav),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.tdl > 0) mainTableData.push({
    rubrique: 'TDL',
    base: '',
    taux: '',
    montant: formatNumber(d.tdl),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  if (d?.fne > 0) mainTableData.push({
    rubrique: 'FNE',
    base: '',
    taux: '',
    montant: formatNumber(d.fne),
    isHeader: false,
    bgColor: [255, 255, 255]
  });

  mainTableData.push({
    rubrique: 'TOTAL DEDUCTIONS',
    base: '',
    taux: '',
    montant: formatNumber(totalDeductions),
    isHeader: false,
    bgColor: [220, 220, 220], // Gris clair simple
    isBold: true
  });

  // Création du tableau
  autoTable(doc, {
    startY: currentY,
    head: [['Éléments de paie', 'Base', 'Taux', 'Montant (XAF)']],
    body: mainTableData.map(row => [
      row.rubrique, row.base, row.taux, row.montant
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [100, 100, 100], // Gris foncé simple
      textColor: [255, 255, 255], // Texte blanc
      fontSize: 9,
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
        
        data.cell.styles.fillColor = rowData.bgColor;
        
        if (rowData.isHeader || rowData.isBold) {
          data.cell.styles.fontStyle = 'bold';
        }
      }
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
      doc.rect(leftX, tableStartY, rightX - leftX, tableEndY - tableStartY);
    }
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // ============================================
  // NET À PAYER
  // ============================================
  doc.setFillColor(220, 220, 220); // Gris clair simple
  doc.rect(margin, currentY, pageWidth - 2 * margin, 14, 'F');
  doc.setDrawColor(80, 80, 80); // Gris foncé
  doc.setLineWidth(0.8);
  doc.rect(margin, currentY, pageWidth - 2 * margin, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('NET À PAYER', margin + 3, currentY + 9);
  doc.text(`${formatNumber(netSalary)} XAF`, pageWidth - margin - 3, currentY + 9, { align: 'right' });

  const safe = (s) => String(s || '').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Fiche_Paie_${safe(empName)}_${safe(payslipData.payPeriod)}.pdf`;
  doc.save(fileName);
  
  return { completed: true };
}