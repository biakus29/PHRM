// src/utils/displayUtils.jsx
// Utilitaires pour l'affichage des données d'employé

/**
 * Affiche une valeur d'employé avec une valeur par défaut appropriée
 * @param {*} value - La valeur à afficher
 * @param {string} defaultValue - La valeur par défaut si la valeur est vide
 * @returns {string} La valeur à afficher
 */
export const displayEmployeeValue = (value, defaultValue = "Non renseigné") => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return defaultValue;
  }
  return value;
};

/**
 * Affiche le téléphone avec formatage
 * @param {string} phone - Le numéro de téléphone
 * @returns {string} Le téléphone formaté ou "Non renseigné"
 */
export const displayPhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "Non renseigné";
  }
  return phone;
};

/**
 * Affiche le département
 * @param {string} department - Le département
 * @returns {string} Le département ou "Non spécifié"
 */
export const displayDepartment = (department) => {
  if (!department || !department.trim()) {
    return "Non spécifié";
  }
  return department;
};

/**
 * Affiche le matricule
 * @param {string} matricule - Le matricule
 * @returns {string} Le matricule ou "Non renseigné"
 */
export const displayMatricule = (matricule) => {
  if (!matricule || !matricule.trim()) {
    return "Non renseigné";
  }
  return matricule;
};

/**
 * Affiche la catégorie professionnelle
 * @param {string} category - La catégorie professionnelle
 * @returns {string} La catégorie ou "Non spécifiée"
 */
export const displayProfessionalCategory = (category) => {
  if (!category || !category.trim()) {
    return "Non spécifiée";
  }
  return category;
};

/**
 * Affiche le numéro CNPS
 * @param {string} cnpsNumber - Le numéro CNPS
 * @returns {string} Le numéro CNPS ou "Non renseigné"
 */
export const displayCNPSNumber = (cnpsNumber) => {
  if (!cnpsNumber || !cnpsNumber.trim()) {
    return "Non renseigné";
  }
  return cnpsNumber;
};

/**
 * Affiche le salaire avec formatage
 * @param {number|string} salary - Le salaire
 * @returns {string} Le salaire formaté ou "Non renseigné"
 */
export const displaySalary = (salary) => {
  if (!salary || salary === 0) {
    return "Non renseigné";
  }
  const numSalary = Number(salary);
  if (isNaN(numSalary) || numSalary <= 0) {
    return "Non renseigné";
  }
  return `${numSalary.toLocaleString()} FCFA`;
};

/**
 * Affiche une date avec formatage
 * @param {string|Date|Timestamp} date - La date
 * @returns {string} La date formatée ou "Non renseignée"
 */
export const displayDate = (date) => {
  if (!date) {
    return "Non renseignée";
  }
  
  try {
    let dateObj;
    
    // Si c'est un Timestamp Firebase
    if (date && typeof date === 'object' && date.toDate) {
      dateObj = date.toDate();
    }
    // Si c'est déjà un objet Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si c'est une chaîne de caractères
    else if (typeof date === 'string') {
      // Essayer de parser la chaîne
      dateObj = new Date(date);
      
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return "Date invalide";
    }
    
    return dateObj.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayDate] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche les diplômes
 * @param {string} diplomas - Les diplômes
 * @returns {string} Les diplômes ou "Non renseignés"
 */
export const displayDiplomas = (diplomas) => {
  if (!diplomas || !diplomas.trim()) {
    return "Non renseignés";
  }
  return diplomas;
};

/**
 * Affiche l'échelon
 * @param {string} echelon - L'échelon
 * @returns {string} L'échelon ou "Non renseigné"
 */
export const displayEchelon = (echelon) => {
  if (!echelon || !echelon.trim()) {
    return "Non renseigné";
  }
  return echelon;
};

/**
 * Affiche le service
 * @param {string} service - Le service
 * @returns {string} Le service ou "Non renseigné"
 */
export const displayService = (service) => {
  if (!service || !service.trim()) {
    return "Non renseigné";
  }
  return service;
};

/**
 * Affiche le superviseur
 * @param {string} supervisor - Le superviseur
 * @returns {string} Le superviseur ou "Non renseigné"
 */
export const displaySupervisor = (supervisor) => {
  if (!supervisor || !supervisor.trim()) {
    return "Non renseigné";
  }
  return supervisor;
};

/**
 * Affiche le lieu de naissance
 * @param {string} placeOfBirth - Le lieu de naissance
 * @returns {string} Le lieu de naissance ou "Non renseigné"
 */
export const displayPlaceOfBirth = (placeOfBirth) => {
  if (!placeOfBirth || !placeOfBirth.trim()) {
    return "Non renseigné";
  }
  return placeOfBirth;
};

/**
 * Affiche la date de naissance avec formatage
 * @param {string|Date|Timestamp} dateOfBirth - La date de naissance
 * @returns {string} La date de naissance formatée ou "Non renseignée"
 */
export const displayDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) {
    return "Non renseignée";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (dateOfBirth && typeof dateOfBirth === 'object' && dateOfBirth.toDate) {
      date = dateOfBirth.toDate();
    }
    // Si c'est déjà un objet Date
    else if (dateOfBirth instanceof Date) {
      date = dateOfBirth;
    }
    // Si c'est une chaîne de caractères
    else if (typeof dateOfBirth === 'string') {
      // Essayer de parser la chaîne
      date = new Date(dateOfBirth);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof dateOfBirth === 'number') {
      date = new Date(dateOfBirth);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayDateOfBirth] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date avec formatage personnalisé
 * @param {string|Date|Timestamp} date - La date
 * @param {object} options - Options de formatage
 * @returns {string} La date formatée ou "Non renseignée"
 */
export const displayDateWithOptions = (date, options = {}) => {
  if (!date) {
    return "Non renseignée";
  }
  
  try {
    let dateObj;
    
    // Si c'est un Timestamp Firebase
    if (date && typeof date === 'object' && date.toDate) {
      dateObj = date.toDate();
    }
    // Si c'est déjà un objet Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si c'est une chaîne de caractères
    else if (typeof date === 'string') {
      // Essayer de parser la chaîne
      dateObj = new Date(date);
      
      // Vérifier si la date est valide
      if (isNaN(dateObj.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof date === 'number') {
      dateObj = new Date(date);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(dateObj.getTime())) {
      return "Date invalide";
    }
    
    return dateObj.toLocaleDateString("fr-FR", options);
  } catch (error) {
    console.error("[displayDateWithOptions] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date de génération (pour les PDFs, contrats, etc.)
 * @param {string|Date|Timestamp} generatedAt - La date de génération
 * @returns {string} La date formatée ou "Non renseignée"
 */
export const displayGeneratedAt = (generatedAt) => {
  if (!generatedAt) {
    return "Non renseignée";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (generatedAt && typeof generatedAt === 'object' && generatedAt.toDate) {
      date = generatedAt.toDate();
    }
    // Si c'est déjà un objet Date
    else if (generatedAt instanceof Date) {
      date = generatedAt;
    }
    // Si c'est une chaîne de caractères
    else if (typeof generatedAt === 'string') {
      // Essayer de parser la chaîne
      date = new Date(generatedAt);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof generatedAt === 'number') {
      date = new Date(generatedAt);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayGeneratedAt] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date d'embauche
 * @param {string|Date|Timestamp} hireDate - La date d'embauche
 * @returns {string} La date formatée ou "Non renseignée"
 */
export const displayHireDate = (hireDate) => {
  if (!hireDate) {
    return "Non renseignée";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (hireDate && typeof hireDate === 'object' && hireDate.toDate) {
      date = hireDate.toDate();
    }
    // Si c'est déjà un objet Date
    else if (hireDate instanceof Date) {
      date = hireDate;
    }
    // Si c'est une chaîne de caractères
    else if (typeof hireDate === 'string') {
      // Essayer de parser la chaîne
      date = new Date(hireDate);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof hireDate === 'number') {
      date = new Date(hireDate);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayHireDate] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date de début de contrat
 * @param {string|Date|Timestamp} startDate - La date de début
 * @returns {string} La date formatée ou "Non définie"
 */
export const displayContractStartDate = (startDate) => {
  if (!startDate) {
    return "Non définie";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (startDate && typeof startDate === 'object' && startDate.toDate) {
      date = startDate.toDate();
    }
    // Si c'est déjà un objet Date
    else if (startDate instanceof Date) {
      date = startDate;
    }
    // Si c'est une chaîne de caractères
    else if (typeof startDate === 'string') {
      // Essayer de parser la chaîne
      date = new Date(startDate);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof startDate === 'number') {
      date = new Date(startDate);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayContractStartDate] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date de fin de contrat
 * @param {string|Date|Timestamp} endDate - La date de fin
 * @returns {string} La date formatée ou "Non définie"
 */
export const displayContractEndDate = (endDate) => {
  if (!endDate) {
    return "Non définie";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (endDate && typeof endDate === 'object' && endDate.toDate) {
      date = endDate.toDate();
    }
    // Si c'est déjà un objet Date
    else if (endDate instanceof Date) {
      date = endDate;
    }
    // Si c'est une chaîne de caractères
    else if (typeof endDate === 'string') {
      // Essayer de parser la chaîne
      date = new Date(endDate);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof endDate === 'number') {
      date = new Date(endDate);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayContractEndDate] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

/**
 * Affiche une date d'expiration de licence
 * @param {string|Date|Timestamp} expiryDate - La date d'expiration
 * @returns {string} La date formatée ou "Non définie"
 */
export const displayLicenseExpiry = (expiryDate) => {
  if (!expiryDate) {
    return "Non définie";
  }
  
  try {
    let date;
    
    // Si c'est un Timestamp Firebase
    if (expiryDate && typeof expiryDate === 'object' && expiryDate.toDate) {
      date = expiryDate.toDate();
    }
    // Si c'est déjà un objet Date
    else if (expiryDate instanceof Date) {
      date = expiryDate;
    }
    // Si c'est une chaîne de caractères
    else if (typeof expiryDate === 'string') {
      // Essayer de parser la chaîne
      date = new Date(expiryDate);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return "Date invalide";
      }
    }
    // Si c'est un timestamp numérique
    else if (typeof expiryDate === 'number') {
      date = new Date(expiryDate);
    }
    else {
      return "Date invalide";
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[displayLicenseExpiry] Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
}; 

/**
 * Normalise les données d'un employé récupérées depuis Firebase
 * @param {object} employeeData - Les données brutes de l'employé
 * @returns {object} Les données normalisées
 */
export const normalizeEmployeeData = (employeeData) => {
  if (!employeeData) return employeeData;
  
  const normalized = { ...employeeData };
  
  // Normaliser la date de naissance
  if (normalized.dateOfBirth) {
    try {
      // Si c'est déjà une chaîne ISO valide, la garder
      const testDate = new Date(normalized.dateOfBirth);
      if (isNaN(testDate.getTime())) {
        // Si la date n'est pas valide, la supprimer
        console.warn(`[normalizeEmployeeData] Date de naissance invalide pour ${normalized.name}:`, normalized.dateOfBirth);
        normalized.dateOfBirth = null;
      }
    } catch (error) {
      console.error(`[normalizeEmployeeData] Erreur normalisation date de naissance pour ${normalized.name}:`, error);
      normalized.dateOfBirth = null;
    }
  }
  
  // Normaliser la date d'embauche
  if (normalized.hireDate) {
    try {
      const testDate = new Date(normalized.hireDate);
      if (isNaN(testDate.getTime())) {
        console.warn(`[normalizeEmployeeData] Date d'embauche invalide pour ${normalized.name}:`, normalized.hireDate);
        normalized.hireDate = null;
      }
    } catch (error) {
      console.error(`[normalizeEmployeeData] Erreur normalisation date d'embauche pour ${normalized.name}:`, error);
      normalized.hireDate = null;
    }
  }
  
  return normalized;
}; 