import React from "react";
import Button from "../compoments/Button";
import { Plus } from "lucide-react";
import InputField from "./form/InputField";
import AutocompleteField from "./form/AutocompleteField";
import SelectField from "./form/SelectField";
import {
  POSTES_EMPLOI,
  DEPARTEMENTS,
  CATEGORIES_CNPS,
  ECHELONS_CNPS,
  CATEGORIES_PROFESSIONNELLES,
  DIPLOMES,
  SERVICES,
  SITUATIONS_FAMILLE,
} from "../utils/constants";
import { calculateSeniorityYears, formatSeniority } from "../utils/seniorityUtils";

const EmployeeFormModal = ({
  newEmployee,
  setNewEmployee,
  onSubmit,
  actionLoading,
  // Personal infos helpers
  formatDateOfBirthInput,
  validateDateOfBirth,
  dateOfBirthError,
  setDateOfBirthError,
  allLieuNaissance = [],
  allResidences = [],
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">{newEmployee.id ? "Modifier Employé" : "Ajouter Employé"}</h2>

      <InputField
        label="Nom complet"
        type="text"
        value={newEmployee.name}
        onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
        placeholder="Nom complet"
        required
      />

      <InputField
        label="Email"
        type="email"
        value={newEmployee.email}
        onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
        placeholder="Email"
        required
      />

      <AutocompleteField
        label="Rôle"
        value={newEmployee.role}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, role: newValue })}
        inputValue={newEmployee.role}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, role: newInputValue })}
        options={[
          "Employé",
          "Manager",
          "Admin",
          "Directeur",
          "Superviseur",
          "Chef d'équipe",
          "Responsable",
          "Coordinateur",
          "Consultant",
          "Expert",
          "Spécialiste",
          "Assistant",
          "Stagiaire",
          "Apprenti",
        ]}
        placeholder="Sélectionnez ou tapez un rôle"
        required
      />

      <AutocompleteField
        label="Poste"
        value={newEmployee.poste}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, poste: newValue })}
        inputValue={newEmployee.poste}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, poste: newInputValue })}
        options={POSTES_EMPLOI}
        placeholder="Sélectionnez ou tapez un poste"
        required
      />

      <SelectField
        label="Type de contrat"
        value={newEmployee.contractType || "CDI"}
        onChange={(e) => setNewEmployee({ ...newEmployee, contractType: e.target.value })}
        options={["CDI", "CDD"]}
        required
      />

      {newEmployee.contractType === 'CDD' && (
        <InputField
          label="Durée du contrat"
          type="text"
          value={newEmployee.contractDuration || ''}
          onChange={(e) => setNewEmployee({ ...newEmployee, contractDuration: e.target.value })}
          placeholder="Ex: 12 mois"
          required
        />
      )}

      <InputField
        label="Téléphone"
        type="tel"
        value={newEmployee.phone}
        onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
        placeholder="Téléphone"
      />

      <AutocompleteField
        label="Département"
        value={newEmployee.department}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, department: newValue })}
        inputValue={newEmployee.department}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, department: newInputValue })}
        options={DEPARTEMENTS}
        placeholder="Sélectionnez ou tapez un département"
      />

      <InputField
        label="Ville de travail"
        type="text"
        value={newEmployee.workCity || ''}
        onChange={(e) => setNewEmployee({ ...newEmployee, workCity: e.target.value })}
        placeholder="Ville principale d'exercice (ex: Douala)"
      />

      <InputField
        label="Date d'embauche"
        type="date"
        value={newEmployee.hireDate}
        onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
        placeholder="Date d'embauche"
        required
      />

      <InputField
        label="Heure de début"
        type="time"
        value={newEmployee.startTime || '08:00'}
        onChange={(e) => setNewEmployee({ ...newEmployee, startTime: e.target.value })}
        placeholder="Heure de début (ex: 08:00)"
      />

      <SelectField
        label="Statut"
        value={newEmployee.status}
        onChange={(e) => setNewEmployee({ ...newEmployee, status: e.target.value })}
        options={["Actif", "Inactif", "Suspendu"]}
        required
      />

      <InputField
        label="Numéro CNPS"
        type="text"
        value={newEmployee.cnpsNumber}
        onChange={(e) => setNewEmployee({ ...newEmployee, cnpsNumber: e.target.value })}
        placeholder="Numéro CNPS"
        required
      />

      <AutocompleteField
        label="Catégorie CNPS"
        value={newEmployee.professionalCategory}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, professionalCategory: newValue })}
        inputValue={newEmployee.professionalCategory}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, professionalCategory: newInputValue })}
        options={CATEGORIES_CNPS}
        placeholder="Sélectionnez une catégorie CNPS (1-12)"
        required
      />

      <AutocompleteField
        label="Échelon CNPS"
        value={newEmployee.echelon}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, echelon: newValue })}
        inputValue={newEmployee.echelon}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, echelon: newInputValue })}
        options={ECHELONS_CNPS}
        placeholder="Sélectionnez un échelon CNPS (A-G)"
      />

      <AutocompleteField
        label="Catégorie professionnelle"
        value={newEmployee.category}
        onChange={(newValue) => setNewEmployee({ ...newEmployee, category: newValue })}
        inputValue={newEmployee.category}
        onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, category: newInputValue })}
        options={CATEGORIES_PROFESSIONNELLES}
        placeholder="Sélectionnez ou tapez une catégorie professionnelle"
      />

      <InputField
        label="Salaire de base (FCFA)"
        type="number"
        value={newEmployee.baseSalary}
        onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: e.target.value })}
        placeholder="Salaire de base (FCFA)"
        min="0"
        required
      />

      <InputField
        label="Prime de transport (FCFA)"
        type="number"
        value={newEmployee.transportAllowance || 0}
        onChange={(e) => setNewEmployee({ ...newEmployee, transportAllowance: Number(e.target.value) || 0 })}
        placeholder="Prime de transport (FCFA)"
        min="0"
      />

      <InputField
        label="Indemnité de logement (FCFA)"
        type="number"
        value={newEmployee.housingAllowance || 0}
        onChange={(e) => setNewEmployee({ ...newEmployee, housingAllowance: Number(e.target.value) || 0 })}
        placeholder="Indemnité de logement (FCFA)"
        min="0"
      />

      <SelectField
        label="Période d'essai"
        value={newEmployee.hasTrialPeriod}
        onChange={(e) => setNewEmployee({ ...newEmployee, hasTrialPeriod: e.target.value === "true" })}
        options={[
          { value: false, label: "Non" },
          { value: true, label: "Oui" },
        ]}
      />

      {newEmployee.hasTrialPeriod && (
        <InputField
          label="Durée de la période d'essai"
          type="text"
          value={newEmployee.trialPeriodDuration}
          onChange={(e) => setNewEmployee({ ...newEmployee, trialPeriodDuration: e.target.value })}
          placeholder="Durée de la période d'essai (ex. 3 mois)"
        />
      )}

      <InputField
        label="Matricule"
        type="text"
        value={newEmployee.matricule || ""}
        onChange={(e) => setNewEmployee({ ...newEmployee, matricule: e.target.value })}
        placeholder="Entrez le matricule de l'employé"
        required
      />

      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Informations personnelles</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Date de naissance"
            type="text"
            value={newEmployee.dateOfBirth}
            onChange={(e) => {
              const formatted = formatDateOfBirthInput(e.target.value);
              setNewEmployee({ ...newEmployee, dateOfBirth: formatted });
              setDateOfBirthError(validateDateOfBirth(formatted));
            }}
            placeholder="JJ/MM/AAAA (ex: 25/12/1990)"
            maxLength={10}
            autoComplete="off"
            error={dateOfBirthError}
          />

          <InputField
            label="Lieu de naissance"
            type="text"
            value={newEmployee.lieuNaissance}
            onChange={(e) => setNewEmployee({ ...newEmployee, lieuNaissance: e.target.value })}
            placeholder="Ville, département, pays (ex: Douala, Littoral, Cameroun)"
            list="lieuxNaissance"
          />
          <datalist id="lieuxNaissance">
            {allLieuNaissance.map((lieu, idx) => (
              <option key={idx} value={lieu} />
            ))}
          </datalist>

          <InputField
            label="Fils de"
            type="text"
            value={newEmployee.pere}
            onChange={(e) => setNewEmployee({ ...newEmployee, pere: e.target.value })}
            placeholder="Nom du père"
          />

          <InputField
            label="Et de"
            type="text"
            value={newEmployee.mere}
            onChange={(e) => setNewEmployee({ ...newEmployee, mere: e.target.value })}
            placeholder="Nom de la mère"
          />

          <InputField
            label="Lieu de résidence habituelle"
            type="text"
            value={newEmployee.residence}
            onChange={(e) => setNewEmployee({ ...newEmployee, residence: e.target.value })}
            placeholder="Adresse complète (ex: Rue de la Paix, Akwa, Douala, Cameroun)"
            list="adressesResidence"
          />
          <datalist id="adressesResidence">
            {allResidences.map((addr, idx) => (
              <option key={idx} value={addr} />
            ))}
          </datalist>

          <AutocompleteField
            label="Situation de famille"
            value={newEmployee.situation}
            onChange={(newValue) => setNewEmployee({ ...newEmployee, situation: newValue })}
            inputValue={newEmployee.situation}
            onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, situation: newInputValue })}
            options={SITUATIONS_FAMILLE}
            placeholder="Sélectionnez une situation de famille"
          />

          <InputField
            label="Nom et prénoms de l'épouse"
            type="text"
            value={newEmployee.epouse}
            onChange={(e) => setNewEmployee({ ...newEmployee, epouse: e.target.value })}
            placeholder="Nom et prénoms de l'épouse"
          />

          <InputField
            label="Personne à prévenir en cas de besoin"
            type="text"
            value={newEmployee.personneAPrevenir}
            onChange={(e) => setNewEmployee({ ...newEmployee, personneAPrevenir: e.target.value })}
            placeholder="Nom et téléphone de la personne à prévenir"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Informations professionnelles supplémentaires</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AutocompleteField
            label="Diplômes"
            value={newEmployee.diplomas}
            onChange={(newValue) => setNewEmployee({ ...newEmployee, diplomas: newValue })}
            inputValue={newEmployee.diplomas}
            onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, diplomas: newInputValue })}
            options={DIPLOMES}
            placeholder="Sélectionnez ou tapez un diplôme"
          />

          <AutocompleteField
            label="Service"
            value={newEmployee.service}
            onChange={(newValue) => setNewEmployee({ ...newEmployee, service: newValue })}
            inputValue={newEmployee.service}
            onInputChange={(newInputValue) => setNewEmployee({ ...newEmployee, service: newInputValue })}
            options={SERVICES}
            placeholder="Sélectionnez ou tapez un service"
          />

          <InputField
            label="Superviseur"
            type="text"
            value={newEmployee.supervisor}
            onChange={(e) => setNewEmployee({ ...newEmployee, supervisor: e.target.value })}
            placeholder="Nom du superviseur"
          />

          <InputField
            label="Heures par mois"
            type="number"
            value={newEmployee.hoursPerMonth}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, hoursPerMonth: parseInt(e.target.value) || 160 })
            }
            placeholder="Heures de travail par mois"
            min="0"
          />

          <InputField
            label="Ancienneté (années d'expérience)"
            type="number"
            value={newEmployee.seniority || 0}
            onChange={(e) => setNewEmployee({ ...newEmployee, seniority: parseInt(e.target.value) || 0 })}
            placeholder="Années d'expérience professionnelle totale"
            min="0"
            helperText="Expérience professionnelle totale (utilisée pour la prime d'ancienneté)"
          />

          <InputField
            label="Nombre d'enfants"
            type="number"
            value={newEmployee.childrenCount}
            onChange={(e) => setNewEmployee({ ...newEmployee, childrenCount: parseInt(e.target.value) || 0 })}
            placeholder="Nombre d'enfants"
            min="0"
          />
        </div>
      </div>

      <Button type="submit" icon={Plus} disabled={actionLoading}>
        {newEmployee.id ? "Modifier" : "Ajouter"}
      </Button>
    </form>
  );
};

export default EmployeeFormModal;
