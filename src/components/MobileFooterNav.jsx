// src/components/MobileFooterNav.jsx
// Navigation footer pour mobile/tablette style Android

import React, { useState } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  Clock,
  CreditCard,
  Download,
  Bell,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";

const MobileFooterNav = ({ activeTab, setActiveTab, notificationCount = 0 }) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  // Sections principales (identiques à la sidebar desktop)
  const mainItems = [
    { id: "overview", label: "Tableau de bord", icon: BarChart3 },
    { id: "employees", label: "Employés", icon: Users },
    { id: "leaves", label: "Congés", icon: Calendar },
    { id: "absences", label: "Absences", icon: Clock },
    { id: "payslips", label: "Paie", icon: CreditCard },
    { id: "reports", label: "Déclarations", icon: Download },
  ];
  
  // Outils (regroupés dans le menu "Outils")
  const toolsItems = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "badges", label: "Badges", icon: Users },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];
  
  // Footer avec 5 items principaux + menu Outils
  const footerItems = [
    { id: "overview", label: "Accueil", icon: BarChart3 },
    { id: "employees", label: "Employés", icon: Users },
    { id: "payslips", label: "Paie", icon: CreditCard },
    { id: "reports", label: "Déclarations", icon: Download },
    { id: "tools", label: "Outils", icon: MoreHorizontal, isMenu: true },
  ];
  
  const handleToolsClick = () => {
    setShowToolsMenu(!showToolsMenu);
  };
  
  const handleToolItemClick = (itemId) => {
    setActiveTab(itemId);
    setShowToolsMenu(false);
  };
  
  const isToolsActive = toolsItems.some(item => item.id === activeTab);

  return (
    <>
      {/* Menu Outils (popup) */}
      {showToolsMenu && (
        <div className="md:hidden fixed inset-0 bg-gray-900/50 z-50 flex items-end" onClick={() => setShowToolsMenu(false)}>
          <div className="bg-white w-full rounded-t-2xl shadow-xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Outils</h3>
              <button onClick={() => setShowToolsMenu(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-2">
              {toolsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToolItemClick(item.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.id === "notifications" && notificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {notificationCount > 9 ? "9+" : notificationCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* Footer Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMenu ? isToolsActive : activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => item.isMenu ? handleToolsClick() : setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-600 active:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
                  {item.id === "tools" && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? "font-semibold" : "font-normal"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileFooterNav;
