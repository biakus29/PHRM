import React from 'react';
import { Users, TrendingUp, Clock, Headphones } from 'lucide-react';
import { useRealTimeStats } from '../hooks/useRealTimeStats';

const RealTimeStats = ({ employees = [], leaveRequests = [], companyData = null }) => {
  const stats = useRealTimeStats(employees, leaveRequests, companyData);

  const statsConfig = [
    {
      key: 'companies',
      label: 'Entreprises',
      value: stats.formattedStats.companies,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `${stats.clientCompanies} entreprises clientes`
    },
    {
      key: 'employees',
      label: 'Employés gérés',
      value: stats.formattedStats.employees,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: `${stats.activeEmployees} actifs sur ${stats.totalEmployees}`
    },
    {
      key: 'uptime',
      label: 'Disponibilité',
      value: stats.formattedStats.uptime,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Temps de fonctionnement'
    },
    {
      key: 'support',
      label: 'Support',
      value: stats.formattedStats.support,
      icon: Headphones,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Support client disponible'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre de section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Statistiques en Temps Réel
          </h2>
          <p className="text-xl text-gray-600">
            Données actualisées automatiquement depuis votre tableau de bord
          </p>
        </div>

        {/* Grille des statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {statsConfig.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.key}
                className="text-center group hover:scale-110 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`${stat.bgColor} rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center group-hover:shadow-lg transition-all duration-300`}>
                  <div className="flex flex-col items-center">
                    <IconComponent className={`w-6 h-6 ${stat.color} mb-1`} />
                    <p className={`text-2xl md:text-3xl font-bold ${stat.color} animate-count-up`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 font-medium group-hover:text-gray-800 transition-colors duration-300">
                  {stat.label}
                </p>
                <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Statistiques détaillées (optionnel) */}
        {stats.totalEmployees > 0 && (
          <div className="mt-12 bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Détails des Statistiques RH
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.contractCompletionRate}%</div>
                <div className="text-sm text-gray-600">Contrats générés</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.payslipCompletionRate}%</div>
                <div className="text-sm text-gray-600">Fiches de paie</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</div>
                <div className="text-sm text-gray-600">Départements</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingLeaveRequests}</div>
                <div className="text-sm text-gray-600">Congés en attente</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RealTimeStats;
