// src/pages/EmployeeManagement.jsx
import React from "react";
import EmployeeManagementEnhanced from "../components/EmployeeManagementEnhanced";

const EmployeeManagement = ({ companyData, employees, setEmployees, actionLoading, setActionLoading }) => {
  return (
    <EmployeeManagementEnhanced
      companyData={companyData}
      employees={employees}
      setEmployees={setEmployees}
      actionLoading={actionLoading}
      setActionLoading={setActionLoading}
    />
  );
};

export default EmployeeManagement;