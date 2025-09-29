// src/components/ResponsiveForm.jsx
// Composant de formulaire responsive avec disposition adaptative
// Optimisé pour mobile, tablette et desktop

import React from "react";
import { useIsMobile, useIsTablet } from "../hooks/useMediaQuery";

const ResponsiveForm = ({
  children,
  onSubmit,
  className = "",
  title,
  subtitle,
  actions,
  loading = false,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  // Nombre de colonnes selon l'appareil
  const getGridCols = () => {
    if (isMobile) return "grid-cols-1";
    if (isTablet) return "grid-cols-2";
    return "grid-cols-2 lg:grid-cols-3";
  };

  return (
    <form onSubmit={onSubmit} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* En-tête du formulaire */}
      {(title || subtitle) && (
        <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      
      {/* Corps du formulaire */}
      <div className="px-4 py-5 sm:p-6">
        <div className={`grid ${getGridCols()} gap-4 sm:gap-6`}>
          {children}
        </div>
      </div>
      
      {/* Actions du formulaire */}
      {actions && (
        <div className={`px-4 py-4 sm:px-6 bg-gray-50 border-t border-gray-200 flex ${
          isMobile ? 'flex-col gap-3' : 'justify-end gap-3'
        }`}>
          {actions}
        </div>
      )}
      
      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}
    </form>
  );
};

// Composant pour un champ de formulaire responsive
export const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  icon: Icon,
  options = [], // Pour les selects
  fullWidth = false,
  disabled = false,
  readOnly = false,
}) => {
  const isMobile = useIsMobile();
  const fieldId = `field-${name}`;
  
  const baseInputClass = `
    w-full px-3 py-2 border rounded-lg transition-colors text-sm
    ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
    ${disabled || readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
    ${Icon ? 'pl-10' : ''}
    focus:outline-none focus:ring-2 focus:border-transparent
  `;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={baseInputClass}
          >
            <option value="">Sélectionner...</option>
            {options.map((option, index) => (
              <option key={index} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            rows={isMobile ? 3 : 4}
            className={baseInputClass}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              id={fieldId}
              type="checkbox"
              name={name}
              checked={value}
              onChange={onChange}
              disabled={disabled}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            {label && (
              <label htmlFor={fieldId} className="ml-2 text-sm text-gray-900">
                {label}
              </label>
            )}
          </div>
        );
      
      default:
        return (
          <input
            id={fieldId}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            className={baseInputClass}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className={fullWidth ? 'col-span-full' : ''}>
        {renderInput()}
        {helpText && (
          <p className="mt-1 text-xs text-gray-500">{helpText}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={fullWidth ? 'col-span-full' : ''}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-4 w-4 text-gray-400" />
          </div>
        )}
        
        {renderInput()}
      </div>
      
      {helpText && !error && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

// Composant pour un groupe de champs
export const FormSection = ({ title, children, description }) => (
  <div className="col-span-full">
    {title && (
      <h4 className="text-base font-medium text-gray-900 mb-3">{title}</h4>
    )}
    {description && (
      <p className="text-sm text-gray-600 mb-4">{description}</p>
    )}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// Composant pour les boutons d'action
export const FormActions = ({ children, align = "right" }) => {
  const isMobile = useIsMobile();
  
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
    between: "justify-between"
  }[align] || "justify-end";
  
  return (
    <div className={`flex ${isMobile ? 'flex-col' : alignClass} gap-3`}>
      {children}
    </div>
  );
};

// Bouton responsive
export const FormButton = ({
  type = "button",
  variant = "primary",
  size = "normal",
  onClick,
  disabled = false,
  loading = false,
  icon: Icon,
  children,
  fullWidth = false,
}) => {
  const isMobile = useIsMobile();
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
  };
  
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    normal: "px-4 py-2 text-sm",
    large: "px-6 py-3 text-base",
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.normal}
        ${fullWidth || isMobile ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
        flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
    </button>
  );
};

export default ResponsiveForm;
