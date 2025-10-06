// src/pages/HRProceduresPage.jsx
import React from 'react';
import HRProcedures from '../components/HRProcedures';

const HRProceduresPage = ({ companyData, employees, setEmployees, actionLoading, setActionLoading }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HRProcedures
          companyData={companyData}
          employees={employees}
          setEmployees={setEmployees}
          actionLoading={actionLoading}
          setActionLoading={setActionLoading}
        />
      </div>
    </div>
  );
};

export default HRProceduresPage;

