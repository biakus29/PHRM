import React from "react";
import { VILLES_CAMEROUN, QUARTIERS_PAR_VILLE } from "../utils/constants";
import { formatDateOfBirthInput, validateDateOfBirth } from "../utils/dateHelpers";

const EmployeeForm = ({ 
  employee, 
  onEmployeeChange, 
  allResidences = [], 
  allLieuNaissance = [],
  onSubmit,
  onCancel,
  actionLoading = false,
  isEditing = false
}) => {
  const handleInputChange = (field, value) => {
    onEmployeeChange({
      ...employee,
      [field]: value
    });
  };

  const handleDateOfBirthChange = (value) => {
    const formatted = formatDateOfBirthInput(value);
    handleInputChange('dateOfBirth', formatted);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informations de base */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom complet *</label>
          <input
            type="text"
            value={employee.name || ""}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            value={employee.email || ""}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            type="tel"
            value={employee.phone || ""}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Poste *</label>
          <input
            type="text"
            value={employee.poste || ""}
            onChange={(e) => handleInputChange('poste', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Catégorie professionnelle</label>
          <select
            value={employee.professionalCategory || ""}
            onChange={(e) => handleInputChange('professionalCategory', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Sélectionner une catégorie</option>
            <option value="Cadre">Cadre</option>
            <option value="Agent de maîtrise">Agent de maîtrise</option>
            <option value="Employé">Employé</option>
            <option value="Ouvrier">Ouvrier</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Salaire de base (FCFA) *</label>
          <input
            type="number"
            value={employee.baseSalary || ""}
            onChange={(e) => handleInputChange('baseSalary', parseFloat(e.target.value) || 0)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="36270"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date d'embauche *</label>
          <input
            type="date"
            value={employee.hireDate || ""}
            onChange={(e) => handleInputChange('hireDate', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Matricule</label>
          <input
            type="text"
            value={employee.matricule || ""}
            onChange={(e) => handleInputChange('matricule', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro CNPS</label>
          <input
            type="text"
            value={employee.cnpsNumber || ""}
            onChange={(e) => handleInputChange('cnpsNumber', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date de naissance (JJ/MM/AAAA)</label>
          <input
            type="text"
            value={employee.dateOfBirth || ""}
            onChange={(e) => handleDateOfBirthChange(e.target.value)}
            placeholder="JJ/MM/AAAA"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {employee.dateOfBirth && validateDateOfBirth(employee.dateOfBirth) && (
            <p className="text-red-500 text-sm mt-1">{validateDateOfBirth(employee.dateOfBirth)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lieu de naissance</label>
          <input
            type="text"
            value={employee.placeOfBirth || ""}
            onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
            list="lieuNaissance-list"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="lieuNaissance-list">
            {allLieuNaissance.map((lieu, index) => (
              <option key={index} value={lieu} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nationalité</label>
          <input
            type="text"
            value={employee.nationality || "Camerounaise"}
            onChange={(e) => handleInputChange('nationality', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          disabled={actionLoading}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={actionLoading}
        >
          {actionLoading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Ajouter"}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
