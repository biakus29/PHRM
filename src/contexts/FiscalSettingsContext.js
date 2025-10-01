import React, { createContext, useContext } from 'react';
import { useFiscalSettings } from '../hooks/useFiscalSettings';

const FiscalSettingsContext = createContext(null);

/**
 * Provider pour les paramètres fiscaux
 * À placer au niveau racine de l'application
 */
export const FiscalSettingsProvider = ({ children }) => {
  const { settings, loading, error } = useFiscalSettings();

  return (
    <FiscalSettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </FiscalSettingsContext.Provider>
  );
};

/**
 * Hook pour accéder aux paramètres fiscaux dans n'importe quel composant
 */
export const useFiscalSettingsContext = () => {
  const context = useContext(FiscalSettingsContext);
  
  if (!context) {
    throw new Error('useFiscalSettingsContext doit être utilisé dans un FiscalSettingsProvider');
  }
  
  return context;
};

export default FiscalSettingsContext;
