// Composant pour protéger les routes selon le type de compte
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useDemo } from '../contexts/DemoContext';

// Route protégée pour les comptes NON-démo uniquement
export const NonDemoRoute = ({ children }) => {
  const { isDemoAccount } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDemoAccount) {
      console.log('[ProtectedRoute] Compte démo détecté, redirection vers /demo-dashboard');
      navigate('/demo-dashboard', { replace: true });
    }
  }, [isDemoAccount, navigate]);

  // Si c'est un compte démo, ne pas rendre le composant
  if (isDemoAccount) {
    return null;
  }

  return children;
};

// Route protégée pour les comptes démo uniquement
export const DemoOnlyRoute = ({ children }) => {
  const { isDemoAccount } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isDemoAccount) {
      console.log('[ProtectedRoute] Compte non-démo détecté, redirection vers /client-admin-dashboard');
      navigate('/client-admin-dashboard', { replace: true });
    }
  }, [isDemoAccount, navigate]);

  // Si ce n'est pas un compte démo, ne pas rendre le composant
  if (!isDemoAccount) {
    return null;
  }

  return children;
};

export default NonDemoRoute;
