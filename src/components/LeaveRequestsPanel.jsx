import React, { memo } from "react";
import Button from "../compoments/Button";
import { displayDate } from "../utils/displayUtils";

const LeaveRequestsPanel = ({
  employees,
  requests,
  leaveFilter,
  setLeaveFilter,
  onApprove,
  onReject,
}) => {
  const findEmployeeName = (id) => employees.find((e) => e.id === id)?.name || "";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <select
          value={leaveFilter}
          onChange={(e) => setLeaveFilter(e.target.value)}
          className="p-2 border border-blue-200 rounded-lg"
        >
          <option>Tous</option>
          <option>En attente</option>
          <option>Approuvé</option>
          <option>Rejeté</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-blue-100">
              <th className="text-left py-3 px-4">Employé</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Durée</th>
              <th className="text-left py-3 px-4">Raison</th>
              <th className="text-left py-3 px-4">Statut</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req, index) => (
              <tr key={index} className="border-b border-blue-100 hover:bg-blue-50">
                <td className="py-4 px-4">{findEmployeeName(req.employeeId)}</td>
                <td className="py-4 px-4">{displayDate(req.date)}</td>
                <td className="py-4 px-4">{req.days} jour(s)</td>
                <td className="py-4 px-4">{req.reason}</td>
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
                <td className="py-4 px-4">
                  {req.status === "En attente" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onApprove(req.employeeId, index)}>
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => onReject(req.employeeId, index)}
                      >
                        Rejeter
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default memo(LeaveRequestsPanel);
