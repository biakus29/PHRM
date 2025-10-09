// src/utils/pdfTemplates/attestationTemplate.js
// Template PDF pour les attestations de virement

import jsPDF from 'jspdf';

export function generateAttestationPDF(attestationData) {
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
  y = addText(attestationData.companyName || 'ENTREPRISE', margin, y, { fontSize: 16, style: 'bold' });
  y += 5;
  y = addText(attestationData.companyAddress || 'Adresse de l\'entreprise', margin, y);
  y = addText(`Tél: ${attestationData.companyPhone || 'Non renseigné'}`, margin, y);
  y = addText(`Email: ${attestationData.companyEmail || 'Non renseigné'}`, margin, y);
  y += 15;

  // Titre du document
  y = addText('ATTESTATION DE VIREMENT', pageWidth / 2, y, { fontSize: 18, style: 'bold' });
  if (attestationData.irrevocable) {
    y = addText('IRRÉVOCABLE', pageWidth / 2, y, { fontSize: 14, style: 'bold', color: [220, 38, 38] });
  }
  y += 15;

  // Informations de l'employé
  y = addText('INFORMATIONS DE L\'EMPLOYÉ', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Nom: ${attestationData.employeeName || 'Non renseigné'}`, margin, y);
  y = addText(`Matricule: ${attestationData.employeeId || 'Non renseigné'}`, margin, y);
  y = addText(`Poste: ${attestationData.position || 'Non renseigné'}`, margin, y);
  y = addText(`Département: ${attestationData.department || 'Non renseigné'}`, margin, y);
  y += 10;

  // Informations bancaires
  y = addText('INFORMATIONS BANCAIRES', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Nom de la banque: ${attestationData.bankName || 'Non renseigné'}`, margin, y);
  y = addText(`Numéro de compte: ${attestationData.accountNumber || 'Non renseigné'}`, margin, y);
  y = addText(`Code banque: ${attestationData.bankCode || 'Non renseigné'}`, margin, y);
  y = addText(`Code guichet: ${attestationData.branchCode || 'Non renseigné'}`, margin, y);
  y += 10;

  // Informations du virement
  y = addText('INFORMATIONS DU VIREMENT', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  y = addText(`Montant: ${attestationData.amount ? `${attestationData.amount.toLocaleString()} ${attestationData.currency || 'F CFA'}` : 'Non renseigné'}`, margin, y);
  y = addText(`Date de virement: ${attestationData.transferDate ? new Date(attestationData.transferDate).toLocaleDateString('fr-FR') : 'Non renseigné'}`, margin, y);
  y = addText(`Référence: ${attestationData.reference || 'Non renseigné'}`, margin, y);
  y = addText(`Objet: ${attestationData.purpose || 'Non renseigné'}`, margin, y);
  y += 10;

  // Texte de l'attestation selon le format fourni
  y = addText('TEXTE DE L\'ATTESTATION', margin, y, { fontSize: 14, style: 'bold' });
  y += 5;

  const attestationText = `Nous soussignés Monsieur ${attestationData.managerName || '________________'}, certifions que M. ${attestationData.employeeName || '________________'} est employé dans notre Société, ${attestationData.companyName || '________________'} et nous engageons sur son ordre formel à virer irrévocablement au compte numéro ${attestationData.accountNumber || '________________'} - Cameroun au titre de salaire, nous nous engageons également à virer toutes indemnités qui seraient dues à l'intéressé s'il venait à quitter pour quelque raison que ce soit, notre société et à vous aviser de ce départ définitif au plus tard en même temps que nous vous adresserons le virement de liquidation de l'intéressé.

Tout compte versé au salarié sur sa demande en cours de mois sera également viré à la Banque

Cet accord ne pourra être modifié ou suspendu qu'après accord donné par la ${attestationData.bankName || '________________'} conjointement avec M.${attestationData.employeeName || '________________'}`;

  const attestationLines = doc.splitTextToSize(attestationText, pageWidth - 2 * margin);
  y = addText(attestationLines, margin, y);
  y += 15;

  // Conditions spéciales pour virement irrévocable
  if (attestationData.irrevocable) {
    y = addText('CONDITIONS SPÉCIALES - VIREMENT IRRÉVOCABLE', margin, y, { fontSize: 12, style: 'bold', color: [220, 38, 38] });
    y += 5;
    
    const irrevocableText = `Ce virement est irrévocable et ne peut être annulé ou modifié une fois effectué. L'employé reconnaît avoir reçu les fonds et accepte les conditions de ce virement irrévocable.`;
    const irrevocableLines = doc.splitTextToSize(irrevocableText, pageWidth - 2 * margin);
    y = addText(irrevocableLines, margin, y);
    y += 10;
  }

  // Signature et cachet
  y = addText('Fait à ________________, le ________________', margin, y);
  y += 20;
  y = addText('Signature et cachet de l\'employeur', margin, y);
  y = addText('________________', margin, y);
  y += 10;
  y = addText('Signature de l\'employé', margin, y);
  y = addText('________________', margin, y);

  // Sauvegarde
  const fileName = `Attestation_Virement_${(attestationData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateAttestationPDF;
