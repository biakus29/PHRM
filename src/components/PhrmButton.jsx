import React from 'react';
import { PHRM_URLS } from '../config/urls';

/**
 * Composant bouton pour les liens vers phrmapp.com
 * @param {Object} props
 * @param {string} props.type - Type de lien (demo, signup, login, etc.)
 * @param {string} props.children - Texte du bouton
 * @param {string} props.className - Classes CSS additionnelles
 * @param {string} props.variant - Variante du bouton (primary, secondary, outline)
 * @param {boolean} props.newTab - Ouvrir dans un nouvel onglet
 */
const PhrmButton = ({ 
  type = 'demo', 
  children, 
  className = '', 
  variant = 'primary',
  newTab = false,
  ...props 
}) => {
  // Mapping des types vers les URLs
  const urlMap = {
    demo: PHRM_URLS.DEMO,
    signup: PHRM_URLS.DEMO_SIGNUP,
    'demo-signup': PHRM_URLS.DEMO_SIGNUP,
    login: PHRM_URLS.CLIENT_LOGIN,
    'client-login': PHRM_URLS.CLIENT_LOGIN,
    'employee-login': PHRM_URLS.EMPLOYEE_LOGIN,
    dashboard: PHRM_URLS.CLIENT_DASHBOARD,
    home: PHRM_URLS.HOME,
    contact: PHRM_URLS.CONTACT,
    support: PHRM_URLS.SUPPORT
  };

  // Classes CSS par variante
  const variantClasses = {
    primary: 'bg-phrm-dark text-white hover:brightness-90',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-phrm-dark text-phrm-dark hover:bg-phrm-light',
    success: 'bg-green-600 text-white hover:bg-green-700',
    white: 'bg-white text-phrm-dark hover:bg-phrm-light'
  };

  const baseClasses = 'inline-block text-center px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 shadow-lg hover:shadow-xl';
  const finalClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  const url = urlMap[type] || PHRM_URLS.HOME;
  const target = newTab ? '_blank' : '_self';
  const rel = newTab ? 'noopener noreferrer' : undefined;

  return (
    <a 
      href={url} 
      className={finalClasses}
      target={target}
      rel={rel}
      {...props}
    >
      {children}
    </a>
  );
};

// Composants spécialisés pour les cas d'usage courants
export const DemoButton = ({ children = "Voir la démo", ...props }) => (
  <PhrmButton type="demo" variant="outline" {...props}>
    {children}
  </PhrmButton>
);

export const SignupButton = ({ children = "Essai gratuit", ...props }) => (
  <PhrmButton type="signup" variant="success" {...props}>
    {children}
  </PhrmButton>
);

export const StartButton = ({ children = "Commencer", ...props }) => (
  <PhrmButton type="signup" variant="primary" {...props}>
    {children}
  </PhrmButton>
);

export const LoginButton = ({ children = "Se connecter", type = "client-login", ...props }) => (
  <PhrmButton type={type} variant="secondary" {...props}>
    {children}
  </PhrmButton>
);

export default PhrmButton;
