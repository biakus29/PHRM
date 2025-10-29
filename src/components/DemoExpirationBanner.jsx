import React from 'react';
import { useDemo } from '../contexts/DemoContext';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoExpirationBanner = () => {
  const { isDemoAccount, timeRemaining, formatTimeRemaining, isExpired } = useDemo();
  const navigate = useNavigate();

  // Ne pas afficher si ce n'est pas un compte démo
  if (!isDemoAccount) return null;

  // Si expiré, rediriger vers la page d'abonnement
  if (isExpired) {
    navigate('/subscription');
    return null;
  }

  // Calculer les jours restants pour déterminer l'urgence
  const daysRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60 * 24)) : 0;
  const isUrgent = daysRemaining <= 2; // Urgent si moins de 2 jours
  const isWarning = daysRemaining <= 5; // Avertissement si moins de 5 jours

  const getBannerStyle = () => {
    if (isUrgent) {
      return 'bg-gradient-to-r from-red-600 to-red-700 border-red-500';
    } else if (isWarning) {
      return 'bg-gradient-to-r from-orange-600 to-orange-700 border-orange-500';
    } else {
      return 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500';
    }
  };

  const getIcon = () => {
    if (isUrgent) {
      return <AlertTriangle className="w-6 h-6 animate-pulse" />;
    } else {
      return <Clock className="w-6 h-6" />;
    }
  };

  const getMessage = () => {
    if (isUrgent) {
      return {
        title: '⚠️ Expiration imminente !',
        subtitle: `Votre période d'essai de 30 jours expire dans ${formatTimeRemaining(timeRemaining)}. Souscrivez maintenant pour ne pas perdre vos données.`
      };
    } else if (isWarning) {
      return {
        title: '⏰ Bientôt la fin de votre essai',
        subtitle: `Plus que ${formatTimeRemaining(timeRemaining)} sur votre période d'essai de 30 jours pour profiter de PRHM.`
      };
    } else {
      return {
        title: '🎯 Mode Démonstration Actif',
        subtitle: `Il vous reste ${formatTimeRemaining(timeRemaining)} sur votre période d'essai de 30 jours pour explorer toutes les fonctionnalités.`
      };
    }
  };

  const message = getMessage();

  return (
    <div className={`${getBannerStyle()} text-white border-l-4 shadow-lg mb-6 rounded-lg overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{message.title}</h3>
              <p className="text-sm opacity-90 mt-1">{message.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Compteur visuel */}
            <div className="hidden sm:flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold text-lg">
                {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
            
            {/* Bouton d'action */}
            <button
              onClick={() => navigate('/subscription')}
              className="bg-white text-gray-900 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 shadow-md"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Choisir un plan</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="mt-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${Math.max(0, Math.min(100, (timeRemaining / (30 * 24 * 60 * 60 * 1000)) * 100))}%` 
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs opacity-75 mt-1">
            <span>Début de l'essai</span>
            <span>30 jours</span>
          </div>
        </div>
      </div>
      
      {/* Animation de pulsation pour les cas urgents */}
      {isUrgent && (
        <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse pointer-events-none"></div>
      )}
    </div>
  );
};

export default DemoExpirationBanner;
