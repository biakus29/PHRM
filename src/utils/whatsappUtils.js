/**
 * Utilitaires pour l'envoi d'informations de connexion via WhatsApp
 */

/**
 * Génère un lien WhatsApp pour envoyer un message
 * @param {string} phoneNumber - Numéro de téléphone (avec indicatif, ex: +2376XXXXXXXX)
 * @param {string} message - Message à envoyer
 * @returns {string} URL WhatsApp
 */
export const generateWhatsAppLink = (phoneNumber, message) => {
  // Nettoyer le numéro de téléphone (supprimer tous les caractères non numériques sauf le +)
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Encoder le message pour l'URL
  const encodedMessage = encodeURIComponent(message);
  
  // Générer le lien WhatsApp
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

/**
 * Formate le message d'informations de connexion pour un employé
 * @param {Object} employee - Données de l'employé
 * @param {Object} companyData - Données de l'entreprise
 * @returns {string} Message formaté
 */
export const formatCredentialsMessage = (employee, companyData) => {
  const email = employee.internalEmail || employee.email;
  const password = employee.currentPassword || employee.initialPassword || "123456";
  
  const message = `🏢 *${companyData.name} - Informations de Connexion*

👤 *Employé :* ${employee.name}
📧 *Email :* ${email}
🔑 *Mot de passe :* ${password}

🌐 *Lien de connexion :* ${window.location.origin}/employee-login

---
💡 *Instructions :*
1. Utilisez votre email ci-dessus pour vous connecter
2. Entrez votre mot de passe
3. Changez votre mot de passe lors de la première connexion

📞 Pour toute assistance, contactez le RH.

*Cet email est généré automatiquement - Ne pas répondre*`;

  return message;
};

/**
 * Ouvre WhatsApp avec les informations de connexion de l'employé
 * @param {Object} employee - Données de l'employé
 * @param {Object} companyData - Données de l'entreprise
 * @param {string} phoneNumber - Numéro WhatsApp du destinataire
 */
export const sendCredentialsViaWhatsApp = (employee, companyData, phoneNumber) => {
  if (!phoneNumber) {
    throw new Error("Numéro de téléphone requis pour l'envoi WhatsApp");
  }
  
  if (!employee || !companyData) {
    throw new Error("Données de l'employé et de l'entreprise requises");
  }
  
  const message = formatCredentialsMessage(employee, companyData);
  const whatsappLink = generateWhatsAppLink(phoneNumber, message);
  
  // Ouvre le lien dans une nouvelle fenêtre
  window.open(whatsappLink, '_blank');
};

/**
 * Valide un numéro de téléphone pour WhatsApp
 * @param {string} phoneNumber - Numéro à valider
 * @returns {boolean} True si valide
 */
export const validateWhatsAppNumber = (phoneNumber) => {
  // Doit commencer par + et contenir uniquement des chiffres après
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(phoneNumber.replace(/[^\d+]/g, ''));
};

/**
 * Formate un numéro de téléphone pour WhatsApp
 * @param {string} phoneNumber - Numéro à formater
 * @returns {string} Numéro formaté
 */
export const formatPhoneNumberForWhatsApp = (phoneNumber) => {
  // Supprimer tous les caractères non numériques sauf le +
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  
  // Si le numéro ne commence pas par +, ajouter l'indicatif du Cameroun par défaut
  if (!cleanPhone.startsWith('+')) {
    // Si le numéro commence par 6, c'est probablement un numéro camerounais
    if (cleanPhone.startsWith('6')) {
      cleanPhone = '+237' + cleanPhone;
    } else {
      // Sinon, ajouter juste un + (l'utilisateur devra corriger)
      cleanPhone = '+' + cleanPhone;
    }
  }
  
  return cleanPhone;
};
