// src/components/ResponsiveLayout.jsx
// Layout principal responsive pour l'application
// Gère automatiquement l'adaptation mobile, tablette et desktop

import React, { useState, useEffect } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";
import MobileFooterNav from "./MobileFooterNav";

const ResponsiveLayout = ({
  children,
  activeTab,
  setActiveTab,
  companyData,
  logoData,
  userEmail,
  notificationCount = 0,
  onSignOut,
}) => {
  // États pour gérer la sidebar
  const [sidebarState, setSidebarState] = useState("fullyOpen");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Media queries
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  
  // Adapter la sidebar selon l'écran
  useEffect(() => {
    if (isMobile) {
      setSidebarState("hidden");
    } else if (isTablet) {
      setSidebarState("minimized");
    } else {
      setSidebarState("fullyOpen");
    }
  }, [isMobile, isTablet]);
  
  // Classes pour le conteneur principal selon le mode
  const getMainContainerClass = () => {
    let base = "min-h-screen bg-gray-50 transition-all duration-300 ";
    
    if (isMobile) {
      return base + "pb-20"; // Espace pour le footer mobile
    }
    
    if (sidebarState === "fullyOpen" && !isMobile) {
      return base + "lg:pl-64";
    } else if (sidebarState === "minimized" && !isMobile) {
      return base + "lg:pl-20";
    }
    
    return base;
  };
  
  // Classes pour le conteneur de contenu
  const getContentClass = () => {
    let base = "flex-1 ";
    
    if (isMobile) {
      return base + "px-3 py-3";
    } else if (isTablet) {
      return base + "px-4 py-4";
    } else {
      return base + "px-6 py-6";
    }
  };

  return (
    <>
      {/* Sidebar Desktop/Tablette */}
      {!isMobile && (
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarState={sidebarState}
          setSidebarState={setSidebarState}
          companyData={companyData}
          logoData={logoData}
        />
      )}
      
      {/* Layout principal */}
      <div className={getMainContainerClass()}>
        {/* Header */}
        <DashboardHeader
          userEmail={userEmail}
          onSignOut={onSignOut}
          onMenuToggle={() => {
            if (isMobile) {
              setShowMobileMenu(!showMobileMenu);
            } else {
              setSidebarState(prev => 
                prev === "fullyOpen" ? "minimized" : "fullyOpen"
              );
            }
          }}
          notificationCount={notificationCount}
          isMobile={isMobile}
        />
        
        {/* Menu mobile (drawer) */}
        {isMobile && showMobileMenu && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-gray-900/50" onClick={() => setShowMobileMenu(false)} />
            <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
              <DashboardSidebar
                activeTab={activeTab}
                setActiveTab={(tab) => {
                  setActiveTab(tab);
                  setShowMobileMenu(false);
                }}
                sidebarState="fullyOpen"
                setSidebarState={() => {}}
                companyData={companyData}
                logoData={logoData}
                isMobileDrawer={true}
                onClose={() => setShowMobileMenu(false)}
              />
            </div>
          </div>
        )}
        
        {/* Contenu principal */}
        <main className={getContentClass()}>
          {children}
        </main>
      </div>
      
      {/* Footer Navigation Mobile */}
      {isMobile && (
        <MobileFooterNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          notificationCount={notificationCount}
        />
      )}
    </>
  );
};

export default ResponsiveLayout;
