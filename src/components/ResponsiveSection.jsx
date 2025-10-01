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
    <div className={`${className}`}>
      {/* Contenu */}
      <div>
        {children}
      </div>
    </div>
  );
};

export default ResponsiveSection;
