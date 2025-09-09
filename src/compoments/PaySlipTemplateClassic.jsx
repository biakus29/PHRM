import React from 'react';
import PaySlipTemplateBase, { escapeText } from './PaySlipTemplateBase';
import { displayDate } from "../utils/displayUtils";

/**
 * Modèle classique de fiche de paie avec style traditionnel
 * Design sobre et professionnel sans fioritures
 */
class PaySlipTemplateClassic extends PaySlipTemplateBase {

  /**
   * Génère l'en-tête classique avec logo et informations employeur
   */
  generateHeader(doc, normalizedData, logo) {
    const { employer } = normalizedData;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    // Logo en haut à gauche (si disponible)
    if (logo) {
      this.addLogo(doc, logo, margin, y, 30, 30);
    }

    // Informations employeur alignées à droite
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    const employerInfo = [
      escapeText(employer.name),
      escapeText(employer.address),
      `Tél: ${escapeText(employer.phone)}`,
      `N° CNPS: ${escapeText(employer.cnpsNumber)}`
    ];

    employerInfo.forEach((info, index) => {
      const textWidth = doc.getTextWidth(info);
      doc.text(info, pageWidth - margin - textWidth, y + 5 + (index * 5));
    });

    // Ligne de séparation
    y += 40;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);

    return y + 10;
  }

  /**
   * Génère le titre principal de la fiche de paie
   */
  generateTitle(doc, normalizedData) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = 60;

    // Titre centré
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    const title = "BULLETIN DE SALAIRE";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);

    // Période et date de génération
    y += 15;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const periodText = `Période: ${normalizedData.payPeriod}`;
    const dateText = `Édité le: ${displayDate(normalizedData.generatedAt)}`;
    
    doc.text(periodText, margin, y);
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateWidth, y);

    return y + 15;
  }

  /**
   * Génère le tableau d'informations employeur/employé
   */
  generateInfoTable(doc, normalizedData, startY) {
    const { employee, employer } = normalizedData;
    const margin = 20;
    let y = startY;

    // Titre de la section
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text("INFORMATIONS", margin, y);
    y += 8;

    // Tableau avec informations employeur et employé
    const tableData = [
      ['EMPLOYEUR', 'SALARIÉ'],
      [`Raison sociale: ${escapeText(employer.name)}`, `Nom: ${escapeText(employee.name)}`],
      [`Adresse: ${escapeText(employer.address)}`, `Matricule: ${escapeText(employee.matricule)}`],
      [`N° CNPS: ${escapeText(employer.cnpsNumber)}`, `Fonction: ${escapeText(employee.poste)}`],
      [`Téléphone: ${escapeText(employer.phone)}`, `Classification: ${escapeText(employee.professionalClassification)}`],
      ['', `Département: ${escapeText(employee.department)}`],
      ['', `N° CNPS Salarié: ${escapeText(employee.cnpsNumber)}`]
    ];

    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold'
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 15;
  }

  /**
   * Génère le tableau détaillé des éléments de rémunération
   */
  generateRemunerationTable(doc, normalizedData, startY) {
    const { salaryDetails, remuneration, primes = [], indemnites = [] } = normalizedData;
    const margin = 20;
    let y = startY;

    // Titre de la section
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text("ÉLÉMENTS DE RÉMUNÉRATION", margin, y);
    y += 8;

    // Préparation des données du tableau
    const tableData = [
      ['Désignation', 'Nombre', 'Taux', 'Montant (FCFA)']
    ];

    // Salaire de base
    tableData.push([
      'Salaire de base',
      '1',
      salaryDetails.monthlyRate.toLocaleString(),
      salaryDetails.monthlyRate.toLocaleString()
    ]);

    // Indemnité de transport
    if (salaryDetails.transportAllowance > 0) {
      tableData.push([
        'Indemnité de transport',
        '1',
        salaryDetails.transportAllowance.toLocaleString(),
        salaryDetails.transportAllowance.toLocaleString()
      ]);
    }

    // Heures supplémentaires
    if (remuneration.overtime > 0) {
      tableData.push([
        'Heures supplémentaires',
        '-',
        '-',
        remuneration.overtime.toLocaleString()
      ]);
    }

    // Primes
    primes.forEach((prime, index) => {
      tableData.push([
        `Prime ${prime.label || prime.type || (index + 1)}`,
        '1',
        '-',
        Number(prime.value || prime.montant || 0).toLocaleString()
      ]);
    });

    // Indemnités
    indemnites.forEach((indem, index) => {
      tableData.push([
        `Indemnité ${indem.label || indem.type || (index + 1)}`,
        '1',
        '-',
        Number(indem.value || indem.montant || 0).toLocaleString()
      ]);
    });

    // Ligne de séparation
    tableData.push(['', '', '', '']);

    // Total brut
    tableData.push([
      'TOTAL BRUT',
      '',
      '',
      remuneration.total.toLocaleString()
    ]);

    // Génération du tableau
    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 15;
  }

  /**
   * Génère le tableau des cotisations et déductions
   */
  generateDeductionsTable(doc, normalizedData, startY) {
    const { deductions } = normalizedData;
    const margin = 20;
    let y = startY;

    // Titre de la section
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text("COTISATIONS SOCIALES ET DÉDUCTIONS", margin, y);
    y += 8;

    // Données du tableau
    const tableData = [
      ['Désignation', 'Base', 'Taux', 'Part Salariale']
    ];

    // Ajout des cotisations uniquement si elles sont > 0
    if (deductions.pvid > 0) {
      tableData.push([
        'C.N.P.S. (Pension Vieillesse, Invalidité, Décès)',
        '-',
        '4,2%',
        deductions.pvid.toLocaleString()
      ]);
    }

    if (deductions.irpp > 0) {
      tableData.push([
        'I.R.P.P. (Impôt sur le Revenu des Personnes Physiques)',
        '-',
        'Barème',
        deductions.irpp.toLocaleString()
      ]);
    }

    if (deductions.cac > 0) {
      tableData.push([
        'C.A.C. (Centimes Additionnels Communaux)',
        '-',
        '10% IRPP',
        deductions.cac.toLocaleString()
      ]);
    }

    if (deductions.cfc > 0) {
      tableData.push([
        'C.F.C. (Crédit Foncier du Cameroun)',
        '-',
        '1%',
        deductions.cfc.toLocaleString()
      ]);
    }

    if (deductions.rav > 0) {
      tableData.push([
        'R.A.V. (Réseau Audiovisuel)',
        '-',
        'Forfait',
        deductions.rav.toLocaleString()
      ]);
    }

    if (deductions.tdl > 0) {
      tableData.push([
        'T.D.L. (Taxe de Développement Local)',
        '-',
        'Variable',
        deductions.tdl.toLocaleString()
      ]);
    }

    if (deductions.fne > 0) {
      tableData.push([
        'F.N.E. (Fonds National de l\'Emploi)',
        '-',
        'Variable',
        deductions.fne.toLocaleString()
      ]);
    }

    // Ligne de séparation
    tableData.push(['', '', '', '']);

    // Total des déductions
    tableData.push([
      'TOTAL DÉDUCTIONS',
      '',
      '',
      deductions.total.toLocaleString()
    ]);

    // Génération du tableau
    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 15;
  }

  /**
   * Génère le récapitulatif final avec le net à payer
   */
  generateSummary(doc, normalizedData, startY) {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const netPay = this.calculateNetPay(normalizedData);
    let y = startY;

    // Ligne de séparation
    doc.setLineWidth(1);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Tableau récapitulatif
    const summaryData = [
      ['', 'Montant (FCFA)'],
      ['Total des gains', normalizedData.remuneration.total.toLocaleString()],
      ['Total des déductions', normalizedData.deductions.total.toLocaleString()],
      ['NET À PAYER', netPay.toLocaleString()]
    ];

    doc.autoTable({
      startY: y,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      theme: 'grid',
      styles: {
        font: 'times',
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontSize: 11,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold' },
        1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 20;
  }

  /**
   * Génère le pied de page avec signatures
   */
  generateFooter(doc, normalizedData, startY) {
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = Math.max(startY, pageHeight - 50);

    // Date et lieu
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const dateText = `Yaoundé, le ${displayDate(new Date())}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, y);

    y += 15;

    // Signatures
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text("L'EMPLOYEUR", margin + 20, y);
    doc.text("LE SALARIÉ", pageWidth - margin - 60, y);

    // Lignes de signature
    y += 5;
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 70, y);
    doc.line(pageWidth - margin - 70, y, pageWidth - margin, y);

    // Mentions obligatoires
    y += 15;
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const legalText = "Ce bulletin de paie doit être conservé sans limitation de durée";
    const legalWidth = doc.getTextWidth(legalText);
    doc.text(legalText, (pageWidth - legalWidth) / 2, y);

    // Numéro de page
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    const pageText = "Page 1/1";
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 10);
  }

  /**
   * Implémentation de la méthode abstraite generateTemplate
   * Génère le modèle classique complet
   */
  generateTemplate(doc, normalizedData, logo) {
    let currentY = 0;

    // Génération séquentielle des sections
    currentY = this.generateHeader(doc, normalizedData, logo);
    currentY = this.generateTitle(doc, normalizedData);
    currentY = this.generateInfoTable(doc, normalizedData, currentY);
    currentY = this.generateRemunerationTable(doc, normalizedData, currentY);
    currentY = this.generateDeductionsTable(doc, normalizedData, currentY);
    currentY = this.generateSummary(doc, normalizedData, currentY);
    this.generateFooter(doc, normalizedData, currentY);

    return doc;
  }
}

export default PaySlipTemplateClassic;