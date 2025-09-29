// src/components/ResponsiveModal.jsx
// Composant Modal responsive avec animations et gestion du scroll
// Optimisé pour mobile, tablette et desktop

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useIsMobile, useIsTablet } from "../hooks/useMediaQuery";

const ResponsiveModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = "medium",
  fullScreen = false,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  actions,
  loading = false,
  className = "",
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const modalRef = useRef(null);
  
  // Gérer la fermeture avec Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);
  
  // Bloquer le scroll du body quand la modal est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Tailles de modal selon le paramètre et l'appareil
  const getModalSize = () => {
    if (fullScreen || isMobile) {
      return "w-full h-full min-h-screen";
    }
    
    const sizes = {
      small: "max-w-md",
      medium: "max-w-lg",
      large: "max-w-2xl",
      xlarge: "max-w-4xl",
      full: "max-w-7xl"
    };
    
    return `${sizes[size] || sizes.medium} w-full mx-4`;
  };
  
  // Position de la modal
  const getModalPosition = () => {
    if (fullScreen || isMobile) {
      return "inset-0";
    }
    
    if (isTablet) {
      return "top-10 left-1/2 transform -translate-x-1/2";
    }
    
    return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
  };
  
  // Animation d'entrée
  const getAnimationClass = () => {
    if (isMobile) {
      return "animate-slide-up";
    }
    return "animate-fade-in";
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      
      {/* Conteneur de la modal */}
      <div className={`fixed ${getModalPosition()} z-[10000]`}>
        <div
          ref={modalRef}
          className={`
            ${getModalSize()}
            ${getAnimationClass()}
            ${fullScreen || isMobile ? '' : 'rounded-lg shadow-xl'}
            bg-white flex flex-col
            ${className}
          `}
        >
          {/* En-tête */}
          {(title || showCloseButton) && (
            <div className={`
              flex items-center justify-between
              px-4 py-4 sm:px-6
              ${title ? 'border-b border-gray-200' : ''}
            `}>
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
          )}
          
          {/* Corps de la modal */}
          <div className={`
            flex-1 overflow-y-auto
            px-4 py-4 sm:px-6
            ${fullScreen || isMobile ? 'pb-20' : ''}
          `}>
            {children}
          </div>
          
          {/* Actions */}
          {actions && (
            <div className={`
              px-4 py-4 sm:px-6
              border-t border-gray-200 bg-gray-50
              ${isMobile ? 'flex flex-col gap-3' : 'flex justify-end gap-3'}
              ${fullScreen || isMobile ? 'fixed bottom-0 left-0 right-0' : ''}
            `}>
              {actions}
            </div>
          )}
          
          {/* Indicateur de chargement */}
          {loading && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour le contenu scrollable dans la modal
export const ModalContent = ({ children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    {children}
  </div>
);

// Composant pour les sections dans la modal
export const ModalSection = ({ title, children, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {title && (
      <h4 className="text-base font-medium text-gray-900">{title}</h4>
    )}
    {children}
  </div>
);

// Hook pour gérer l'état d'une modal
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);
  const toggle = React.useCallback(() => setIsOpen(prev => !prev), []);
  
  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

// Animations CSS (à ajouter dans votre fichier CSS global ou Tailwind config)
const modalStyles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
`;

export default ResponsiveModal;
