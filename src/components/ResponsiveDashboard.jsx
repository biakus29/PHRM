// src/components/ResponsiveDashboard.jsx
// Composant Dashboard principal responsive
// Unifie l'expérience mobile, tablette et desktop

import React, { useState } from "react";
import { useIsMobile, useIsTablet, useIsDesktop } from "../hooks/useMediaQuery";
import ResponsiveLayout from "./ResponsiveLayout";
import MobileCard from "./MobileCard";
import Card from "./Card";
import {
  Users,
  Calendar,
  Clock,
  CreditCard,
  TrendingUp,
  DollarSign,
  UserCheck,
  AlertCircle,
} from "lucide-react";

const ResponsiveDashboard = ({
  stats = {},
  children,
  activeTab,
  setActiveTab,
  companyData,
  logoData,
  userEmail,
  notificationCount,
  onSignOut,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Stats cards configuration
  const statsCards = [
    {
      id: "employees",
      title: "Total Employés",
      value: stats.totalEmployees || "0",
      icon: Users,
      color: "blue",
      subtitle: "Employés actifs",
      onClick: () => setActiveTab("employees"),
    },
    {
      id: "payroll",
      title: "Masse Salariale",
      value: `${(stats.totalPayroll || 0).toLocaleString('fr-FR')} FCFA`,
      icon: DollarSign,
      color: "green",
      subtitle: "Ce mois",
      onClick: () => setActiveTab("payslips"),
    },
    {
      id: "leaves",
      title: "Congés en cours",
      value: stats.activeLeaves || "0",
      icon: Calendar,
      color: "orange",
      subtitle: "Demandes actives",
      onClick: () => setActiveTab("leaves"),
    },
    {
      id: "attendance",
      title: "Présences",
      value: `${stats.attendanceRate || "0"}%`,
      icon: UserCheck,
      color: "purple",
      subtitle: "Taux aujourd'hui",
      onClick: () => setActiveTab("absences"),
    },
  ];

  // Grille responsive pour les cards
  const getGridClass = () => {
    if (isMobile) return "grid-cols-1";
    if (isTablet) return "grid-cols-2";
    return "grid-cols-2 lg:grid-cols-4";
  };

  return (
    <ResponsiveLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      companyData={companyData}
      logoData={logoData}
      userEmail={userEmail}
      notificationCount={notificationCount}
      onSignOut={onSignOut}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Section des statistiques */}
        <div className={`grid ${getGridClass()} gap-3 sm:gap-4 lg:gap-6`}>
          {statsCards.map((card) => {
            if (isMobile || isTablet) {
              return (
                <MobileCard
                  key={card.id}
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  color={card.color}
                  subtitle={card.subtitle}
                  onClick={card.onClick}
                />
              );
            }
            
            // Desktop version
            return (
              <Card
                key={card.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={card.onClick}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {card.value}
                    </p>
                    <p className="text-xs text-gray-500">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                    <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Contenu principal selon l'onglet actif */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

// Composant pour une section du dashboard
export const DashboardSection = ({ 
  title, 
  subtitle, 
  actions, 
  children,
  className = "" 
}) => {
  const isMobile = useIsMobile();
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* En-tête de section */}
      {(title || actions) && (
        <div className={`
          px-4 py-4 sm:px-6 border-b border-gray-200
          ${isMobile ? 'space-y-3' : 'flex items-center justify-between'}
        `}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className={`${isMobile ? 'flex flex-col gap-2' : 'flex gap-2'}`}>
              {actions}
            </div>
          )}
        </div>
      )}
      
      {/* Contenu de la section */}
      <div className="px-4 py-4 sm:px-6">
        {children}
      </div>
    </div>
  );
};

// Composant pour les widgets du dashboard
export const DashboardWidget = ({ 
  title, 
  value, 
  change, 
  trend = "up",
  icon: Icon,
  className = "" 
}) => {
  const isMobile = useIsMobile();
  const isPositive = trend === "up";
  
  return (
    <div className={`p-4 bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-2 flex items-center gap-1 ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${!isPositive ? 'rotate-180' : ''}`} />
              <span>{change}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
    </div>
  );
};

// Composant pour les alertes du dashboard
export const DashboardAlert = ({ 
  type = "info", 
  title, 
  message,
  onClose,
  className = "" 
}) => {
  const types = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-400",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-400",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-800",
      icon: "text-yellow-400",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-400",
    },
  };
  
  const style = types[type] || types.info;
  
  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className={`w-5 h-5 ${style.icon}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${style.text}`}>{title}</h3>
          )}
          {message && (
            <p className={`text-sm ${style.text} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 -mr-1 -mt-1 p-1.5 rounded-full hover:bg-white/50 ${style.text}`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Composant pour les tabs responsives
export const DashboardTabs = ({ tabs, activeTab, onChange }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    // Version mobile : dropdown
    return (
      <select
        value={activeTab}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>
            {tab.label}
          </option>
        ))}
      </select>
    );
  }
  
  // Version desktop : tabs
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ResponsiveDashboard;
