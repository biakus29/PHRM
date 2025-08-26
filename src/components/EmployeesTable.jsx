import React, { memo } from "react";
import Button from "../compoments/Button";
import { Eye, Edit, Trash2 } from "lucide-react";

const EmployeesTable = ({ employees, onView, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-blue-100">
            <th className="text-left py-3 px-4">Photo</th>
            <th className="text-left py-3 px-4">Nom & Prénom</th>
            <th className="text-left py-3 px-4">Poste</th>
            <th className="text-left py-3 px-4">Salaire</th>
            <th className="text-left py-3 px-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.id} className="border-b border-blue-100 hover:bg-blue-50">
              <td className="py-4 px-4">
                <img
                  src={emp.profilePicture || "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff"}
                  alt={emp.name || "Employé"}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=Inconnu&background=60A5FA&color=fff")}
                />
              </td>
              <td className="py-4 px-4">
                <div>
                  <div className="font-medium">{emp.name || "N/A"}</div>
                  <div className="text-sm text-gray-500">{emp.firstName || ""}</div>
                </div>
              </td>
              <td className="py-4 px-4">{emp.poste || "N/A"}</td>
              <td className="py-4 px-4">{emp.baseSalary ? emp.baseSalary.toLocaleString() : "0"} FCFA</td>
              <td className="py-4 px-4 flex gap-2">
                <Button size="sm" icon={Eye} onClick={() => onView(emp)}>Voir</Button>
                <Button size="sm" icon={Edit} variant="outline" onClick={() => onEdit(emp)}>Modifier</Button>
                <Button size="sm" icon={Trash2} variant="danger" onClick={() => onDelete(emp.id)}>Supprimer</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(EmployeesTable);
