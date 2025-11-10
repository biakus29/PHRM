/**
 * Utilitaires pour la gestion des emails internes des employés
 */

/**
 * Génère un email interne pour un employé basé sur son nom et le nom de l'entreprise
 * Format: nom@nomentreprise.com
 * 
 * @param {string} employeeName - Nom complet de l'employé (ex: "Jean Dupont")
 * @param {string} companyEmail - Email de l'entreprise (ex: "contact@entreprise.com")
 * @param {string} companyName - Nom de l'entreprise (utilisé pour créer le domaine)
 * @returns {string} Email interne généré
 */
export function generateInternalEmail(employeeName, companyEmail, companyName = '') {
  if (!employeeName || !employeeName.trim()) {
    throw new Error("Le nom de l'employé est requis");
  }

  // Normaliser le nom de l'entreprise pour créer le domaine
  let domain = 'phrmapp.com'; // Domaine par défaut
  
  if (companyName && companyName.trim()) {
    // Normaliser le nom de l'entreprise pour créer le domaine
    const normalizedCompanyName = companyName
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]/g, '') // Supprimer les caractères spéciaux
      .replace(/\s+/g, ''); // Supprimer les espaces
    
    if (normalizedCompanyName.length > 0) {
      domain = `${normalizedCompanyName}.com`;
    }
  } else if (companyEmail && companyEmail.includes('@')) {
    // Si pas de nom d'entreprise, extraire le domaine de l'email
    const emailDomain = companyEmail.split('@')[1];
    // Ne pas utiliser gmail.com, yahoo.com, etc. comme domaine
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'icloud.com', 'aol.com'];
    if (!publicDomains.includes(emailDomain.toLowerCase())) {
      // Extraire le sous-domaine principal (ex: "entreprise" de "contact@entreprise.com")
      const domainParts = emailDomain.split('.');
      // Prendre la partie avant le premier point (ex: "entreprise" de "entreprise.com")
      const mainDomain = domainParts[0];
      if (mainDomain && mainDomain.length > 0) {
        domain = `${mainDomain}.com`;
      }
    }
    // Si c'est un domaine public (gmail, etc.), on garde le domaine par défaut
  }

  // Normaliser le nom de l'employé pour extraire uniquement le nom de famille
  const normalizedName = employeeName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s]/g, '') // Supprimer les caractères spéciaux sauf espaces
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .trim();

  // Séparer prénom et nom
  const nameParts = normalizedName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    throw new Error("Impossible de générer un email: nom invalide");
  }

  // Utiliser le dernier mot comme nom de famille (ou le seul mot s'il n'y en a qu'un)
  let lastName = nameParts.length > 1 
    ? nameParts[nameParts.length - 1] // Dernier mot = nom de famille
    : nameParts[0]; // Si un seul mot, l'utiliser comme nom

  // S'assurer qu'il n'y a pas de point dans le nom
  lastName = lastName.replace(/\./g, '');

  // Limiter la longueur pour éviter des emails trop longs
  lastName = lastName.substring(0, 30);

  // Vérifier que le nom n'est pas vide après nettoyage
  if (!lastName || lastName.length === 0) {
    throw new Error("Impossible de générer un email: nom invalide après normalisation");
  }

  // Générer l'email: nom@nomentreprise.com
  const internalEmail = `${lastName}@${domain}`;

  return internalEmail;
}

/**
 * Génère un email interne unique en ajoutant un suffixe numérique si nécessaire
 * Format: nom1@nomentreprise.com, nom2@nomentreprise.com, etc.
 * 
 * @param {string} baseEmail - Email de base (format: nom@nomentreprise.com)
 * @param {Function} checkEmailExists - Fonction async qui vérifie si l'email existe (retourne true si existe)
 * @returns {Promise<string>} Email interne unique
 */
export async function generateUniqueInternalEmail(baseEmail, checkEmailExists) {
  if (!checkEmailExists || typeof checkEmailExists !== 'function') {
    // Si pas de fonction de vérification, retourner l'email de base
    return baseEmail;
  }

  // Vérifier d'abord si l'email de base est disponible
  const baseExists = await checkEmailExists(baseEmail);
  if (!baseExists) {
    return baseEmail;
  }

  // Extraire la partie locale (nom) et le domaine
  const [localPart, domain] = baseEmail.split('@');
  
  let email = baseEmail;
  let counter = 1;
  const maxAttempts = 100;

  // Générer des variantes avec suffixe numérique: nom1@, nom2@, etc.
  while (await checkEmailExists(email) && counter < maxAttempts) {
    email = `${localPart}${counter}@${domain}`;
    counter++;
  }

  if (counter >= maxAttempts) {
    // Si on n'a pas trouvé d'email unique après 100 tentatives, utiliser un timestamp
    const timestamp = Date.now().toString().slice(-6);
    email = `${localPart}${timestamp}@${domain}`;
  }

  return email;
}

/**
 * Extrait le domaine d'un email
 * 
 * @param {string} email - Adresse email
 * @returns {string} Domaine extrait ou domaine par défaut
 */
export function extractDomain(email) {
  if (!email || !email.includes('@')) {
    return 'phrmapp.com';
  }
  return email.split('@')[1];
}

