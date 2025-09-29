// src/hooks/useMediaQuery.js
// Hook personnalisé pour gérer les media queries de manière réactive

import { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Mettre à jour l'état initial
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    // Listener pour les changements
    const listener = (e) => setMatches(e.matches);
    
    // Ajouter le listener (nouvelle API)
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      // Fallback pour les anciens navigateurs
      media.addListener(listener);
    }
    
    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query, matches]);

  return matches;
};

// Hooks prédéfinis pour les tailles courantes
export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsMobileOrTablet = () => useMediaQuery('(max-width: 1023px)');
export const useIsLargeScreen = () => useMediaQuery('(min-width: 1536px)');
