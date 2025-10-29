import React from "react";
import Button from "./Button";
import { FiPlus } from "react-icons/fi";

const EmployeeForm = ({ newEmployee, setNewEmployee, onSubmit }) => (
  <form onSubmit={onSubmit} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[
      { placeholder: "Nom", key: "name", type: "text", required: true, tooltip: "Nom de l'employé" },
      { placeholder: "Email", key: "email", type: "email", required: true, tooltip: "Email de l'employé" },
      { placeholder: "Matricule", key: "matricule", type: "text", required: true, tooltip: "Matricule de l'employé" },
      { placeholder: "Poste", key: "poste", type: "text", required: true, tooltip: "Poste de l'employé" },
      { placeholder: "Téléphone (optionnel)", key: "phone", type: "tel", tooltip: "Numéro de téléphone" },
      { placeholder: "Département (optionnel)", key: "department", type: "text", tooltip: "Département de l'employé", defaultValue: "" },
      { placeholder: "Date d'embauche", key: "hireDate", type: "date", required: true, tooltip: "Date d'embauche" },
    ].map(({ placeholder, key, type, required, tooltip }) => (
      <input
        key={key}
        type={type}
        placeholder={placeholder}
        value={newEmployee[key]}
        onChange={(e) => setNewEmployee({ ...newEmployee, [key]: e.target.value })}
        className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        required={required}
        data-tooltip-id="tooltip"
        data-tooltip-content={tooltip}
      />
    ))}
    <select
      value={newEmployee.role}
      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
      className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="Employé">Employé</option>
      <option value="Manager">Manager</option>
    </select>
    <select
      value={newEmployee.status}
      onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
      className="col-span-1 p-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="Actif">Actif</option>
      <option value="Inactif">Inactif</option>
      <option value="En congé">En congé</option>
    </select>
    <Button type="submit" icon={FiPlus} aria-label="Ajouter un employé" className="col-span-1 sm:col-span-1">
      Ajouter
    </Button>
  </form>
);

export default EmployeeForm;