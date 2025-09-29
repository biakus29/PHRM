// src/components/MobileListItem.jsx
// Item de liste optimisé pour mobile - Grande lisibilité

import React from "react";
import { ChevronRight } from "lucide-react";

const MobileListItem = ({ 
  title, 
  subtitle, 
  value, 
  badge,
  icon: Icon,
  onClick,
  actions,
  className = "" 
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${
        onClick ? "active:bg-gray-50 active:scale-[0.99] cursor-pointer transition-all duration-150" : ""
      } ${className}`}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 text-base leading-snug">{title}</h3>
            {badge && (
              <span className="flex-shrink-0 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">{subtitle}</p>
          )}
          {value && (
            <p className="text-base font-semibold text-gray-900 mt-2">{value}</p>
          )}
        </div>
        
        {actions ? (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        ) : onClick ? (
          <div className="flex-shrink-0 self-center">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MobileListItem;
