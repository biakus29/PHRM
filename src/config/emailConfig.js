// Configuration pour les notifications email
// Utilise EmailJS pour l'envoi côté client (recommandé pour les apps React)

export const EMAIL_CONFIG = {
  // Configuration EmailJS (service gratuit jusqu'à 200 emails/mois)
  emailjs: {
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_phrm',
    templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_phrm',
    publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key',
    privateKey: process.env.REACT_APP_EMAILJS_PRIVATE_KEY || 'your_private_key'
  },

  // Configuration SMTP alternative (pour backend Node.js)
  smtp: {
    host: process.env.REACT_APP_SMTP_HOST || 'smtp.gmail.com',
    port: process.env.REACT_APP_SMTP_PORT || 587,
    secure: false, // true pour 465, false pour autres ports
    auth: {
      user: process.env.REACT_APP_SMTP_USER || 'noreply@phrm.com',
      pass: process.env.REACT_APP_SMTP_PASS || 'your_app_password'
    }
  },

  // Paramètres par défaut
  defaults: {
    from: {
      name: 'PHRM - Gestion RH',
      email: 'noreply@phrm.com'
    },
    replyTo: 'support@phrm.com',
    company: {
      name: 'PHRM',
      website: 'https://phrm.com',
      logo: 'https://phrm.com/logo.png',
      address: 'Yaoundé, Cameroun',
      phone: '+237 123 456 789'
    }
  },

  // Limites et quotas
  limits: {
    dailyLimit: 1000, // Limite quotidienne d'emails
    hourlyLimit: 100, // Limite horaire
    retryAttempts: 3, // Nombre de tentatives en cas d'échec
    retryDelay: 5000 // Délai entre les tentatives (ms)
  }
};

// Types de notifications email
export const EMAIL_TYPES = {
  // Notifications RH
  EMPLOYEE_ADDED: 'employee_added',
  EMPLOYEE_UPDATED: 'employee_updated',
  EMPLOYEE_DELETED: 'employee_deleted',
  
  // Congés et absences
  LEAVE_REQUEST_SUBMITTED: 'leave_request_submitted',
  LEAVE_REQUEST_APPROVED: 'leave_request_approved',
  LEAVE_REQUEST_REJECTED: 'leave_request_rejected',
  ABSENCE_RECORDED: 'absence_recorded',
  
  // Paie
  PAYSLIP_GENERATED: 'payslip_generated',
  PAYSLIP_SENT: 'payslip_sent',
  SALARY_UPDATED: 'salary_updated',
  
  // Contrats
  CONTRACT_CREATED: 'contract_created',
  CONTRACT_UPDATED: 'contract_updated',
  CONTRACT_EXPIRING: 'contract_expiring',
  
  // Système
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_ACTIVATED: 'account_activated',
  ACCOUNT_SUSPENDED: 'account_suspended',
  PASSWORD_RESET: 'password_reset',
  
  // Licence et abonnement
  TRIAL_EXPIRING: 'trial_expiring',
  TRIAL_EXPIRED: 'trial_expired',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  PAYMENT_FAILED: 'payment_failed',
  
  // Notifications administratives
  BACKUP_COMPLETED: 'backup_completed',
  SYSTEM_MAINTENANCE: 'system_maintenance',
  SECURITY_ALERT: 'security_alert'
};

// Priorités des notifications
export const EMAIL_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Configuration des priorités par type
export const EMAIL_TYPE_PRIORITIES = {
  [EMAIL_TYPES.EMPLOYEE_ADDED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.EMPLOYEE_UPDATED]: EMAIL_PRIORITIES.LOW,
  [EMAIL_TYPES.EMPLOYEE_DELETED]: EMAIL_PRIORITIES.HIGH,
  
  [EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.LEAVE_REQUEST_APPROVED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.LEAVE_REQUEST_REJECTED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.ABSENCE_RECORDED]: EMAIL_PRIORITIES.LOW,
  
  [EMAIL_TYPES.PAYSLIP_GENERATED]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.PAYSLIP_SENT]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.SALARY_UPDATED]: EMAIL_PRIORITIES.MEDIUM,
  
  [EMAIL_TYPES.CONTRACT_CREATED]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.CONTRACT_UPDATED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.CONTRACT_EXPIRING]: EMAIL_PRIORITIES.HIGH,
  
  [EMAIL_TYPES.ACCOUNT_CREATED]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.ACCOUNT_ACTIVATED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.ACCOUNT_SUSPENDED]: EMAIL_PRIORITIES.URGENT,
  [EMAIL_TYPES.PASSWORD_RESET]: EMAIL_PRIORITIES.HIGH,
  
  [EMAIL_TYPES.TRIAL_EXPIRING]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.TRIAL_EXPIRED]: EMAIL_PRIORITIES.URGENT,
  [EMAIL_TYPES.SUBSCRIPTION_ACTIVATED]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.SUBSCRIPTION_EXPIRING]: EMAIL_PRIORITIES.HIGH,
  [EMAIL_TYPES.PAYMENT_FAILED]: EMAIL_PRIORITIES.URGENT,
  
  [EMAIL_TYPES.BACKUP_COMPLETED]: EMAIL_PRIORITIES.LOW,
  [EMAIL_TYPES.SYSTEM_MAINTENANCE]: EMAIL_PRIORITIES.MEDIUM,
  [EMAIL_TYPES.SECURITY_ALERT]: EMAIL_PRIORITIES.URGENT
};

// Délais d'envoi par priorité (en minutes)
export const EMAIL_SEND_DELAYS = {
  [EMAIL_PRIORITIES.URGENT]: 0, // Immédiat
  [EMAIL_PRIORITIES.HIGH]: 5, // 5 minutes
  [EMAIL_PRIORITIES.MEDIUM]: 15, // 15 minutes
  [EMAIL_PRIORITIES.LOW]: 60 // 1 heure
};

export default EMAIL_CONFIG;
