import React from 'react';
import PaySlipTemplateBase, { escapeText } from './PaySlipTemplateBase';
import { displayDate } from "../utils/displayUtils";

/**
 * Modèle moderne de fiche de paie avec design attrayant
 * Utilise des couleurs, des blocs et une typography moderne
 */
class PaySlipTemplateModern extends PaySlipTemplateBase {

  /**
   * Génère l'en-tête moderne avec logo et informations
   */
  generateHeader(doc, normalizedData, logo) {
    const { employer } = normalizedData;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin;

    // Fond coloré pour l'en-tête
    doc.setFillColor(41, 128, 185); // Bleu moderne
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo
    if (logo) {
      this.addLogo(doc, logo, margin, y + 5, 25, 25);
    }

    // Nom de l'entreprise en blanc
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(escapeText(employer.name), margin + 35, y + 15);

    // Adresse et informations en blanc plus petit
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(escapeText(employer.address), margin + 35, y + 22);
    doc.text(`Tél: ${escapeText(employer.phone)} | CNPS: ${escapeText(employer.cnpsNumber)}`, margin + 35, y + 28);

    // Remettre la couleur à noir pour le reste
    doc.setTextColor(0, 0, 0);
    
    return y + 45;
  }

  /**
   * Génère le titre de la fiche de paie avec style moderne
   */
  generateTitle(doc, normalizedData) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 50;

    // Titre principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(52, 73, 94); // Gris foncé moderne
    const title = "BULLETIN DE PAIE";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);

    // Ligne décorative sous le titre
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.line((pageWidth - titleWidth) / 2, y + 3, (pageWidth + titleWidth) / 2, y + 3);

    // Période et date de génération
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    const periodText = `Période: ${normalizedData.payPeriod}`;
    const dateText = `Généré le: ${displayDate(normalizedData.generatedAt)}`;
    
    doc.text(periodText, margin, y);
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateWidth, y);

    // Remettre la couleur à noir
    doc.setTextColor(0, 0, 0);

    return y + 10;
  }

  /**
   * Génère les informations de l'employé dans un bloc moderne
   */
  generateEmployeeInfo(doc, normalizedData, startY) {
    const { employee } = normalizedData;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const blockWidth = (pageWidth - 3 * margin) / 2;
    let y = startY;

    // Bloc employé avec fond coloré
    doc.setFillColor(236, 240, 241); // Gris très clair
    doc.setDrawColor(189, 195, 199);
    doc.rect(margin, y, blockWidth, 60, 'FD');

    // Titre du bloc
    doc.setFillColor(52, 152, 219); // Bleu
    doc.rect(margin, y, blockWidth, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("INFORMATIONS SALARIÉ", margin + 5, y + 8);

    // Contenu du bloc
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const employeeInfo = [
      `Nom complet: ${escapeText(employee.name)}`,
      `Matricule: ${escapeText(employee.matricule)}`,
      `Poste: ${escapeText(employee.poste)}`,
      `Classification: ${escapeText(employee.professionalClassification)}`,
      `Département: ${escapeText(employee.department)}`,
      `CNPS: ${escapeText(employee.cnpsNumber)}`
    ];

    employeeInfo.forEach((info, index) => {
      doc.text(info, margin + 5, y + 20 + (index * 6));
    });

    return y + 70;
  }

  /**
   * Génère le tableau de rémunération avec style moderne
   */
  generateRemunerationTable(doc, normalizedData, startY) {
    const { salaryDetails, remuneration, primes = [], indemnites = [] } = normalizedData;
    const margin = 15;
    let y = startY;

    // Titre de section avec icône stylisée
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96); // Vert pour les gains
    doc.text("💰 RÉMUNÉRATION ET GAINS", margin, y);
    
    // Ligne sous le titre
    doc.setDrawColor(39, 174, 96);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 100, y + 2);

    y += 10;

    // Données du tableau
    const tableData = [
      ['Désignation', 'Base/Nombre', 'Taux/Unité', 'Montant (FCFA)'],
      ['Salaire de base', '-', '-', salaryDetails.monthlyRate.toLocaleString()],
      ['Taux journalier', '-', salaryDetails.dailyRate.toLocaleString(), '-'],
      ['Taux horaire', '-', salaryDetails.hourlyRate.toLocaleString(), '-'],
      ['Jours travaillés', remuneration.workedDays.toString(), '-', '-'],
      ['Heures supplémentaires', '-', '-', remuneration.overtime.toLocaleString()],
      ['Indemnité transport', '-', '-', salaryDetails.transportAllowance.toLocaleString()]
    ];

    // Ajouter les primes
    primes.forEach((prime, index) => {
      tableData.push([
        `Prime: ${prime.label || prime.type || `Prime ${index + 1}`}`,
        '-', '-',
        Number(prime.value || prime.montant || 0).toLocaleString()
      ]);
    });

    // Ajouter les indemnités
    indemnites.forEach((indem, index) => {
      tableData.push([
        `Indemnité: ${indem.label || indem.type || `Indemnité ${index + 1}`}`,
        '-', '-',
        Number(indem.value || indem.montant || 0).toLocaleString()
      ]);
    });

    // Total
    tableData.push(['', '', '', '']);
    tableData.push(['TOTAL BRUT', '', '', remuneration.total.toLocaleString()]);

    // Génération du tableau avec jsPDF-AutoTable
    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        lineColor: [189, 195, 199],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [39, 174, 96],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249]
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Génère le tableau des déductions avec style moderne
   */
  generateDeductionsTable(doc, normalizedData, startY) {
    const { deductions } = normalizedData;
    const margin = 15;
    let y = startY;

    // Titre de section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(231, 76, 60); // Rouge pour les déductions
    doc.text("📉 COTISATIONS ET DÉDUCTIONS", margin, y);
    
    // Ligne sous le titre
    doc.setDrawColor(231, 76, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, y + 2, margin + 120, y + 2);

    y += 10;

    // Données du tableau
    const tableData = [
      ['Cotisation', 'Taux', 'Base', 'Montant (FCFA)'],
      ['CNPS (PVID)', '4,2%', '-', deductions.pvid.toLocaleString()],
      ['IRPP', 'Variable', '-', deductions.irpp.toLocaleString()],
      ['CAC', '10% IRPP', '-', deductions.cac.toLocaleString()],
      ['CFC', '1%', '-', deductions.cfc.toLocaleString()],
      ['RAV', 'Forfait', '-', deductions.rav.toLocaleString()],
      ['TDL', 'Variable', '-', deductions.tdl.toLocaleString()],
      ['FNE', 'Variable', '-', deductions.fne.toLocaleString()],
      ['', '', '', ''],
      ['TOTAL DÉDUCTIONS', '', '', deductions.total.toLocaleString()]
    ];

    // Génération du tableau
    doc.autoTable({
      startY: y,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        lineColor: [189, 195, 199],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [231, 76, 60],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249]
      },
      margin: { left: margin, right: margin }
    });

    return doc.lastAutoTable.finalY + 10;
  }

  /**
   * Génère le résumé final avec le net à payer
   */
  generateSummary(doc, normalizedData, startY) {
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const netPay = this.calculateNetPay(normalizedData);
    let y = startY;

    // Bloc net à payer avec design moderne
    const blockWidth = pageWidth - 2 * margin;
    const blockHeight = 25;

    // Fond dégradé simulé
    doc.setFillColor(46, 204, 113); // Vert moderne
    doc.rect(margin, y, blockWidth, blockHeight, 'F');

    // Bordure
    doc.setDrawColor(39, 174, 96);
    doc.setLineWidth(1);
    doc.rect(margin, y, blockWidth, blockHeight, 'D');

    // Texte net à payer
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    const netText = `NET À PAYER: ${netPay.toLocaleString()} FCFA`;
    const netTextWidth = doc.getTextWidth(netText);
    doc.text(netText, (pageWidth - netTextWidth) / 2, y + 16);

    // Remettre la couleur normale
    doc.setTextColor(0, 0, 0);

    return y + blockHeight + 15;
  }

  /**
   * Génère le pied de page moderne
   */
  generateFooter(doc, normalizedData, startY) {
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = Math.max(startY, pageHeight - 40);

    // Date et lieu
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(127, 140, 141);
    const dateText = `Yaoundé, le ${displayDate(new Date())}`;
    doc.text(dateText, margin, y);

    // Signatures
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(52, 73, 94);
    doc.text("L'Employeur", margin, y);
    doc.text("Le Salarié", pageWidth - margin - 50, y);

    // Lignes de signature stylisées
    y += 5;
    doc.setDrawColor(52, 73, 94);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 60, y);
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y);

    // Mentions légales en bas
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(149, 165, 166);
    const legalText = "Document généré automatiquement - Conforme à la réglementation camerounaise";
    const legalWidth = doc.getTextWidth(legalText);
    doc.text(legalText, (pageWidth - legalWidth) / 2, y);

    // Numéro de page moderne
    const pageText = "Page 1/1";
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 8);
  }

  /**
   * Implémentation de la méthode abstraite generateTemplate
   * Génère le modèle moderne complet
   */
  generateTemplate(doc, normalizedData, logo) {
    let currentY = 0;

    // Génération séquentielle des sections
    currentY = this.generateHeader(doc, normalizedData, logo);
    currentY = this.generateTitle(doc, normalizedData);
    currentY = this.generateEmployeeInfo(doc, normalizedData, currentY);
    currentY = this.generateRemunerationTable(doc, normalizedData, currentY);
    currentY = this.generateDeductionsTable(doc, normalizedData, currentY);
    currentY = this.generateSummary(doc, normalizedData, currentY);
    this.generateFooter(doc, normalizedData, currentY);

    return doc;
  }
}

export default PaySlipTemplateModern;