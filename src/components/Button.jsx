import React from "react";

const Button = ({ children, onClick, icon: Icon, variant = "default", size = "default", className = "", disabled }) => {
  const baseStyles = "flex items-center gap-2 rounded-lg font-medium transition-all duration-200";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-blue-600 text-white hover:bg-blue-700";
  
  const sizeStyles =
    size === "sm"
      ? "px-3 py-1.5 text-sm"
      : size === "lg"
      ? "px-6 py-3 text-lg"
      : "px-4 py-2";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

export default Button;
