// src/utils/pdfTemplates/attestationTemplateCameroon.js
// Template PDF pour les attestations de virement irrévocable au format Cameroun

import jsPDF from 'jspdf';

export function generateAttestationPDFCameroon(attestationData) {
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

  // En-tête avec ville et date
  y = addText(`${attestationData.city || 'Douala'}, le ${attestationData.date || new Date().toLocaleDateString('fr-FR')}`, pageWidth - 50, y, { fontSize: 10 });
  y += 10;

  // Référence
  y = addText(`Réf. : ${attestationData.reference || 'RAC'}`, margin, y, { fontSize: 10 });
  y += 20;

  // Texte principal de l'attestation
  const attestationText = `Nous soussignés Monsieur ${attestationData.managerName || '________________'}, certifions que M. ${attestationData.employeeName || '________________'} est employé dans notre Société, ${attestationData.companyName || '________________'} et nous engageons sur son ordre formel à virer irrévocablement au compte numéro ${attestationData.accountNumber || '________________'} - Cameroun au titre de salaire, nous nous engageons également à virer toutes indemnités qui seraient dues à l'intéressé s'il venait à quitter pour quelque raison que ce soit, notre société et à vous aviser de ce départ définitif au plus tard en même temps que nous vous adresserons le virement de liquidation de l'intéressé.

Tout compte versé au salarié sur sa demande en cours de mois sera également viré à la Banque

Cet accord ne pourra être modifié ou suspendu qu'après accord donné par la ${attestationData.bankName || '________________'} conjointement avec M.${attestationData.employeeName || '________________'}`;

  const attestationLines = doc.splitTextToSize(attestationText, pageWidth - 2 * margin);
  y = addText(attestationLines, margin, y);
  y += 20;

  // Signature
  y = addText('Fait à ________________, le ________________', margin, y);
  y += 20;
  y = addText('Signature et cachet de l\'employeur', margin, y);
  y = addText('________________', margin, y);

  // Sauvegarde
  const fileName = `Attestation_Virement_${(attestationData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateAttestationPDFCameroon;

