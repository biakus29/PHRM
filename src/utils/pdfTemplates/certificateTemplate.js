// src/utils/pdfTemplates/certificateTemplate.js
// Template PDF pour les certificats de travail

import jsPDF from 'jspdf';

export function generateCertificatePDF(certificateData) {
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
  y = addText(certificateData.companyName || 'ENTREPRISE', margin, y, { fontSize: 16, style: 'bold' });
  y += 5;
  y = addText(certificateData.companyAddress || 'Adresse de l\'entreprise', margin, y);
  y = addText(`Tél: ${certificateData.companyPhone || 'Non renseigné'}`, margin, y);
  y = addText(`Email: ${certificateData.companyEmail || 'Non renseigné'}`, margin, y);
  y += 15;

  // Titre du document
  y = addText('CERTIFICAT DE TRAVAIL', pageWidth / 2, y, { fontSize: 18, style: 'bold' });
  y += 15;

  // Informations de l'employé
  y = addText('INFORMATIONS DE L\'EMPLOYÉ', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Nom: ${certificateData.employeeName || 'Non renseigné'}`, margin, y);
  y = addText(`Matricule: ${certificateData.employeeId || 'Non renseigné'}`, margin, y);
  y = addText(`Poste occupé: ${certificateData.position || 'Non renseigné'}`, margin, y);
  y = addText(`Département: ${certificateData.department || 'Non renseigné'}`, margin, y);
  y += 10;

  // Période d'emploi
  y = addText('PÉRIODE D\'EMPLOI', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Date d'embauche: ${certificateData.startDate ? new Date(certificateData.startDate).toLocaleDateString('fr-FR') : 'Non renseigné'}`, margin, y);
  if (certificateData.endDate) {
    y = addText(`Date de fin: ${new Date(certificateData.endDate).toLocaleDateString('fr-FR')}`, margin, y);
  } else {
    y = addText('Statut: En cours d\'emploi', margin, y);
  }
  y += 10;

  // Informations salariales
  if (certificateData.salary) {
    y = addText('INFORMATIONS SALARIALES', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    y = addText(`Dernier salaire: ${certificateData.salary.toLocaleString()} F CFA`, margin, y);
    y += 10;
  }

  // Motif de départ
  if (certificateData.reason) {
    y = addText('MOTIF DE DÉPART', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    y = addText(`Motif: ${certificateData.reason}`, margin, y);
    y += 10;
  }

  // Appréciation
  if (certificateData.performance) {
    y = addText('APPRÉCIATION', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    
    const performanceLines = doc.splitTextToSize(certificateData.performance, pageWidth - 2 * margin);
    y = addText(performanceLines, margin, y);
    y += 10;
  }

  // Recommandation
  if (certificateData.recommendation) {
    y = addText('RECOMMANDATION', margin, y, { fontSize: 14, style: 'bold' });
    y += 5;
    
    const recommendationLines = doc.splitTextToSize(certificateData.recommendation, pageWidth - 2 * margin);
    y = addText(recommendationLines, margin, y);
    y += 10;
  }

  // Texte du certificat selon le format fourni
  y = addText('TEXTE DU CERTIFICAT', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  const certificateText = `Nous soussignés
${certificateData.managerName || '________________'}
ET
${certificateData.hrManagerName || '________________'}
Certifications que :
Monsieur ${certificateData.employeeName || '________________'} a travaillé au sein de la société
${certificateData.companyName || '________________'}
En qualité de : ${certificateData.position || '________________'}
Catégorie ${certificateData.category || '____'}, échelon ${certificateData.echelon || '____'}
Durant la période allant du ${certificateData.startDate ? new Date(certificateData.startDate).toLocaleDateString('fr-FR') : '____'} au ${certificateData.endDate ? new Date(certificateData.endDate).toLocaleDateString('fr-FR') : '____'}
En foi de quoi nous lui délivrons ce certificat pour servir et faire valoir ce droit.`;

  const certificateLines = doc.splitTextToSize(certificateText, pageWidth - 2 * margin);
  y = addText(certificateLines, margin, y);
  y += 15;

  // Clause de confidentialité
  y = addText('CLAUSE DE CONFIDENTIALITÉ', margin, y, { fontSize: 12, style: 'bold' });
  y += 5;
  
  const confidentialityText = `Ce certificat est délivré à titre informatif et ne peut être utilisé que dans le cadre professionnel. Toute utilisation frauduleuse de ce document est passible de poursuites judiciaires.`;
  const confidentialityLines = doc.splitTextToSize(confidentialityText, pageWidth - 2 * margin);
  y = addText(confidentialityLines, margin, y);
  y += 15;

  // Signature et cachet
  y = addText('Fait à ________________, le ________________', margin, y);
  y += 20;
  y = addText('Signature et cachet de l\'employeur', margin, y);
  y = addText('________________', margin, y);
  y += 10;
  y = addText('Signature de l\'employé', margin, y);
  y = addText('________________', margin, y);

  // Sauvegarde
  const fileName = `Certificat_Travail_${(certificateData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateCertificatePDF;
