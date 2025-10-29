import React, { useState } from 'react';
import { useDemo } from '../contexts/DemoContext';
import { Clock, AlertTriangle, Crown, Users, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DemoExpirationBanner = () => {
  const { isDemoAccount, timeRemaining, formatTimeRemaining, isExpired, demoData } = useDemo();
  const navigate = useNavigate();
  const [showBanner, setShowBanner] = useState(true);

  // Ne pas afficher si ce n'est pas un compte démo ou si la bannière est masquée
  if (!isDemoAccount || !showBanner || !demoData) return null;

  // Si expiré, rediriger vers la page d'abonnement
  if (isExpired) {
    navigate('/subscription');
    return null;
  }

  // Calculer les jours et heures restants pour l'affichage
  const daysRemaining = timeRemaining ? Math.floor(timeRemaining / (1000 * 60 * 60 * 24)) : 0;
  const hoursRemaining = timeRemaining ? Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0;
  const isUrgent = daysRemaining <= 2; // Urgent si moins de 2 jours
  const isWarning = daysRemaining <= 5; // Avertissement si moins de 5 jours

  // Stats de la démo
  const { employeeCount, payrollGenerated } = demoData.demoMetrics || { employeeCount: 0, payrollGenerated: 0 };
  const remainingEmployees = demoData.licenseMaxUsers - employeeCount;

  const getBannerStyle = () => {
    if (isUrgent) {
      return 'bg-gradient-to-r from-red-600 to-red-700 border-red-500 text-white';
    } else if (isWarning) {
      return 'bg-gradient-to-r from-orange-600 to-orange-700 border-orange-500 text-white';
    } else {
      return 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white';
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
    const timeDisplay = formatTimeRemaining(timeRemaining);
    
    if (isUrgent) {
      return {
        title: '⚠️ Attention - Version démo bientôt terminée !',
        subtitle: (
          <>
            <span className="font-bold text-white">Plus que {timeDisplay} d'accès</span>
            <br />
            Passez à la version complète pour conserver vos données
          </>
        )
      };
    } else if (isWarning) {
      return {
        title: '🕒 Version démo en cours',
        subtitle: (
          <>
            Accès restant : <span className="font-medium">{timeDisplay}</span>
            <br />
            Profitez de toutes les fonctionnalités sans limite avec un abonnement
          </>
        )
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
    <div className={`${getBannerStyle()} text-white border-l-4 shadow-lg mb-6 rounded-lg overflow-hidden relative`}>
      <div className="p-4">
        {/* Top row: icon + message + timer + CTA */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`p-2 rounded-lg ${isUrgent ? 'animate-pulse' : ''}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-lg">{message.title}</h3>
              <p className="text-sm opacity-90 mt-1">{message.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <div className="text-right">
                <div className="font-mono font-bold text-lg">{daysRemaining}j {hoursRemaining}h</div>
                <div className="text-xs opacity-75">restants</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/subscription')}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2 shadow-md"
            >
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Choisir un plan</span>
              <span className="sm:hidden">Upgrade</span>
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-4 flex items-center justify-between bg-white/10 p-3 rounded-lg text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="opacity-75">Employés :</span>{' '}
              <span className="font-bold">{employeeCount}/{demoData.licenseMaxUsers}</span>
            </div>
            <div>
              <span className="opacity-75">Fiches de paie :</span>{' '}
              <span className="font-bold">{payrollGenerated}</span>
            </div>
          </div>
          <div>
            {remainingEmployees > 0 ? (
              <span className="text-green-100">
                {remainingEmployees} place{remainingEmployees > 1 ? 's' : ''} disponible{remainingEmployees > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-yellow-100">Limite d'employés atteinte</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-1000 ease-out"
              style={{
                width: `${Math.max(0, Math.min(100, (timeRemaining / (30 * 24 * 60 * 60 * 1000)) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs opacity-75 mt-1">
            <span>Début de l'essai</span>
            <span>30 jours</span>
          </div>
        </div>
      </div>

      {/* Urgent overlay */}
      {isUrgent && (
        <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default DemoExpirationBanner;
