// src/utils/pdfCnps.js
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildCnpsCode } from './cnpsUtils';
import { computeSBC, CNPS_CAP, computeSBT, computeGrossTotal, getCalculs, computeStatutoryDeductions } from './payrollCalculations';

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

export function exportCnpsPDF({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur, cnpsData }) {
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
  
  // Tableau principal avec TOUTES les colonnes comme dans Excel
  const tableHead = [
    'Mat.', 'Code CNPS', 'Nom', 'Brut', 'Primes', 'Indemnités', 'SBC', 'PVID Sal.', 'PF Emp.', 'PVID Emp.', 'RP', 'Total CNPS', 'Mois', 'Année'
  ];
  
  // Utiliser directement les données des tableaux CNPS
  const tableBody = selectedIds.map((id) => {
    const d = formData[id] || {};
    const r = (cnpsData?.rows || []).find(row => row.id === id) || {};
    
    // Utiliser les données déjà calculées dans les tableaux
    const matricule = d.cnps || d.matricule || r.cnps || r.matricule || '-';
    const codeCnps = buildCnpsCode({
      mois: d.mois,
      matriculeEmployeur: cnpsEmployeur,
      regime: d.regime,
      annee: d.annee,
      matriculeEmploye: matricule,
      joursTravailles: d.joursTravailles
    });
    const nom = d.nom || r.nom || '-';
    const brut = Number(r.brut || d.brut || 0);
    const primes = Number(r.primes || d.primes || 0);
    const indemnites = Number(r.indemnites || d.indemnites || 0);
    const sbc = Number(r.sbc || r.baseCotisable || 0);
    const pvidSalarie = Number(r.pvidSalarie || r.cotisSalarie || 0);
    const pfEmployeur = Number(r.prestationsFamilles || r.pfEmployeur || 0);
    const pvidEmployeur = Number(r.pvidEmployeur || 0);
    const rp = Number(r.risquesProfessionnels || r.rp || 0);
    const totalCnps = pvidSalarie + pfEmployeur + pvidEmployeur + rp;
    
    return [
      matricule,
      codeCnps,
      nom,
      formatNumber(brut),
      formatNumber(primes),
      formatNumber(indemnites),
      formatNumber(sbc),
      formatNumber(pvidSalarie),
      formatNumber(pfEmployeur),
      formatNumber(pvidEmployeur),
      formatNumber(rp),
      formatNumber(totalCnps),
      d.mois || '-',
      d.annee || '-'
    ];
  });
  
  // Styles des colonnes pour le PDF CNPS
  const columnStyles = {
    0: { halign: 'center', cellWidth: 15 },   // Mat.
    1: { halign: 'center', cellWidth: 25 },   // Code CNPS
    2: { cellWidth: 30 },                     // Nom
    3: { halign: 'right', cellWidth: 18 },    // Brut
    4: { halign: 'right', cellWidth: 18 },    // Primes
    5: { halign: 'right', cellWidth: 18 },    // Indemnités
    6: { halign: 'right', cellWidth: 18 },    // SBC
    7: { halign: 'right', cellWidth: 18 },    // PVID Sal.
    8: { halign: 'right', cellWidth: 18 },    // PF Emp.
    9: { halign: 'right', cellWidth: 18 },    // PVID Emp.
    10: { halign: 'right', cellWidth: 15 },   // RP
    11: { halign: 'right', cellWidth: 20, fontStyle: 'bold' }, // Total CNPS
    12: { halign: 'center', cellWidth: 12 },  // Mois
    13: { halign: 'center', cellWidth: 12 }   // Année
  };
  
  // Variable pour compatibilité (pas utilisée mais évite l'erreur)
  const hasRP = !!employerOptions.includeRP;
  
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
  let startY = addHeader(doc, 'DÉCLARATION MENSUELLE - IMPÔTS SUR SALAIRES', cnpsEmployeur, periode, selectedIds.length);
  
  // Tableau principal avec TOUTES les colonnes comme dans Excel
  const tableHead = [
    ['Mat.', 'Nom', 'Brut', 'Primes Imp.', 'Indemnités', 'SBT', 'IRPP', 'CAC', 'CFC', 'RAV', 'TDL', 'FNE Emp.', 'Total Imp.']
  ];
  
  // Utiliser directement les données des tableaux (taxesData.rows)
  const tableBody = selectedIds.map((id) => {
    const d = formData[id] || {};
    const r = (taxesData.rows || []).find(row => row.id === id) || {};
    
    // Utiliser les données déjà calculées dans les tableaux
    const matricule = d.cnps || d.matricule || r.cnps || r.matricule || '-';
    const nom = d.nom || r.nom || '-';
    const brut = Number(r.brut || d.brut || 0);
    const primesImposables = Number(r.primesImposables || d.primesImposables || 0);
    const indemnites = Number(r.indemnites || d.indemnites || 0);
    const sbt = Number(r.sbt || 0);
    const irpp = Number(r.irpp || 0);
    const cac = Number(r.cac || 0);
    const cfc = Number(r.cfc || 0);
    const rav = Number(r.rav || 0);
    const tdl = Number(r.tdl || 0);
    const fneEmp = Number(r.fneEmployeur || Math.round(sbt * 0.01));
    const totalImpots = irpp + cac + cfc + rav + tdl + fneEmp;
    
    return [
      matricule,
      nom,
      formatNumber(brut),
      formatNumber(primesImposables),
      formatNumber(indemnites),
      formatNumber(sbt),
      formatNumber(irpp),
      formatNumber(cac),
      formatNumber(cfc),
      formatNumber(rav),
      formatNumber(tdl),
      formatNumber(fneEmp),
      formatNumber(totalImpots)
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
      0: { halign: 'center', cellWidth: 18 },  // Mat.
      1: { cellWidth: 35 },                    // Nom
      2: { halign: 'right', cellWidth: 18 },   // Brut
      3: { halign: 'right', cellWidth: 18 },   // Primes Imp.
      4: { halign: 'right', cellWidth: 18 },   // Indemnités
      5: { halign: 'right', cellWidth: 18 },   // SBT
      6: { halign: 'right', cellWidth: 18 },   // IRPP
      7: { halign: 'right', cellWidth: 15 },   // CAC
      8: { halign: 'right', cellWidth: 15 },   // CFC
      9: { halign: 'right', cellWidth: 15 },   // RAV
      10: { halign: 'right', cellWidth: 15 },  // TDL
      11: { halign: 'right', cellWidth: 18 },  // FNE Emp.
      12: { halign: 'right', cellWidth: 20, fontStyle: 'bold' }  // Total Imp.
    },
    didDrawPage: (data) => {
      addFooter(doc, data.pageNumber);
    }
  });
  
  // Tableau des totaux
  startY = doc.lastAutoTable.finalY + 8;
  
  const totalsHead = [["TYPE D'IMPÔT", 'TOTAL (FCFA)', 'TAUX']];
  // Utiliser directement les totaux des tableaux
  const totalsCalc = selectedIds.reduce((acc, id) => {
    const r = (taxesData.rows || []).find(row => row.id === id) || {};
    
    acc.brut += Number(r.brut || 0);
    acc.primesImposables += Number(r.primesImposables || 0);
    acc.indemnites += Number(r.indemnites || 0);
    acc.sbt += Number(r.sbt || 0);
    acc.irpp += Number(r.irpp || 0);
    acc.cac += Number(r.cac || 0);
    acc.cfc += Number(r.cfc || 0);
    acc.rav += Number(r.rav || 0);
    acc.tdl += Number(r.tdl || 0);
    acc.fneEmp += Number(r.fneEmployeur || Math.round(Number(r.sbt || 0) * 0.01));
    return acc;
  }, { brut: 0, primesImposables: 0, indemnites: 0, sbt: 0, irpp: 0, cac: 0, cfc: 0, rav: 0, tdl: 0, fneEmp: 0 });
  
  const totalsBody = [
    ['Salaire Brut Total', formatNumber(totalsCalc.brut) + ' F', 'Base'],
    ['Primes Imposables', formatNumber(totalsCalc.primesImposables) + ' F', 'Base'],
    ['Indemnités', formatNumber(totalsCalc.indemnites) + ' F', 'Base'],
    ['Salaire Brut Taxable', formatNumber(totalsCalc.sbt) + ' F', 'Base'],
    ['IRPP', formatNumber(totalsCalc.irpp) + ' F', 'Barème'],
    ['CAC', formatNumber(totalsCalc.cac) + ' F', '10% IRPP'],
    ['CFC Salarié', formatNumber(totalsCalc.cfc) + ' F', '1% SBT'],
    ['RAV', formatNumber(totalsCalc.rav) + ' F', 'Barème'],
    ['TDL', formatNumber(totalsCalc.tdl) + ' F', '10% IRPP'],
    ['FNE Employeur', formatNumber(totalsCalc.fneEmp) + ' F', '1% SBT'],
    ['', '', ''], // Ligne vide
    [
      'TOTAL À VERSER', 
      formatNumber(totalsCalc.irpp + totalsCalc.cac + totalsCalc.cfc + totalsCalc.rav + totalsCalc.tdl + totalsCalc.fneEmp) + ' F',
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