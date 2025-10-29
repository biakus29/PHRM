import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  Crown, 
  Check, 
  X, 
  Clock, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  Headphones,
  CreditCard,
  ArrowLeft,
  Star
} from 'lucide-react';
import { toast } from 'react-toastify';

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '15,000',
      period: '/mois',
      description: 'Parfait pour les petites entreprises',
      maxEmployees: 10,
      features: [
        'Jusqu\'à 10 employés',
        'Gestion des fiches de paie',
        'Suivi des congés',
        'Rapports de base',
        'Support par email',
        'Stockage 1GB'
      ],
      notIncluded: [
        'Gestion des contrats avancée',
        'Rapports personnalisés',
        'Support prioritaire',
        'API Access'
      ],
      popular: false,
      color: 'blue'
    },
    {
      id: 'pro',
      name: 'Professionnel',
      price: '35,000',
      period: '/mois',
      description: 'Idéal pour les entreprises en croissance',
      maxEmployees: 50,
      features: [
        'Jusqu\'à 50 employés',
        'Toutes les fonctionnalités Starter',
        'Gestion des contrats avancée',
        'Rapports personnalisés',
        'Gestion des absences',
        'Documents RH automatisés',
        'Support prioritaire',
        'Stockage 10GB',
        'Intégrations tierces'
      ],
      notIncluded: [
        'Employés illimités',
        'Support dédié',
        'Formation personnalisée'
      ],
      popular: true,
      color: 'green'
    },
    {
      id: 'enterprise',
      name: 'Entreprise',
      price: '75,000',
      period: '/mois',
      description: 'Pour les grandes organisations',
      maxEmployees: 'Illimité',
      features: [
        'Employés illimités',
        'Toutes les fonctionnalités Pro',
        'Support dédié 24/7',
        'Formation personnalisée',
        'API complète',
        'Sauvegardes automatiques',
        'Conformité RGPD',
        'Stockage illimité',
        'Intégrations sur mesure',
        'Tableau de bord exécutif'
      ],
      notIncluded: [],
      popular: false,
      color: 'purple'
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
      toast.info('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const handleSubscribe = async (planId) => {
    setIsLoading(true);
    try {
      // Simuler un processus d'abonnement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Ici, vous intégreriez avec votre système de paiement (Stripe, PayPal, etc.)
      toast.success(`🎉 Abonnement ${plans.find(p => p.id === planId)?.name} activé !`);
      
      // Rediriger vers le tableau de bord
      navigate('/client-admin-dashboard');
    } catch (error) {
      console.error('Erreur d\'abonnement:', error);
      toast.error('Erreur lors de l\'abonnement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSales = () => {
    // Ouvrir un lien mailto ou rediriger vers une page de contact
    window.location.href = 'mailto:sales@phrm.com?subject=Demande d\'information - Abonnement Entreprise';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">PHRM - Abonnements</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bannière d'expiration */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3">
            <Clock className="w-6 h-6 animate-pulse" />
            <div className="text-center">
              <p className="font-semibold">⏰ Votre période d'essai de 30 jours a expiré</p>
              <p className="text-red-100 text-sm">Choisissez un abonnement pour continuer à utiliser PHRM</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête de la section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-full">
              <Crown className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan d'abonnement
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Continuez à gérer vos ressources humaines avec PHRM. 
            Choisissez le plan qui correspond le mieux à vos besoins.
          </p>
        </div>

        {/* Grille des plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-green-500 scale-105' 
                  : selectedPlan === plan.id
                  ? 'border-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Badge populaire */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>Plus populaire</span>
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* En-tête du plan */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-1">FCFA{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Jusqu'à {plan.maxEmployees} employé{plan.maxEmployees !== 'Illimité' && plan.maxEmployees > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Fonctionnalités incluses */}
                <div className="space-y-4 mb-8">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    Inclus dans ce plan
                  </h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fonctionnalités non incluses */}
                {plan.notIncluded.length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <X className="w-5 h-5 text-gray-400 mr-2" />
                      Non inclus
                    </h4>
                    <ul className="space-y-3">
                      {plan.notIncluded.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <X className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Bouton d'action */}
                <div className="space-y-3">
                  {plan.id === 'enterprise' ? (
                    <button
                      onClick={handleContactSales}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <Headphones className="w-5 h-5" />
                      <span>Contacter les ventes</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading}
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>{isLoading ? 'Traitement...' : 'Choisir ce plan'}</span>
                    </button>
                  )}
                  <p className="text-xs text-gray-500 text-center">
                    Annulation possible à tout moment
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section FAQ/Garanties */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pourquoi choisir PHRM ?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Sécurité garantie</h4>
              <p className="text-gray-600">Vos données sont protégées avec un chiffrement de niveau bancaire</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Headphones className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Support expert</h4>
              <p className="text-gray-600">Notre équipe vous accompagne dans votre transformation digitale</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">ROI prouvé</h4>
              <p className="text-gray-600">Économisez jusqu'à 40% de temps sur la gestion RH</p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Des questions ? Notre équipe est là pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <a 
              href="mailto:support@phrm.com" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <span>📧 support@phrm.com</span>
            </a>
            <a 
              href="tel:+237123456789" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <span>📞 +237 123 456 789</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
