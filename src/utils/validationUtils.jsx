// src/utils/pdfCnps.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatFR } from './numberUtils';

/**
 * Formate un nombre pour l'affichage PDF avec séparateur d'espaces
 */
function formatNumber(number) {
  if (!number || isNaN(number)) return '0';
  return Math.round(Number(number)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
import { buildCnpsCode } from './cnpsUtils';

/**
 * Configuration des styles et constantes pour les PDFs
 */
const PDF_CONFIG = {
  margins: { left: 15, right: 15, top: 25, bottom: 15 },
  colors: {
    primary: [41, 98, 255],      // Bleu principal
    secondary: [16, 185, 129],    // Vert
    warning: [245, 158, 11],      // Orange
    danger: [239, 68, 68],        // Rouge
    gray: [107, 114, 128],        // Gris
    lightGray: [249, 250, 251],   // Gris clair
    white: [255, 255, 255]
  },
  fonts: {
    title: { size: 16, style: 'bold' },
    subtitle: { size: 12, style: 'bold' },
    header: { size: 10, style: 'bold' },
    body: { size: 9, style: 'normal' },
    small: { size: 8, style: 'normal' },
    tiny: { size: 7, style: 'normal' }
  }
};

/**
 * Ajoute l'en-tête standardisé du document
 */
function addDocumentHeader(doc, title, cnpsEmployeur, periode, nbSalaries, isLandscape = false) {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Titre principal
  doc.setFontSize(fonts.title.size);
  doc.setFont(undefined, fonts.title.style);
  doc.setTextColor(...colors.primary);
  doc.text(title, margins.left, margins.top);
  
  // Ligne de séparation
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.5);
  doc.line(margins.left, margins.top + 3, pageWidth - margins.right, margins.top + 3);
  
  // Informations de l'entreprise
  doc.setFontSize(fonts.header.size);
  doc.setFont(undefined, fonts.header.style);
  doc.setTextColor(0, 0, 0);
  
  const infoY = margins.top + 10;
  doc.text(`CNPS Employeur: ${cnpsEmployeur || 'N/A'}`, margins.left, infoY);
  
  // Informations de période et génération
  doc.setFontSize(fonts.body.size);
  doc.setFont(undefined, fonts.body.style);
  doc.setTextColor(...colors.gray);
  
  const detailsY = margins.top + 16;
  doc.text(`Période: ${periode}`, margins.left, detailsY);
  doc.text(`Nombre de salariés: ${nbSalaries}`, margins.left + 60, detailsY);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margins.left, detailsY + 6);
  
  return margins.top + 25;
}

/**
 * Ajoute le pied de page standardisé
 */
function addDocumentFooter(doc, data) {
  const { margins, colors, fonts } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Numéro de page
  doc.setFontSize(fonts.tiny.size);
  doc.setTextColor(...colors.gray);
  doc.text(`Page ${data.pageNumber}`, pageWidth - margins.right, pageHeight - 8, { align: 'right' });
  
  // Note légale
  doc.text('Document généré automatiquement - À conserver avec vos archives comptables', 
           margins.left, pageHeight - 8);
}

/**
 * Calcule les cotisations pour un employé
 */
function calculateCotisations(employeeData, employerOptions) {
  const brut = Number(employeeData.brut) || 0;
  const base = Math.min(brut, 750000); // Plafond CNPS
  
  // Cotisations salarié (PVID uniquement)
  const cotisSalarie = Math.round(base * 0.042);
  
  // Cotisations employeur
  let rpRate = 0;
  if (employerOptions.includeRP) {
    rpRate = employerOptions.overrideRP ? 
             employerOptions.rateRP : 
             (Number(employeeData.tauxRP) || 0);
  }
  
  const pvid = Math.round(base * 0.049);
  const pf = Math.round(base * 0.07);
  const rp = Math.round(base * (rpRate / 100));
  const cotisEmployeur = pvid + pf + rp;
  
  const totalGlobal = cotisSalarie + cotisEmployeur;
  
  return {
    base,
    cotisSalarie,
    cotisEmployeur: {
      pvid,
      pf, 
      rp,
      total: cotisEmployeur
    },
    totalGlobal
  };
}

/**
 * Export PDF pour les cotisations CNPS - SUPPRIMÉ
 * Utiliser la fonction dans pdfCnps.js à la place
 */
export function exportCnpsPDF_OLD({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { margins, colors, fonts } = PDF_CONFIG;
  
  // Informations de base
  const periode = (() => {
    try { 
      const d = formData[selectedIds[0]] || {}; 
      return `${d.mois || ''}/${d.annee || ''}`; 
    } catch { 
      return 'N/A'; 
    }
  })();
  
  // En-tête du document
  let startY = addDocumentHeader(
    doc, 
    'DÉCLARATION MENSUELLE - COTISATIONS CNPS',
    cnpsEmployeur,
    periode,
    selectedIds.length,
    true
  );
  
  // Préparation des colonnes
  const hasRP = employerOptions.includeRP;
  const tableHead = [
    'Mat. Interne', 'Code CNPS', 'Nom Complet', 'N° CNPS', 'Salaire Brut', 'Catégorie/Poste'
  ];
  
  if (hasRP) {
    tableHead.push('Taux RP (%)');
  }
  
  tableHead.push('Base Cotisable', 'Cotis. Salarié', 'Cotis. Employeur', 'Total à Verser', 'Mois', 'Année');
  
  // Préparation des données
  const tableBody = selectedIds.map((id) => {
    const employeeData = formData[id];
    const cotisations = calculateCotisations(employeeData, employerOptions);
    
    const row = [
      employeeData.matriculeInterne || '-',
      buildCnpsCode({
        mois: employeeData.mois,
        matriculeEmployeur: cnpsEmployeur,
        regime: employeeData.regime,
        annee: employeeData.annee,
        matriculeEmploye: employeeData.matriculeInterne,
        joursTravailles: employeeData.joursTravailles
      }),
      employeeData.nom || '-',
      employeeData.cnps || '-',
      formatNumber(employeeData.brut) + ' F',
      employeeData.poste || '-'
    ];
    
    if (hasRP) {
      row.push((employeeData.tauxRP || 0) + '%');
    }
    
    row.push(
      formatNumber(cotisations.base) + ' F',
      formatNumber(cotisations.cotisSalarie) + ' F',
      formatNumber(cotisations.cotisEmployeur.total) + ' F',
      formatNumber(cotisations.totalGlobal) + ' F',
      employeeData.mois || '-',
      employeeData.annee || '-'
    );
    
    return row;
  });
  
  // Styles des colonnes (alignement à droite pour les montants)
  const columnStyles = {};
  const baseIndex = hasRP ? 7 : 6;
  columnStyles[4] = { halign: 'right' }; // Salaire brut
  columnStyles[baseIndex] = { halign: 'right' };     // Base cotisable
  columnStyles[baseIndex + 1] = { halign: 'right' }; // Cotis salarié
  columnStyles[baseIndex + 2] = { halign: 'right' }; // Cotis employeur
  columnStyles[baseIndex + 3] = { halign: 'right' }; // Total
  
  // Génération du tableau principal
  autoTable(doc, {
    head: [tableHead],
    body: tableBody,
    startY: startY,
    margin: { 
      top: margins.top, 
      bottom: margins.bottom + 10, 
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
      textColor: colors.white,
      fontSize: fonts.header.size,
      fontStyle: fonts.header.style,
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    columnStyles: columnStyles,
    didDrawPage: (data) => {
      addDocumentFooter(doc, data);
    }
  });
  
  // Calcul de la position pour le récapitulatif
  startY = doc.lastAutoTable.finalY + 10;
  
  // Tableau récapitulatif employeur
  const recapHead = [['RÉCAPITULATIF EMPLOYEUR', 'MONTANT (FCFA)']];
  const recapBody = [
    [`Prestations Familiales (${employerOptions.ratePF}%)`, formatNumber(employerSummary.totalPF) + ' F'],
    [`PVID Employeur (${employerOptions.ratePVID}%)`, formatNumber(employerSummary.totalPVID) + ' F'],
    [
      `Risques Professionnels ${employerOptions.includeRP ? '(Activé)' : '(Désactivé)'}`, 
      formatNumber(employerSummary.totalRP) + ' F'
    ],
    ['', ''], // Ligne vide pour séparation
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
      textColor: colors.white,
      fontSize: fonts.header.size,
      fontStyle: fonts.header.style,
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Mise en évidence de la ligne total
      if (data.row.index === recapBody.length - 1) {
        data.cell.styles.fillColor = colors.warning;
        data.cell.styles.textColor = colors.white;
        data.cell.styles.fontSize = fonts.header.size;
      }
    }
  });
  
  // Note explicative
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.gray);
  doc.text('Note: Base cotisable plafonnée à 750 000 FCFA. Taux salarié: 4,2% (PVID).', 
           margins.left, finalY);
  doc.text('Taux employeur: 4,9% (PVID) + 7% (PF) + Taux RP variable selon la catégorie professionnelle.',
           margins.left, finalY + 5);
  
  // Sauvegarde du fichier
  const filename = `Cotisation_CNPS_${periode.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Export PDF pour les déclarations d'impôts - SUPPRIMÉ
 * Utiliser la fonction dans pdfCnps.js à la place
 */
export function exportTaxesPDF_OLD({ selectedIds, taxesData, formData, cnpsEmployeur }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { margins, colors, fonts } = PDF_CONFIG;
  
  // Informations de base
  const periode = (() => { 
    try { 
      const d = formData[selectedIds[0]] || {}; 
      return `${d.mois || ''}/${d.annee || ''}`; 
    } catch { 
      return 'N/A'; 
    } 
  })();
  
  // En-tête du document
  let startY = addDocumentHeader(
    doc, 
    'DÉCLARATION MENSUELLE - IMPÔTS SUR SALAIRES',
    cnpsEmployeur,
    periode,
    selectedIds.length,
    false
  );
  
  // Tableau principal des impôts
  const tableHead = [
    ['Mat.', 'Nom Complet', 'SBT (F)', 'IRPP (F)', 'CAC (F)', 'CFC SAL (F)', 'FNE Sal. (F)', 'FNE Emp. (F)']
  ];
  
  const tableBody = taxesData.rows.map((row) => [
    row.matricule || '-',
    row.nom || '-',
    formatNumber(row.sbt),
    formatNumber(row.irpp),
    formatNumber(row.cac),
    formatNumber(row.cfc),
    formatNumber(row.fneSal),
    formatNumber(row.fneEmp)
  ]);
  
  // Génération du tableau principal
  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: startY,
    margin: { 
      top: margins.top, 
      bottom: margins.bottom + 10, 
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
      textColor: colors.white,
      fontSize: fonts.header.size,
      fontStyle: fonts.header.style,
      halign: 'center',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: colors.lightGray
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 45 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 22 }
    },
    didDrawPage: (data) => {
      addDocumentFooter(doc, data);
    }
  });
  
  // Tableau des totaux
  startY = doc.lastAutoTable.finalY + 10;
  
  const totalsHead = [['TYPE D\'IMPÔT', 'TOTAL (FCFA)', 'OBSERVATIONS']];
  const totalsBody = [
    ['Salaire Brut Taxable', formatNumber(taxesData.totals.sbt) + ' F', 'Base de calcul'],
    ['IRPP (Impôt sur le Revenu)', formatNumber(taxesData.totals.irpp) + ' F', 'Retenue salariale'],
    ['CAC (Centimes Additionnels)', formatNumber(taxesData.totals.cac) + ' F', '10% de l\'IRPP'],
    ['CFC SAL (Centre Fiscal)', formatNumber(taxesData.totals.cfc) + ' F', '2,5% du SBT'],
    ['FNE Salarié', formatNumber(taxesData.totals.fneSal) + ' F', '1% du SBT'],
    ['FNE Employeur', formatNumber(taxesData.totals.fneEmp) + ' F', '1,5% du SBT'],
    ['', '', ''], // Ligne de séparation
    [
      'TOTAL À VERSER AU TRÉSOR', 
      formatNumber(taxesData.totals.irpp + taxesData.totals.cac + taxesData.totals.cfc + taxesData.totals.fneSal + taxesData.totals.fneEmp) + ' F',
      'Montant global'
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
      textColor: colors.white,
      fontSize: fonts.header.size,
      fontStyle: fonts.header.style,
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      2: { fontSize: fonts.small.size, cellWidth: 50 }
    },
    didParseCell: (data) => {
      // Mise en évidence de la ligne total
      if (data.row.index === totalsBody.length - 1) {
        data.cell.styles.fillColor = colors.danger;
        data.cell.styles.textColor = colors.white;
        data.cell.styles.fontSize = fonts.header.size;
      }
    }
  });
  
  // Notes explicatives
  const finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(fonts.small.size);
  doc.setTextColor(...colors.gray);
  
  const notes = [
    'Notes importantes:',
    '• SBT: Salaire Brut Taxable (après déduction des avantages exonérés)',
    '• IRPP calculé selon le barème progressif camerounais en vigueur',
    '• Abattement forfaitaire annuel: 500 000 FCFA',
    '• Seuil d\'exonération mensuel: 62 000 FCFA',
    '• Déclaration à effectuer avant le 15 du mois suivant'
  ];
  
  notes.forEach((note, index) => {
    const style = index === 0 ? 'bold' : 'normal';
    doc.setFont(undefined, style);
    doc.text(note, margins.left, finalY + (index * 5));
  });
  
  // Sauvegarde du fichier
  const filename = `Declaration_Impots_${periode.replace('/', '-')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// Anciennes fonctions supprimées - utiliser pdfCnps.js
export default {};