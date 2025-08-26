import React, { memo } from "react";
import { displayDate } from "../utils/displayUtils";

const LeaveRequestsRecent = ({ employees, requests }) => {
  const findEmployeeName = (id) => employees.find((e) => e.id === id)?.name || "";

  return (
    <div className="w-full">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4">Employé</th>
            <th className="text-left py-3 px-4">Date</th>
            <th className="text-left py-3 px-4">Durée</th>
            <th className="text-left py-3 px-4">Statut</th>
          </tr>
        </thead>
        <tbody>
          {requests.slice(0, 5).map((req, index) => (
            <tr key={index} className="border-b border-gray-100 hover:bg-blue-50">
              <td className="py-4 px-4">{findEmployeeName(req.employeeId)}</td>
              <td className="py-4 px-4">{displayDate(req.date)}</td>
              <td className="py-4 px-4">{req.days} jour(s)</td>
              <td className="py-4 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    req.status === "Approuvé"
                      ? "bg-green-100 text-green-800"
                      : req.status === "Rejeté"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {req.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default memo(LeaveRequestsRecent);
