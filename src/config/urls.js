// Configuration des URLs pour PHRM
// Domaine principal : phrmapp.com

export const PHRM_URLS = {
  // Domaine principal
  DOMAIN: 'https://phrmapp.com',
  
  // Pages principales
  HOME: 'https://phrmapp.com',
  DEMO: 'https://phrmapp.com/demo',
  DEMO_SIGNUP: 'https://phrmapp.com/demo-signup',
  
  // Authentification
  CLIENT_LOGIN: 'https://phrmapp.com/client-admin-login',
  EMPLOYEE_LOGIN: 'https://phrmapp.com/employee-login',
  SUPER_ADMIN_LOGIN: 'https://phrmapp.com/super-admin-login',
  
  // Dashboards
  CLIENT_DASHBOARD: 'https://phrmapp.com/client-admin-dashboard',
  EMPLOYEE_DASHBOARD: 'https://phrmapp.com/employee-dashboard',
  SUPER_ADMIN_DASHBOARD: 'https://phrmapp.com/super-admin',
  
  // API (si nécessaire)
  API_BASE: 'https://api.phrmapp.com',
  
  // Support et contact
  SUPPORT: 'https://phrmapp.com/support',
  CONTACT: 'https://phrmapp.com/contact',
  
  // Documentation
  DOCS: 'https://docs.phrmapp.com',
  
  // Réseaux sociaux (à configurer selon vos comptes)
  SOCIAL: {
    FACEBOOK: 'https://facebook.com/phrmapp',
    TWITTER: 'https://twitter.com/phrmapp',
    LINKEDIN: 'https://linkedin.com/company/phrmapp'
  }
};

// Fonction utilitaire pour construire des URLs
export const buildUrl = (path) => {
  return `${PHRM_URLS.DOMAIN}${path}`;
};

// Fonction pour rediriger vers une URL PHRM
export const redirectToPhrm = (path) => {
  window.location.href = buildUrl(path);
};

export default PHRM_URLS;
