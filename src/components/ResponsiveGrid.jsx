// src/components/ResponsiveGrid.jsx
// Grille responsive qui s'adapte au nombre de colonnes

import React from "react";

const ResponsiveGrid = ({ 
  children, 
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = "4",
  className = "" 
}) => {
  const gridClasses = `grid gap-${gap} 
    grid-cols-${cols.xs} 
    ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''} 
    ${cols.md ? `md:grid-cols-${cols.md}` : ''} 
    ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}`;

  return (
    <div className={`grid gap-${gap} grid-cols-1 sm:grid-cols-${cols.sm || 2} md:grid-cols-${cols.md || 3} lg:grid-cols-${cols.lg || 4} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
