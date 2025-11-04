import React from 'react';
import { FiX, FiStar, FiCheck, FiArrowRight } from 'react-icons/fi';

const DemoLimitModal = ({ isOpen, onClose, onUpgrade, actionType = 'document' }) => {
  if (!isOpen) return null;

  const getActionMessage = () => {
    switch (actionType) {
      case 'employee':
        return {
          title: 'Limite atteinte - Création d\'employé',
          message: 'Vous avez déjà créé un employé dans votre compte démo. Pour créer plus d\'employés et accéder à toutes les fonctionnalités, passez à la version complète.',
          icon: '👥'
        };
      case 'payslip':
        return {
          title: 'Limite atteinte - Fiche de paie',
          message: 'Vous avez déjà généré une fiche de paie dans votre compte démo. Pour générer plus de fiches de paie et accéder à toutes les fonctionnalités, passez à la version complète.',
          icon: '💰'
        };
      case 'document':
        return {
          title: 'Limite atteinte - Documents RH',
          message: 'Vous avez atteint la limite de votre compte démo. Pour créer plus de documents et accéder à toutes les fonctionnalités, passez à la version complète.',
          icon: '📄'
        };
      default:
        return {
          title: 'Limite du compte démo atteinte',
          message: 'Pour continuer à utiliser toutes les fonctionnalités, passez à la version complète.',
          icon: '⚡'
        };
    }
  };

  const { title, message, icon } = getActionMessage();

  const features = [
    'Employés illimités',
    'Documents RH illimités',
    'Fiches de paie illimitées',
    'Gestion des congés avancée',
    'Rapports et analyses',
    'Support prioritaire',
    'Sauvegardes automatiques',
    'Personnalisation complète'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <FiX className="h-5 w-5" />
          </button>
          
          <div className="text-center text-white">
            <div className="text-4xl mb-3">{icon}</div>
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-blue-100 text-lg">{message}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Demo Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Résumé de votre démo</h3>
                <p className="text-amber-700 text-sm">
                  Vous avez testé les fonctionnalités de base : création d'un employé et génération d'une fiche de paie. 
                  Découvrez maintenant toute la puissance de PRHM avec la version complète !
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiStar className="h-5 w-5 text-yellow-500 mr-2" />
              Fonctionnalités de la version complète
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <FiCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-green-800 text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
            <div className="text-center">
              <h4 className="font-semibold text-blue-800 mb-2">Offre spéciale de lancement</h4>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl font-bold text-blue-600">À partir de 15 000 FCFA</span>
                <span className="text-sm text-blue-600">/mois</span>
              </div>
              <p className="text-blue-700 text-sm">
                Plusieurs forfaits disponibles selon vos besoins
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
            >
              Continuer la démo
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg"
            >
              <FiStar className="h-5 w-5" />
              <span>Passer en Pro</span>
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLimitModal;
