// src/utils/textTemplates.js
// Système de gestion des textes personnalisables pour les documents PDF

export class TextTemplateManager {
  constructor(companyId) {
    this.companyId = companyId;
    this.defaultTexts = this.getDefaultTexts();
  }

  /**
   * Récupère un texte personnalisé ou par défaut
   * @param {string} documentType - Type de document (offers, contracts, etc.)
   * @param {string} textKey - Clé du texte (introduction, closing, etc.)
   * @param {object} variables - Variables à remplacer dans le texte
   * @returns {string} Texte final avec variables remplacées
   */
  getText(documentType, textKey, variables = {}) {
    const customText = this.getCustomText(documentType, textKey);
    const defaultText = this.defaultTexts[documentType]?.[textKey];
    const text = customText || defaultText || '';
    
    // Si c'est un tableau, le retourner tel quel (pas de remplacement de variables)
    if (Array.isArray(text)) {
      return text;
    }
    
    // S'assurer que text est une chaîne de caractères
    const finalText = typeof text === 'string' ? text : String(text || '');
    
    return this.replaceVariables(finalText, variables);
  }

  /**
   * Récupère un texte personnalisé depuis le localStorage
   * @param {string} documentType - Type de document
   * @param {string} textKey - Clé du texte
   * @returns {string|null} Texte personnalisé ou null
   */
  getCustomText(documentType, textKey) {
    try {
      const customTexts = localStorage.getItem(`textTemplates_${this.companyId}`);
      if (customTexts) {
        const templates = JSON.parse(customTexts);
        return templates[documentType]?.[textKey];
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des textes personnalisés:', error);
    }
    return null;
  }

  /**
   * Sauvegarde un texte personnalisé
   * @param {string} documentType - Type de document
   * @param {string} textKey - Clé du texte
   * @param {string} text - Texte à sauvegarder
   */
  saveCustomText(documentType, textKey, text) {
    try {
      const customTexts = JSON.parse(localStorage.getItem(`textTemplates_${this.companyId}`) || '{}');
      if (!customTexts[documentType]) customTexts[documentType] = {};
      customTexts[documentType][textKey] = text;
      localStorage.setItem(`textTemplates_${this.companyId}`, JSON.stringify(customTexts));
      console.log(`Texte sauvegardé: ${documentType}.${textKey}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des textes personnalisés:', error);
    }
  }

  /**
   * Sauvegarde tous les textes d'un type de document
   * @param {string} documentType - Type de document
   * @param {object} texts - Objet contenant tous les textes
   */
  saveAllTexts(documentType, texts) {
    try {
      const customTexts = JSON.parse(localStorage.getItem(`textTemplates_${this.companyId}`) || '{}');
      customTexts[documentType] = texts;
      localStorage.setItem(`textTemplates_${this.companyId}`, JSON.stringify(customTexts));
      console.log(`Tous les textes sauvegardés pour: ${documentType}`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des textes:', error);
    }
  }

  /**
   * Récupère tous les textes personnalisés d'un type de document
   * @param {string} documentType - Type de document
   * @returns {object} Objet contenant tous les textes personnalisés
   */
  getAllCustomTexts(documentType) {
    try {
      const customTexts = localStorage.getItem(`textTemplates_${this.companyId}`);
      if (customTexts) {
        const templates = JSON.parse(customTexts);
        return templates[documentType] || {};
      }
    } catch (error) {
      console.warn('Erreur lors de la récupération des textes personnalisés:', error);
    }
    return {};
  }

  /**
   * Remplace les variables dans un texte
   * @param {string} text - Texte contenant des variables {{variable}}
   * @param {object} variables - Objet contenant les valeurs des variables
   * @returns {string} Texte avec variables remplacées
   */
  replaceVariables(text, variables) {
    // Vérifier que text est une chaîne de caractères
    if (typeof text !== 'string') {
      console.warn('replaceVariables: text n\'est pas une chaîne de caractères:', text);
      return text || '';
    }
    
    // Vérifier que variables est un objet
    if (!variables || typeof variables !== 'object') {
      console.warn('replaceVariables: variables n\'est pas un objet:', variables);
      return text;
    }
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Réinitialise les textes d'un type de document aux valeurs par défaut
   * @param {string} documentType - Type de document
   */
  resetToDefault(documentType) {
    try {
      const customTexts = JSON.parse(localStorage.getItem(`textTemplates_${this.companyId}`) || '{}');
      delete customTexts[documentType];
      localStorage.setItem(`textTemplates_${this.companyId}`, JSON.stringify(customTexts));
      console.log(`Textes réinitialisés pour: ${documentType}`);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }
  }

  /**
   * Retourne les textes par défaut pour tous les types de documents
   * @returns {object} Objet contenant tous les textes par défaut
   */
  getDefaultTexts() {
    return {
      offers: {
        introduction: "Notre société a le plaisir de vous proposer un emploi pour une durée déterminée d'un (1) an, prenant effet à compter du {{startDate}} à {{startTime}} heures.",
        positionDescription: "Nous sommes disposés à vous embaucher en qualité de {{position}}, classé en {{category}} catégorie échelon {{echelon}} du secteur secondaire. Votre lieu de travail sera fixé à {{workplace}}.",
        remuneration: "Votre rémunération mensuelle totale brute sera fixée à {{totalSalary}} francs CFA laquelle sera décomposée ainsi qu'il suit :",
        workDuration: "La détermination de votre rémunération prend en considération une durée hebdomadaire de travail de {{weeklyHours}} heures environ sur six jours.",
        workConditions: "Vous aurez la possibilité, en cas d'affectation permanente sur site, de disposer de six (6) jours complets à votre résidence après six (6) semaines de travail sur site. Votre transport de votre lieu de travail à votre lieu de résidence sera pris en charge par la société.",
        missionExpenses: "Les frais occasionnés pour des missions hors de votre lieu de travail ou de résidence seront pris en charge par la société, selon ses règles. Ainsi, en cas de déplacement sur site, la société prendra à sa charge votre hébergement et les frais relatifs à trois (3) repas. À défaut, il vous sera alloué une indemnité journalière compensatrice dont le montant est arrêté à {{dailyAllowance}} XAF par jour.",
        trialPeriod: "Il est prévu une période d'essai de {{trialPeriod}} mois, qui peut être renouvelée une fois pour une même durée",
        medicalCoverage: "À la fin de votre période d'essai, la société vous incorporera dans son plan maladie qui couvre les soins exclusivement au Cameroun (obligatoire pour l'employé, facultatif pour la famille) ; les soins dentaires et optiques étant exclus.",
        medicalDetails: "La société prendra à sa charge la totalité de votre couverture médicale et comprend les frais pharmaceutiques. En ce qui concerne votre famille, la société prendra à sa charge la partie majeure de sa couverture médicale, l'employé prenant à sa charge l'autre partie qui représente 20 % de la prime annuelle et 20 % des frais pharmaceutiques.",
        medicalTests: "En application de la politique Alcool et Drogue de {{companyName}}, vous aurez à passer un test et à nous fournir un échantillon pour analyse médicale.",
        medicalCondition: "Nous soulignons que cette offre est conditionnée à des résultats d'analyse satisfaisants.",
        validityConditions: "Par ailleurs, l'offre d'emploi n'est valable que dans la mesure où :",
        acceptance: "Nous espérons que cette offre vous conviendra ; nous vous demanderons de nous retourner, pour accord, une copie de ce document avec la mention manuscrite « lu et approuvé », la signature et la date.",
        additionalInfo: "Vous pouvez obtenir des renseignements complémentaires au Département Socioéconomique.",
        documentsTitle: "En cas d'acceptation, vous pourrez fournir les documents ci-après :",
        closing: "Dans l'attente du plaisir de vous accueillir, nous vous prions d'agréer, Monsieur, l'expression de nos sentiments distingués",
        documentsList: [
          "Fiche de renseignements jointe à compléter",
          "1 fiche d'état civil de chaque membre de votre famille",
          "1 extrait de casier judiciaire (validité inférieure à 3 mois)",
          "Photocopies certifiées des diplômes, avec présentation des originaux",
          "2 photos d'identité",
          "1 relevé d'identité bancaire, le cas échéant",
          "Plan de situation de votre domicile"
        ]
      },
      contracts: {
        legalBasis: "Il est établi le présent contrat qui, outre les dispositions ci-dessous, sera régi par:",
        legalBasisEn: "The present contract is hereby established and, beside the provisions set out hereunder, it shall be governed by:",
        law1: "La loi n° 92/007 du 14 août 1992",
        law1En: "law n°92/007 of 14 August 1992",
        law2: "Les textes pris pour son application :",
        law2En: "enactments related to its application",
        law3: "La convention collective",
        law3En: "the collective agreement",
        law4: "Le règlement intérieur de l'entreprise",
        law4En: "The internal rules of the company",
        duration: "Le présent contrat est conclu dans les conditions suivantes :",
        durationEn: "The present contract is hereby established and, beside the provisions set out hereunder, it shall be governed by:",
        trialPeriod: "Période d'essai : {{trialPeriod}} renouvelable une fois.",
        trialPeriodEn: "Probation period will be renewed once.",
        trialTermination: "Toute rupture intervenue au cours de cette période d'essai ne donne droit à aucune indemnité et peut être faite par simple lettre.",
        trialTerminationEn: "In case of termination of the contract during the probation period, the employee will not expect any indemnity and it can be done through a simple letter.",
        contractDuration: "Durée : {{contractDuration}} d'une durée renouvelable une fois pour la même durée",
        contractDurationEn: "Period",
        effectiveDate: "Il prendra effet à compter du {{startDate}} sous réserve des résultats satisfaisants de l'examen médical d'embauche",
        effectiveDateEn: "It shall become effective as from………….. pending satisfactory results of the medical examination.",
        termination: "Il prendra fin à l'arrivée du terme ci-dessus fixé, sauf en cas de renouvellement ou de dénonciation notifiée par l'une des parties avant l'expiration de la période en cours.",
        terminationEn: "The contract will come to term at the end of fixed period mentioned above, except in case of renewal or breaching of contract, notified by one of the party before end of term of the stated period.",
        functions: "L'employé exerce chez l'employeur les fonctions de {{position}}",
        functionsEn: "The employee shall carry out the following responsibilities for the employer",
        classification: "Il sera classé à la catégorie {{category}} Échelon {{echelon}}",
        classificationEn: "He shall be placed in category incremental position",
        classificationSector: "de la classification du secteur secondaire",
        classificationSectorEn: "of the classification of the secondary sector",
        workplace: "L'employé est recruté pour servir à {{workplace}} avec des missions sur différents sites.",
        workplaceEn: "The employee is being recruited to serve at ……. with missions to different sites.",
        workplaceDetails: "Et peut être affecté sur différentes installations de la Société le long du tracé camerounais du Pipeline.",
        workplaceDetailsEn: "And could be transferred to any Pipeline project work site within the Republic of Cameroon.",
        remuneration: "L'employé percevra une rémunération de {{totalSalary}} XAF se décomposant comme suit :",
        remunerationEn: "The employee's remuneration shall be broken down as follows",
        payment: "Le paiement du salaire se fera conformément aux articles 67, 68 et 69 du Code du travail.",
        paymentEn: "Wages shall be paid in accordance with sections 67, 68, 69 of the Labour Code."
      },
      certificates: {
        title: "CERTIFICAT DE TRAVAIL",
        weUndersigned: "Nous soussignés",
        and: "ET",
        certify: "Certifications que :",
        worked: "a travaillé au sein de la société",
        position: "En qualité de : {{position}}",
        category: "Catégorie {{category}}, échelon {{echelon}}",
        period: "Durant la période allant du {{startDate}} au {{endDate}}",
        faith: "En foi de quoi nous lui délivrons ce certificat pour servir et faire valoir ce droit.",
        madeAt: "Fait à {{city}} le {{date}}"
      },
      attestations: {
        title: "ATTESTATION DE VIREMENT IRRÉVOCABLE",
        weUndersigned: "Nous soussignés Monsieur {{managerName}}, certifions que M. {{employeeName}} est employé dans notre Société, {{companyName}} et nous engageons sur son ordre formel à virer irrévocablement au compte numéro {{accountNumber}} - Cameroun au titre de salaire, nous nous engageons également à virer toutes indemnités qui seraient dues à l'intéressé s'il venait à quitter pour quelque raison que ce soit, notre société et à vous aviser de ce départ définitif au plus tard en même temps que nous vous adresserons le virement de liquidation de l'intéressé.",
        monthlyPayment: "Tout compte versé au salarié sur sa demande en cours de mois sera également viré à la Banque",
        modification: "Cet accord ne pourra être modifié ou suspendu qu'après accord donné par la {{bankName}} conjointement avec M.{{employeeName}}",
        madeAt: "Fait à {{city}}, le {{date}}"
      },
      amendments: {
        title: "AVENANT AU CONTRAT DE TRAVAIL DU {{originalContractDate}}",
        between: "ENTRE LES SOUSSIGNÉS",
        betweenEn: "Between the undersigned",
        employer: "{{employerName}}",
        employerEn: "(Full Name or Firm's Name)",
        address: "Adresse Complète : BP {{employerBP}} Tél : {{employerPhone}} E-mail : {{employerEmail}}",
        addressEn: "Full Address",
        representedBy: "Représenté par {{employerRepresentative}}",
        representedByEn: "Represented by",
        titleRep: "Qualité {{employerRepresentativeTitle}}",
        titleRepEn: "Title",
        cnps: "N° d'immatriculation CNPS {{employerCNPS}}",
        cnpsEn: "Registration Number",
        employerHereinafter: "CI-APRES DÉNOMMÉ L'EMPLOYEUR",
        employerHereinafterEn: "Hereinafter called (the employer)",
        oneHand: "D'une part Et",
        oneHandEn: "On the one hand and",
        employee: "Monsieur {{employeeName}}",
        employeeEn: "(Full in full)",
        born: "Né le {{employeeBirthDate}}",
        bornEn: "Born on",
        at: "À {{employeeBirthPlace}}",
        atEn: "At",
        residence: "Lieu de résidence habituel {{employeeAddress}}",
        residenceEn: "Usual place of residence",
        familyStatus: "Situation de famille {{employeeMaritalStatus}}",
        familyStatusEn: "Family status",
        employeeHereinafter: "CI APRES DENOMME L'EMPLOYEUR",
        employeeHereinafterEn: "Hereinafter called \"the employee\"",
        otherHand: "D'AUTRE PART",
        otherHandEn: "On the other hand",
        agreed: "Il a été arrêté et convenu ce qui suit",
        agreedEn: "It has been agreed the following",
        newClassification: "Vous êtes désormais classé à la Catégorie {{newCategory}} Échelon {{newEchelon}}",
        newClassificationEn: "You are placed in category Incremental position",
        newClassificationSector: "de la classification du secteur secondaire.",
        newClassificationSectorEn: "Of the classification of the secondary sector",
        newRemuneration: "L'employé(e) percevra une rémunération mensuelle brute totale de XAF {{totalSalary}} ({{totalSalary}} XAF), se décomposant comme suit; et ce avec effet au {{effectiveDate}}",
        newRemunerationEn: "The employee's remuneration shall be broken down as follows",
        workDuration: "La détermination de cette rémunération prend en considération une durée hebdomadaire forfaitaire de travail de {{weeklyHours}} heures par semaine.",
        workDurationEn: "(Le reste sans changement)",
        madeAt: "FAIT À {{city}} LE {{date}}",
        employeeSignature: "L'EMPLOYE",
        employeeSignatureEn: "THE EMPLOYEE",
        employerSignature: "L'EMPLOYEUR",
        employerSignatureEn: "THE EMPLOYER",
        readApproved: "Lu et approuvé",
        readApprovedEn: "Read and approved"
      }
    };
  }

  /**
   * Récupère la liste des champs personnalisables pour un type de document
   * @param {string} documentType - Type de document
   * @returns {array} Liste des champs personnalisables
   */
  getCustomizableFields(documentType) {
    const fields = {
      offers: [
        { key: 'introduction', label: '📝 Introduction de la lettre', type: 'textarea', rows: 3, description: 'Le premier paragraphe qui accueille le candidat et présente l\'offre d\'emploi' },
        { key: 'positionDescription', label: '💼 Description du poste proposé', type: 'textarea', rows: 2, description: 'Présentation du poste, de la catégorie et du lieu de travail' },
        { key: 'remuneration', label: '💰 Introduction de la rémunération', type: 'textarea', rows: 2, description: 'Texte qui introduit la section sur le salaire et les avantages' },
        { key: 'workDuration', label: '⏰ Durée et horaires de travail', type: 'textarea', rows: 2, description: 'Informations sur les heures de travail par semaine' },
        { key: 'workConditions', label: '🏢 Conditions de travail et déplacements', type: 'textarea', rows: 3, description: 'Règles pour les déplacements, télétravail et conditions d\'affectation' },
        { key: 'missionExpenses', label: '✈️ Règles pour les missions', type: 'textarea', rows: 3, description: 'Comment sont pris en charge les frais de mission et déplacements' },
        { key: 'trialPeriod', label: '🔍 Période d\'essai', type: 'textarea', rows: 2, description: 'Durée et conditions de la période d\'essai' },
        { key: 'medicalCoverage', label: '🏥 Couverture médicale - Introduction', type: 'textarea', rows: 3, description: 'Présentation générale de la couverture santé' },
        { key: 'medicalDetails', label: '💊 Détails de la couverture médicale', type: 'textarea', rows: 3, description: 'Détails sur les frais médicaux et pharmaceutiques' },
        { key: 'medicalTests', label: '🧪 Tests médicaux obligatoires', type: 'textarea', rows: 2, description: 'Politique sur les tests d\'alcool et de drogue' },
        { key: 'medicalCondition', label: '✅ Condition d\'acceptation', type: 'textarea', rows: 2, description: 'Texte sur les conditions médicales pour accepter l\'offre' },
        { key: 'validityConditions', label: '📋 Conditions de validité de l\'offre', type: 'textarea', rows: 2, description: 'Introduction des conditions pour que l\'offre soit valide' },
        { key: 'acceptance', label: '🤝 Texte d\'acceptation', type: 'textarea', rows: 2, description: 'Comment le candidat peut accepter l\'offre' },
        { key: 'additionalInfo', label: '📞 Informations de contact', type: 'textarea', rows: 2, description: 'Qui contacter pour plus d\'informations' },
        { key: 'documentsTitle', label: '📄 Titre de la section documents', type: 'text', description: 'Le titre de la section qui liste les documents à fournir' },
        { key: 'closing', label: '👋 Formule de politesse finale', type: 'textarea', rows: 2, description: 'La phrase de fin de lettre pour saluer le candidat' },
        { key: 'documentsList', label: '📋 Liste des documents à fournir', type: 'array', description: 'Les documents que le candidat doit apporter s\'il accepte l\'offre' }
      ],
      contracts: [
        { key: 'legalBasis', label: '⚖️ Introduction des lois applicables', type: 'textarea', rows: 2, description: 'Le texte qui présente les lois qui régissent le contrat' },
        { key: 'duration', label: '📅 Article sur la durée du contrat', type: 'textarea', rows: 2, description: 'Comment est définie la durée du contrat de travail' },
        { key: 'trialPeriod', label: '🔍 Période d\'essai', type: 'textarea', rows: 2, description: 'Durée et conditions de la période d\'essai' },
        { key: 'trialTermination', label: '❌ Rupture pendant la période d\'essai', type: 'textarea', rows: 2, description: 'Conditions pour mettre fin au contrat pendant l\'essai' },
        { key: 'contractDuration', label: '⏱️ Durée contractuelle', type: 'textarea', rows: 2, description: 'La durée totale du contrat de travail' },
        { key: 'effectiveDate', label: '📆 Date d\'entrée en vigueur', type: 'textarea', rows: 2, description: 'Quand le contrat commence à être effectif' },
        { key: 'termination', label: '🏁 Fin du contrat', type: 'textarea', rows: 2, description: 'Comment et quand le contrat peut prendre fin' },
        { key: 'functions', label: '💼 Fonctions de l\'employé', type: 'textarea', rows: 2, description: 'Description du poste et des responsabilités' },
        { key: 'classification', label: '📊 Classification professionnelle', type: 'textarea', rows: 2, description: 'Catégorie et échelon de l\'employé' },
        { key: 'workplace', label: '🏢 Lieu de travail', type: 'textarea', rows: 2, description: 'Où l\'employé va travailler' },
        { key: 'remuneration', label: '💰 Article sur la rémunération', type: 'textarea', rows: 2, description: 'Comment est définie la rémunération' },
        { key: 'payment', label: '💳 Modalités de paiement', type: 'textarea', rows: 2, description: 'Comment et quand l\'employé sera payé' }
      ],
      certificates: [
        { key: 'title', label: '🏆 Titre du certificat', type: 'text', description: 'Le titre principal qui apparaît en haut du certificat' },
        { key: 'weUndersigned', label: '✍️ Introduction des signataires', type: 'text', description: 'Le texte qui présente qui signe le certificat' },
        { key: 'certify', label: '📜 Introduction de la certification', type: 'text', description: 'Le mot qui introduit la certification' },
        { key: 'worked', label: '💼 Texte sur l\'emploi', type: 'text', description: 'Comment est décrit le fait d\'avoir travaillé' },
        { key: 'position', label: '👔 Poste occupé', type: 'text', description: 'Comment est décrit le poste de l\'employé' },
        { key: 'category', label: '📊 Classification professionnelle', type: 'text', description: 'Comment est décrite la catégorie de l\'employé' },
        { key: 'period', label: '📅 Période de travail', type: 'text', description: 'Comment est décrite la période d\'emploi' },
        { key: 'faith', label: '🤝 Conclusion du certificat', type: 'textarea', rows: 2, description: 'La phrase de conclusion qui valide le certificat' },
        { key: 'madeAt', label: '📍 Lieu et date', type: 'text', description: 'Où et quand le certificat a été établi' }
      ],
      attestations: [
        { key: 'title', label: '💳 Titre de l\'attestation', type: 'text', description: 'Le titre principal qui apparaît en haut de l\'attestation' },
        { key: 'weUndersigned', label: '📝 Texte principal de l\'attestation', type: 'textarea', rows: 3, description: 'Le texte qui explique l\'engagement de virement' },
        { key: 'monthlyPayment', label: '💰 Règles de paiement mensuel', type: 'textarea', rows: 2, description: 'Comment sont gérés les paiements en cours de mois' },
        { key: 'modification', label: '🔄 Conditions de modification', type: 'textarea', rows: 2, description: 'Comment l\'attestation peut être modifiée' },
        { key: 'madeAt', label: '📍 Lieu et date', type: 'text', description: 'Où et quand l\'attestation a été établie' }
      ],
      amendments: [
        { key: 'title', label: '📝 Titre de l\'avenant', type: 'text', description: 'Le titre principal qui apparaît en haut de l\'avenant' },
        { key: 'between', label: '🤝 Introduction des parties', type: 'text', description: 'Le texte qui présente l\'employeur et l\'employé' },
        { key: 'agreed', label: '✅ Introduction de l\'accord', type: 'text', description: 'Le texte qui introduit les modifications convenues' },
        { key: 'newClassification', label: '📊 Nouvelle classification', type: 'textarea', rows: 2, description: 'Le texte sur la nouvelle catégorie et échelon' },
        { key: 'newRemuneration', label: '💰 Nouvelle rémunération', type: 'textarea', rows: 2, description: 'Le texte sur la nouvelle rémunération' },
        { key: 'workDuration', label: '⏰ Durée de travail', type: 'textarea', rows: 2, description: 'Les nouvelles heures de travail par semaine' },
        { key: 'madeAt', label: '📍 Lieu et date', type: 'text', description: 'Où et quand l\'avenant a été signé' },
        { key: 'readApproved', label: '✍️ Signature', type: 'text', description: 'Le texte pour les signatures' }
      ]
    };
    
    return fields[documentType] || [];
  }
}

export default TextTemplateManager;
