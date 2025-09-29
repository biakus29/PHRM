// src/components/ResponsiveSection.jsx
// Section qui s'adapte automatiquement mobile/desktop - Lisible et spacieuse

import React from "react";

const ResponsiveSection = ({ 
  title, 
  subtitle,
  icon: Icon,
  action,
  children,
  className = "" 
}) => {
  return (
    <div className={`space-y-5 sm:space-y-6 ${className}`}>
      {/* Header de section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{subtitle}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            {action}
          </div>
        )}
      </div>
      
      {/* Contenu */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};

export default ResponsiveSection;
