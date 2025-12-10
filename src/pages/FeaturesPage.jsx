// Page de comparaison des fonctionnalités Démo vs Pro
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Rocket, ArrowLeft, Zap, Shield, Users, FileText, TrendingUp, Headphones } from 'lucide-react';

const FeaturesPage = () => {
  const navigate = useNavigate();

  const features = [
    { name: 'Nombre d\'employés', demo: '3 maximum', pro: 'Illimité', icon: Users },
    { name: 'Fiches de paie', demo: '2 par employé', pro: 'Illimitées', icon: FileText },
    { name: 'Calculs CNPS automatiques', demo: true, pro: true, icon: Zap },
    { name: 'Export PDF simple', demo: true, pro: true, icon: FileText },
    { name: 'Templates PDF personnalisés', demo: false, pro: true, icon: FileText },
    { name: 'Import CSV/Excel', demo: false, pro: true, icon: TrendingUp },
    { name: 'Paie mensuelle automatique', demo: false, pro: true, icon: Zap },
    { name: 'Génération de contrats', demo: false, pro: true, icon: FileText },
    { name: 'Gestion des congés', demo: false, pro: true, icon: Users },
    { name: 'Rapports et analyse des données', demo: false, pro: true, icon: TrendingUp },
    { name: 'Historique illimité', demo: false, pro: true, icon: TrendingUp },
    { name: 'Support prioritaire', demo: false, pro: true, icon: Headphones },
    { name: 'Sécurité renforcée', demo: false, pro: true, icon: Shield },
    { name: 'Mises à jour automatiques', demo: true, pro: true, icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Comparez les Versions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez toute la puissance de PHRM Pro et choisissez la formule qui vous convient
          </p>
        </div>

        {/* Cartes de comparaison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Version Démo */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Version Démo</h2>
              <p className="text-gray-600 mb-4">Découvrez PHRM gratuitement</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">0 FCFA</div>
              <p className="text-sm text-gray-500">Accès immédiat • Sans inscription</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span>3 employés exemple</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span>2 fiches de paie par employé</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Calculs CNPS de base</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <span>Export PDF simple</span>
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Import CSV</span>
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Paie en masse</span>
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Rapports avancés</span>
              </li>
              <li className="flex items-center text-gray-400">
                <X className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <span>Support prioritaire</span>
              </li>
            </ul>

            <button
              onClick={() => navigate('/demo')}
              className="w-full bg-gray-100 text-gray-700 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Essayer la démo
            </button>
          </div>

          {/* Version Pro */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-2xl p-8 border-2 border-blue-400 relative transform lg:scale-105">
            <div className="absolute -top-4 -right-4 bg-yellow-400 text-blue-900 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              RECOMMANDÉ
            </div>
            
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Version Pro</h2>
              <p className="text-blue-100 mb-4">Toutes les fonctionnalités</p>
              <div className="text-4xl font-bold mb-2">À partir de</div>
              <div className="text-5xl font-bold mb-2">25,000 FCFA</div>
              <p className="text-sm text-blue-100">par mois • Essai gratuit 14 jours</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Employés illimités</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Fiches de paie illimitées</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Calculs automatiques avancés</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Import CSV & Excel</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Paie mensuelle automatique</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Génération de contrats</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Rapports et analyse des données</span>
              </li>
              <li className="flex items-center">
                <Check className="w-5 h-5 text-green-300 mr-3 flex-shrink-0" />
                <span className="font-medium">Support prioritaire</span>
              </li>
            </ul>
            
            <button
              onClick={() => navigate('/register-client')}
              className="w-full bg-white text-blue-600 py-4 rounded-lg font-bold hover:shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <Rocket className="w-5 h-5" />
              <span>Commencer l'essai gratuit</span>
            </button>
          </div>
        </div>

        {/* Tableau détaillé */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h2 className="text-2xl font-bold text-center">Comparaison détaillée des fonctionnalités</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fonctionnalité</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Démo</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {features.map((feature, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <feature.icon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{feature.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.demo === 'boolean' ? (
                        feature.demo ? (
                          <Check className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-600">{feature.demo}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <Check className="w-6 h-6 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-red-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm font-semibold text-blue-600">{feature.pro}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Final */}
        <div className="mt-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Prêt à commencer ?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Essayez PHRM Pro gratuitement pendant 14 jours
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/register-client')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <Rocket className="w-5 h-5" />
              <span>Commencer l'essai gratuit</span>
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-lg font-bold text-lg hover:border-gray-400 transition-all"
            >
              Essayer la démo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesPage;
