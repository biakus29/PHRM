import React, { useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { displayGeneratedAt, displayDate } from "../utils/displayUtils";

const REQUIRED_FIELDS = [
  { key: 'employee.name', label: "Nom de l'employé" },
  { key: 'employee.matricule', label: 'Matricule' },
  { key: 'salaryDetails.baseSalary', label: 'Salaire de base' },
  { key: 'payPeriod', label: 'Période de paie' },
];

function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const ExportPaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt, auto = false, onExported }) => {
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
      const payslip = {
        employee: employee || {},
        employer: employer || {},
        salaryDetails: salaryDetails || {},
        remuneration: remuneration || {},
        deductions: deductions || {},
        payPeriod: payPeriod || 'N/A',
        generatedAt: generatedAt || new Date(),
      };
      
      // Valeurs par défaut avec fallback
      const emp = payslip.employee;
      const empName = emp.name || 'N/A';
      const empMatricule = emp.matricule || 'N/A';
      const empPoste = emp.poste || 'N/A';
      const empCategory = emp.professionalCategory || 'N/A';
      const empCNPS = emp.cnpsNumber || 'N/A';
      const empEmail = emp.email || 'N/A';
      
      const employerName = payslip.employer.companyName || payslip.employer.name || 'N/A';
      const employerAddress = payslip.employer.address || 'N/A';
      const employerCNPS = payslip.employer.cnpsNumber || 'N/A';
      
      // Calculs avec fallback
      const salary = payslip.salaryDetails.baseSalary || 0;
      const dailyRate = payslip.salaryDetails.dailyRate || 0;
      const hourlyRate = payslip.salaryDetails.hourlyRate || 0;
      const transport = payslip.salaryDetails.transportAllowance || 0;
      const workedDays = payslip.remuneration.workedDays || 0;
      const overtime = payslip.remuneration.overtime || 0;
      const remunerationTotal = payslip.remuneration.total || 0;
      
      const pvid = payslip.deductions.pvis || 0;
      const irpp = payslip.deductions.irpp || 0;
      const cac = payslip.deductions.cac || 0;
      const cfc = payslip.deductions.cfc || 0;
      const rav = payslip.deductions.rav || 0;
      const tdl = payslip.deductions.tdl || 0;
      const deductionsTotal = payslip.deductions.total || 0;
      
      const netToPay = Math.max(0, Number(remunerationTotal) - Number(deductionsTotal));
      
      // Configuration du PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      let y = margin;
      
      // Configuration des polices professionnelles
      doc.setFont('times', 'normal');
      
      // 1. EN-TÊTE - Logo et informations employeur
      let logoData = null;
      try {
        logoData = localStorage.getItem(`logo_${payslip.employer.id}`);
        if (logoData) {
          const extension = logoData.includes('image/png') ? 'PNG' : logoData.includes('image/jpeg') ? 'JPEG' : null;
          if (extension) {
            doc.addImage(logoData, extension, margin, y, 20, 20);
          }
        }
      } catch (e) {
        console.error('Erreur logo:', e);
      }
      
      // Informations employeur alignées à droite
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      const employerInfo = [
        employerName,
        employerAddress,
        `CNPS: ${employerCNPS}`
      ];
      
      let employerY = y + 3;
      employerInfo.forEach((info, index) => {
        const textWidth = doc.getTextWidth(info);
        doc.text(info, pageWidth - margin - textWidth, employerY + (index * 4), { align: 'right' });
      });
      
      y += 25;
      
      // 2. TITRE ET PÉRIODE
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      const title = "FICHE DE PAIE";
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, y, { align: 'center' });
      y += 6;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      const periodText = `Période: ${payslip.payPeriod}`;
      const dateText = `Généré le: ${displayDate(payslip.generatedAt)}`;
      const periodWidth = doc.getTextWidth(periodText);
      const dateWidth = doc.getTextWidth(dateText);
      
      doc.text(periodText, margin, y);
      doc.text(dateText, pageWidth - margin - dateWidth, y, { align: 'right' });
      y += 10;
      
      // 3. TABLEAU EMPLOYEUR ET SALARIÉ (2 colonnes)
      autoTable(doc, {
        startY: y,
        head: [['EMPLOYEUR', 'SALARIÉ']],
        body: [
          [`Raison sociale: ${employerName}`, `Nom: ${empName}`],
          [`Adresse: ${employerAddress}`, `Matricule: ${empMatricule}`],
          [`CNPS: ${employerCNPS}`, `Poste: ${empPoste}`],
          ['', `Catégorie: ${empCategory}`],
          ['', `CNPS: ${empCNPS}`],
          ['', `Email: ${empEmail}`]
        ],
        theme: 'grid',
        styles: { 
          font: 'times', 
          fontSize: 7, 
          cellPadding: 2,
          fillColor: [240, 240, 240]
        },
        headStyles: { 
          fillColor: [200, 200, 200], 
          textColor: [0, 0, 0], 
          fontSize: 8,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - (2 * margin)
      });
      y = doc.lastAutoTable.finalY + 5;
      
      // 4. TABLEAU RÉMUNÉRATION
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text('RÉMUNÉRATION', margin, y);
      y += 5;
      
      autoTable(doc, {
        startY: y,
        head: [['Désignation', 'Base', 'Taux', 'Montant (FCFA)']],
        body: [
          ['Salaire de base', salary.toLocaleString(), '', salary.toLocaleString()],
          ['Taux journalier', '', dailyRate.toLocaleString(), ''],
          ['Taux horaire', '', hourlyRate.toLocaleString(), ''],
          ['Indemnité transport', '', '', transport.toLocaleString()],
          ['Jours travaillés', workedDays.toString(), '', ''],
          ['Heures supplémentaires', '', '', overtime.toLocaleString()],
          ['', '', '', ''],
          ['TOTAL BRUT', '', '', remunerationTotal.toLocaleString()]
        ],
        theme: 'grid',
        styles: { 
          font: 'times', 
          fontSize: 7, 
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [200, 200, 200], 
          textColor: [0, 0, 0], 
          fontSize: 8,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - (2 * margin)
      });
      y = doc.lastAutoTable.finalY + 5;
      
      // 5. TABLEAU DÉDUCTIONS
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text('DÉDUCTIONS', margin, y);
      y += 5;
      
      autoTable(doc, {
        startY: y,
        head: [['Cotisation', 'Part Salariale', 'Part Patronale', 'Montant (FCFA)']],
        body: [
          ['PVIS', pvid.toLocaleString(), '', pvid.toLocaleString()],
          ['IRPP', irpp.toLocaleString(), '', irpp.toLocaleString()],
          ['CAC', cac.toLocaleString(), '', cac.toLocaleString()],
          ['CFC', cfc.toLocaleString(), '', cfc.toLocaleString()],
          ['RAV', rav.toLocaleString(), '', rav.toLocaleString()],
          ['TDL', tdl.toLocaleString(), '', tdl.toLocaleString()],
          ['', '', '', ''],
          ['TOTAL DÉDUCTIONS', '', '', deductionsTotal.toLocaleString()]
        ],
        theme: 'grid',
        styles: { 
          font: 'times', 
          fontSize: 7, 
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [200, 200, 200], 
          textColor: [0, 0, 0], 
          fontSize: 8,
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - (2 * margin)
      });
      y = doc.lastAutoTable.finalY + 10;
      
      // 6. NET À PAYER - Encadré avec fond gris
      const netToPayText = `NET À PAYER: ${netToPay.toLocaleString()} FCFA`;
      const netToPayWidth = doc.getTextWidth(netToPayText);
      
      // Rectangle de fond gris
      doc.setFillColor(240, 240, 240);
      doc.rect(margin - 3, y - 3, netToPayWidth + 6, 12, 'F');
      
      // Texte en gras
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(netToPayText, margin, y + 4);
      
      y += 20;
      
      // 7. SIGNATURES ET DATE
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      const signatureText = `Fait à ${employerAddress || 'Yaoundé'}, le ${displayDate(new Date())}`;
      doc.text(signatureText, margin, y);
      y += 10;
      
      doc.setFont('times', 'bold');
      doc.setFontSize(9);
      doc.text("Signature Employeur", margin, y);
      doc.text("Signature Salarié", pageWidth - margin - 50, y);
      y += 6;
      
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.line(margin, y, margin + 50, y); // Ligne signature employeur
      doc.line(pageWidth - margin - 50, y, pageWidth - margin, y); // Ligne signature salarié
      
      // 8. PIED DE PAGE
      doc.setFont('times', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const footerText = `Fiche de paie générée automatiquement - Page 1/1`;
      const footerWidth = doc.getTextWidth(footerText);
      doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8, { align: 'center' });
      
      // Réinitialiser la couleur
      doc.setTextColor(0, 0, 0);
      
      // 9. NOM DU FICHIER
      const safeFileName = `fiche_paie_${empName.replace(/[^a-zA-Z0-9]/g, "_")}_${payslip.payPeriod.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(safeFileName);
      if (onExported) onExported();
      console.log('Fiche de paie générée avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération de la fiche de paie:', error);
      alert('Erreur lors de la génération de la fiche de paie PDF');
    }
  };

  useEffect(() => {
    if (auto) {
      generatePaySlipPDF();
    }
    // eslint-disable-next-line
  }, [auto]);

  if (auto) return null;

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Génération de la Fiche de Paie PDF</h3>
      <p className="text-sm text-gray-600 mb-4">
        Cliquez sur le bouton ci-dessous pour générer et télécharger la fiche de paie au format PDF.
      </p>
      <button
        onClick={generatePaySlipPDF}
        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exporter la Fiche de Paie en PDF
      </button>
    </div>
  );
};

export default ExportPaySlip; 