import React, { useEffect } from 'react';
import { INDEMNITIES, BONUSES } from '../utils/payrollLabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { displayGeneratedAt, displayDate } from "../utils/displayUtils";
import { computeEffectiveDeductions, computeRoundedDeductions, computeNetPay, formatCFA, computeStatutoryDeductions } from "../utils/payrollCalculations";
import { getPayslipCacheKeyFromEmployee, setLastPayslipCache } from "../utils/payslipCache";

// Formatage monétaire importé depuis utils centralisés

// Formatage pourcentage
const formatPercent = (rate) => {
  return `${Number(rate) || 0}%`;
};

const REQUIRED_FIELDS = [
  { key: 'employee.name', label: "Nom de l'employé" },
  { key: 'employee.matricule', label: 'Matricule' },
  { key: 'salaryDetails.baseSalary', label: 'Salaire de base' },
  { key: 'payPeriod', label: 'Période de paie' },
];

function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const ExportPaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt, primes, indemnites, auto = false, onExported }) => {
  
  const generatePaySlipPDF = () => {
    // Vérification des champs obligatoires
    const payslip = { employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt };
    const missing = REQUIRED_FIELDS.filter(f => !getValue(payslip, f.key));
    if (missing.length > 0) {
      const msg = "Impossible de générer le PDF. Champs manquants :\n" + missing.map(f => `- ${f.label}`).join("\n");
      if (toast) toast.error(msg);
      else alert(msg);
      return;
    }

    try {
      // Données avec fallback
      const payslipData = {
        employee: employee || {},
        employer: employer || {},
        salaryDetails: salaryDetails || {},
        remuneration: remuneration || {},
        deductions: deductions || {},
        payPeriod: payPeriod || 'N/A',
        generatedAt: generatedAt || new Date(),
      };
      
      // Valeurs employé
      const emp = payslipData.employee;
      const empName = emp.name || 'N/A';
      const empMatricule = emp.matricule || 'N/A';
      const empPoste = emp.poste || emp.position || 'N/A';
      const empCategory = emp.professionalCategory || emp.category || 'N/A';
      const empCNPS = emp.cnpsNumber || 'N/A';
      const empEmail = emp.email || 'N/A';
      const empPhone = emp.phone || 'N/A';
      
      // Valeurs employeur
      const employerName = payslipData.employer.companyName || payslipData.employer.name || 'N/A';
      const employerAddress = payslipData.employer.address || 'N/A';
      const employerCNPS = payslipData.employer.cnpsNumber || 'N/A';
      const employerPhone = payslipData.employer.phone || 'N/A';
      const employerEmail = payslipData.employer.email || 'N/A';
      
      // Calculs rémunération
      const baseSalary = Number(payslipData.salaryDetails.baseSalary) || 0;
      const transportAllowance = Number(payslipData.salaryDetails.transportAllowance) || 0;
      const housingAllowance = Number(payslipData.salaryDetails.housingAllowance) || 0;
      const overtime = Number(payslipData.remuneration.overtime) || 0;
      const bonus = Number(payslipData.remuneration.bonus) || 0;
      const workedDays = Number(payslipData.remuneration.workedDays) || 0;
      const workedHours = Number(payslipData.remuneration.workedHours) || 0;
      
      // Calculs centralisés via utils
      const statutory = computeStatutoryDeductions(payslipData.salaryDetails || {}, payslipData.remuneration || {}, payslipData.primes || [], payslipData.indemnites || []);
      const mergedDeductions = { ...statutory, ...(payslipData.deductions || {}) };
      const payrollCalc = computeNetPay({
        salaryDetails: payslipData.salaryDetails || {},
        remuneration: payslipData.remuneration || {},
        deductions: mergedDeductions,
        primes: payslipData.primes || [],
        indemnites: payslipData.indemnites || []
      });
      const { grossTotal: totalGross, roundedDeductions: d, deductionsTotal: totalDeductions, netPay: netSalary } = payrollCalc;
      
      // Calcul du SBT (Salaire Brut Taxable) pour affichage
      const representationAllowance = Number(payslipData.salaryDetails.representationAllowance) || 0;
      const dirtAllowance = Number(payslipData.salaryDetails.dirtAllowance) || 0;
      const mealAllowance = Number(payslipData.salaryDetails.mealAllowance) || 0;
      const sbt = baseSalary + housingAllowance + overtime + bonus;
      
      // Cache local des montants utiles pour CNPS (pré-remplissage)
      try {
        const empKey = getPayslipCacheKeyFromEmployee(emp);
        if (empKey) {
          const cachePayload = {
            baseSalary,
            transportAllowance,
            housingAllowance,
            overtime,
            bonus,
            representationAllowance,
            dirtAllowance,
            mealAllowance,
            // Ajout des montants calculés pour CNPS
            netToPay: Number(netSalary) || 0,
            net: Number(netSalary) || 0,
            sbt: Number(sbt) || 0,
            irpp: Number(d.irpp) || 0,
            cac: Number(d.cac) || 0,
            cfc: Number(d.cfc) || 0,
            tdl: Number(d.tdl) || 0,
            rav: Number(d.rav) || 0,
            pvis: Number(d.pvis) || 0,
            // Persist dynamic arrays when available
            primes: Array.isArray(primes)
              ? primes.map(p => ({ label: p.label || p.type, montant: Number(p.montant) || 0 }))
              : undefined,
            indemnites: Array.isArray(indemnites)
              ? indemnites.map(i => ({ label: i.label || i.type, montant: Number(i.montant) || 0 }))
              : undefined,
          };
          setLastPayslipCache(empKey, cachePayload);
        }
      } catch (e) {
        console.warn('Cache payslip CNPS indisponible:', e);
      }

      // Configuration PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 12;
      let currentY = margin;
      
      // === EN-TÊTE AVEC LOGO ET RÉPUBLIQUE DU CAMEROUN ===
      let logoHeight = 0;
      
      // Ajout du logo à gauche
      try {
        const logoData = localStorage.getItem(`logo_${payslipData.employer.id}`);
        if (logoData) {
          const extension = logoData.includes('image/png') ? 'PNG' : 
                           logoData.includes('image/jpeg') ? 'JPEG' : 
                           logoData.includes('image/jpg') ? 'JPEG' : null;
          if (extension) {
            doc.addImage(logoData, extension, margin, currentY, 20, 20);
            logoHeight = 20;
          }
        }
      } catch (e) {
        console.error('Erreur logo:', e);
      }
      
      // En-tête République du Cameroun au centre
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      const republicText = "RÉPUBLIQUE DU CAMEROUN";
      const peaceText = "Paix - Travail - Progrès";
      const republicWidth = doc.getTextWidth(republicText);
      const peaceWidth = doc.getTextWidth(peaceText);
      
      doc.text(republicText, (pageWidth - republicWidth) / 2, currentY + 5);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text(peaceText, (pageWidth - peaceWidth) / 2, currentY + 9);
      
      // Informations entreprise à droite (compactes)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      const rightX = pageWidth - margin - 55;
      doc.text(employerName, rightX, currentY + 3);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`CNPS: ${employerCNPS}`, rightX, currentY + 7);
      
      currentY = Math.max(currentY + logoHeight, currentY + 12);
      
      // Ligne de séparation
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 4;
      
      // === TITRE BULLETIN DE SALAIRE ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      
      const titleText = "BULLETIN DE SALAIRE";
      const titleWidth = doc.getTextWidth(titleText);
      doc.text(titleText, (pageWidth - titleWidth) / 2, currentY);
      currentY += 6;
      
      // Période de paie
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const periodText = `Période : ${payslipData.payPeriod}`;
      const periodWidth = doc.getTextWidth(periodText);
      doc.text(periodText, (pageWidth - periodWidth) / 2, currentY);
      currentY += 8;
      
      // === INFORMATIONS EMPLOYEUR ET EMPLOYÉ ===
      autoTable(doc, {
        startY: currentY,
        head: [['EMPLOYEUR', 'SALARIÉ']],
        body: [
          [`Dénomination : ${employerName}`, `Nom et Prénoms : ${empName}`],
          [`Adresse : ${employerAddress}`, `Matricule : ${empMatricule}`],
          [`N° CNPS : ${employerCNPS}`, `Fonction : ${empPoste}`],
          [`Téléphone : ${employerPhone}`, `Catégorie : ${empCategory}`],
          ['', `N° CNPS : ${empCNPS}`]
        ],
        theme: 'grid',
        styles: { 
          font: 'helvetica', 
          fontSize: 8, 
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.2
        },
        headStyles: { 
          fillColor: [200, 200, 200],
          textColor: [0, 0, 0],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: (pageWidth - 2 * margin) / 2, halign: 'left' },
          1: { cellWidth: (pageWidth - 2 * margin) / 2, halign: 'left' }
        },
        margin: { left: margin, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 5;
      
      // === SECTION GAINS ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      
      // En-tête des gains
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
      doc.text('GAINS ET AVANTAGES', margin + 2, currentY + 4);
      currentY += 8;
      
      // Tableau des gains (salaire de base uniquement pour uniformiser)
      const gainsData = [
        ['Salaire de base', formatCFA(baseSalary), 'F CFA']
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['DÉSIGNATION', 'MONTANT', 'DEVISE']],
        body: gainsData,
        theme: 'grid',
        styles: { 
          font: 'helvetica', 
          fontSize: 8, 
          cellPadding: 1.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.2
        },
        headStyles: { 
          fillColor: [180, 180, 180],
          textColor: [0, 0, 0],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 100, halign: 'left' },
          1: { cellWidth: 40, halign: 'right' },
          2: { cellWidth: 25, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 1;

      // === SECTION INDEMNITÉS ===
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('INDEMNITÉS', margin + 2, currentY + 4);
      currentY += 8;

      const indemnitesData = [
        ['Indemnité de transport', formatCFA(transportAllowance), 'F CFA'],
        ['Indemnité de logement', formatCFA(housingAllowance), 'F CFA'],
        ['Indemnité de représentation', formatCFA(representationAllowance), 'F CFA'],
        ['Prime de salissures', formatCFA(dirtAllowance), 'F CFA'],
        ['Prime de panier', formatCFA(mealAllowance), 'F CFA'],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['DÉSIGNATION', 'MONTANT', 'DEVISE']],
        body: indemnitesData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
        headStyles: { fillColor: [180, 180, 180], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { cellWidth: 100, halign: 'left' }, 1: { cellWidth: 40, halign: 'right' }, 2: { cellWidth: 25, halign: 'center' } },
        margin: { left: margin, right: margin }
      });

      currentY = doc.lastAutoTable.finalY + 6;

      // === SECTION PRIMES ===
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('PRIMES', margin + 2, currentY + 4);
      currentY += 8;

      const primesData = [
        ['Heures supplémentaires', formatCFA(overtime), 'F CFA'],
        ['Prime/Bonus', formatCFA(bonus), 'F CFA']
      ];

      autoTable(doc, {
        startY: currentY,
        head: [['DÉSIGNATION', 'MONTANT', 'DEVISE']],
        body: primesData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.5, lineColor: [0, 0, 0], lineWidth: 0.2 },
        headStyles: { fillColor: [180, 180, 180], textColor: [0, 0, 0], fontSize: 8, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { cellWidth: 100, halign: 'left' }, 1: { cellWidth: 40, halign: 'right' }, 2: { cellWidth: 25, halign: 'center' } },
        margin: { left: margin, right: margin }
      });

      currentY = doc.lastAutoTable.finalY + 6;

      // Total brut
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL BRUT', margin + 2, currentY + 3.5);
      doc.text(`${formatCFA(totalGross)} F CFA`, pageWidth - margin - 40, currentY + 3.5);
      currentY += 7;
      
      // Affichage SBT (base IRPP)
      doc.setFillColor(235, 235, 235);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('SBT (Salaire Brut Taxable)', margin + 2, currentY + 3.5);
      doc.text(`${formatCFA(sbt)} F CFA`, pageWidth - margin - 40, currentY + 3.5);
      currentY += 7;
      
      // === SECTION RETENUES ===
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      
      // En-tête des retenues
      doc.setFillColor(220, 220, 220);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 6, 'F');
      doc.text('RETENUES ET COTISATIONS', margin + 2, currentY + 4);
      currentY += 8;
      
      // Tableau des retenues (affiche les principales lignes, dont TDL via util)
      const deductionsData = [
        ['PVID (CNPS) – salarié', `${formatCFA(baseSalary)} × 4,2%`, formatCFA(d.pvid), 'F CFA'],
        ['IRPP', `${formatCFA(sbt)}`, formatCFA(d.irpp), 'F CFA'],
        ['CAC', '', formatCFA(d.cac), 'F CFA'],
        ['CFC (1% du brut)', '', formatCFA(d.cfc), 'F CFA'],
        ['RAV', '', formatCFA(d.rav), 'F CFA'],
        ['TDL (10% de l’IRPP)', `${formatCFA(d.irpp)} × 10%`, formatCFA(d.tdl), 'F CFA'],
        ['FNE', '', formatCFA(d.fne), 'F CFA'],
      ];
      
      autoTable(doc, {
        startY: currentY,
        head: [['DÉSIGNATION', 'BASE DE CALCUL', 'MONTANT', 'DEVISE']],
        body: deductionsData,
        theme: 'grid',
        styles: { 
          font: 'helvetica', 
          fontSize: 8, 
          cellPadding: 1.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.2
        },
        headStyles: { 
          fillColor: [180, 180, 180],
          textColor: [0, 0, 0],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 55, halign: 'left' },
          1: { cellWidth: 35, halign: 'center' },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: margin, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 1;
      
      // Total retenues
      doc.setFillColor(200, 200, 200);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL RETENUES', margin + 2, currentY + 3.5);
      doc.text(`${formatCFA(totalDeductions)} F CFA`, pageWidth - margin - 40, currentY + 3.5);
      currentY += 7;
      
      // === NET À PAYER ===
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, currentY, pageWidth - (2 * margin), 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      const netText = `NET À PAYER : ${formatCFA(netSalary)} F CFA`;
      const netTextWidth = doc.getTextWidth(netText);
      doc.text(netText, (pageWidth - netTextWidth) / 2, currentY + 6.5);
      currentY += 15;
      
      // === INFORMATIONS COMPLÉMENTAIRES ET SIGNATURES ===
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      // Informations sur une ligne compacte
      const infoLine = `Jours travaillés: ${workedDays} | Heures: ${workedHours} | Généré le: ${displayDate(payslipData.generatedAt)}`;
      const infoWidth = doc.getTextWidth(infoLine);
      doc.text(infoLine, (pageWidth - infoWidth) / 2, currentY);
      currentY += 10;
      
      // === SIGNATURES ===
      const cityName = employerAddress.split(',')[0]?.trim() || 'Yaoundé';
      const signatureDate = displayDate(new Date());
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Fait à ${cityName}, le ${signatureDate}`, margin, currentY);
      currentY += 8;
      
      // Espaces signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("L'EMPLOYEUR", margin + 20, currentY);
      doc.text("LE SALARIÉ", pageWidth - margin - 40, currentY);
      
      currentY += 10;
      
      // Lignes de signature
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, margin + 50, currentY);
      doc.line(pageWidth - margin - 50, currentY, pageWidth - margin, currentY);
      
      // === PIED DE PAGE ===
      const footerY = pageHeight - 10;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      
      const footerLeft = "Bulletin conforme à la réglementation camerounaise";
      const footerRight = `Page 1/1`;
      
      doc.text(footerLeft, margin, footerY);
      doc.text(footerRight, pageWidth - margin - doc.getTextWidth(footerRight), footerY);
      
      // Ligne de séparation pied de page
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.1);
      doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
      
      // === SAUVEGARDE ===
      const fileName = `Bulletin_Salaire_${empName.replace(/[^a-zA-Z0-9]/g, "_")}_${payslipData.payPeriod.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(fileName);
      
      if (onExported) onExported();
      if (toast) toast.success('Bulletin de salaire généré avec succès !');
      
      console.log('Bulletin généré:', fileName);
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      const errorMsg = 'Erreur lors de la génération du bulletin de salaire';
      if (toast) toast.error(errorMsg);
      else alert(errorMsg);
    }
  };

  useEffect(() => {
    if (auto) {
      generatePaySlipPDF();
    }
  }, [auto]);

  // Auto-met à jour le cache local des montants utiles pour CNPS dès qu'on modifie les données
  useEffect(() => {
    try {
      const empKey = getPayslipCacheKeyFromEmployee(employee || {});
      if (!empKey) return;
      // Recalcule le bulletin pour obtenir net et retenues à jour
      const statutory2 = computeStatutoryDeductions(salaryDetails || {}, remuneration || {}, primes || [], indemnites || []);
      const mergedDeductions2 = { ...statutory2, ...(deductions || {}) };
      const calc = computeNetPay({
        salaryDetails: salaryDetails || {},
        remuneration: remuneration || {},
        deductions: mergedDeductions2,
        primes: primes || [],
        indemnites: indemnites || [],
      });
      const { roundedDeductions: d2, netPay: net2 } = calc;
      const baseSalary2 = Number(salaryDetails?.baseSalary) || 0;
      const sbt2 = baseSalary2 + (Number(salaryDetails?.housingAllowance) || 0) + (Number(remuneration?.overtime) || 0) + (Number(remuneration?.bonus) || 0);
      const payload = {
        baseSalary: baseSalary2,
        transportAllowance: Number(salaryDetails?.transportAllowance) || 0,
        housingAllowance: Number(salaryDetails?.housingAllowance) || 0,
        representationAllowance: Number(salaryDetails?.representationAllowance) || 0,
        dirtAllowance: Number(salaryDetails?.dirtAllowance) || 0,
        mealAllowance: Number(salaryDetails?.mealAllowance) || 0,
        overtime: Number(remuneration?.overtime) || 0,
        bonus: Number(remuneration?.bonus) || 0,
        // Champs pour CNPS
        netToPay: Number(net2) || 0,
        net: Number(net2) || 0,
        sbt: Number(sbt2) || 0,
        irpp: Number(d2?.irpp) || 0,
        cac: Number(d2?.cac) || 0,
        cfc: Number(d2?.cfc) || 0,
        tdl: Number(d2?.tdl) || 0,
        rav: Number(d2?.rav) || 0,
        pvid: Number(d2?.pvid) || 0,
        // Persist dynamic arrays when available
        primes: Array.isArray(primes)
          ? primes.map(p => ({ label: p.label || p.type, montant: Number(p.montant) || 0 }))
          : undefined,
        indemnites: Array.isArray(indemnites)
          ? indemnites.map(i => ({ label: i.label || i.type, montant: Number(i.montant) || 0 }))
          : undefined,
      };
      setLastPayslipCache(empKey, payload);
    } catch {}
  }, [
    employee?.matricule,
    employee?.cnpsNumber,
    employee?.name,
    salaryDetails?.baseSalary,
    salaryDetails?.transportAllowance,
    salaryDetails?.housingAllowance,
    salaryDetails?.representationAllowance,
    salaryDetails?.dirtAllowance,
    salaryDetails?.mealAllowance,
    remuneration?.overtime,
    remuneration?.bonus,
    // include arrays so cache updates if user edits them upstream
    primes,
    indemnites,
  ]);

  if (auto) return null;

  // Calcul UI centralisé
  const statutory3 = computeStatutoryDeductions(salaryDetails || {}, remuneration || {}, primes || [], indemnites || []);
  const mergedDeductions3 = { ...statutory3, ...(deductions || {}) };
  const uiCalc = computeNetPay({
    salaryDetails: salaryDetails || {},
    remuneration: remuneration || {},
    deductions: mergedDeductions3,
    primes: primes || [],
    indemnites: indemnites || []
  });
  const netToPay = uiCalc.netPay;

  return (
    <div className="mt-6 p-6 border border-gray-300 rounded-lg bg-white shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Bulletin de Salaire</h3>
          <p className="text-sm text-gray-600">Format officiel République du Cameroun</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Employé :</span>
            <span className="ml-2 text-gray-900">{employee?.name || 'Non défini'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Matricule :</span>
            <span className="ml-2 text-gray-900">{employee?.matricule || 'Non défini'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Période :</span>
            <span className="ml-2 text-gray-900">{payPeriod || 'Non définie'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Salaire de base :</span>
            <span className="ml-2 text-gray-900">{formatCFA(salaryDetails?.baseSalary)} F CFA</span>
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold text-gray-700">Net à payer :</span>
            <span className="ml-2 font-bold text-green-700 text-base">
              {formatCFA(netToPay)} F CFA
            </span>
          </div>
        </div>
      </div>
      
      <button
        onClick={generatePaySlipPDF}
        className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Générer le Bulletin de Salaire PDF
      </button>

      {/* Aperçu dynamique Type / Montant (écran) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Indemnités */}
        <div className="bg-gray-50 rounded border p-4">
          <div className="font-semibold text-gray-800 mb-3">Indemnités</div>
          <div className="space-y-2">
            {INDEMNITIES
              .map(item => ({
                label: item.label,
                amount: Number(salaryDetails?.[item.key]) || 0,
              }))
              .filter(x => x.amount > 0)
              .map((x, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{x.label}</span>
                  <span className="font-medium">{formatCFA(x.amount)} F CFA</span>
                </div>
              ))}
            {INDEMNITIES.every(i => (Number(salaryDetails?.[i.key]) || 0) === 0) && (
              <div className="text-gray-400">—</div>
            )}
          </div>
        </div>

        {/* Primes */}
        <div className="bg-gray-50 rounded border p-4">
          <div className="font-semibold text-gray-800 mb-3">Primes</div>
          <div className="space-y-2">
            {BONUSES
              .map(item => ({
                label: item.label,
                amount: Number(remuneration?.[item.key]) || 0,
              }))
              .filter(x => x.amount > 0)
              .map((x, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{x.label}</span>
                  <span className="font-medium">{formatCFA(x.amount)} F CFA</span>
                </div>
              ))}
            {BONUSES.every(b => (Number(remuneration?.[b.key]) || 0) === 0) && (
              <div className="text-gray-400">—</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Conforme à la réglementation camerounaise</p>
            <ul className="text-xs space-y-1">
              <li>• Cotisations CNPS : 4,2% (salarié PVID) + 11,9% (employeur hors RP)</li>
              <li>• Crédit Foncier : 1% du salaire brut (part salarié)</li>
              <li>• Format officiel avec en-tête République du Cameroun</li>
              <li>• Calculs conformes au Code du Travail camerounais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPaySlip;