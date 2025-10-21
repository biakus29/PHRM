// src/utils/pdfTemplates/offerLetterTemplate.js
// Template PDF pour les lettres d'offre personnalisées

import jsPDF from 'jspdf';

export function generateOfferLetterPDF(offerData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let y = margin;

  // Fonction pour ajouter du texte avec gestion de la position Y
  const addText = (text, x, yPos, options = {}) => {
    doc.setFontSize(options.fontSize || 11);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    
    if (Array.isArray(text)) {
      text.forEach(line => {
        doc.text(line, x, yPos);
        yPos += (options.lineHeight || 5);
      });
      return yPos;
    } else {
      doc.text(text, x, yPos);
      return yPos + (options.lineHeight || 5);
    }
  };

  // Fonction pour formater les montants
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '0 XAF';
    // Formater avec espaces comme séparateurs de milliers
    return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XAF`;
  };

  // En-tête - Destinataire (à gauche)
  y = addText('À l\'attention de :', margin, y);
  const displayCandidateName = offerData.candidateName
    ? offerData.candidateName
    : (offerData.firstName || offerData.lastName)
      ? `${offerData.civility || 'Monsieur'} ${[offerData.firstName, offerData.lastName].filter(Boolean).join(' ')}`.trim()
      : 'Monsieur/Madame [Nom complet]';
  y = addText(displayCandidateName, margin, y, { style: 'bold' });
  y += 3;
  if (offerData.candidateCity || offerData.city) {
    y = addText(offerData.candidateCity || offerData.city, margin, y);
  }
  y += 10;

  // Date et lieu (à droite)
  const offerDateFormatted = offerData.offerDate 
    ? new Date(offerData.offerDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  const headerCity = offerData.companyCity || '';
  const dateText = headerCity ? `${headerCity}, le ${offerDateFormatted}` : `le ${offerDateFormatted}`;
  doc.text(dateText, pageWidth - margin, y - 15, { align: 'right' });

  // Objet
  y = addText('Objet : LETTRE D\'OFFRE', margin, y, { style: 'bold', fontSize: 12 });
  y += 10;

  // Corps de la lettre - Paragraphe 1
  const contractDuration = offerData.contractDuration || offerData.duration || '';
  const startDateFormatted = offerData.startDate 
    ? new Date(offerData.startDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '[date de début]';
  const startTime = offerData.startTime || '08:00';
  // Détecter durée déterminée vs indéterminée (CDI sans durée)
  const contractTypeRaw = (offerData.contractType || '').toString().toUpperCase();
  const isIndetermine = contractTypeRaw === 'CDI' || contractTypeRaw.includes('INDETERM');
  let text;
  if (isIndetermine || !contractDuration) {
    text = `Notre société a le plaisir de vous proposer un emploi pour une durée indéterminée, prenant effet à compter du ${startDateFormatted} à ${startTime} heures.`;
  } else {
    text = `Notre société a le plaisir de vous proposer un emploi pour une durée déterminée de ${contractDuration}, prenant effet à compter du ${startDateFormatted} à ${startTime} heures.`;
  }
  let lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Paragraphe 2
  const jobTitle = offerData.jobTitle || offerData.title || offerData.position || offerData.employeePosition || offerData.poste || '[titre du poste]';
  const rawCategory = offerData.category || offerData.professionalCategory || '[catégorie]';
  const rawEchelon = offerData.echelon || offerData.grade || '[échelon]';
  const workCity = offerData.workCity || offerData.city || offerData.companyCity || offerData.workLocation || offerData.location || '[lieu de travail]';

  // Nettoyer libellés dupliqués
  const stripLabel = (val, label) => {
    if (!val) return '';
    const re = new RegExp(`^\n?\r?\t?\s*${label}\s*:?\s*`, 'i');
    return String(val).replace(re, '').trim();
  };
  const categoryValue = stripLabel(rawCategory, 'Catégorie');
  const echelonValue = stripLabel(rawEchelon, 'Échelon');

  text = `Nous sommes disposés à vous embaucher en qualité de ${jobTitle}, classé en ${categoryValue}, échelon ${echelonValue} du secteur secondaire. Votre departemants est  ${workCity}.`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 8;

  // Rémunération - Titre
  // Calculer le salaire total si non fourni
  const baseAmount = (offerData.baseSalary ?? offerData.salaryBase ?? offerData.salaireBase ?? offerData.salaire) || 0;
  const overtimeAmount = (offerData.overtimeSalary ?? offerData.overtime ?? offerData.heuresSupplementaires) || 0;
  const housingAmount = (offerData.housingAllowance ?? offerData.indemniteLogement ?? offerData.primeLogement) || 0;
  const transportAmount = (offerData.transportAllowance ?? offerData.indemniteTransport ?? offerData.primeTransport) || 0;
  const totalSalary = offerData.totalSalary || baseAmount + overtimeAmount + housingAmount + transportAmount;
  
  text = `Votre rémunération mensuelle totale brute sera fixée à ${formatAmount(totalSalary)} laquelle sera décomposée ainsi qu'il suit :`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Décomposition du salaire (avec gras pour les montants)
  const salaryBreakdown = [
    { label: 'Salaire de base catégoriel', amount: baseAmount },
    { label: 'Sursalaire y compris forfait heures supplémentaires', amount: overtimeAmount },
    { label: 'Indemnité de logement', amount: housingAmount },
    { label: 'Indemnité de transport', amount: transportAmount }
  ];

  salaryBreakdown.forEach(item => {
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, margin + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.text(formatAmount(item.amount), pageWidth - margin, y, { align: 'right' });
    y += 6;
  });
  y += 5;

  // Durée hebdomadaire de travail
  const weeklyHours = offerData.weeklyHours || offerData.hoursPerWeek || 40;
  text = `La détermination de votre rémunération prend en considération une durée hebdomadaire de travail de ${weeklyHours} heures environ sur six jours.`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Rotation sur site
  text = 'Vous aurez la possibilité, en cas d\'affectation permanente sur site, de disposer de six (6) jours complets à votre résidence après six (6) semaines de travail sur site. Votre transport de votre lieu de travail à votre lieu de résidence sera pris en charge par la société.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Frais de mission
  const perDiem = offerData.perDiem || 0;
  text = `Les frais occasionnés pour des missions hors de votre lieu de travail ou de résidence seront pris en charge par la société, selon ses règles. Ainsi, en cas de déplacement sur site, la société prendra à sa charge votre hébergement et les frais relatifs à trois (3) repas. À défaut, il vous sera alloué une indemnité journalière compensatrice dont le montant est arrêté à ${formatAmount(perDiem)} par jour.`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 8;

  // Vérifier si on doit ajouter une nouvelle page
  if (y > pageHeight - 60) {
    doc.addPage();
    y = margin;
  }

  // Période d'essai
  const probationPeriod = offerData.probationPeriod || offerData.trialPeriod || 3;
  text = `Il est prévu une période d'essai de ${probationPeriod} mois, qui peut être renouvelée une fois pour une même durée.`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Couverture médicale
  text = 'À la fin de votre période d\'essai, la société vous incorporera dans son plan maladie qui couvre les soins exclusivement au Cameroun (obligatoire pour l\'employé, facultatif pour la famille) ; les soins dentaires et optiques étant exclus.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  text = 'La société prendra à sa charge la totalité de votre couverture médicale et comprend les frais pharmaceutiques. En ce qui concerne votre famille, la société prendra à sa charge la partie majeure de sa couverture médicale, l\'employé prenant à sa charge l\'autre partie qui représente 20 % de la prime annuelle et 20 % des frais pharmaceutiques.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  // Test alcool et drogue
  const companyName = offerData.companyName || offerData.company || '[nom de la société]';
  text = `En application de la politique Alcool et Drogue de ${companyName}, vous aurez à passer un test et à nous fournir un échantillon pour analyse médicale.`;
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 3;
  text = 'Nous soulignons que cette offre est conditionnée à des résultats d\'analyse satisfaisants.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 8;

  // Conditions de validité
  y = addText('Par ailleurs, l\'offre d\'emploi n\'est valable que dans la mesure où :', margin, y);
  y += 3;
  
  const responseDeadline = offerData.responseDeadline 
    ? new Date(offerData.responseDeadline).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '[date limite de réponse]';
  const actualStartDate = offerData.actualStartDate 
    ? new Date(offerData.actualStartDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : startDateFormatted;
  
  y = addText(`•  Vous répondez avant le ${responseDeadline}`, margin + 5, y, { lineHeight: 6 });
  y = addText(`•  Vous prenez votre poste le ${actualStartDate}`, margin + 5, y, { lineHeight: 6 });
  y = addText('•  Vos résultats de la visite médicale de pré-embauche sont satisfaisants', margin + 5, y, { lineHeight: 6 });
  y += 5;

  // Instructions d'acceptation
  text = 'Nous espérons que cette offre vous conviendra ; nous vous demanderons de nous retourner, pour accord, une copie de ce document avec la mention manuscrite « lu et approuvé », la signature et la date.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });
  y += 5;

  y = addText('Vous pouvez obtenir des renseignements complémentaires au Département Socioéconomique.', margin, y, { lineHeight: 6 });
  y += 8;

  // Vérifier si on doit ajouter une nouvelle page
  if (y > pageHeight - 80) {
    doc.addPage();
    y = margin;
  }

  // Documents à fournir
  y = addText('•  En cas d\'acceptation, vous pourrez fournir les documents ci-après :', margin, y, { style: 'bold' });
  y += 3;
  
  const documents = [
    'Fiche de renseignements jointe à compléter',
    '1 fiche d\'état civil de chaque membre de votre famille',
    '1 extrait de casier judiciaire (validité inférieure à 3 mois)',
    'Photocopies certifiées des diplômes, avec présentation des originaux',
    '2 photos d\'identité',
    '1 relevé d\'identité bancaire, le cas échéant',
    'Plan de situation de votre domicile'
  ];

  documents.forEach(doc_item => {
    y = addText(`•  ${doc_item}`, margin + 5, y, { lineHeight: 6 });
  });
  y += 10;

  // Formule de politesse
  text = 'Dans l\'attente du plaisir de vous accueillir, nous vous prions d\'agréer, Monsieur, l\'expression de nos sentiments distingués.';
  lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
  y = addText(lines, margin, y, { lineHeight: 6 });

  // Sauvegarde
  const fileName = `Lettre_Offre_${(displayCandidateName || 'Candidat').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateOfferLetterPDF;