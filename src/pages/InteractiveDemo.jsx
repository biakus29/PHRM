import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Users, CheckCircle, TrendingUp } from 'lucide-react';

// Styles pour les animations
const styles = `
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.5); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes progressFill {
    from { width: 0%; }
    to { width: 100%; }
  }

  .animate-count-up {
    animation: countUp 1s ease-out forwards;
  }

  .animate-progress-fill {
    animation: progressFill 2s ease-out forwards;
  }

  .pulse-dot {
    animation: pulse 2s infinite;
  }
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState('payroll');
  const [payrollProgress, setPayrollProgress] = useState(0);
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    fullTime: 0,
    partTime: 0
  });

  useEffect(() => {
    // Simulate payroll processing
    if (activeTab === 'payroll') {
      const interval = setInterval(() => {
        setPayrollProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    // Simulate employee stats counting
    if (activeTab === 'employees') {
      const targetStats = { total: 1247, fullTime: 850, partTime: 397 };
      const interval = setInterval(() => {
        setEmployeeStats(prev => {
          const newStats = { ...prev };
          if (newStats.total < targetStats.total) newStats.total += 10;
          if (newStats.fullTime < targetStats.fullTime) newStats.fullTime += 7;
          if (newStats.partTime < targetStats.partTime) newStats.partTime += 3;
          return newStats;
        });
      }, 50);
      setTimeout(() => clearInterval(interval), 3000);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Démonstration Interactive PHRM
            </h1>
            <p className="text-gray-600">
              Explorez les fonctionnalités PHRM avec des données d'exemple
            </p>
            <div className="mt-6">
              <a
                href="https://phrmapp.com/demo-signup"
                className="inline-flex items-center px-5 py-3 rounded-md bg-blue-600 text-white font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Commencer l'essai gratuit 24h
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-1">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'payroll'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Module de Paie
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 rounded-md font-medium transition-colors ${
                activeTab === 'employees'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Gestion Employés
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {activeTab === 'payroll' && (
            <PayrollDemo progress={payrollProgress} />
          )}
          {activeTab === 'employees' && (
            <EmployeeDemo stats={employeeStats} />
          )}
        </div>
      </div>
    </div>
  );
}

function PayrollDemo({ progress }) {
  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Module de Paie</h2>
          <p className="text-gray-600">Traitement automatisé des bulletins de paie</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Calculs CNPS</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${progress >= 25 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-green-600 font-semibold">Actif</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full animate-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Barème IRPP automatique</span>
          </div>
          <div className="flex items-center space-x-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Cotisations CNPS calculées</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Fiches de paie générées</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-2">Conformité</h3>
          <div className="text-2xl font-bold text-green-600">98.5%</div>
          <p className="text-sm text-green-700">Calculs conformes CNPS</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Bulletins générés</h3>
          <div className="text-2xl font-bold text-blue-600">1,200</div>
          <p className="text-sm text-blue-700">Ce mois-ci</p>
        </div>
      </div>
    </div>
  );
}

function EmployeeDemo({ stats }) {
  return (
    <div>
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion Employés</h2>
          <p className="text-gray-600">Base de données complète des employés</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2 animate-count-up">{stats.total.toLocaleString()}</div>
          <div className="text-sm text-blue-700">Employés actifs</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2 animate-count-up">{stats.fullTime}</div>
          <div className="text-sm text-green-700">Temps plein</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2 animate-count-up">{stats.partTime}</div>
          <div className="text-sm text-purple-700">Temps partiel</div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Activité récente</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">47 nouveaux employés ajoutés</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">12 demandes de congés traitées</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-700">Mises à jour des données personnelles</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractiveDemo;
