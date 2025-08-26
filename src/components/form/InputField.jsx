import React, { memo } from "react";

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  className = "w-full",
  min,
  maxLength,
  autoComplete,
  error,
  list,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`p-2 border ${error ? "border-red-400" : "border-blue-200"} rounded-lg ${className}`}
        required={required}
        min={min}
        maxLength={maxLength}
        autoComplete={autoComplete}
        list={list}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default memo(InputField);
