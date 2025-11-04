// Page de démo publique accessible sans connexion
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Calendar, BarChart3, CreditCard, Rocket, ArrowRight, Check, Lock, Plus, Minus, Calculator, Edit2, Save } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { BONUSES, INDEMNITIES } from '../utils/payrollLabels';
import { computeCompletePayroll } from '../utils/payrollCalculations';
import 'react-toastify/dist/ReactToastify.css';

// Données démo prédéfinies
const DEMO_DATA = {
  company: {
    name: 'SUBSAHARA SERVICES inc',
    address: 'Douala, Cameroun',
    cnpsNumber: 'A123456789',
  },
  employees: [
    {
      id: 'demo_emp_1',
      name: 'Jean Dupont',
      matricule: 'EMP001',
      poste: 'Responsable RH',
      department: 'Ressources Humaines',
      baseSalary: 450000,
      cnpsNumber: '12345678',
      professionalCategory: 'Cadre',
      status: 'Actif',
      hireDate: '2023-01-15',
      payslips: [
        {
          id: 'ps_1',
          payPeriod: 'Novembre 2024',
          generatedAt: new Date().toISOString(),
          salaryDetails: {
            baseSalary: 450000,
            transportAllowance: 25000,
          },
          netPay: 407600
        }
      ]
    },
    {
      id: 'demo_emp_2',
      name: 'Marie Kouam',
      matricule: 'EMP002',
      poste: 'Comptable',
      department: 'Finance',
      baseSalary: 350000,
      cnpsNumber: '87654321',
      professionalCategory: 'Agent de maîtrise',
      status: 'Actif',
      hireDate: '2023-03-20',
      payslips: []
    },
    {
      id: 'demo_emp_3',
      name: 'Paul Nkomo',
      matricule: 'EMP003',
      poste: 'Assistant administratif',
      department: 'Administration',
      baseSalary: 250000,
      cnpsNumber: '45678912',
      professionalCategory: 'Employé',
      status: 'Actif',
      hireDate: '2023-06-10',
      payslips: []
    }
  ]
};

const PublicDemo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingPayslip, setEditingPayslip] = useState(false);
  const [payslipData, setPayslipData] = useState({
    baseSalary: 450000,
    transportAllowance: 25000,
    housingAllowance: 15000,
    primes: [],
    indemnites: []
  });

  // Calcul automatique des déductions et net
  const calculatePayroll = (data) => {
    const gross = data.baseSalary + data.transportAllowance + data.housingAllowance +
      data.primes.reduce((sum, p) => sum + p.amount, 0) +
      data.indemnites.reduce((sum, i) => sum + i.amount, 0);
    
    const pvid = Math.round(data.baseSalary * 0.042); // 4.2% CNPS
    const irpp = Math.round(gross * 0.11); // 11% IRPP (simplifié)
    const cac = 1000;
    const cfc = 2500;
    const totalDeductions = pvid + irpp + cac + cfc;
    const netPay = gross - totalDeductions;

    return { gross, pvid, irpp, cac, cfc, totalDeductions, netPay };
  };

  const addPrime = () => {
    setPayslipData(prev => ({
      ...prev,
      primes: [
        ...prev.primes,
        { label: (BONUSES?.[0]?.label || `Prime ${prev.primes.length + 1}`), amount: 10000 }
      ]
    }));
  };

  const addIndemnite = () => {
    setPayslipData(prev => ({
      ...prev,
      indemnites: [
        ...prev.indemnites,
        { label: (INDEMNITIES?.[0]?.label || 'Indemnité'), amount: 5000 }
      ]
    }));
  };

  const removePrime = (index) => {
    setPayslipData(prev => ({
      ...prev,
      primes: prev.primes.filter((_, i) => i !== index)
    }));
  };

  const removeIndemnite = (index) => {
    setPayslipData(prev => ({
      ...prev,
      indemnites: prev.indemnites.filter((_, i) => i !== index)
    }));
  };

  const updatePrime = (index, field, value) => {
    setPayslipData(prev => ({
      ...prev,
      primes: prev.primes.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const updateIndemnite = (index, field, value) => {
    setPayslipData(prev => ({
      ...prev,
      indemnites: prev.indemnites.map((ind, i) => i === index ? { ...ind, [field]: value } : ind)
    }));
  };

  const calculations = calculatePayroll(payslipData);

  // Calcul SBT/SBC via moteur officiel
  const payrollSnapshot = (() => {
    try {
      const indemnitesList = [
        { label: 'Indemnité de transport', amount: Number(payslipData.transportAllowance) || 0 },
        { label: 'Indemnité de logement', amount: Number(payslipData.housingAllowance) || 0 },
        ...(Array.isArray(payslipData.indemnites) ? payslipData.indemnites : [])
      ];
      return computeCompletePayroll({
        baseSalary: Number(payslipData.baseSalary) || 0,
        primes: Array.isArray(payslipData.primes) ? payslipData.primes : [],
        indemnites: indemnitesList
      });
    } catch (_) {
      return null;
    }
  })();

  const handleUpgrade = () => {
    navigate('/register-client');
  };

  const handleBlockedAction = (feature) => {
    toast.info(
      <div>
        <strong>Fonctionnalité Pro</strong>
        <p className="text-sm mt-1">
          Créez un compte officiel pour débloquer toutes les fonctionnalités
        </p>
      </div>,
      { autoClose: 4000 }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header avec CTA */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PHRM</h1>
                <p className="text-xs text-gray-500">Démo Interactive</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/client-admin-login')}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <span className="text-sm font-medium">Déjà client ?</span>
                <span className="text-sm text-blue-600">Se connecter</span>
              </button>
              <button
                onClick={handleUpgrade}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                <Rocket className="w-4 h-4" />
                <span>Créer mon compte</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bannière démo */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-bold mb-2">🎯 Découvrez PHRM en Action</h2>
              <p className="text-purple-100 text-lg">
                Explorez toutes les fonctionnalités • Aucune inscription requise • Données exemple
              </p>
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-4 text-sm">
                <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                  <Check className="w-4 h-4 mr-2" />
                  3 employés exemple
                </span>
                <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                  <Check className="w-4 h-4 mr-2" />
                  Calculs de paie réels
                </span>
                <span className="flex items-center bg-white/20 px-3 py-1 rounded-full">
                  <Check className="w-4 h-4 mr-2" />
                  Interface complète
                </span>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-purple-100">Gratuit</div>
              <div className="text-xs text-purple-200 mt-2">Sans engagement</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'employees', label: 'Employés', icon: Users },
              { id: 'payslips', label: 'Fiches de paie', icon: FileText },
              { id: 'leaves', label: 'Congés', icon: Calendar, locked: true },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.locked ? setActiveTab(tab.id) : handleBlockedAction(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                } ${tab.locked ? 'opacity-50' : ''}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
                {tab.locked && <Lock className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Carte Employés */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Actifs</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {DEMO_DATA.employees.length}
              </div>
              <p className="text-sm text-gray-600">Employés dans la démo</p>
              <button
                onClick={() => setActiveTab('employees')}
                className="mt-4 w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              >
                Voir les employés
              </button>
            </div>

            {/* Carte Fiches de paie */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Ce mois</span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1</div>
              <p className="text-sm text-gray-600">Fiche de paie exemple</p>
              <button
                onClick={() => setActiveTab('payslips')}
                className="mt-4 w-full bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                Voir les fiches
              </button>
            </div>

            {/* Carte Upgrade */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Rocket className="w-6 h-6" />
                </div>
                <span className="text-xs bg-yellow-400 text-purple-900 px-2 py-1 rounded-full font-bold">
                  PRO
                </span>
              </div>
              <div className="text-2xl font-bold mb-2">Passez en Pro</div>
              <p className="text-sm text-purple-100 mb-4">
                Employés illimités, paie automatique, rapports avancés...
              </p>
              <button
                onClick={handleUpgrade}
                className="w-full bg-white text-purple-600 py-2 rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Créer mon compte
              </button>
            </div>
          </div>
        )}

        {/* Liste des employés */}
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                👥 Employés de démonstration
              </h3>
              <p className="text-gray-700 text-sm">
                Explorez les profils des 3 employés exemple. En version Pro, ajoutez un nombre illimité d'employés.
              </p>
            </div>

            {DEMO_DATA.employees.map(employee => (
              <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {employee.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-600">{employee.poste}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {employee.department} • {employee.matricule}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {employee.baseSalary.toLocaleString()} FCFA
                    </div>
                    <div className="text-sm text-gray-600">{employee.professionalCategory}</div>
                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {employee.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calculateur de paie interactif */}
        {activeTab === 'payslips' && (
          <div className="space-y-6">
            {/* Bannière explicative */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    🧮 Calculateur de Paie Interactif
                  </h3>
                  <p className="text-gray-700 text-sm mb-3">
                    Modifiez les montants, ajoutez des primes et indemnités pour voir les calculs automatiques en temps réel !
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 border border-green-200">
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      Calculs CNPS automatiques
                    </span>
                    <span className="inline-flex items-center bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 border border-green-200">
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      IRPP calculé
                    </span>
                    <span className="inline-flex items-center bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-700 border border-green-200">
                      <Check className="w-3 h-3 mr-1 text-green-600" />
                      Primes & Indemnités
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formulaire de saisie */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                  Éléments de Rémunération
                </h3>

                {/* Salaire de base */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salaire de base (FCFA)
                  </label>
                  <input
                    type="number"
                    value={payslipData.baseSalary}
                    onChange={(e) => setPayslipData({...payslipData, baseSalary: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  />
                </div>

                {/* Transport */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indemnité de transport (FCFA)
                  </label>
                  <input
                    type="number"
                    value={payslipData.transportAllowance}
                    onChange={(e) => setPayslipData({...payslipData, transportAllowance: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Logement */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Indemnité de logement (FCFA)
                  </label>
                  <input
                    type="number"
                    value={payslipData.housingAllowance}
                    onChange={(e) => setPayslipData({...payslipData, housingAllowance: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Primes */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Primes
                    </label>
                    <button
                      onClick={addPrime}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                  {/* Suggestions basées sur BONUSES */}
                  <datalist id="bonuses-list">
                    {Array.isArray(BONUSES) && BONUSES.map((b) => (
                      <option key={b.key} value={b.label} />
                    ))}
                  </datalist>
                  {payslipData.primes.map((prime, index) => (
                    <div key={index} className="mb-3">
                      <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-7">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Intitulé de la prime
                          </label>
                          <input
                            type="text"
                            value={prime.label}
                            onChange={(e) => updatePrime(index, 'label', e.target.value)}
                            placeholder="Ex: Prime de performance"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            list="bonuses-list"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Montant (FCFA)
                          </label>
                          <input
                            type="number"
                            value={prime.amount}
                            onChange={(e) => updatePrime(index, 'amount', Number(e.target.value))}
                            placeholder="Montant"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removePrime(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg mt-5"
                            aria-label="Supprimer la prime"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indemnités */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Autres indemnités
                    </label>
                    <button
                      onClick={addIndemnite}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                  {/* Suggestions basées sur INDEMNITIES */}
                  <datalist id="indemnities-list">
                    {Array.isArray(INDEMNITIES) && INDEMNITIES.map((i) => (
                      <option key={i.key} value={i.label} />
                    ))}
                  </datalist>
                  {payslipData.indemnites.map((indemnite, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={indemnite.label}
                        onChange={(e) => updateIndemnite(index, 'label', e.target.value)}
                        placeholder="Nom de l'indemnité"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        list="indemnities-list"
                      />
                      <input
                        type="number"
                        value={indemnite.amount}
                        onChange={(e) => updateIndemnite(index, 'amount', Number(e.target.value))}
                        placeholder="Montant"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeIndemnite(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Résultats des calculs */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-blue-600" />
                  Calculs Automatiques
                </h3>

                {/* Salaire brut */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Salaire Brut Total</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {calculations.gross.toLocaleString()} FCFA
                  </div>
                </div>

                {/* Bases SBT / SBC */}
                {payrollSnapshot && (
                  <div className="bg-white rounded-lg p-4 mb-4 border border-indigo-200">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Bases CNPS & Fiscales</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">SBC (Salaire Brut Cotisable)</span>
                        <span className="font-semibold text-indigo-700">{(payrollSnapshot.sbc || 0).toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">SBT (Salaire Brut Taxable)</span>
                        <span className="font-semibold text-indigo-700">{(payrollSnapshot.sbt || 0).toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Détail des gains */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Détail des gains</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salaire de base</span>
                      <span className="font-semibold">{payslipData.baseSalary.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transport</span>
                      <span className="font-semibold">{payslipData.transportAllowance.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Logement</span>
                      <span className="font-semibold">{payslipData.housingAllowance.toLocaleString()} FCFA</span>
                    </div>
                    {payslipData.primes.map((prime, index) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span>{prime.label}</span>
                        <span className="font-semibold">+{prime.amount.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                    {payslipData.indemnites.map((ind, index) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span>{ind.label}</span>
                        <span className="font-semibold">+{ind.amount.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Déductions */}
                <div className="bg-white rounded-lg p-4 mb-4 border border-red-200">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Déductions</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">CNPS (4.2%)</span>
                      <span className="font-semibold text-red-600">-{calculations.pvid.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">IRPP (11%)</span>
                      <span className="font-semibold text-red-600">-{calculations.irpp.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CAC</span>
                      <span className="font-semibold text-red-600">-{calculations.cac.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">CFC</span>
                      <span className="font-semibold text-red-600">-{calculations.cfc.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold">
                      <span className="text-gray-700">Total déductions</span>
                      <span className="text-red-600">-{calculations.totalDeductions.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                {/* Salaire net */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-4 text-white">
                  <div className="text-sm mb-1">💰 Salaire Net à Payer</div>
                  <div className="text-4xl font-bold">
                    {calculations.netPay.toLocaleString()} FCFA
                  </div>
                </div>

                {/* CTA Export */}
                <button
                  onClick={() => handleBlockedAction('pdf')}
                  className="mt-4 w-full bg-white text-gray-700 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Exporter en PDF (Version Pro)</span>
                </button>
              </div>
            </div>

            {/* Info supplémentaire */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-2">✨ En version Pro :</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Sauvegarde automatique des fiches de paie
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Export PDF professionnel avec logo entreprise
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Historique complet et recherche avancée
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Paie mensuelle automatique pour tous les employés
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Envoi automatique par email aux employés
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* CTA Final */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à gérer votre paie efficacement ?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Créez votre compte officiel et débloquez toutes les fonctionnalités
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={handleUpgrade}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
            >
              <Rocket className="w-5 h-5" />
              <span>Créer mon compte maintenant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/features')}
              className="bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-800 transition-all"
            >
              Voir toutes les fonctionnalités
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDemo;
