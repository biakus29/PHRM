import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useDemo } from '../contexts/DemoContext';
import { CheckCircle, ArrowRight, Building, Users, FileText, X } from 'lucide-react';
import { demoConversionService } from '../services/demoConversionService';

const DemoToClientConversion = () => {
  const { demoData, isDemoAccount } = useDemo();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [conversionData, setConversionData] = useState({
    companyName: demoData?.companyName || '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: demoData?.originalEmail || '',
    taxId: '',
    cnpsNumber: '',
    sector: '',
    employeeCount: '',
    planType: 'starter' // starter, professional, enterprise
  });

  const handleInputChange = (field, value) => {
    setConversionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep1 = () => {
    const requiredFields = ['companyName', 'companyAddress', 'companyPhone', 'companyEmail'];
    const missingFields = requiredFields.filter(field => !conversionData[field]?.trim());

    if (missingFields.length > 0) {
      alert(`Les champs suivants sont requis: ${missingFields.join(', ')}`);
      return false;
    }

    if (!conversionData.companyEmail.includes('@')) {
      alert('L\'email de l\'entreprise doit être valide');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const validation = demoConversionService.validateConversionData(conversionData);

    if (!validation.isValid) {
      alert('Erreurs de validation:\n' + validation.errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConversion = async () => {
    if (!auth.currentUser) {
      return;
    }

    setLoading(true);
    try {
      // Utiliser le service de conversion
      const clientId = await demoConversionService.convertDemoToClient(
        demoData,
        conversionData,
        auth.currentUser.uid
      );

      // Convertir les employés temporaires en employés permanents
      const employeesQuery = query(
        collection(db, 'clients', demoData.id, 'employees'),
        where('isTemporary', '==', true)
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      
      // Mise à jour en batch pour de meilleures performances
      const batch = writeBatch(db);
      
      employeesSnapshot.forEach((employeeDoc) => {
        const employeeRef = doc(db, 'clients', clientId, 'employees', employeeDoc.id);
        // Supprimer les flags temporaires et mettre à jour avec le nouveau client ID
        const employeeData = {
          ...employeeDoc.data(),
          isTemporary: false,
          demoExpiry: null,
          updatedAt: new Date().toISOString()
        };
        batch.set(employeeRef, employeeData);
      });
      
      await batch.commit();

      // Supprimer l'ancien compte démo
      const demoQuery = query(
        collection(db, 'clients'),
        where('adminUid', '==', auth.currentUser.uid),
        where('isDemo', '==', true)
      );
      const demoSnapshot = await getDocs(demoQuery);
      if (!demoSnapshot.empty) {
        await deleteDoc(doc(db, 'demo_accounts', demoSnapshot.docs[0].id));
        console.log('Compte démo supprimé');
      }

      // Mettre à jour le profil utilisateur
      await updateProfile(auth.currentUser, {
        displayName: `${demoData?.firstName} ${demoData?.lastName} (${conversionData.companyName})`
      });

      // Envoyer notification de conversion
      await demoConversionService.sendConversionNotification(clientId, conversionData);

      alert('Félicitations ! Votre compte a été converti avec succès. Vous allez être redirigé vers votre tableau de bord.');
      navigate('/client-admin-dashboard');

    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
  }
};

  if (!isDemoAccount || !showModal) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Convertir en Compte Client
                </h3>
                <p className="text-sm text-gray-600">
                  Transformez votre compte démo en compte client réel
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Étape {step} sur 3</div>
                <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Step 1: Informations de base */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <Building className="w-5 h-5 text-blue-600" />
                <h4 className="text-md font-medium text-gray-900">
                  Informations de l'entreprise
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={conversionData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Société ABC SARL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={conversionData.companyAddress}
                    onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adresse complète de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={conversionData.companyPhone}
                    onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email professionnel *
                  </label>
                  <input
                    type="email"
                    value={conversionData.companyEmail}
                    onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@entreprise.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Informations légales */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="text-md font-medium text-gray-900">
                  Informations légales et sectorielles
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Identifiant Fiscal *
                  </label>
                  <input
                    type="text"
                    value={conversionData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: M0123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro CNPS Entreprise *
                  </label>
                  <input
                    type="text"
                    value={conversionData.cnpsNumber}
                    onChange={(e) => handleInputChange('cnpsNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Numéro CNPS de l'entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secteur d'activité *
                  </label>
                  <select
                    value={conversionData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un secteur</option>
                    <option value="Technologie">Technologie</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Industrie">Industrie</option>
                    <option value="Services">Services</option>
                    <option value="Construction">Construction</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Santé">Santé</option>
                    <option value="Éducation">Éducation</option>
                    <option value="Transport">Transport</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre d'employés *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={conversionData.employeeCount}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan souhaité
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'starter', name: 'Starter', price: '25,000 FCFA/mois', features: 'Jusqu\'à 50 employés' },
                    { id: 'professional', name: 'Professional', price: '50,000 FCFA/mois', features: 'Jusqu\'à 200 employés' },
                    { id: 'enterprise', name: 'Enterprise', price: 'Sur mesure', features: 'Plus de 200 employés' }
                  ].map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => handleInputChange('planType', plan.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        conversionData.planType === plan.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{plan.name}</h5>
                        {conversionData.planType === plan.id && (
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{plan.price}</p>
                      <p className="text-xs text-gray-500">{plan.features}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="text-md font-medium text-gray-900">
                  Confirmation de conversion
                </h4>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4">Récapitulatif de votre conversion :</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Entreprise :</strong> {conversionData.companyName}
                  </div>
                  <div>
                    <strong>Adresse :</strong> {conversionData.companyAddress}
                  </div>
                  <div>
                    <strong>Email :</strong> {conversionData.companyEmail}
                  </div>
                  <div>
                    <strong>Téléphone :</strong> {conversionData.companyPhone}
                  </div>
                  <div>
                    <strong>Secteur :</strong> {conversionData.sector}
                  </div>
                  <div>
                    <strong>Employés :</strong> {conversionData.employeeCount}
                  </div>
                  <div>
                    <strong>Plan :</strong> {conversionData.planType === 'starter' ? 'Starter' : conversionData.planType === 'professional' ? 'Professional' : 'Enterprise'}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h6 className="font-medium text-blue-900 mb-2">Que se passe-t-il après la conversion ?</h6>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Votre compte démo sera supprimé</li>
                  <li>• Un vrai compte client sera créé</li>
                  <li>• Vous recevrez un email de confirmation</li>
                  <li>• L'équipe PHRM vous contactera pour finaliser la configuration</li>
                  <li>• Vos données fictives seront remplacées par une base vide</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>

            <div className="flex space-x-3">
              {step < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleConversion}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Conversion en cours...
                    </div>
                  ) : (
                    'Confirmer la conversion'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoToClientConversion;
