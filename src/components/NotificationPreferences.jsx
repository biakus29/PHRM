import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { EMAIL_TYPES } from '../config/emailConfig';
import { toast } from 'react-toastify';
import {
  Bell,
  Mail,
  Settings,
  Check,
  X,
  Save,
  RefreshCw,
  Shield,
  Clock,
  Users,
  FileText,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

const NotificationPreferences = ({ userId, onClose }) => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    enabledTypes: Object.values(EMAIL_TYPES),
    frequency: 'immediate', // immediate, hourly, daily
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Catégories de notifications
  const notificationCategories = {
    employees: {
      title: 'Gestion des Employés',
      icon: Users,
      color: 'blue',
      types: [
        EMAIL_TYPES.EMPLOYEE_ADDED,
        EMAIL_TYPES.EMPLOYEE_UPDATED,
        EMAIL_TYPES.EMPLOYEE_DELETED
      ]
    },
    leaves: {
      title: 'Congés et Absences',
      icon: Clock,
      color: 'green',
      types: [
        EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED,
        EMAIL_TYPES.LEAVE_REQUEST_APPROVED,
        EMAIL_TYPES.LEAVE_REQUEST_REJECTED,
        EMAIL_TYPES.ABSENCE_RECORDED
      ]
    },
    payroll: {
      title: 'Paie et Salaires',
      icon: CreditCard,
      color: 'purple',
      types: [
        EMAIL_TYPES.PAYSLIP_GENERATED,
        EMAIL_TYPES.PAYSLIP_SENT,
        EMAIL_TYPES.SALARY_UPDATED
      ]
    },
    contracts: {
      title: 'Contrats',
      icon: FileText,
      color: 'orange',
      types: [
        EMAIL_TYPES.CONTRACT_CREATED,
        EMAIL_TYPES.CONTRACT_UPDATED,
        EMAIL_TYPES.CONTRACT_EXPIRING
      ]
    },
    system: {
      title: 'Système et Sécurité',
      icon: Shield,
      color: 'red',
      types: [
        EMAIL_TYPES.ACCOUNT_CREATED,
        EMAIL_TYPES.ACCOUNT_ACTIVATED,
        EMAIL_TYPES.ACCOUNT_SUSPENDED,
        EMAIL_TYPES.PASSWORD_RESET,
        EMAIL_TYPES.SECURITY_ALERT
      ]
    },
    subscription: {
      title: 'Abonnement',
      icon: AlertTriangle,
      color: 'yellow',
      types: [
        EMAIL_TYPES.TRIAL_EXPIRING,
        EMAIL_TYPES.TRIAL_EXPIRED,
        EMAIL_TYPES.SUBSCRIPTION_ACTIVATED,
        EMAIL_TYPES.SUBSCRIPTION_EXPIRING,
        EMAIL_TYPES.PAYMENT_FAILED
      ]
    }
  };

  // Labels des types de notifications
  const typeLabels = {
    [EMAIL_TYPES.EMPLOYEE_ADDED]: 'Nouvel employé ajouté',
    [EMAIL_TYPES.EMPLOYEE_UPDATED]: 'Profil employé modifié',
    [EMAIL_TYPES.EMPLOYEE_DELETED]: 'Employé supprimé',
    
    [EMAIL_TYPES.LEAVE_REQUEST_SUBMITTED]: 'Demande de congé soumise',
    [EMAIL_TYPES.LEAVE_REQUEST_APPROVED]: 'Congé approuvé',
    [EMAIL_TYPES.LEAVE_REQUEST_REJECTED]: 'Congé refusé',
    [EMAIL_TYPES.ABSENCE_RECORDED]: 'Absence enregistrée',
    
    [EMAIL_TYPES.PAYSLIP_GENERATED]: 'Fiche de paie générée',
    [EMAIL_TYPES.PAYSLIP_SENT]: 'Fiche de paie envoyée',
    [EMAIL_TYPES.SALARY_UPDATED]: 'Salaire mis à jour',
    
    [EMAIL_TYPES.CONTRACT_CREATED]: 'Contrat créé',
    [EMAIL_TYPES.CONTRACT_UPDATED]: 'Contrat modifié',
    [EMAIL_TYPES.CONTRACT_EXPIRING]: 'Contrat expirant',
    
    [EMAIL_TYPES.ACCOUNT_CREATED]: 'Compte créé',
    [EMAIL_TYPES.ACCOUNT_ACTIVATED]: 'Compte activé',
    [EMAIL_TYPES.ACCOUNT_SUSPENDED]: 'Compte suspendu',
    [EMAIL_TYPES.PASSWORD_RESET]: 'Réinitialisation mot de passe',
    [EMAIL_TYPES.SECURITY_ALERT]: 'Alerte de sécurité',
    
    [EMAIL_TYPES.TRIAL_EXPIRING]: 'Essai expirant',
    [EMAIL_TYPES.TRIAL_EXPIRED]: 'Essai expiré',
    [EMAIL_TYPES.SUBSCRIPTION_ACTIVATED]: 'Abonnement activé',
    [EMAIL_TYPES.SUBSCRIPTION_EXPIRING]: 'Abonnement expirant',
    [EMAIL_TYPES.PAYMENT_FAILED]: 'Paiement échoué'
  };

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const currentUserId = userId || auth.currentUser?.uid;
      
      if (!currentUserId) {
        throw new Error('Utilisateur non authentifié');
      }

      const prefsQuery = query(
        collection(db, 'notification_preferences'),
        where('userId', '==', currentUserId)
      );
      
      const snapshot = await getDocs(prefsQuery);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setPreferences(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des préférences:', error);
      toast.error('Erreur lors du chargement des préférences');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const currentUserId = userId || auth.currentUser?.uid;
      
      if (!currentUserId) {
        throw new Error('Utilisateur non authentifié');
      }

      const prefsData = {
        ...preferences,
        userId: currentUserId,
        updatedAt: new Date()
      };

      // Vérifier si les préférences existent déjà
      const prefsQuery = query(
        collection(db, 'notification_preferences'),
        where('userId', '==', currentUserId)
      );
      
      const snapshot = await getDocs(prefsQuery);
      
      if (snapshot.empty) {
        // Créer nouvelles préférences
        await setDoc(doc(collection(db, 'notification_preferences')), {
          ...prefsData,
          createdAt: new Date()
        });
      } else {
        // Mettre à jour les préférences existantes
        const docRef = doc(db, 'notification_preferences', snapshot.docs[0].id);
        await updateDoc(docRef, prefsData);
      }

      toast.success('✅ Préférences sauvegardées avec succès');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationType = (type) => {
    setPreferences(prev => ({
      ...prev,
      enabledTypes: prev.enabledTypes.includes(type)
        ? prev.enabledTypes.filter(t => t !== type)
        : [...prev.enabledTypes, type]
    }));
  };

  const toggleCategoryTypes = (categoryTypes, enable) => {
    setPreferences(prev => ({
      ...prev,
      enabledTypes: enable
        ? [...new Set([...prev.enabledTypes, ...categoryTypes])]
        : prev.enabledTypes.filter(type => !categoryTypes.includes(type))
    }));
  };

  const isCategoryEnabled = (categoryTypes) => {
    return categoryTypes.every(type => preferences.enabledTypes.includes(type));
  };

  const isCategoryPartiallyEnabled = (categoryTypes) => {
    return categoryTypes.some(type => preferences.enabledTypes.includes(type)) &&
           !categoryTypes.every(type => preferences.enabledTypes.includes(type));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Chargement des préférences...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Préférences de Notifications</h2>
            <p className="text-gray-600">Personnalisez vos notifications email et push</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Paramètres généraux */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-blue-600" />
          Paramètres Généraux
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications Email */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Notifications Email</p>
                <p className="text-sm text-gray-500">Recevoir les notifications par email</p>
              </div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Fréquence */}
          <div className="p-4 bg-white rounded-lg border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fréquence des notifications
            </label>
            <select
              value={preferences.frequency}
              onChange={(e) => setPreferences(prev => ({ ...prev, frequency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immédiate</option>
              <option value="hourly">Toutes les heures</option>
              <option value="daily">Quotidienne</option>
            </select>
          </div>
        </div>

        {/* Heures silencieuses */}
        <div className="mt-6 p-4 bg-white rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Heures Silencieuses</p>
                <p className="text-sm text-gray-500">Pas de notifications pendant ces heures</p>
              </div>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ 
                ...prev, 
                quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
              }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.quietHours.enabled ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {preferences.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Début</label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Types de notifications par catégorie */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Types de Notifications</h3>
        
        <div className="space-y-6">
          {Object.entries(notificationCategories).map(([key, category]) => {
            const Icon = category.icon;
            const isEnabled = isCategoryEnabled(category.types);
            const isPartial = isCategoryPartiallyEnabled(category.types);
            
            return (
              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* En-tête de catégorie */}
                <div className={`p-4 bg-${category.color}-50 border-b border-gray-200`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 text-${category.color}-600`} />
                      <h4 className="font-medium text-gray-900">{category.title}</h4>
                      <span className="text-sm text-gray-500">
                        ({category.types.filter(type => preferences.enabledTypes.includes(type)).length}/{category.types.length})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleCategoryTypes(category.types, false)}
                        className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                      >
                        Tout désactiver
                      </button>
                      <button
                        onClick={() => toggleCategoryTypes(category.types, true)}
                        className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                      >
                        Tout activer
                      </button>
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        isEnabled 
                          ? `bg-${category.color}-600 border-${category.color}-600` 
                          : isPartial
                          ? `bg-gray-300 border-gray-300`
                          : 'border-gray-300'
                      }`}>
                        {isEnabled && <Check className="w-4 h-4 text-white" />}
                        {isPartial && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Types de notifications */}
                <div className="p-4 space-y-3">
                  {category.types.map(type => (
                    <div key={type} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div>
                        <p className="font-medium text-gray-900">{typeLabels[type]}</p>
                        <p className="text-sm text-gray-500">Code: {type}</p>
                      </div>
                      <button
                        onClick={() => toggleNotificationType(type)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.enabledTypes.includes(type) 
                            ? `bg-${category.color}-600` 
                            : 'bg-gray-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.enabledTypes.includes(type) ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          {preferences.enabledTypes.length} type(s) de notification(s) activé(s)
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadPreferences}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Réinitialiser</span>
          </button>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-pulse' : ''}`} />
            <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
