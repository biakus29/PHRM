import React, { memo } from "react";

const SelectField = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  className = "w-full",
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <select
        value={value !== undefined && value !== null ? String(value) : ""}
        onChange={onChange}
        className={`p-2 border border-blue-200 rounded-lg ${className}`}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => {
          const isObject = typeof option === "object" && option !== null;
          const optValue = isObject ? option.value : option;
          const optLabel = isObject ? option.label : option;
          return (
            <option key={index} value={optValue !== undefined && optValue !== null ? String(optValue) : ""}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default memo(SelectField);
