import React from "react";

const Card = ({ children, className = "", title, subtitle, icon: Icon }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 transition-shadow hover:shadow-lg ${className}`}>
      {(title || subtitle || Icon) && (
        <div className="p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            {Icon && (
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>}
              {subtitle && <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}
      <div className="p-3 sm:p-4">
        {children}
      </div>
    </div>
  );
};

export default Card;
