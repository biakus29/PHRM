// src/components/ResponsiveTableWrapper.jsx
// Wrapper responsive pour les tableaux avec scroll horizontal sur mobile

import React from "react";

const ResponsiveTableWrapper = ({ children, className = "" }) => {
  return (
    <div className={`overflow-x-auto -mx-3 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveTableWrapper;
