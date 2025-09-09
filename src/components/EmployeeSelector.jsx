import React from "react";

const EmployeeSelector = ({ 
  employees = [], 
  selectedEmployee, 
  onEmployeeSelect, 
  onPaySlipDataReset,
  className = "" 
}) => {
  const filteredEmployees = employees.filter(emp => emp.isActive !== false);

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-gray-500 mb-4">Sélectionnez un employé pour générer ou modifier une fiche de paie :</p>
      <select
        value={selectedEmployee?.id || ""}
        onChange={(e) => {
          const employee = employees.find((emp) => emp.id === e.target.value);
          onEmployeeSelect(employee || null);
          if (onPaySlipDataReset) onPaySlipDataReset(); // Réinitialiser si changement d'employé
        }}
        className="p-2 border border-blue-200 rounded-lg w-full"
        required
      >
        <option value="">Sélectionner un employé</option>
        {filteredEmployees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.name} ({emp.poste || "N/A"})
          </option>
        ))}
      </select>
    </div>
  );
};

export default EmployeeSelector;
