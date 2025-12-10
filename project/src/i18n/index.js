import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';

const resources = {
  en: {
    translation: enTranslation
  },
  fr: {
    translation: frTranslation
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Default language (French for Cameroon)
    fallbackLng: 'en', // Fallback to English
    
    interpolation: {
      escapeValue: false // React already escapes
    },
    
    debug: false, // Set to true for development debugging
    
    // Options for language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
