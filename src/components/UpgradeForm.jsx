import React, { useState } from 'react';
import { FiX, FiCheck, FiStar, FiUsers, FiFileText, FiDollarSign, FiShield, FiArrowRight, FiMail, FiPhone, FiHome, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';

const UpgradeForm = ({ isOpen, onClose, onSubmit }) => {
  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    employeeCount: '',
    currentSoftware: '',
    specificNeeds: '',
    preferredStartDate: new Date().toISOString().split('T')[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '15 000',
      period: '/mois',
      description: 'Parfait pour les petites entreprises',
      maxEmployees: '1-10 employés',
      features: [
        'Gestion complète des employés',
        'Fiches de paie illimitées',
        'Documents RH (contrats, attestations)',
        'Gestion des congés',
        'Rapports de base',
        'Support email'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '25 000',
      period: '/mois',
      description: 'Idéal pour les entreprises en croissance',
      maxEmployees: '11-50 employés',
      features: [
        'Toutes les fonctionnalités Starter',
        'Gestion avancée des congés',
        'Rapports détaillés et analyses',
        'Personnalisation des documents',
        'Intégrations tierces',
        'Support prioritaire'
      ],
      color: 'indigo',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Sur devis',
      period: '',
      description: 'Pour les grandes organisations',
      maxEmployees: '50+ employés',
      features: [
        'Toutes les fonctionnalités Professional',
        'Multi-sites et départements',
        'API complète',
        'Formation personnalisée',
        'Gestionnaire de compte dédié',
        'Support 24/7'
      ],
      color: 'purple',
      popular: false
    }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation basique
      if (!formData.companyName || !formData.contactName || !formData.email || !formData.phone) {
        toast.error('Veuillez remplir tous les champs obligatoires');
        return;
      }

      const upgradeData = {
        ...formData,
        selectedPlan,
        planDetails: plans.find(p => p.id === selectedPlan),
        submittedAt: new Date().toISOString(),
        source: 'demo_upgrade'
      };

      // Appeler la fonction de soumission
      await onSubmit(upgradeData);
      
      toast.success('🎉 Demande d\'upgrade envoyée avec succès ! Notre équipe vous contactera sous 24h.');
      onClose();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <FiX className="h-5 w-5" />
          </button>
          
          <div className="text-center text-white">
            <div className="text-4xl mb-3">🚀</div>
            <h2 className="text-3xl font-bold mb-2">Passez à la version complète</h2>
            <p className="text-blue-100 text-lg">Choisissez le forfait qui correspond à vos besoins</p>
          </div>
        </div>

        <div className="p-6">
          {/* Plans de tarification */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Nos forfaits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id
                      ? `border-${plan.color}-500 bg-${plan.color}-50 shadow-lg`
                      : 'border-gray-200 hover:border-gray-300'
                  } ${plan.popular ? 'ring-2 ring-indigo-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                        <FiStar className="h-3 w-3" />
                        <span>Populaire</span>
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-800">{plan.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{plan.maxEmployees}</p>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <FiCheck className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-center">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPlan === plan.id
                        ? `bg-${plan.color}-500 border-${plan.color}-500`
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan === plan.id && (
                        <FiCheck className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulaire de contact */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMail className="h-5 w-5 mr-2 text-blue-600" />
              Informations de contact
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiHome className="inline h-4 w-4 mr-1" />
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Ma Société SARL"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline h-4 w-4 mr-1" />
                    Nom du contact *
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Jean Dupont"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline h-4 w-4 mr-1" />
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@masociete.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiPhone className="inline h-4 w-4 mr-1" />
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+237 6XX XX XX XX"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUsers className="inline h-4 w-4 mr-1" />
                    Nombre d'employés
                  </label>
                  <select
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="1-5">1-5 employés</option>
                    <option value="6-10">6-10 employés</option>
                    <option value="11-25">11-25 employés</option>
                    <option value="26-50">26-50 employés</option>
                    <option value="51-100">51-100 employés</option>
                    <option value="100+">Plus de 100 employés</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de démarrage souhaitée
                  </label>
                  <input
                    type="date"
                    name="preferredStartDate"
                    value={formData.preferredStartDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logiciel RH actuel (optionnel)
                </label>
                <input
                  type="text"
                  name="currentSoftware"
                  value={formData.currentSoftware}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Excel, autre logiciel RH..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Besoins spécifiques (optionnel)
                </label>
                <textarea
                  name="specificNeeds"
                  value={formData.specificNeeds}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Décrivez vos besoins particuliers, intégrations souhaitées, etc."
                />
              </div>

              {/* Résumé de la sélection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Forfait sélectionné :</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-blue-900">
                      {plans.find(p => p.id === selectedPlan)?.name}
                    </span>
                    <span className="text-blue-700 ml-2">
                      - {plans.find(p => p.id === selectedPlan)?.price} {plans.find(p => p.id === selectedPlan)?.period}
                    </span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {plans.find(p => p.id === selectedPlan)?.maxEmployees}
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <FiStar className="h-5 w-5" />
                      <span>Envoyer la demande</span>
                      <FiArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeForm;
