// src/utils/pdfTemplates/certificateTemplateCameroon.js
// Template PDF pour les certificats de travail au format Cameroun

import jsPDF from 'jspdf';

export function generateCertificatePDFCameroon(certificateData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let y = 20;

  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    
    if (options.align === 'center') {
      doc.text(text, x, yPos, { align: 'center' });
    } else if (options.align === 'right') {
      doc.text(text, x, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
    
    return yPos + (options.lineHeight || 6);
  };

  const addMultilineText = (text, xPos, yPos, maxWidth, options = {}) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', options.style || 'normal');
    
    lines.forEach(line => {
      yPos = addText(line, xPos, yPos, { ...options, lineHeight: options.lineHeight || 6 });
    });
    
    return yPos;
  };

  // En-tête avec ville (entreprise) et date
  const headerDate = certificateData.date ? new Date(certificateData.date).toLocaleDateString('fr-FR') : '___________';
  const headerCity = certificateData.companyCity || certificateData.city || '';
  const cityDate = headerCity ? `${headerCity}, le ${headerDate}` : `le ${headerDate}`;
  y = addText(cityDate, pageWidth - margin, y, { fontSize: 11, align: 'right', lineHeight: 6 });
  
  // Référence (optionnelle)
  y = addText(`Réf. : ${certificateData.reference || ''}`.trim(), margin, y, { fontSize: 11, lineHeight: 15 });

  // Titre principal
  y = addText('CERTIFICAT DE TRAVAIL', pageWidth / 2, y, { 
    fontSize: 14, 
    style: 'bold',
    align: 'center',
    lineHeight: 20
  });

  // Texte principal du certificat
  y = addText('Nous soussignés', margin, y, { fontSize: 11, lineHeight: 8 });
  y = addText(certificateData.managerName || '……………………………………', margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText('ET', margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(certificateData.hrManagerName || '……………………………………', margin, y, { fontSize: 11, lineHeight: 8 });
  y = addText('Certifications que :', margin, y, { fontSize: 11, lineHeight: 8 });
  
  y = addText(`Monsieur ${certificateData.employeeName || '……………………………………'} a travaillé au sein de la société`, 
    margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(certificateData.companyName || '……………………………………', margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(`En qualité de : ${certificateData.position || '……………………………………'}`, 
    margin, y, { fontSize: 11, lineHeight: 6 });
  y = addText(`Catégorie ${certificateData.category || '………….'}, échelon ${certificateData.echelon || '…………..'}`, 
    margin, y, { fontSize: 11, lineHeight: 6 });
  
  const startDate = certificateData.startDate ? 
    new Date(certificateData.startDate).toLocaleDateString('fr-FR') : '…………………..';
  const endDate = certificateData.endDate ? 
    new Date(certificateData.endDate).toLocaleDateString('fr-FR') : '………………..';
  
  y = addText(`Durant la période allant du ${startDate} au ${endDate}`, 
    margin, y, { fontSize: 11, lineHeight: 8 });
  y = addText('En foi de quoi nous lui délivrons ce certificat pour servir et faire valoir ce droit.', 
    margin, y, { fontSize: 11, lineHeight: 15 });

  // Signature
  const signingDate = certificateData.signingDate ? 
    new Date(certificateData.signingDate).toLocaleDateString('fr-FR') : '…………………….';
  const signingCity = certificateData.signingCity || '……………….';
  
  y = addText(`Fait à ${signingCity} le ${signingDate}`, margin, y, { fontSize: 11, lineHeight: 20 });

  // Espace pour signatures
  const midPage = pageWidth / 2;
  let yLeft = y;
  yLeft = addText('Le Directeur', margin, yLeft, { fontSize: 10, lineHeight: 20 });
  yLeft = addText('Signature et cachet', margin, yLeft, { fontSize: 9, style: 'italic' });

  let yRight = y;
  yRight = addText('Le Responsable RH', midPage + 10, yRight, { fontSize: 10, lineHeight: 20 });
  yRight = addText('Signature et cachet', midPage + 10, yRight, { fontSize: 9, style: 'italic' });

  // Sauvegarde
  const fileName = `Certificat_Travail_${(certificateData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateCertificatePDFCameroon;