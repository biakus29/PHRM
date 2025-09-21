// src/utils/pdfCnps.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildCnpsCode } from './cnpsUtils';
import { getSBC, CNPS_CAP, getSBT, computeGrossTotal, getCalculs } from './payrollCalculations';

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
  
  // Configuration des colonnes (alignées avec la vue "déclaration")
  const hasRP = !!employerOptions.includeRP;
  const tableHead = [
    'Mat. CNPS', 'Code CNPS', 'Nom', 'N° CNPS', 'Base Cot.', 'PVID Sal.', 'PF', 'PVID Emp.', 'RP', 'Cot. Emp.', 'Total', 'Mois', 'Année'
  ];
  
  // Données du tableau
  const tableBody = selectedIds.map((id) => {
    const d = formData[id];
    // Utiliser les calculs centralisés comme dans le tableau 'déclaration'
    const calculs = getCalculs(d || {}, employerOptions || {});
    const base = Math.min(Number(calculs.baseCotisable) || 0, CNPS_CAP);
    const cotisSalarie = Math.round(Number(calculs.cotisSalarie) || 0);
    const prestationsFamilles = Math.round(Number(calculs.prestationsFamilles) || 0);
    const pvidEmployeur = Math.round(Number(calculs.pvidEmployeur) || 0);
    const risquesProfessionnels = Math.round(Number(calculs.risquesProfessionnels) || 0);
    const cotisEmployeur = Math.round(Number(calculs.cotisEmployeur) || 0);
    const totalGlobal = Math.round(Number(calculs.totalGlobal) || (cotisSalarie + cotisEmployeur));
    
    const row = [
      d.cnps || '-',
      buildCnpsCode({
        mois: d.mois,
        matriculeEmployeur: cnpsEmployeur,
        regime: d.regime,
        annee: d.annee,
        matriculeEmploye: d.cnps,
        joursTravailles: d.joursTravailles
      }),
      d.nom || '-',
      d.cnps || '-',
      formatNumber(base) + ' F',
      formatNumber(cotisSalarie) + ' F',
      formatNumber(prestationsFamilles) + ' F',
      formatNumber(pvidEmployeur) + ' F',
      formatNumber(risquesProfessionnels) + ' F',
      formatNumber(cotisEmployeur) + ' F',
      formatNumber(totalGlobal) + ' F'
    ];
    
    row.push(
      d.mois || '-',
      d.annee || '-'
    );
    
    return row;
  });
  
  // Styles des colonnes
  const columnStyles = {};
  const baseIdx = hasRP ? 9 : 8; // Ajusté pour les nouvelles colonnes
  columnStyles[4] = { halign: 'right' }; // Brut
  columnStyles[6] = { halign: 'right' }; // Total Primes
  columnStyles[7] = { halign: 'right' }; // Total Indemnités
  columnStyles[baseIdx] = { halign: 'right' }; // Base
  columnStyles[baseIdx + 1] = { halign: 'right' }; // Cotis Sal
  
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
  doc.text('Base cotisable plafonnée à 750 000 F. Salarié: 4,2% PVID. Employeur: 4,2% PVID + 7% PF + RP variable.', 
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
    ['Mat. CNPS', 'Nom Complet', 'SBT (F)', 'IRPP (F)', 'CAC (F)', 'CFC (F)', 'TDL (F)', 'FNE Emp. (F)']
  ];
  
  // Construire le corps en s'alignant sur selectedIds et en recalculant SBT via getSBT(formData[id])
  const tableBody = selectedIds.map((id) => {
    const d = formData[id] || {};
    const r = (taxesData.rows || []).find(row => row.id === id) || {};
    const sbt = getSBT(d);
    const irpp = Number(r.irpp) || 0;
    const cac  = Number(r.cac)  || 0;
    const cfc  = Number(r.cfc)  || 0;
    const tdl  = Math.round(irpp * 0.10);
    const fneEmp = Math.round(sbt * 0.01); // 1% employeur
    return [
      d.cnps || r.cnps || r.matricule || '-',
      d.nom || r.nom || '-',
      formatNumber(sbt),
      formatNumber(irpp),
      formatNumber(cac),
      formatNumber(cfc),
      formatNumber(tdl),
      formatNumber(fneEmp)
    ];
  });
  
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
      0: { halign: 'center', cellWidth: 22 },
      1: { cellWidth: 55 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 22 },
      4: { halign: 'right', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 22 }
    },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    }
  });
  
  // Tableau des totaux
  startY = doc.lastAutoTable.finalY + 8;
  
  const totalsHead = [["TYPE D'IMPÔT", 'TOTAL (FCFA)', 'TAUX']];
  // Recalculer les totaux à partir des lignes construites
  const totalsCalc = selectedIds.reduce((acc, id) => {
    const d = formData[id] || {};
    const row = (taxesData.rows || []).find(r => r.id === id) || {};
    const sbt = getSBT(d);
    const irpp = Number(row.irpp) || 0;
    const cac  = Number(row.cac)  || 0;
    const cfc  = Number(row.cfc)  || 0;
    acc.sbt += sbt;
    acc.irpp += irpp;
    acc.cac += cac;
    acc.cfc += cfc;
    return acc;
  }, { sbt: 0, irpp: 0, cac: 0, cfc: 0 });
  const totalsTDL = Math.round(totalsCalc.irpp * 0.10);
  const totalsFneEmp = Math.round(totalsCalc.sbt * 0.01);
  const totalsBody = [
    ['Salaire Brut Taxable', formatNumber(totalsCalc.sbt) + ' F', 'Base'],
    ['IRPP', formatNumber(totalsCalc.irpp) + ' F', 'Barème'],
    ['CAC', formatNumber(totalsCalc.cac) + ' F', '10% IRPP'],
    ['CFC SAL', formatNumber(totalsCalc.cfc) + ' F', '1% SBT'],
    ['TDL', formatNumber(totalsTDL) + ' F', '10% IRPP'],
    ['FNE Employeur', formatNumber(totalsFneEmp) + ' F', '1% SBT'],
    ['', '', ''], // Ligne vide
    [
      'TOTAL À VERSER', 
      formatNumber(totalsCalc.irpp + totalsCalc.cac + totalsCalc.cfc + totalsTDL + totalsFneEmp) + ' F',
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
    'FNE: à la charge exclusive de l’employeur à 1% du SBT.',
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