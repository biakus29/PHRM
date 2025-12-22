// Service EmailJS - Version stable et sécurisée

import emailjs from '@emailjs/browser';

const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.REACT_APP_EMAILJS_SERVICE_ID,
  TEMPLATE_CANDIDATE: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  TEMPLATE_COMPANY: process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
  PUBLIC_KEY: process.env.REACT_APP_EMAILJS_PUBLIC_KEY
};

export const sendCandidateEmail = async ({
  to_email,
  to_name,
  subject,
  message,
  job_title,
  status
}) => {
  try {
    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_CANDIDATE,
      {
        to_email,
        to_name,
        subject,
        message,
        job_title,
        status,
        from_name: 'PHRM Recrutement',
        reply_to: 'noreply@phrm.app'
      },
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    console.log('Email envoyé avec succès:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Erreur EmailJS:', error);
    return { success: false, error: error.text || error.message };
  }
};

export const sendCompanyEmail = async ({
  to_email,
  to_name,
  subject,
  message,
  company_name
}) => {
  try {
    const result = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_COMPANY,
      {
        to_email,
        to_name,
        subject,
        message,
        company_name,
        from_name: 'PHRM Recrutement',
        reply_to: 'noreply@phrm.app'
      },
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    
    return { success: true, result };
  } catch (error) {
    console.error('Erreur EmailJS:', error);
    return { success: false, error: error.text || error.message };
  }
};
