import React, { memo } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const AutocompleteField = ({
  label,
  value,
  onChange,
  inputValue,
  onInputChange,
  options,
  placeholder,
  required = false,
  className = "w-full",
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      <Autocomplete
        value={value ?? ""}
        onChange={(event, newValue) => (onChange || (() => {}))(newValue ?? "")}
        inputValue={inputValue ?? ""}
        onInputChange={(event, newInputValue) => (onInputChange || (() => {}))(newInputValue ?? "")}
        options={(options ?? []).map((o) => (o ?? ""))}
        freeSolo
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={placeholder}
            required={required}
            className={className}
            size="small"
          />
        )}
        renderOption={(props, option) => {
          const { key, ...liProps } = props;
          return (
          <li key={key} {...liProps}>
            <div className="flex items-center">
              <span className="text-sm">{option}</span>
            </div>
          </li>
        )}}
        filterOptions={(opts, { inputValue }) =>
          (opts || []).filter((opt) => (opt || "").toLowerCase().includes((inputValue || "").toLowerCase()))
        }
      />
    </div>
  );
};

export default memo(AutocompleteField);
