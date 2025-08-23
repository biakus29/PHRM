// src/utils/pdfCnps.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildCnpsCode } from './cnpsUtils';

/**
 * Formate un nombre avec des espaces comme séparateurs de milliers
 */
function formatNumber(number) {
  if (!number || isNaN(number)) return '0';
  return Math.round(Number(number)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Configuration des styles PDF
 */
const PDF_STYLES = {
  margins: { left: 15, right: 15, top: 20, bottom: 12 },
  colors: {
    primary: [41, 98, 255],
    secondary: [16, 185, 129],
    warning: [245, 158, 11],
    gray: [107, 114, 128],
    lightGray: [248, 250, 252]
  },
  fonts: {
    title: { size: 14, weight: 'bold' },
    header: { size: 10, weight: 'bold' },
    body: { size: 9, weight: 'normal' },
    small: { size: 8, weight: 'normal' }
  }
};

/**
 * Ajoute l'en-tête du document
 */
function addHeader(doc, title, cnpsEmployeur, periode, nbSalaries) {
  const { margins, colors, fonts } = PDF_STYLES;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Titre principal
  doc.setFontSize(fonts.title.size);
  doc.setFont(undefined, fonts.title.weight);
  doc.setTextColor(...colors.primary);
  doc.text(title, margins.left, margins.top);
  
  // Ligne de séparation
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.line(margins.left, margins.top + 2, pageWidth - margins.right, margins.top + 2);
  
  // Informations
  doc.setFontSize(fonts.body.size);
  doc.setFont(undefined, fonts.body.weight);
  doc.setTextColor(0, 0, 0);
  
  const infoY = margins.top + 8;
  doc.text(`CNPS Employeur: ${cnpsEmployeur || 'N/A'}`, margins.left, infoY);
  doc.text(`Période: ${periode} | Salariés: ${nbSalaries} | Généré: ${new Date().toLocaleDateString('fr-FR')}`, 
           margins.left, infoY + 5);
  
  return margins.top + 18;
}

/**
 * Ajoute le pied de page
 */
function addFooter(doc, pageNumber) {
  const { margins, fonts, colors } = PDF_STYLES;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.gray);
  doc.text(`Page ${pageNumber}`, pageWidth - margins.right, pageHeight - 8, { align: 'right' });
  doc.text('Document généré automatiquement', margins.left, pageHeight - 8);
}

export function exportCnpsPDF({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { margins, colors, fonts } = PDF_STYLES;
  
  // Informations de base
  const periode = (() => {
    try { 
      const d = formData[selectedIds[0]] || {}; 
      return `${d.mois || ''}/${d.annee || ''}`;
    } catch { 
      return 'N/A'; 
    }
  })();
  
  // En-tête
  let startY = addHeader(doc, 'DÉCLARATION MENSUELLE - COTISATIONS CNPS', cnpsEmployeur, periode, selectedIds.length);
  
  // Configuration des colonnes
  const hasRP = !!employerOptions.includeRP;
  const tableHead = [
    'Mat. Int.', 'Code CNPS', 'Nom Complet', 'N° CNPS', 'Salaire Brut', 'Catégorie'
  ];
  
  if (hasRP) tableHead.push('Taux RP');
  tableHead.push('Base Cotis.', 'Cotis. Sal.', 'Cotis. Emp.', 'Total', 'Mois', 'Année');
  
  // Données du tableau
  const tableBody = selectedIds.map((id) => {
    const d = formData[id];
    const base = Math.min(Number(d.brut) || 0, 750000);
    const rpRate = hasRP ? (employerOptions.overrideRP ? employerOptions.rateRP : (Number(d.tauxRP) || 0)) : 0;
    const cotisSalarie = Math.round(base * 0.042);
    const cotisEmployeur = Math.round(base * (0.049 + 0.07 + rpRate / 100));
    const totalGlobal = cotisSalarie + cotisEmployeur;
    
    const row = [
      d.matriculeInterne || '-',
      buildCnpsCode({
        mois: d.mois,
        matriculeEmployeur: cnpsEmployeur,
        regime: d.regime,
        annee: d.annee,
        matriculeEmploye: d.matriculeInterne,
        joursTravailles: d.joursTravailles
      }),
      d.nom || '-',
      d.cnps || '-',
      formatNumber(d.brut) + ' F',
      d.poste || '-'
    ];
    
    if (hasRP) row.push((d.tauxRP || 0) + '%');
    
    row.push(
      formatNumber(base) + ' F',
      formatNumber(cotisSalarie) + ' F',
      formatNumber(cotisEmployeur) + ' F',
      formatNumber(totalGlobal) + ' F',
      d.mois || '-',
      d.annee || '-'
    );
    
    return row;
  });
  
  // Styles des colonnes
  const columnStyles = {};
  const baseIdx = hasRP ? 7 : 6;
  columnStyles[4] = { halign: 'right' }; // Brut
  columnStyles[baseIdx] = { halign: 'right' }; // Base
  columnStyles[baseIdx + 1] = { halign: 'right' }; // Cotis Sal
  columnStyles[baseIdx + 2] = { halign: 'right' }; // Cotis Emp
  columnStyles[baseIdx + 3] = { halign: 'right' }; // Total
  
  // Tableau principal
  autoTable(doc, {
    head: [tableHead],
    body: tableBody,
    startY: startY,
    margin: { 
      top: margins.top + 15, 
      bottom: margins.bottom + 5, 
      left: margins.left, 
      right: margins.right 
    },
    theme: 'grid',
    styles: {
      fontSize: fonts.body.size,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      lineColor: colors.gray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: fonts.header.size,
      fontStyle: fonts.header.weight,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    columnStyles: columnStyles,
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    }
  });
  
  // Récapitulatif employeur
  startY = doc.lastAutoTable.finalY + 8;
  
  const recapHead = [['RÉCAPITULATIF EMPLOYEUR', 'MONTANT (FCFA)']];
  const recapBody = [
    [`Prestations Familiales (${employerOptions.ratePF}%)`, formatNumber(employerSummary.totalPF) + ' F'],
    [`PVID Employeur (${employerOptions.ratePVID}%)`, formatNumber(employerSummary.totalPVID) + ' F'],
    [`Risques Prof. ${hasRP ? '(Activé)' : '(Désactivé)'}`, formatNumber(employerSummary.totalRP) + ' F'],
    ['', ''], // Ligne vide
    ['TOTAL DÛ EMPLOYEUR', formatNumber(employerSummary.totalEmployeurDu) + ' F']
  ];
  
  autoTable(doc, {
    head: recapHead,
    body: recapBody,
    startY: startY,
    margin: { left: margins.left, right: margins.right },
    theme: 'grid',
    styles: {
      fontSize: fonts.body.size,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 }
    },
    headStyles: {
      fillColor: colors.secondary,
      textColor: [255, 255, 255],
      fontSize: fonts.header.size,
      fontStyle: fonts.header.weight,
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Ligne total en surbrillance
      if (data.row.index === recapBody.length - 1) {
        data.cell.styles.fillColor = colors.warning;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontSize = fonts.header.size;
      }
    }
  });
  
  // Notes
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.gray);
  doc.text('Base cotisable plafonnée à 750 000 F. Salarié: 4,2% PVID. Employeur: 4,9% PVID + 7% PF + RP variable.', 
           margins.left, finalY);
  
  // Sauvegarde
  const filename = `Cotisations_CNPS_${periode.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function exportTaxesPDF({ selectedIds, taxesData, formData, cnpsEmployeur }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { margins, colors, fonts } = PDF_STYLES;
  
  // Informations de base
  const periode = (() => { 
    try { 
      const d = formData[selectedIds[0]] || {}; 
      return `${d.mois || ''}/${d.annee || ''}`; 
    } catch { 
      return 'N/A'; 
    }
  })();
  
  // En-tête
  let startY = addHeader(doc, 'DÉCLARATION MENSUELLE - IMPÔTS SUR SALAIRES', cnpsEmployeur, periode, selectedIds.length);
  
  // Tableau principal
  const tableHead = [
    ['Mat.', 'Nom Complet', 'SBT (F)', 'IRPP (F)', 'CAC (F)', 'CFC (F)', 'FNE Sal. (F)', 'FNE Emp. (F)']
  ];
  
  const tableBody = taxesData.rows.map((r) => [
    r.matricule || '-',
    r.nom || '-',
    formatNumber(r.sbt),
    formatNumber(r.irpp),
    formatNumber(r.cac),
    formatNumber(r.cfc),
    formatNumber(r.fneSal),
    formatNumber(r.fneEmp)
  ]);
  
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: startY,
    margin: { 
      top: margins.top + 15, 
      bottom: margins.bottom + 5, 
      left: margins.left, 
      right: margins.right 
    },
    theme: 'grid',
    styles: {
      fontSize: fonts.body.size,
      cellPadding: { top: 3, right: 2, bottom: 3, left: 2 },
      lineColor: colors.gray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: colors.warning,
      textColor: [255, 255, 255],
      fontSize: fonts.header.size,
      fontStyle: fonts.header.weight,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 25 },
      7: { halign: 'right', cellWidth: 25 }
    },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    }
  });
  
  // Tableau des totaux
  startY = doc.lastAutoTable.finalY + 8;
  
  const totalsHead = [['TYPE D\'IMPÔT', 'TOTAL (FCFA)', 'TAUX']];
  const totalsBody = [
    ['Salaire Brut Taxable', formatNumber(taxesData.totals.sbt) + ' F', 'Base'],
    ['IRPP', formatNumber(taxesData.totals.irpp) + ' F', 'Barème'],
    ['CAC', formatNumber(taxesData.totals.cac) + ' F', '10% IRPP'],
    ['CFC SAL', formatNumber(taxesData.totals.cfc) + ' F', '2,5% SBT'],
    ['FNE Salarié', formatNumber(taxesData.totals.fneSal) + ' F', '1% SBT'],
    ['FNE Employeur', formatNumber(taxesData.totals.fneEmp) + ' F', '1,5% SBT'],
    ['', '', ''], // Ligne vide
    [
      'TOTAL À VERSER', 
      formatNumber(taxesData.totals.irpp + taxesData.totals.cac + taxesData.totals.cfc + 
                   taxesData.totals.fneSal + taxesData.totals.fneEmp) + ' F',
      'Somme'
    ]
  ];
  
  autoTable(doc, {
    head: totalsHead,
    body: totalsBody,
    startY: startY,
    margin: { left: margins.left, right: margins.right },
    theme: 'grid',
    styles: {
      fontSize: fonts.body.size,
      cellPadding: { top: 4, right: 3, bottom: 4, left: 3 }
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontSize: fonts.header.size,
      fontStyle: fonts.header.weight,
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 30, fontSize: fonts.small.size }
    },
    didParseCell: (data) => {
      // Ligne total en surbrillance
      if (data.row.index === totalsBody.length - 1) {
        data.cell.styles.fillColor = colors.warning;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontSize = fonts.header.size;
      }
    }
  });
  
  // Notes explicatives
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.gray);
  
  const notes = [
    'Notes: SBT = Salaire Brut Taxable. Abattement annuel: 500 000 F.',
    'Seuil exonération: 62 000 F/mois. Déclaration avant le 15 du mois suivant.'
  ];
  
  notes.forEach((note, i) => {
    doc.text(note, margins.left, finalY + (i * 5));
  });
  
  // Sauvegarde
  const filename = `Declaration_Impots_${periode.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export default { exportCnpsPDF, exportTaxesPDF };