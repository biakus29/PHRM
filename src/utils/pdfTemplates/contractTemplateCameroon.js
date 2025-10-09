// src/utils/pdfTemplates/contractTemplateCameroon.js
// Template PDF pour les contrats de travail au format Cameroun

import jsPDF from 'jspdf';

export function generateContractPDFCameroon(contractData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let y = 20;

  // Fonction pour formater les montants en XAF
  const formatAmount = (amount) => {
    if (!amount || amount === 0) return '................';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '................';
    return numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Fonction pour ajouter du texte avec gestion de la position Y
  const addText = (text, x, yPos, options = {}) => {
    const fontSize = options.fontSize || 11;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', options.style || 'normal');
    doc.setTextColor(options.color || 0, 0, 0);
    
    if (options.align === 'center') {
      doc.text(text, x, yPos, { align: 'center' });
    } else if (options.align === 'right') {
      doc.text(text, x, yPos, { align: 'right' });
    } else {
      doc.text(text, x, yPos);
    }
    
    return yPos + (options.lineHeight || 5);
  };

  // Fonction pour ajouter une ligne de rémunération avec alignement en colonnes
  const addSalaryLine = (label, amount, englishLabel, yPos) => {
    // Label français
    y = addText(`-        ${label}`, margin, yPos, { fontSize: 11, lineHeight: 5 });
    
    // Montant aligné à droite - utiliser align: 'right' pour un alignement parfait
    const formattedAmount = formatAmount(amount);
    y = addText(formattedAmount, pageWidth - margin, y - 5, { 
      fontSize: 11, 
      align: 'right',
      lineHeight: 5
    });
    
    // Label anglais
    y = addText(englishLabel, margin + 5, y, { 
      fontSize: 9, 
      style: 'italic',
      lineHeight: 6
    });
    
    return y;
  };

  // Fonction pour vérifier si on doit changer de page
  const checkPageBreak = (requiredSpace = 20) => {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      return margin;
    }
    return y;
  };

  // ============================================
  // TITRE PRINCIPAL
  // ============================================
  y = addText('CONTRAT DE TRAVAIL', pageWidth / 2, y, { 
    fontSize: 14, 
    style: 'bold',
    align: 'center',
    lineHeight: 7
  });

  y = addText('ENTRE LES SOUSSIGNÉS', pageWidth / 2, y, { 
    fontSize: 12, 
    style: 'bold',
    align: 'center',
    lineHeight: 5
  });
  y = addText('Between the undersigned', pageWidth / 2, y, { 
    fontSize: 10, 
    style: 'italic',
    align: 'center',
    lineHeight: 8
  });

  // ============================================
  // INFORMATIONS EMPLOYEUR
  // ============================================
  y = checkPageBreak(80);
  y = addText(contractData.employerName || '........................................................', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('(Nom et Prénoms ou Raison Sociale)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Name in full firm\'s name)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  const addressLine = `Adresse Complète : BP ${contractData.employerBP || '....................'} TÉL : ${contractData.employerPhone || '...........'} FAX : ${contractData.employerFax || '..............'}`;
  y = addText(addressLine, margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Full address', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Représenté par ${contractData.employerRepresentative || '............,...........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Represented by', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Qualité ${contractData.employerRepresentativeTitle || '........................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Title', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`N° d'immatriculation CNPS ${contractData.employerCNPS || '...........................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Registration number', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  y = addText('CI APRES DENOMME L\'EMPLOYEUR', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('Hereinafter called (the employer)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText('d\'une part', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('on the one hand and', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  // ============================================
  // INFORMATIONS EMPLOYÉ
  // ============================================
  y = checkPageBreak(100);
  y = addText(`Monsieur ${contractData.employeeName || '...........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('(Nom et Prénoms)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Name in full)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  const birthDate = contractData.employeeBirthDate ? 
    new Date(contractData.employeeBirthDate).toLocaleDateString('fr-FR') : 
    '................';
  y = addText(`Né le ${birthDate}, à ${contractData.employeeBirthPlace || '................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Born on', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`À ${contractData.employeeBirthPlace || '..........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('At', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Fils de ${contractData.employeeFatherName || '.................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Son of', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Nom et Prénoms du père)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Father\'s name in full)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`et de ${contractData.employeeMotherName || '....................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('(Nom et Prénoms de la mère)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 4
  });
  y = addText('(Mother\'s name in full)', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Lieu de résidence habituel ${contractData.employeeAddress || '..........................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Usual place of residence', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Situation de famille ${contractData.employeeMaritalStatus || '.........................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Family status:', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`1/ Nom et Prénoms de l'épouse ${contractData.employeeSpouseName || '………………………………………………….'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Spouse\'s name in full', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`2/ Nombre d'enfants à charge ${contractData.employeeChildrenCount || '.................................................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Number of dependant children', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText(`Personne à prévenir en cas de besoin ${contractData.employeeEmergencyContact || '............,.........................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Person to notify in case of necessity', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  y = addText('CI APRES DENOMME L\'EMPLOYE', margin, y, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  y = addText('Hereinafter called "the employee"', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 6
  });

  y = addText('D\'AUTRE PART,', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('On the other hand,', margin, y, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 8
  });

  // ============================================
  // DISPOSITIONS GÉNÉRALES
  // ============================================
  y = checkPageBreak(40);
  y = addText('Il est établi le présent contrat qui, outre les dispositions ci-dessous, sera régi par:', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The present contract is hereby established and, beside the provisions set out hereunder, it shall be governed by:', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });

  y = addText('-   La loi n° 92/007 du 14 août 1992', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('-   law n°92/007 of 14 August 1992', margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });
  y = addText('-   Les textes pris pour son application :', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('-   enactments related to its application', margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });
  y = addText('-   La convention collective', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('-   the collective agreement', margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });
  y = addText('-   Le règlement intérieur de l\'entreprise', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('-   The internal rules of the company', margin, y, { fontSize: 9, style: 'italic', lineHeight: 10 });

  // ============================================
  // ARTICLE 1 - DURÉE DU CONTRAT
  // ============================================
  y = checkPageBreak(60);
  y = addText('ARTICLE 1er', margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('DURÉE DU CONTRAT', margin + 50, y - 5, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('DURATION OF CONTRACT', margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });

  y = addText('1/ Le présent contrat est conclu dans les conditions suivantes :', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText(`a) Période d'essai : ${contractData.trialPeriod || '......,.............................'} renouvelable une fois.`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Probation period                                   will be renewed once.', margin, y, { 
    fontSize: 9, style: 'italic', lineHeight: 5 });
  
  y = addText('Toute rupture intervenue au cours de cette période d\'essai ne donne droit à aucune indemnité et peut être faite par simple lettre.', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('In case of termination of the contract during the probation period, the employee will not expect any indemnity and it can be done through a simple letter.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });

  y = addText(`b) Durée : ${contractData.contractDuration || '................................'} d'une durée renouvelable une fois pour la même durée`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Period', margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });

  const startDate = contractData.startDate ? 
    new Date(contractData.startDate).toLocaleDateString('fr-FR') : 
    '..............................';
  y = addText(`2/ Il prendra effet à compter du ${startDate} sous réserve des résultats satisfaisants de l'examen médical d'embauche`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('It shall become effective as from………….. pending satisfactory results of the medical examination.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 5 });

  y = addText('Il prendra fin à l\'arrivée du terme ci-dessus fixé, sauf en cas de renouvellement ou de dénonciation notifiée par l\'une des parties avant l\'expiration de la période en cours.', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The contract will come to term at the end of fixed period mentioned above, except in case of renewal or breaching of contract, notified by one of the party before end of term of the stated period.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 10 });

  // ============================================
  // ARTICLE 2 - FONCTIONS
  // ============================================
  y = checkPageBreak(40);
  y = addText('ARTICLE 2', margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('FONCTIONS DE L\'EMPLOYÉ', margin + 50, y - 5, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('EMPLOYEE RESPONSIBILITIES', margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });

  y = addText(`1/ L'employé exerce chez l'employeur les fonctions de ${contractData.employeePosition || '.............................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The employee shall carry out the following responsibilities for the employer', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });

  y = addText(`2/ Il sera classé à la catégorie ${contractData.employeeCategory || '............'} Échelon ${contractData.employeeEchelon || '................'}`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('He shall be placed in category', margin, y, { fontSize: 9, style: 'italic', lineHeight: 5 });
  y = addText('incremental position', margin + 100, y - 5, { fontSize: 9, style: 'italic', lineHeight: 5 });
  y = addText('de la classification du secteur secondaire', margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('of the classification of the secondary sector', margin, y, { 
    fontSize: 9, style: 'italic', lineHeight: 10 
  });

  // ============================================
  // ARTICLE 3 - LIEU DE TRAVAIL
  // ============================================
  y = checkPageBreak(30);
  y = addText('ARTICLE 3', margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('LIEU DE TRAVAIL', margin + 50, y - 5, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('WORKPLACE', margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });

  y = addText(`L'employé est recruté pour servir à ${contractData.workplace || '....................'} avec des missions sur différents sites.`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The employee is being recruited to serve at ……. with missions to different sites.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 5 });
  y = addText('Et peut être affecté sur différentes installations de la Société le long du tracé camerounais du Pipeline.', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('And could be transferred to any Pipeline project work site within the Republic of Cameroon.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 10 });

  // ============================================
  // ARTICLE 4 - RÉMUNÉRATION
  // ============================================
  y = checkPageBreak(80);
  y = addText('ARTICLE 4', margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('RÉMUNÉRATION', margin + 50, y - 5, { fontSize: 11, style: 'bold', lineHeight: 5 });
  y = addText('REMUNERATION', margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });

  const totalSalaryFormatted = formatAmount(contractData.totalSalary);
  y = addText(`1/ L'employé percevra une rémunération de ${totalSalaryFormatted} XAF se décomposant comme suit :`, 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('The employee\'s remuneration shall be broken down as follows', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });

  // Section rémunération détaillée avec alignement professionnel
  y = addText('Rémunération détaillée :', margin, y, { fontSize: 12, style: 'bold' });
  y += 5;

  // Éléments de rémunération avec alignement en colonnes
  y = addSalaryLine('Salaire de base', contractData.baseSalary, 'Basic wage', y);
  y = addSalaryLine('Sursalaire y compris forfait horaires supplémentaires', 
    contractData.overtimeSalary, 'Complementary wage including overtime-fixed allowances', y);
  y = addSalaryLine('Indemnité de logement', contractData.housingAllowance, 'Housing indemnity', y);
  y = addSalaryLine('Indemnités de transport', contractData.transportAllowance, 'Transport indemnity', y);

  // Primes personnalisées si disponibles
  if (contractData.primes && Array.isArray(contractData.primes) && contractData.primes.length > 0) {
    contractData.primes.forEach(prime => {
      const montant = Number(prime.montant || prime.amount) || 0;
      if (montant > 0) {
        const label = prime.label || prime.type || 'Prime';
        y = addSalaryLine(label, montant, 'Bonus', y);
      }
    });
  }

  // Indemnités personnalisées si disponibles
  if (contractData.indemnites && Array.isArray(contractData.indemnites) && contractData.indemnites.length > 0) {
    contractData.indemnites.forEach(ind => {
      const montant = Number(ind.montant || ind.amount) || 0;
      if (montant > 0) {
        const label = ind.label || ind.type || 'Indemnité';
        y = addSalaryLine(label, montant, 'Allowance', y);
      }
    });
  }

  y += 10;
  y = addText('2/ Le paiement du salaire se fera conformément aux articles 67, 68 et 69 du Code du travail.', 
    margin, y, { fontSize: 11, lineHeight: 5 });
  y = addText('Wages shall be paid in accordance with sections 67, 68, 69 of the Labour Code.', 
    margin, y, { fontSize: 9, style: 'italic', lineHeight: 10 });

  // ============================================
  // ARTICLES RESTANTS (5 à 12)
  // ============================================
  const articles = [
    {
      number: '5',
      titleFr: 'CONGÉS EFFECTIFS',
      titleEn: 'LEAVE',
      contentFr: [
        '1/ L\'employé aura droit à un congé de 1,5 jour ouvrable par mois de service effectif, sous réserve des majorations de congés prévues par les textes en vigueur.',
        '2/ La période ouvrant droit au congé est de 12 mois.',
        '3/ Le paiement de l\'allocation de congé se fera conformément aux dispositions du décret n° 75/28 du 10 janvier 1975.'
      ],
      contentEn: [
        'The employee shall be entitled to leave of......... working days per month of effective service, subreserved to the number of additional days allowed by the conventions in force.',
        'The period giving entitlement to leave shall be 12 months.',
        'The payment of leave allowances shall be in accordance with the provisions of Decree No. 75/28 of January 1975.'
      ]
    },
    {
      number: '6',
      titleFr: 'OBLIGATION DE NON CONCURRENCE',
      titleEn: 'CONFLICT OF INTEREST',
      contentFr: [
        'L\'employé s\'engage à consacrer tout son temps à l\'exercice de son activité professionnelle. En conséquence, il lui est interdit d\'exercer pendant la durée du présent contrat et au moins un an après sa cessation, et ce, dans un rayon de cinquante kilomètres, toute activité professionnelle susceptible de concurrence ou de nuire à la bonne exécution du présent contrat.'
      ],
      contentEn: [
        'The employee should devote all of their time to achieving their professional duties. Consequently, they will be prohibited from doing any professional activity other than disrupting the carry-out of the contract during the term of this contract and for at least one year after its termination, within a radius of fifty kilometers of the project worksite.'
      ]
    },
    {
      number: '7',
      titleFr: 'CONFIDENTIALITÉ - SECRET PROFESSIONNEL',
      titleEn: 'CONFIDENTIALITY',
      contentFr: [
        'L\'employé s\'interdit de divulguer ou d\'utiliser à des fins personnelles, toute information à caractère scientifique, technique ou commerciale mise à sa disposition dans le cadre de l\'exécution du présent contrat'
      ],
      contentEn: [
        'The employee shall be prohibited from revealing or using in his or her personal account any scientific, technical, or commercial information at his or her disposal during the carryout of this contact.'
      ]
    },
    {
      number: '8',
      titleFr: 'PROTECTION SOCIALE',
      titleEn: 'SOCIAL SECURITY',
      contentFr: [
        '1/ En cas de maladie de l\'employé ou des membres de sa famille légitime, l\'employeur se conformera à la réglementation en vigueur.',
        '2/ L\'employeur s\'engage à souscrire une assurance « accident du travail et maladie professionnelle » au profit de l\'employé.',
        '3/ L\'employeur devra de même s\'affilier à la Caisse nationale de prévoyance sociale au profit de l\'employé conformément à la législation en vigueur.',
        '4/ Le travailleur sera couvert par une assurance maladie souscrite auprès d\'une compagnie locale.',
        'Le travailleur bénéficiera en outre d\'une couverture individuelle accidents'
      ],
      contentEn: [
        'If the employee or the member of his legal family is sick, the employer shall conform with legal and regulations in force.',
        'The employer undertakes to buy an insurance policy covering « industrial accident and occupational diseases on behalf of the employee.',
        'He shall also be affiliated to the National Social Insurance Fun on behalf of the employee and in accordance with the laws force.',
        'The employee shall be entitled to an illnesses insurance subscripted from a local insurance company.',
        'The employee shall also be entitled to an accidents insurance.'
      ]
    },
    {
      number: '9',
      titleFr: 'HYGIÈNE ET SÉCURITÉ',
      titleEn: 'HYGIENE AND SECURITY',
      contentFr: [
        'L\'employeur s\'engage à se conformer à toutes les prescriptions légales et réglementaires en vigueur en matière d\'hygiène, de sécurité et de santé des travailleurs.'
      ],
      contentEn: [
        'The employer shall be conformed at all legal prescriptions and reglementations in force related to hygienic, security and healthy of employees.'
      ]
    },
    {
      number: '10',
      titleFr: 'RÉSILIATION DU CONTRAT',
      titleEn: 'TERMINATION OF CONTRACT',
      contentFr: [
        '1/ Le présent contrat pourra être résilié dans les conditions prévues aux articles 37, 39 et 43 du Code du travail.',
        '2/ Le contrat étant à durée déterminée, sa rupture interviendra dans les conditions prévues à l\'article 38 du Code du travail'
      ],
      contentEn: [
        'The present contract may be terminated within the framework of conditions provided for in section 37,39 et 43 of the Labour Code.',
        'The termination of a contract of employment of specifically duration shall take place under the conditions laid down in section 38 of the Labour Code.'
      ]
    },
    {
      number: '11',
      titleFr: 'DIFFÉRENDS INDIVIDUELS',
      titleEn: 'INDIVIDUAL DISPUTES',
      contentFr: [
        'Les différents litiges découlant de l\'exécution ou de la rupture du présent contrat relèveront de la compétence de l\'Inspecteur du Travail du lieu d\'exécution du contrat (art. 139 alinéa 2) et des tribunaux prévus aux articles 138 et 139 du Code du Travail.'
      ],
      contentEn: [
        'Disputes arising from the execution or termination of this contract shall come under the jurisdiction of the Labor Inspector of the place of employment (Section 139 (2) and the courts referred to in Sections 138 and 139 of the Labor Code.'
      ]
    },
    {
      number: '12',
      titleFr: 'DISPOSITIONS FINALES',
      titleEn: '',
      contentFr: [
        'Pour tout ce qui n\'est pas précisé au présent contrat, les parties s\'en remettent à la législation, à la réglementation, à la convention collective et aux usages en vigueur dans la profession au Cameroun'
      ],
      contentEn: [
        'The contracting parties shall be governed by the laws, regulations, and collective agreements in force and this contract.by current practice in the profession in Cameroon, in the case of details not stated in the present contract.'
      ]
    }
  ];

  articles.forEach(article => {
    y = checkPageBreak(40);
    y = addText(`ARTICLE ${article.number}`, margin, y, { fontSize: 11, style: 'bold', lineHeight: 5 });
    y = addText(article.titleFr, margin + 50, y - 5, { fontSize: 11, style: 'bold', lineHeight: 5 });
    if (article.titleEn) {
      y = addText(article.titleEn, margin, y, { fontSize: 9, style: 'italic', lineHeight: 8 });
    } else {
      y += 8;
    }

    article.contentFr.forEach((text, index) => {
      y = addText(text, margin, y, { fontSize: 11, lineHeight: 5 });
      if (article.contentEn[index]) {
        y = addText(article.contentEn[index], margin, y, { fontSize: 9, style: 'italic', lineHeight: 6 });
      }
    });
    y += 8;
  });

  // ============================================
  // FAIT À ... LE ...
  // ============================================
  y = checkPageBreak(40);
  const signingDate = contractData.date ? 
    new Date(contractData.date).toLocaleDateString('fr-FR') : 
    '……………...........';
  const placeOfSigning = contractData.city || '…………..............';
  
  y = addText(`FAIT À ${placeOfSigning} LE ${signingDate}`, 
    margin, y, { fontSize: 11, lineHeight: 15 });

  // ============================================
  // SIGNATURES
  // ============================================
  y = checkPageBreak(60);
  const midPage = pageWidth / 2;
  
  // Colonne gauche - L'EMPLOYEUR
  let yLeft = y;
  yLeft = addText('L\'EMPLOYEUR', margin, yLeft, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  yLeft = addText('THE EMPLOYER', margin, yLeft, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 5
  });
  yLeft = addText('Lu et approuvé', margin, yLeft, { 
    fontSize: 10,
    lineHeight: 5
  });
  yLeft = addText('Read and approved', margin, yLeft, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 20
  });
  yLeft = addText('Signature et cachet:', margin, yLeft, { 
    fontSize: 10,
    lineHeight: 5
  });
  
  // Colonne droite - L'EMPLOYÉ
  let yRight = y;
  yRight = addText('L\'EMPLOYE', midPage + 10, yRight, { 
    fontSize: 11, 
    style: 'bold',
    lineHeight: 5
  });
  yRight = addText('THE EMPLOYEE', midPage + 10, yRight, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 5
  });
  yRight = addText('Lu et approuvé', midPage + 10, yRight, { 
    fontSize: 10,
    lineHeight: 5
  });
  yRight = addText('Read and approved', midPage + 10, yRight, { 
    fontSize: 9, 
    style: 'italic',
    lineHeight: 20
  });
  yRight = addText('Signature:', midPage + 10, yRight, { 
    fontSize: 10,
    lineHeight: 5
  });

  // Sauvegarde
  const fileName = `Contrat_Travail_${(contractData.employeeName || 'Employe').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);

  return { completed: true, fileName };
}

export default generateContractPDFCameroon;