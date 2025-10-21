// src/utils/pdfTemplates/offerLetterTemplate.js
// Template PDF pour les lettres d'offre personnalisées - VERSION AMÉLIORÉE

import jsPDF from 'jspdf';
import { addLogoWithReservedSpace } from './shared';

// ==================== CONSTANTES ====================
const PAGE_CONFIG = {
  margin: 20,
  footerMargin: 15, // Espace réservé pour le pied de page et signatures (réduit)
  lineHeight: {
    normal: 5,
    tight: 4,
    loose: 6
  },
  fontSize: {
    title: 12,
    normal: 11,
    small: 10,
    tiny: 9,
    footer: 8
  },
  colors: {
    primary: [0, 0, 0],
    secondary: [60, 60, 60]
  }
};

const TEXT_TEMPLATES = {
  rotation: 'Vous aurez la possibilité, en cas d\'affectation permanente sur site, de disposer de six (6) jours complets à votre résidence après six (6) semaines de travail sur site. Votre transport de votre lieu de travail à votre lieu de résidence sera pris en charge par la société.',
  
  mission: 'Les frais occasionnés pour des missions hors de votre lieu de travail ou de résidence seront pris en charge par la société, selon ses règles. Ainsi, en cas de déplacement sur site, la société prendra à sa charge votre hébergement et les frais relatifs à trois (3) repas. À défaut, il vous sera alloué une indemnité journalière compensatrice dont le montant est arrêté selon les règles de la société.',
  
  medicalCoverage1: 'La société vous incorporera dans son plan maladie qui couvre les soins exclusivement au Cameroun (obligatoire pour l\'employé, facultatif pour la famille) ; les soins dentaires et optiques étant exclus.',
  
  medicalCoverage2: 'La société prendra à sa charge la totalité de votre couverture médicale et comprend les frais pharmaceutiques. En ce qui concerne votre famille, la société prendra à sa charge la partie majeure de sa couverture médicale, l\'employé prenant à sa charge l\'autre partie qui représente 20 % de la prime annuelle et 20 % des frais pharmaceutiques.',
  
  acceptance: 'Nous espérons que cette offre vous conviendra ; nous vous demanderons de nous retourner, pour accord, une copie de ce document avec la mention manuscrite « lu et approuvé », la signature et la date.',
  
  contact: 'Vous pouvez obtenir des renseignements complémentaires au Département Socioéconomique.',
  
  closing: 'Dans l\'attente du plaisir de vous accueillir, nous vous prions d\'agréer, Monsieur, l\'expression de nos sentiments distingués.'
};

const REQUIRED_DOCUMENTS = [
  'Fiche de renseignements jointe à compléter',
  '1 fiche d\'état civil de chaque membre de votre famille',
  '1 extrait de casier judiciaire (validité inférieure à 3 mois)',
  'Photocopies certifiées des diplômes, avec présentation des originaux',
  '2 photos d\'identité',
  '1 relevé d\'identité bancaire, le cas échéant',
  'Plan de situation de votre domicile'
];

// ==================== CLASSES UTILITAIRES ====================
class PDFBuilder {
  constructor(doc, config = PAGE_CONFIG) {
    this.doc = doc;
    this.config = config;
    this.pageWidth = doc.internal.pageSize.width;
    this.pageHeight = doc.internal.pageSize.height;
    this.y = config.margin;
    this.currentPage = 1;
  }

  // Vérifier et gérer les sauts de page
  checkPageBreak(requiredSpace = 40) {
    // Utiliser footerMargin pour réserver l'espace du pied de page
    const bottomLimit = this.pageHeight - (this.config.footerMargin || 60);
    if (this.y > bottomLimit - requiredSpace) {
      this.doc.addPage();
      this.y = this.config.margin;
      this.currentPage++;
      return true;
    }
    return false;
  }

  // Ajouter du texte avec gestion automatique de la pagination
  addText(text, x, options = {}) {
    const {
      fontSize = this.config.fontSize.normal,
      fontStyle = 'normal',
      color = this.config.colors.primary,
      lineHeight = this.config.lineHeight.normal,
      align = 'left',
      maxWidth = this.pageWidth - 2 * this.config.margin
    } = options;

    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', fontStyle);
    this.doc.setTextColor(...color);

    // Gérer les tableaux de lignes
    if (Array.isArray(text)) {
      text.forEach(line => {
        this.checkPageBreak(lineHeight + 10);
        this.doc.text(line, x, this.y);
        this.y += lineHeight;
      });
      return this.y;
    }

    // Découper le texte si nécessaire
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    lines.forEach(line => {
      this.checkPageBreak(lineHeight + 10);
      if (align === 'right') {
        this.doc.text(line, this.pageWidth - this.config.margin, this.y, { align: 'right' });
      } else {
        this.doc.text(line, x, this.y);
      }
      this.y += lineHeight;
    });

    return this.y;
  }

  // Ajouter un espace vertical
  addSpace(space = 5) {
    this.y += space;
    this.checkPageBreak();
  }

  // Ajouter une section avec titre
  addSection(title, content, options = {}) {
    this.checkPageBreak(40);
    
    if (title) {
      this.addText(title, this.config.margin, {
        fontSize: this.config.fontSize.title,
        fontStyle: 'bold',
        ...options.titleOptions
      });
      this.addSpace(3);
    }

    if (content) {
      this.addText(content, this.config.margin, options.contentOptions);
      this.addSpace(options.spacing || 5);
    }
  }

  // Ajouter un tableau simple (label : valeur)
  addTable(items, options = {}) {
    const { indent = 5, labelWidth = 120, valueAlign = 'right' } = options;
    
    items.forEach(item => {
      this.checkPageBreak(this.config.lineHeight.normal + 5);
      
      // Label
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.config.fontSize.normal);
      this.doc.text(item.label, this.config.margin + indent, this.y);
      
      // Valeur (alignée à droite avec gras)
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(
        item.value, 
        this.pageWidth - this.config.margin, 
        this.y, 
        { align: valueAlign }
      );
      
      this.y += this.config.lineHeight.normal;
    });
  }

  // Ajouter une liste à puces
  addBulletList(items, options = {}) {
    const { indent = 5, bullet = '•' } = options;
    
    items.forEach(item => {
      this.checkPageBreak(15);
      const lines = this.doc.splitTextToSize(
        `${bullet}  ${item}`, 
        this.pageWidth - 2 * this.config.margin - indent
      );
      
      lines.forEach((line, index) => {
        this.checkPageBreak(this.config.lineHeight.tight + 5);
        this.doc.text(
          line, 
          this.config.margin + indent, 
          this.y
        );
        this.y += this.config.lineHeight.tight;
      });
    });
  }

  // Réinitialiser la position Y
  setY(newY) {
    this.y = newY;
  }

  getCurrentY() {
    return this.y;
  }
}

// ==================== UTILITAIRES ====================
function formatAmount(amount) {
  if (!amount || amount === 0) return 'N/A';
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} XAF`;
}

function formatDate(dateString, fallback = '[date non spécifiée]') {
  if (!dateString) return fallback;
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return fallback;
  }
}

function stripLabel(value, label) {
  if (!value) return '';
  const regex = new RegExp(`^\\n?\\r?\\t?\\s*${label}\\s*:?\\s*`, 'i');
  return String(value).replace(regex, '').trim();
}

function getFieldValue(offerData, ...fields) {
  for (const field of fields) {
    if (offerData[field] !== undefined && offerData[field] !== null && offerData[field] !== '') {
      return offerData[field];
    }
  }
  return fields[fields.length - 1]; // Retourne le dernier comme fallback
}

// ==================== VALIDATION ====================
function validateOfferData(offerData) {
  const errors = [];
  
  if (!offerData.companyName && !offerData.company) {
    errors.push('Nom de l\'entreprise manquant');
  }
  
  if (!offerData.candidateName && !offerData.firstName && !offerData.lastName) {
    errors.push('Nom du candidat manquant');
  }
  
  if (!offerData.jobTitle && !offerData.title && !offerData.position) {
    errors.push('Titre du poste manquant');
  }
  
  return errors;
}

// ==================== SECTIONS DU DOCUMENT ====================
function addHeader(builder, offerData) {
  const { doc, config } = builder;
  
  // Logo
  try {
    const employerId = getFieldValue(
      offerData,
      'employerId',
      'companyId',
      'companyEmail',
      'companyName',
      'default'
    );
    
    const logoY = addLogoWithReservedSpace(
      doc,
      { employer: { id: employerId } },
      builder.pageWidth,
      config.margin,
      builder.y,
      { position: 'left', logoSize: 26, reserveSpace: true }
    );
    builder.setY(logoY);
  } catch (error) {
    console.warn('Erreur lors de l\'ajout du logo:', error);
  }

  // Coordonnées de l'entreprise
  const companyName = getFieldValue(offerData, 'companyName', 'company', '');
  const companyAddress = getFieldValue(offerData, 'companyAddress', 'address', '');
  const companyPhone = getFieldValue(offerData, 'companyPhone', 'phone', '');
  const companyEmail = getFieldValue(offerData, 'companyEmail', 'email', '');

  if (companyName) {
    builder.addText(companyName, config.margin, {
      fontSize: config.fontSize.normal,
      fontStyle: 'bold',
      lineHeight: config.lineHeight.tight
    });
  }

  const headerLines = [companyAddress, companyPhone, companyEmail].filter(Boolean);
  if (headerLines.length) {
    headerLines.forEach(line => {
      builder.addText(line, config.margin, {
        fontSize: config.fontSize.small,
        lineHeight: config.lineHeight.tight
      });
    });
  }
  
  builder.addSpace(3);
}

function addRecipient(builder, offerData) {
  const { config } = builder;
  const startY = builder.getCurrentY();

  // Destinataire
  builder.addText('À l\'attention de :', config.margin, {
    fontSize: config.fontSize.normal,
    lineHeight: config.lineHeight.tight
  });

  const candidateName = offerData.candidateName ||
    (offerData.firstName || offerData.lastName
      ? `${offerData.civility || 'Monsieur'} ${[offerData.firstName, offerData.lastName].filter(Boolean).join(' ')}`.trim()
      : 'Monsieur/Madame [Nom complet]');

  builder.addText(candidateName, config.margin, {
    fontSize: config.fontSize.normal,
    fontStyle: 'bold',
    lineHeight: config.lineHeight.tight
  });

  const candidateCity = getFieldValue(offerData, 'candidateCity', 'city', '');
  if (candidateCity) {
    builder.addText(candidateCity, config.margin, {
      fontSize: config.fontSize.normal,
      lineHeight: config.lineHeight.tight
    });
  }

  // Date et lieu (à droite, au même niveau que le destinataire)
  const offerDate = formatDate(offerData.offerDate, new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));
  const companyCity = getFieldValue(offerData, 'companyCity', '');
  const dateText = companyCity ? `${companyCity}, le ${offerDate}` : `le ${offerDate}`;

  builder.doc.text(dateText, builder.pageWidth - config.margin, startY, { align: 'right' });

  builder.addSpace(3);
}

function addBody(builder, offerData) {
  const { config } = builder;

  // Objet
  builder.addText('Objet : LETTRE D\'OFFRE', config.margin, {
    fontSize: config.fontSize.title,
    fontStyle: 'bold',
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(6);

  // Paragraphe 1 - Durée et date de début
  const contractTypeRaw = (offerData.contractType || '').toString().toUpperCase();
  const isIndetermine = contractTypeRaw === 'CDI' || contractTypeRaw.includes('INDÉTERM');
  const contractDuration = getFieldValue(offerData, 'contractDuration', 'duration', '');
  const startDate = formatDate(offerData.startDate, '[date de début]');
  const startTime = getFieldValue(offerData, 'startTime', '08:00');

  let intro;
  if (isIndetermine || !contractDuration) {
    intro = `Notre société a le plaisir de vous proposer un emploi pour une durée indéterminée, prenant effet à compter du ${startDate} à ${startTime} heures.`;
  } else {
    intro = `Notre société a le plaisir de vous proposer un emploi pour une durée déterminée de ${contractDuration}, prenant effet à compter du ${startDate} à ${startTime} heures.`;
  }

  builder.addText(intro, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(2);

  // Paragraphe 2 - Poste et classification
  const jobTitle = getFieldValue(
    offerData,
    'jobTitle',
    'title',
    'position',
    'employeePosition',
    'poste',
    '[titre du poste]'
  );
  const rawCategory = getFieldValue(offerData, 'category', 'professionalCategory', '[catégorie]');
  const rawEchelon = getFieldValue(offerData, 'echelon', 'grade', '[échelon]');
  
  const categoryValue = stripLabel(rawCategory, 'Catégorie');
  const echelonValue = stripLabel(rawEchelon, 'Échelon');

  const classification = `Nous sommes disposés à vous embaucher en qualité de ${jobTitle}, classé en catégorie ${categoryValue}, échelon ${echelonValue} du secteur secondaire.`;

  builder.addText(classification, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(6);
}

function addCompensation(builder, offerData) {
  const { config } = builder;

  // Calculer les montants
  const baseSalary = getFieldValue(offerData, 'baseSalary', 'salaryBase', 'salaireBase', 'salaire', 0);
  const overtime = getFieldValue(offerData, 'overtimeSalary', 'overtime', 'heuresSupplementaires', 0);
  const housing = getFieldValue(offerData, 'housingAllowance', 'indemniteLogement', 'primeLogement', 0);
  const transport = getFieldValue(offerData, 'transportAllowance', 'indemniteTransport', 'primeTransport', 0);
  
  const totalSalary = offerData.totalSalary || (baseSalary + overtime + housing + transport);

  // Introduction
  const compensationIntro = `Votre rémunération mensuelle totale brute sera fixée à ${formatAmount(totalSalary)} laquelle sera décomposée ainsi qu'il suit :`;
  
  builder.addText(compensationIntro, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(4);

  // Décomposition du salaire
  const salaryBreakdown = [
    { label: 'Salaire de base catégoriel', value: formatAmount(baseSalary) },
    { label: 'Sursalaire y compris forfait heures supplémentaires', value: formatAmount(overtime) },
    { label: 'Indemnité de logement', value: formatAmount(housing) },
    { label: 'Indemnité de transport', value: formatAmount(transport) }
  ];

  builder.addTable(salaryBreakdown, { indent: 5 });
  builder.addSpace(6);

  // Durée hebdomadaire
  const weeklyHours = getFieldValue(offerData, 'weeklyHours', 'hoursPerWeek', 40);
  const weeklyText = `La détermination de votre rémunération prend en considération une durée hebdomadaire de travail de ${weeklyHours} heures environ sur six jours.`;
  
  builder.addText(weeklyText, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(6);
}

function addBenefits(builder, offerData) {
  const { config } = builder;

  // Rotation sur site
  builder.addText(TEXT_TEMPLATES.rotation, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(3);

  // Frais de mission
  builder.addText(TEXT_TEMPLATES.mission, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(6);

  // Période d'essai
  const probationPeriod = getFieldValue(offerData, 'probationPeriod', 'trialPeriod', 3);
  const probationText = `Il est prévu une période d'essai de ${probationPeriod} mois, qui peut être renouvelée une fois pour une même durée. À la fin de votre période d'essai,`;
  
  builder.addText(probationText, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  // builder.addSpace(4);

  // Couverture médicale
  builder.addText(TEXT_TEMPLATES.medicalCoverage1, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(4);

  builder.addText(TEXT_TEMPLATES.medicalCoverage2, config.margin, {
    lineHeight: config.lineHeight.normal
  });
  builder.addSpace(6);
}

function addConditions(builder, offerData) {
  const { config } = builder;

  // S'assurer qu'on a assez d'espace pour cette section
  builder.checkPageBreak(100);

  // Test alcool et drogue
  const companyName = getFieldValue(offerData, 'companyName', 'company', '[nom de la société]');
  const drugTestText = `En application de la politique Alcool et Drogue de ${companyName}, vous aurez à passer un test et à nous fournir un échantillon pour analyse médicale.`;
  
  builder.addText(drugTestText, config.margin, {
    fontSize: config.fontSize.small,
    lineHeight: config.lineHeight.tight
  });
  builder.addSpace(2);

  builder.addText(
    'Nous soulignons que cette offre est conditionnée à des résultats d\'analyse satisfaisants.',
    config.margin,
    {
      fontSize: config.fontSize.small,
      lineHeight: config.lineHeight.tight
    }
  );
  builder.addSpace(5);

  // Conditions de validité
  builder.addText(
    'Par ailleurs, l\'offre d\'emploi n\'est valable que dans la mesure où :',
    config.margin,
    {
      fontSize: config.fontSize.small,
      lineHeight: config.lineHeight.tight
    }
  );
  builder.addSpace(3);

  const responseDeadline = formatDate(offerData.responseDeadline, '[date limite de réponse]');
  const actualStartDate = formatDate(
    offerData.actualStartDate,
    formatDate(offerData.startDate, '[date de début]')
  );

  const conditions = [
    `Vous répondez avant le ${responseDeadline}`,
    `Vous prenez votre poste le ${actualStartDate}`,
    'Vos résultats de la visite médicale de pré-embauche sont satisfaisants'
  ];

  builder.addBulletList(conditions, { indent: 5 });
  builder.addSpace(5);
}

function addAcceptanceInstructions(builder, offerData) {
  const { config } = builder;

  // S'assurer qu'on a assez d'espace pour toute la section
  builder.checkPageBreak(70);

  // Instructions d'acceptation
  builder.addText(TEXT_TEMPLATES.acceptance, config.margin, {
    fontSize: config.fontSize.small,
    lineHeight: config.lineHeight.tight
  });
  builder.addSpace(4);

  builder.addText(TEXT_TEMPLATES.contact, config.margin, {
    fontSize: config.fontSize.small,
    lineHeight: config.lineHeight.tight
  });
  builder.addSpace(5);

  // Documents à fournir
  builder.addText(
    '•  En cas d\'acceptation, vous pourrez fournir les documents ci-après :',
    config.margin,
    {
      fontSize: config.fontSize.small,
      fontStyle: 'bold',
      lineHeight: config.lineHeight.tight
    }
  );
  builder.addSpace(2);

  builder.addBulletList(REQUIRED_DOCUMENTS, { indent: 5 });
  builder.addSpace(5);

  // Formule de politesse
  builder.addText(TEXT_TEMPLATES.closing, config.margin, {
    fontSize: config.fontSize.small,
    lineHeight: config.lineHeight.tight
  });
  builder.addSpace(2); // Réduit pour coller les signatures
}

function addSignatures(builder, offerData) {
  const { doc, config } = builder;
  
  // NE PAS vérifier l'espace, coller directement après le texte précédent
  // Juste vérifier qu'on ne déborde pas trop (garder minimum 15px pour pied de page)
  const minSpaceForFooter = 15;
  const bottomLimit = builder.pageHeight - minSpaceForFooter;
  
  // Si vraiment pas assez de place pour les signatures (65px), passer à la page suivante
  if (builder.y > bottomLimit - 65) {
    doc.addPage();
    builder.setY(config.margin);
    builder.currentPage++;
  }

  const midPage = builder.pageWidth / 2;
  const signatureY = builder.y;

  // Colonne gauche - L'EMPLOYEUR
  let yLeft = signatureY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('L\'EMPLOYEUR', config.margin, yLeft);
  
  yLeft += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('THE EMPLOYER', config.margin, yLeft);
  
  yLeft += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Lu et approuvé', config.margin, yLeft);
  
  yLeft += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Read and approved', config.margin, yLeft);
  
  yLeft += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Signature et cachet:', config.margin, yLeft);

  // Colonne droite - LE CANDIDAT
  let yRight = signatureY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LE CANDIDAT', midPage + 10, yRight);
  
  yRight += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('THE CANDIDATE', midPage + 10, yRight);
  
  yRight += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Lu et approuvé', midPage + 10, yRight);
  
  yRight += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('Read and approved', midPage + 10, yRight);
  
  yRight += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Signature:', midPage + 10, yRight);

  // Mettre à jour la position Y après les signatures
  builder.setY(Math.max(yLeft, yRight) + 5);
}

function addFooter(doc, offerData) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const companyName = getFieldValue(offerData, 'companyName', 'company', 'Entreprise');
  const footerText = `© ${new Date().getFullYear()} ${companyName}. Tous droits réservés.`;

  try {
    const totalPages = typeof doc.getNumberOfPages === 'function' 
      ? doc.getNumberOfPages() 
      : 1;

    // Sauvegarder la page courante
    const currentPage = doc.internal.getCurrentPageInfo ? 
      doc.internal.getCurrentPageInfo().pageNumber : 1;

    for (let i = 1; i <= totalPages; i++) {
      if (typeof doc.setPage === 'function') {
        doc.setPage(i);
      }
      
      // S'assurer que les paramètres de police sont appliqués sur chaque page
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      
      // Copyright à droite
      doc.text(footerText, pageWidth - PAGE_CONFIG.margin, pageHeight - 10, { align: 'right' });
      
      // Numéro de page à gauche
      doc.text(`Page ${i}/${totalPages}`, PAGE_CONFIG.margin, pageHeight - 10);
    }

    // Restaurer la page courante
    if (typeof doc.setPage === 'function') {
      doc.setPage(currentPage);
    }
  } catch (error) {
    console.warn('Erreur lors de l\'ajout du pied de page:', error);
  }
}

// ==================== FONCTION PRINCIPALE ====================
export function generateOfferLetterPDF(offerData) {
  // Validation
  const errors = validateOfferData(offerData);
  if (errors.length > 0) {
    console.error('Erreurs de validation:', errors);
    throw new Error(`Données manquantes: ${errors.join(', ')}`);
  }

  // Initialisation
  const doc = new jsPDF();
  const builder = new PDFBuilder(doc);

  try {
    // Construction du document
    addHeader(builder, offerData);
    addRecipient(builder, offerData);
    addBody(builder, offerData);
    addCompensation(builder, offerData);
    addBenefits(builder, offerData);
    addConditions(builder, offerData);
    addAcceptanceInstructions(builder, offerData);
    addSignatures(builder, offerData);
    
    // Pied de page sur toutes les pages
    addFooter(doc, offerData);

    // Métadonnées du PDF
    const candidateName = offerData.candidateName ||
      `${offerData.firstName || ''} ${offerData.lastName || ''}`.trim() ||
      'Candidat';

    doc.setProperties({
      title: `Lettre d'offre - ${candidateName}`,
      subject: 'Offre d\'emploi',
      author: getFieldValue(offerData, 'companyName', 'company', 'Entreprise'),
      keywords: 'offre, emploi, contrat, Cameroun',
      creator: 'Système RH - Gestion des offres'
    });

    // Génération du nom de fichier
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Lettre_Offre_${sanitizedName}_${dateStr}.pdf`;

    // Sauvegarde
    doc.save(fileName);

    return {
      success: true,
      completed: true,
      fileName,
      pages: builder.currentPage,
      message: 'Lettre d\'offre générée avec succès'
    };

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    return {
      success: false,
      completed: false,
      error: error.message,
      message: 'Erreur lors de la génération de la lettre d\'offre'
    };
  }
}

export default generateOfferLetterPDF;