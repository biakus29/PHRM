// src/components/MobileFooterNav.jsx
// Navigation footer pour mobile/tablette style Android

import React, { useState, Fragment } from "react";
import "../styles/sidebar.css";
import {
  FiHome,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiClock,
  FiBell,
  FiMoreHorizontal,
  FiX,
  FiLogOut,
  FiSettings,
  FiBarChart,
  FiFile,
} from "react-icons/fi";

const MobileFooterNav = ({ activeTab, setActiveTab, notificationCount = 0, handleLogout }) => {
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  // Sections principales (identiques à la sidebar desktop)
  const mainItems = [
    { id: "overview", label: "Accueil", icon: FiHome },
    { id: "employees", label: "Employés", icon: FiUsers },
    { id: "leaves", label: "Congés", icon: FiCalendar },
    { id: "absences", label: "Absences", icon: FiClock },
    { id: "payslips", label: "Fiches de Paie", icon: FiFileText },
    { id: "documents", label: "Documents", icon: FiFileText },
  ];
  
  // Outils (regroupés dans le menu "Outils")
  const toolsItems = [
    { id: "leaves", label: "Congés", icon: FiCalendar },
    { id: "absences", label: "Absences", icon: FiClock },
    { id: "documents", label: "Documents", icon: FiFileText },
    { id: "hr-procedures", label: "Procédures RH", icon: FiFileText },
    { id: "reports", label: "Rapports", icon: FiBarChart },
    { id: "notifications", label: "Notifications", icon: FiBell },
    { id: "settings", label: "Paramètres", icon: FiSettings },
    { id: "logout", label: "Déconnexion", icon: FiLogOut, isLogout: true },
  ];
  
  // Footer avec 4 items principaux + déconnexion directe
  const footerItems = [
    { id: "overview", label: "Accueil", icon: FiHome },
    { id: "employees", label: "Employés", icon: FiUsers },
    { id: "payslips", label: "Paie", icon: FiFileText },
    { id: "tools", label: "Plus", icon: FiMoreHorizontal, isMenu: true },
    { id: "logout", label: "Sortir", icon: FiLogOut, isLogout: true },
  ];
  
  const handleToolsClick = () => {
    setShowToolsMenu(!showToolsMenu);
  };
  
  const handleToolItemClick = (itemId) => {
    if (itemId === 'logout') {
      setShowToolsMenu(false);
      if (handleLogout) {
        handleLogout();
      }
    } else {
      setActiveTab(itemId);
      setShowToolsMenu(false);
    }
  };
  
  const isToolsActive = toolsItems.some(item => item.id === activeTab);

  return (
    <>
      {/* Menu Outils (popup) */}
      {showToolsMenu && (
        <div className="lg:hidden fixed inset-0 bg-gray-900/50 z-50 flex items-end" onClick={() => setShowToolsMenu(false)}>
          <div className="bg-gradient-to-b from-white to-blue-50 w-full rounded-t-2xl shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-blue-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <h3 className="text-lg font-bold text-white">📱 Menu Principal</h3>
              <button onClick={() => setShowToolsMenu(false)} className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-4 space-y-2 hide-scrollbar overflow-y-auto max-h-96">
              {toolsItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                // Séparateur avant la déconnexion
                if (item.isLogout && index > 0) {
                  return (
                    <Fragment key={item.id}>
                      <div className="border-t border-gray-200 my-3"></div>
                      <button
                        onClick={() => handleToolItemClick(item.id)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 hover:from-red-100 hover:to-red-200 hover:border-red-300"
                      >
                        <div className="p-2 rounded-lg bg-red-200">
                          <Icon className="w-5 h-5 text-red-700" />
                        </div>
                        <span className="font-bold flex-1 text-left text-red-700">🚪 {item.label}</span>
                        <div className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded-full font-medium">
                          Sortir
                        </div>
                      </button>
                    </Fragment>
                  );
                }
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToolItemClick(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 transform hover:scale-105 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? "bg-white bg-opacity-20" 
                        : "bg-blue-100"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-blue-600'
                      }`} />
                    </div>
                    <span className="font-medium flex-1 text-left">{item.label}</span>
                    {item.id === "notifications" && notificationCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        isActive 
                          ? "bg-white bg-opacity-20 text-white" 
                          : "bg-red-500 text-white"
                      }`}>
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white to-blue-50 border-t border-blue-200 shadow-2xl z-50">
        <div className="flex justify-around items-center h-20 px-2">
          {footerItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isMenu ? isToolsActive : activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isMenu) {
                    handleToolsClick();
                  } else if (item.isLogout) {
                    if (handleLogout) handleLogout();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 transform hover:scale-105 ${
                  item.isLogout
                    ? "text-red-600 hover:bg-red-50"
                    : isActive
                    ? "text-blue-600"
                    : "text-gray-600 active:bg-blue-100"
                }`}
              >
                <div className="relative mb-1">
                  <div className={`p-2 rounded-xl ${
                    item.isLogout
                      ? "bg-gradient-to-r from-red-500 to-red-600 shadow-lg"
                      : isActive 
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg" 
                      : "bg-blue-100 group-hover:bg-blue-200"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      item.isLogout 
                        ? "text-white"
                        : isActive 
                        ? "text-white" 
                        : "text-blue-600"
                    }`} />
                  </div>
                  {item.id === "tools" && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  item.isLogout
                    ? "text-red-600 font-bold"
                    : isActive 
                    ? "text-blue-600 font-bold" 
                    : "text-gray-600"
                }`}>
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
