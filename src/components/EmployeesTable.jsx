import React, { memo } from "react";
import Button from "../compoments/Button";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";

const EmployeesTable = ({ employees, onView, onEdit, onDelete }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1024px] md:min-w-0">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">Photo</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">Nom & Prénom</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">Poste</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 whitespace-nowrap">Salaire</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employees.map((emp) => (
            <tr key={emp.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex-shrink-0">
                  <img
                    src={emp.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || 'U')}&background=60A5FA&color=fff`}
                    alt={emp.name || "Employé"}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => (e.target.src = "https://ui-avatars.com/api/?name=U&background=60A5FA&color=fff")}
                    width={40}
                    height={40}
                  />
                </div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{emp.name || "N/A"}</span>
                  {emp.firstName && <span className="text-sm text-gray-500">{emp.firstName}</span>}
                </div>
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-700">
                {emp.poste || "N/A"}
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {emp.baseSalary ? emp.baseSalary.toLocaleString('fr-FR') : "0"} FCFA
              </td>
              <td className="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onView(emp)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                    title="Voir les détails"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(emp)}
                    className="text-yellow-600 hover:text-yellow-900 p-1 rounded-full hover:bg-yellow-50"
                    title="Modifier"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(emp.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(EmployeesTable);
