import React from 'react';
import PaySlipTemplateBase, { escapeText } from './PaySlipTemplateBase';
import { displayDate } from "../utils/displayUtils";

/**
 * Modèle minimaliste de fiche de paie 
 * Design épuré avec l'essentiel uniquement
 */
class PaySlipTemplateMinimal extends PaySlipTemplateBase {

  /**
   * Génère l'en-tête minimaliste
   */
  generateHeader(doc, normalizedData, logo) {
    const { employer } = normalizedData;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = margin;

    // Ligne d'en-tête simple
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(escapeText(employer.name), margin, y);

    // Logo petit en haut à droite si disponible
    if (logo) {
      this.addLogo(doc, logo, pageWidth - margin - 20, y - 5, 20, 20);
    }

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${escapeText(employer.address)} | Tél: ${escapeText(employer.phone)}`, margin, y);

    return y + 15;
  }

  /**
   * Génère le titre épuré
   */
  generateTitle(doc, normalizedData) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    let y = 35;

    // Titre simple centré
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const title = "FICHE DE PAIE";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, y);

    // Période sur la même ligne
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const info = `${normalizedData.payPeriod} - ${displayDate(normalizedData.generatedAt)}`;
    const infoWidth = doc.getTextWidth(info);
    doc.text(info, (pageWidth - infoWidth) / 2, y);

    return y + 15;
  }

  /**
   * Génère les informations essentielles en format compact
   */
  generateCompactInfo(doc, normalizedData, startY) {
    const { employee } = normalizedData;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    let y = startY;

    // Informations employé sur 2 lignes
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const line1 = `${escapeText(employee.name)} (${escapeText(employee.matricule)}) - ${escapeText(employee.poste)}`;
    doc.text(line1, margin, y);
    
    y += 6;
    const line2 = `${escapeText(employee.department)} | CNPS: ${escapeText(employee.cnpsNumber)}`;
    doc.text(line2, margin, y);

    // Ligne de séparation fine
    y += 8;
    doc.setLineWidth(0.2);
    doc.setDrawColor(150, 150, 150);
    doc.line(margin, y, pageWidth - margin, y);

    return y + 8;
  }

  /**
   * Génère un tableau simplifié de rémunération
   */
  generateSimplifiedRemuneration(doc, normalizedData, startY) {
    const { salaryDetails, remuneration, primes = [], indemnites = [] } = normalizedData;
    const margin = 15;
    let y = startY;

    // Titre section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("GAINS", margin, y);
    y += 8;

    // Données simplifiées
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const gains = [];
    
    // Salaire de base
    gains.push(['Salaire de base', salaryDetails.monthlyRate.toLocaleString()]);
    
    // Transport si > 0
    if (salaryDetails.transportAllowance > 0) {
      gains.push(['Transport', salaryDetails.transportAllowance.toLocaleString()]);
    }
    
    // Heures sup si > 0
    if (remuneration.overtime > 0) {
      gains.push(['Heures sup.', remuneration.overtime.toLocaleString()]);
    }

    // Primes (condensées)
    const totalPrimes = primes.reduce((acc, p) => acc + Number(p.value || p.montant || 0), 0);
    if (totalPrimes > 0) {
      gains.push(['Primes', totalPrimes.toLocaleString()]);
    }

    // Indemnités (condensées) 
    const totalIndemnites = indemnites.reduce((acc, i) => acc + Number(i.value || i.montant || 0), 0);
    if (totalIndemnites > 0) {
      gains.push(['Indemnités', totalIndemnites.toLocaleString()]);
    }

    // Affichage des gains
    gains.forEach(([label, amount]) => {
      doc.text(label, margin + 5, y);
      doc.text(`${amount} F`, margin + 80, y);
      y += 5;
    });

    // Total brut
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL BRUT', margin + 5, y);
    doc.text(`${remuneration.total.toLocaleString()} F`, margin + 80, y);

    return y + 10;
  }

  /**
   * Génère un tableau simplifié des déductions
   */
  generateSimplifiedDeductions(doc, normalizedData, startY) {
    const { deductions } = normalizedData;
    const margin = 15;
    let y = startY;

    // Titre section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("DÉDUCTIONS", margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Affichage simplifié uniquement des déductions > 0
    const deductionsData = [
      ['CNPS', deductions.pvid],
      ['IRPP', deductions.irpp],
      ['CAC', deductions.cac],
      ['CFC', deductions.cfc],
      ['RAV', deductions.rav],
      ['TDL', deductions.tdl],
      ['FNE', deductions.fne]
    ];

    deductionsData.forEach(([label, amount]) => {
      if (amount > 0) {
        doc.text(label, margin + 5, y);
        doc.text(`${amount.toLocaleString()} F`, margin + 80, y);
        y += 5;
      }
    });

    // Total déductions
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL DÉDUCTIONS', margin + 5, y);
    doc.text(`${deductions.total.toLocaleString()} F`, margin + 80, y);

    return y + 15;
  }

  /**
   * Génère le net à payer de façon minimaliste
   */
  generateMinimalSummary(doc, normalizedData, startY) {
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const netPay = this.calculateNetPay(normalizedData);
    let y = startY;

    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Net à payer centré et encadré simplement
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const netText = `NET À PAYER: ${netPay.toLocaleString()} FCFA`;
    const netWidth = doc.getTextWidth(netText);
    const netX = (pageWidth - netWidth) / 2;
    
    // Rectangle simple autour du net
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.rect(netX - 5, y - 3, netWidth + 10, 10, 'D');
    
    doc.text(netText, netX, y + 4);

    return y + 20;
  }

  /**
   * Génère un pied de page minimal
   */
  generateMinimalFooter(doc, normalizedData, startY) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Signatures en bas de page
    const y = pageHeight - 30;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("Employeur", margin, y);
    doc.text("Salarié", pageWidth - margin - 30, y);

    // Lignes de signature simples
    doc.setLineWidth(0.3);
    doc.line(margin, y + 3, margin + 40, y + 3);
    doc.line(pageWidth - margin - 40, y + 3, pageWidth - margin, y + 3);

    // Date centrée
    const dateText = displayDate(new Date());
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, (pageWidth - dateWidth) / 2, y + 15);
  }

  /**
   * Implémentation de la méthode abstraite generateTemplate
   * Génère le modèle minimaliste complet
   */
  generateTemplate(doc, normalizedData, logo) {
    let currentY = 0;

    // Génération séquentielle des sections minimales
    currentY = this.generateHeader(doc, normalizedData, logo);
    currentY = this.generateTitle(doc, normalizedData);
    currentY = this.generateCompactInfo(doc, normalizedData, currentY);
    currentY = this.generateSimplifiedRemuneration(doc, normalizedData, currentY);
    currentY = this.generateSimplifiedDeductions(doc, normalizedData, currentY);
    currentY = this.generateMinimalSummary(doc, normalizedData, currentY);
    this.generateMinimalFooter(doc, normalizedData, currentY);

    return doc;
  }
}

export default PaySlipTemplateMinimal;