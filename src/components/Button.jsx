import React from "react";

const Button = ({ children, onClick, icon: Icon, variant = "default", size = "default", className = "", disabled, ...props }) => {
  const baseStyles = "flex items-center justify-center gap-1 sm:gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-200 text-gray-600 hover:bg-gray-50 focus:ring-gray-300"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
      : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
  
  const sizeStyles =
    size === "sm"
      ? "px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm"
      : size === "lg"
      ? "px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg"
      : "px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default Button;
