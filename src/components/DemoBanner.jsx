import React, { useState } from 'react';
import { useDemo } from '../contexts/DemoContext';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import DemoToClientConversion from './DemoToClientConversion';

const DemoBanner = () => {
  const { isDemoAccount, timeRemaining, formatTimeRemaining, isExpired } = useDemo();
  const [showConversionModal, setShowConversionModal] = useState(false);

  if (!isDemoAccount) return null;

  if (isExpired) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm text-red-700">
                  <strong>Compte démo expiré</strong> - Votre période d'essai de 30 jours est terminée.
                  Les données ont été supprimées automatiquement.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="h-16"></div>
      </>
    );
  }

  const hoursLeft = Math.floor(timeRemaining / (1000 * 60 * 60));
  const isUrgent = hoursLeft < 2;

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 ${isUrgent ? 'bg-orange-50' : 'bg-blue-50'} border-b ${isUrgent ? 'border-orange-200' : 'border-blue-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <Clock className={`h-5 w-5 mr-3 ${isUrgent ? 'text-orange-400' : 'text-blue-400'}`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${isUrgent ? 'text-orange-800' : 'text-blue-800'}`}>
                  Compte Démo - Temps restant : {formatTimeRemaining(timeRemaining)}
                </p>
                <p className={`text-sm ${isUrgent ? 'text-orange-700' : 'text-blue-700'}`}>
                  {isUrgent
                    ? "⚠️ Votre compte expire bientôt. Sauvegardez vos données importantes."
                    : "Toutes les données sont fictives et seront supprimées automatiquement à l'expiration."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Démo
              </div>
              <button
                onClick={() => setShowConversionModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Convertir en client</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="h-16"></div>

      {showConversionModal && (
        <DemoToClientConversion />
      )}
    </>
  );
};

export default DemoBanner;
