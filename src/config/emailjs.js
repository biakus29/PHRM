// Configuration EmailJS
// Remplacez ces valeurs par vos propres identifiants EmailJS

export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_your_service_id',
  TEMPLATE_ID: 'template_your_template_id',
  PUBLIC_KEY: 'your_public_key',
  FROM_EMAIL: 'sarlphrm17@gmail.com',
  FROM_NAME: 'PHRM'
};

// Templates pour différents types d'emails
export const EMAIL_TEMPLATES = {
  // Template pour mise à jour de statut de candidature
  APPLICATION_STATUS_UPDATE: {
    subject: (jobTitle) => `Mise à jour de votre candidature - ${jobTitle}`,
    template: (candidateName, jobTitle, status, message) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PHRM - Mise à jour de votre candidature</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 20px 0; font-size: 16px;">Bonjour ${candidateName},</p>
          <p style="margin: 0 0 20px 0; font-size: 16px;">
            Nous vous informons que le statut de votre candidature pour le poste de <strong>${jobTitle}</strong> a été mis à jour.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              <strong>Nouveau statut :</strong> 
              <span style="color: #667eea; font-weight: bold; margin-left: 10px;">${status}</span>
            </p>
          </div>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              <strong>Message de l'équipe de recrutement :</strong><br>
              ${message}
            </p>
          </div>
          <p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d;">
            Vous pouvez suivre l'évolution de votre candidature à tout moment depuis votre espace personnel.
          </p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Cordialement,<br>
              L'équipe de recrutement PHRM<br>
              <small>Email: sarlphrm17@gmail.com</small>
            </p>
          </div>
        </div>
      </div>
    `
  },

  // Template pour réponse personnalisée
  CUSTOM_REPLY: {
    subject: (jobTitle) => `Réponse à votre candidature - ${jobTitle}`,
    template: (candidateName, jobTitle, message) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PHRM - Réponse à votre candidature</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 20px 0; font-size: 16px;">Bonjour ${candidateName},</p>
          <p style="margin: 0 0 20px 0; font-size: 16px;">
            Concernant votre candidature pour le poste de <strong>${jobTitle}</strong>, voici notre réponse :
          </p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              ${message}
            </p>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Cordialement,<br>
              L'équipe de recrutement PHRM<br>
              <small>Email: sarlphrm17@gmail.com</small>
            </p>
          </div>
        </div>
      </div>
    `
  },

  // Template pour notification d'offre
  JOB_NOTIFICATION: {
    subject: (title, type) => `${type} - ${title}`,
    template: (companyName, jobTitle, message, link) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">PHRM - Notification d'offre</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 20px 0; font-size: 16px;">Bonjour ${companyName},</p>
          <p style="margin: 0 0 20px 0; font-size: 16px;">
            ${message}
          </p>
          ${link ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Voir l'offre
              </a>
            </div>
          ` : ''}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="margin: 0; font-size: 14px; color: #6c757d;">
              Cordialement,<br>
              L'équipe PHRM<br>
              <small>Email: sarlphrm17@gmail.com</small>
            </p>
          </div>
        </div>
      </div>
    `
  }
};

// Fonction pour envoyer des emails avec EmailJS
export const sendEmail = async (templateType, params) => {
  try {
    const { SERVICE_ID, TEMPLATE_ID, PUBLIC_KEY } = EMAILJS_CONFIG;
    
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    return { success: true };
  } catch (error) {
    console.error('Erreur EmailJS:', error);
    return { success: false, error: error.message };
  }
};
