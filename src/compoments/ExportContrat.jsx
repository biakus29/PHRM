import React, { useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { displayDateOfBirth, displayContractStartDate, displayDate } from "../utils/displayUtils";

const ExportContrat = ({ employee, employer, contractData, auto = false, onExported }) => {
  const generateContractPDF = () => {
    try {
      // Debug pour voir les données reçues
      console.log('[ExportContrat] Données reçues:', {
        employee: employee,
        employer: employer,
        contractData: contractData,
        employerId: employer?.id,
        employerCompanyId: employer?.companyId
      });
      
      // Vérifier si employer est défini, sinon utiliser des valeurs par défaut
      const safeEmployer = employer || {
        id: null,
        name: 'PHRM', // Utiliser name au lieu de companyName
        address: 'BP 16194 Yaoundé',
        phone: '22214081',
        representant: 'Paul, Directeur Général',
        cnpsNumber: 'Non spécifié'
      };
      
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let y = margin;
      let currentPage = 1;

      // Configuration des polices
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      
      // 1. EN-TÊTE - Logo en haut à gauche
      let logoData = null;
      try {
        const companyId = safeEmployer?.id;
        if (companyId) {
          logoData = localStorage.getItem(`logo_${companyId}`);
          console.log(`[ExportContrat] Tentative récupération logo pour companyId: ${companyId}`);
          if (logoData) {
            console.log(`[ExportContrat] Logo trouvé pour companyId: ${companyId}`);
            const extension = logoData.includes('image/png') ? 'PNG' : logoData.includes('image/jpeg') ? 'JPEG' : null;
            if (extension) {
              doc.addImage(logoData, extension, margin, y, 30, 30);
            }
          }
        }
      } catch (e) {
        console.error(`[ExportContrat] Erreur lors de la récupération du logo:`, e);
      }
      
      // Coordonnées de l'employeur alignées à droite
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Informations de l'employeur alignées à droite
      const employerName = safeEmployer?.name || 'PHRM';
      const employerAddress = safeEmployer?.address || 'BP 16194 Yaoundé';
      const employerPhone = `Tél: ${safeEmployer?.phone || '22214081'}`;
      const employerCNPS = `CNPS: ${safeEmployer?.cnpsNumber || 'Non spécifié'}`;
      
      let employerY = y + 5;
      const nameWidth = doc.getTextWidth(employerName);
      const addressWidth = doc.getTextWidth(employerAddress);
      const phoneWidth = doc.getTextWidth(employerPhone);
      const cnpsWidth = doc.getTextWidth(employerCNPS);
      
      // Alignement précis à droite pour toutes les coordonnées
      doc.text(employerName, pageWidth - margin - nameWidth, employerY, { align: 'right' });
      doc.text(employerAddress, pageWidth - margin - addressWidth, employerY + 6, { align: 'right' });
      doc.text(employerPhone, pageWidth - margin - phoneWidth, employerY + 12, { align: 'right' });
      doc.text(employerCNPS, pageWidth - margin - cnpsWidth, employerY + 18, { align: 'right' });
      
      y += 40; // Espace après l'en-tête
      
      // Titre centré : "CONTRAT DE TRAVAIL"
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      const title = "CONTRAT DE TRAVAIL";
      const mainTitleWidth = doc.getTextWidth(title);
      const titleX = (pageWidth - mainTitleWidth) / 2;
      doc.text(title, titleX, y, { align: 'left' });
      y += 20;
      
      // 2. INFORMATIONS - Blocs Employeur et Employé
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("INFORMATIONS DE L'EMPLOYEUR", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const representant = contractData?.representant || safeEmployer?.representant || 'Paul, Directeur Général';
      
      // Informations de l'employeur sur la même ligne
      const employerLine1 = `Raison sociale: ${safeEmployer?.name || 'PHRM'}`;
      const employerLine2 = `Adresse: ${safeEmployer?.address || 'BP 16194 Yaoundé'}`;
      const employerLine3 = `Représenté par: ${representant}`;
      const employerLine4 = `Téléphone: ${safeEmployer?.phone || '22214081'}`;
      const employerLine5 = `N° CNPS: ${safeEmployer?.cnpsNumber || 'Non spécifié'}`;
      
      doc.text(employerLine1, margin, y, { align: 'left' });
      y += 6;
      doc.text(employerLine2, margin, y, { align: 'left' });
      y += 6;
      doc.text(employerLine3, margin, y, { align: 'left' });
      y += 6;
      doc.text(employerLine4, margin, y, { align: 'left' });
      y += 6;
      doc.text(employerLine5, margin, y, { align: 'left' });
      y += 15;
      
      // Bloc Employé
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("INFORMATIONS DE L'EMPLOYÉ", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const employeeDetails = [
        `Nom complet: ${employee?.name || 'N/A'}`,
        `Né(e) le: ${displayDateOfBirth(employee?.dateOfBirth)}`,
        `À: ${employee?.lieuNaissance || employee?.placeOfBirth || 'N/A'}`,
        `Fils de: ${employee?.pere || 'N/A'}`,
        `Et de: ${employee?.mere || 'N/A'}`,
        `Lieu de résidence: ${employee?.residence || 'N/A'}`,
        `Situation de famille: ${employee?.situation || 'N/A'}`,
        `Nom de l'épouse: ${employee?.epouse || 'N/A'}`,
        `Personne à prévenir: ${employee?.personneAPrevenir || 'N/A'}`
      ];
      
      employeeDetails.forEach(detail => {
        // Vérifier si on doit ajouter une nouvelle page
        if (y > pageHeight - 80) {
          doc.addPage();
          currentPage++;
          y = margin;
        }
        doc.text(detail, margin, y, { align: 'left' });
        y += 6;
      });
      y += 20;
      
      // 3. CORPS - Articles numérotés
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      const dispositionsTitle = "DISPOSITIONS CONTRACTUELLES";
      const dispositionsTitleWidth = doc.getTextWidth(dispositionsTitle);
      doc.text(dispositionsTitle, (pageWidth - dispositionsTitleWidth) / 2, y, { align: 'center' });
      y += 15;
      
      // Article 1 - Objet du contrat
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("ARTICLE 1 – OBJET DU CONTRAT", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const article1 = "Le présent contrat a pour objet l'embauche de l'employé(e) en qualité de " + 
                      (employee?.poste || 'employé') + " au sein de l'entreprise.";
      
      const lines1 = doc.splitTextToSize(article1, contentWidth);
      lines1.forEach(line => {
        if (y > pageHeight - 80) {
          doc.addPage();
          currentPage++;
          y = margin;
        }
        doc.text(line, margin, y, { align: 'justify' });
        y += 6;
      });
      y += 15;
      
      // Article 2 - Durée du contrat
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("ARTICLE 2 – DURÉE DU CONTRAT", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const article2 = [
        "1. Type de contrat: " + (contractData?.contractType || 'CDI'),
        "2. Date d'effet: " + (contractData?.startDate ? displayContractStartDate(contractData.startDate) : 'N/A'),
        "3. Période d'essai: 2 mois renouvelable une fois",
        "4. Lieu de travail: " + (contractData?.workPlace || 'Yaoundé')
      ];
      
      article2.forEach(item => {
        if (y > pageHeight - 80) {
          doc.addPage();
          currentPage++;
          y = margin;
        }
        doc.text(item, margin, y, { align: 'left' });
        y += 6;
      });
      y += 15;
      
      // Article 3 - Rémunération
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("ARTICLE 3 – RÉMUNÉRATION", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const article3 = [
        "1. Salaire de base: " + (employee?.baseSalary ? employee.baseSalary.toLocaleString() : 'N/A') + " FCFA",
        "2. Modalités de paiement: Conformément aux articles 67, 68 et 69 du Code du Travail",
        "3. Période de paie: Mensuelle"
      ];
      
      article3.forEach(item => {
        if (y > pageHeight - 80) {
          doc.addPage();
          currentPage++;
          y = margin;
        }
        doc.text(item, margin, y, { align: 'left' });
        y += 6;
      });
      y += 15;
      
      // Article 4 - Congés
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("ARTICLE 4 – CONGÉS", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const article4 = "L'employé(e) aura droit à un congé de 10 jours ouvrables par mois de service effectif, " +
                      "sous réserve des majorations de congés prévues par les textes en vigueur.";
      
      const lines4 = doc.splitTextToSize(article4, contentWidth);
      lines4.forEach(line => {
        if (y > pageHeight - 80) {
          doc.addPage();
          currentPage++;
          y = margin;
        }
        doc.text(line, margin, y, { align: 'justify' });
        y += 6;
      });
      y += 15;
      
      // Article 5 - Obligations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("ARTICLE 5 – OBLIGATIONS", margin, y, { align: 'left' });
      y += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const article5 = [
        "1. L'employé(e) s'engage à consacrer tout son temps à l'exercice de son activité professionnelle.",
        "2. L'employé(e) s'interdit toute activité professionnelle susceptible de concurrencer l'entreprise.",
        "3. L'employé(e) s'interdit de divulguer toute information à caractère confidentiel."
      ];
      
      article5.forEach(item => {
        const lines = doc.splitTextToSize(item, contentWidth);
        lines.forEach(line => {
          if (y > pageHeight - 80) {
            doc.addPage();
            currentPage++;
            y = margin;
          }
          doc.text(line, margin, y, { align: 'justify' });
          y += 6;
        });
        y += 5;
      });
      y += 15;
      
      // 4. DATE ET LIEU - Aligné à droite
      if (y > pageHeight - 100) {
        doc.addPage();
        currentPage++;
        y = margin;
      }
      
      const dateEffet = contractData?.startDate ? displayContractStartDate(contractData.startDate) : displayDate(new Date());
      const dateText = `Fait à Yaoundé, le ${dateEffet}`;
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, pageWidth - margin - dateWidth, y, { align: 'right' });
      y += 25;
      
      // 5. SIGNATURES - Deux colonnes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      const employerSignatureText = "Signature de l'Employeur";
      const employeeSignatureText = "Signature de l'Employé";
      const employerSignatureWidth = doc.getTextWidth(employerSignatureText);
      const employeeSignatureWidth = doc.getTextWidth(employeeSignatureText);
      
      doc.text(employerSignatureText, margin, y, { align: 'left' });
      doc.text(employeeSignatureText, pageWidth - margin - employeeSignatureWidth, y, { align: 'right' });
      y += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.line(margin, y, margin + 70, y); // Ligne signature employeur
      doc.line(pageWidth - margin - 70, y, pageWidth - margin, y); // Ligne signature employé
      y += 8;
      
      const approvedText = "(Lu et approuvé)";
      const approvedWidth = doc.getTextWidth(approvedText);
      doc.text(approvedText, margin + 35, y, { align: 'center' });
      doc.text(approvedText, pageWidth - margin - 35, y, { align: 'center' });
      
      // 6. PIED DE PAGE - Numérotation
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const pageText = `Page ${i} sur ${totalPages}`;
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, (doc.internal.pageSize.width - pageTextWidth) / 2, doc.internal.pageSize.height - 15, { align: 'center' });
      }
      
      // Réinitialiser la couleur
      doc.setTextColor(0, 0, 0);
      
      // Générer le nom du fichier
      const fileName = `Contrat_${employee?.name || 'Employe'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Télécharger le PDF
      doc.save(fileName);
      
    } catch (error) {
      console.error('[ExportContrat] Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du contrat PDF');
    }
    if (onExported) onExported();
  };

  useEffect(() => {
    if (auto) {
      generateContractPDF();
    }
    // eslint-disable-next-line
  }, [auto]);

  if (auto) return null;

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">Génération du Contrat PDF</h3>
      <p className="text-sm text-gray-600 mb-4">
        Cliquez sur le bouton ci-dessous pour générer et télécharger le contrat au format PDF.
      </p>
      <button
        onClick={generateContractPDF}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Exporter le Contrat en PDF
      </button>
    </div>
  );
};

export default ExportContrat; 