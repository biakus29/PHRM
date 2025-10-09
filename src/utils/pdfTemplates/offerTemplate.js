// src/utils/pdfTemplates/offerTemplate.js
// Template PDF pour les offres d'emploi

import jsPDF from 'jspdf';

export function generateOfferPDF(offerData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let y = margin;

  // Fonction pour ajouter du texte avec gestion de la position Y
  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.fontSize || 12);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    doc.text(text, x, yPos);
    return yPos + (options.lineHeight || 6);
  };

  // En-tête de l'entreprise
  y = addText(offerData.companyName || 'ENTREPRISE', margin, y, { fontSize: 16, style: 'bold' });
  y += 5;
  y = addText(offerData.companyAddress || 'Adresse de l\'entreprise', margin, y);
  y = addText(`Tél: ${offerData.companyPhone || 'Non renseigné'}`, margin, y);
  y = addText(`Email: ${offerData.companyEmail || 'Non renseigné'}`, margin, y);
  y += 10;

  // Titre du document
  y = addText('OFFRE D\'EMPLOI', pageWidth / 2, y, { fontSize: 18, style: 'bold' });
  y += 15;

  // Informations du poste
  y = addText('INFORMATIONS DU POSTE', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Titre du poste: ${offerData.title || 'Non renseigné'}`, margin, y);
  y = addText(`Département: ${offerData.department || 'Non renseigné'}`, margin, y);
  y = addText(`Lieu de travail: ${offerData.location || 'Non renseigné'}`, margin, y);
  y = addText(`Type de contrat: ${offerData.contractType || 'Non renseigné'}`, margin, y);
  y = addText(`Salaire proposé: ${offerData.salary ? `${offerData.salary.toLocaleString()} F CFA` : 'Non renseigné'}`, margin, y);
  y = addText(`Date de début: ${offerData.startDate ? new Date(offerData.startDate).toLocaleDateString('fr-FR') : 'Non renseigné'}`, margin, y);
  y = addText(`Date limite de candidature: ${offerData.applicationDeadline ? new Date(offerData.applicationDeadline).toLocaleDateString('fr-FR') : 'Non renseigné'}`, margin, y);
  y += 10;

  // Description du poste
  if (offerData.description) {
    y = addText('DESCRIPTION DU POSTE', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    
    const descriptionLines = doc.splitTextToSize(offerData.description, pageWidth - 2 * margin);
    y = addText(descriptionLines, margin, y);
    y += 10;
  }

  // Profil recherché
  if (offerData.requirements) {
    y = addText('PROFIL RECHERCHÉ', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    
    const requirementsLines = doc.splitTextToSize(offerData.requirements, pageWidth - 2 * margin);
    y = addText(requirementsLines, margin, y);
    y += 10;
  }

  // Avantages
  if (offerData.benefits) {
    y = addText('AVANTAGES', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    
    const benefitsLines = doc.splitTextToSize(offerData.benefits, pageWidth - 2 * margin);
    y = addText(benefitsLines, margin, y);
    y += 10;
  }

  // Informations de candidature
  y = addText('INFORMATIONS DE CANDIDATURE', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;
  y = addText('Les candidats intéressés sont priés de faire parvenir leur dossier de candidature comprenant:', margin, y);
  y += 5;
  y = addText('• Une lettre de motivation', margin, y);
  y = addText('• Un curriculum vitae détaillé', margin, y);
  y = addText('• Les copies des diplômes et certificats', margin, y);
  y = addText('• Les attestations de travail', margin, y);
  y += 10;

  y = addText(`Date limite de réception des candidatures: ${offerData.applicationDeadline ? new Date(offerData.applicationDeadline).toLocaleDateString('fr-FR') : 'Non renseigné'}`, margin, y);
  y = addText(`Adresse d\'envoi: ${offerData.applicationEmail || offerData.companyEmail || 'Non renseigné'}`, margin, y);
  y += 15;

  // Signature
  y = addText('Fait à ________________, le ________________', margin, y);
  y += 20;
  y = addText('Signature et cachet de l\'employeur', margin, y);
  y = addText('________________', margin, y);

  // Sauvegarde
  const fileName = `Offre_Emploi_${(offerData.title || 'Poste').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateOfferPDF;

