// src/components/MobileCard.jsx
// Carte optimisée pour mobile - Lisible et spacieuse

import React from "react";

const MobileCard = ({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  color = "blue",
  onClick,
  className = "" 
}) => {
  const colorClasses = {
    blue: "from-blue-600 to-blue-400",
    green: "from-green-600 to-green-400",
    orange: "from-orange-600 to-orange-400",
    purple: "from-purple-600 to-purple-400",
    red: "from-red-600 to-red-400",
    yellow: "from-yellow-600 to-yellow-400",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${colorClasses[color]} text-white rounded-2xl shadow-lg p-5 sm:p-6 min-h-[140px] flex flex-col justify-between ${
        onClick ? "cursor-pointer active:scale-[0.98] transition-all duration-200" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-90 mb-2 leading-relaxed">{title}</p>
        </div>
        {Icon && (
          <div className="ml-3 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl sm:text-4xl font-bold mb-2 leading-tight">{value}</p>
        {subtitle && (
          <p className="text-sm opacity-90 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default MobileCard;
