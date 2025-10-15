// src/components/UnifiedDocumentManager.jsx
// Gestionnaire unifié pour documents et contrats

import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiPlus, FiEdit, FiTrash2, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DocumentsManager from './DocumentsManager';
import Contract from './Contract';
import { exportContractPDF } from '../utils/exportContractPDF';

const UnifiedDocumentManager = ({ 
  companyId, 
  userRole = 'admin', 
  companyData = null, 
  employees = [] 
}) => {
  const [activeSection, setActiveSection] = useState('documents');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les employés
  const filteredEmployees = employees.filter(employee => 
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sections disponibles
  const sections = [
    {
      id: 'documents',
      title: 'Documents RH',
      icon: FiFileText,
      description: 'Offres d\'emploi, attestations, certificats'
    },
    {
      id: 'contracts',
      title: 'Contrats de travail',
      icon: FiUsers,
      description: 'Gestion des contrats et avenants'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Documents et Contrats
          </h1>
          <p className="text-gray-600">
            Créez et gérez tous vos documents RH et contrats de travail
          </p>
        </div>

        {/* Navigation des sections */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <nav className="flex">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 px-6 py-4 text-center border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className="w-5 h-5 mx-auto mb-1" />
                <div className="font-medium">{section.title}</div>
                <div className="text-xs text-gray-500">{section.description}</div>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu selon la section active */}
        {activeSection === 'documents' && (
          <DocumentsManager
            companyId={companyId}
            userRole={userRole}
            companyData={companyData}
            employees={employees}
          />
        )}

        {activeSection === 'contracts' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sélection d'employé */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Sélectionner un employé
                </h3>
                
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEmployees.map(employee => (
                    <div
                      key={employee.id}
                      onClick={() => setSelectedEmployee(employee)}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedEmployee?.id === employee.id
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{employee.name}</h4>
                      <p className="text-sm text-gray-600">{employee.matricule}</p>
                      <p className="text-xs text-gray-500">{employee.poste}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Affichage du contrat */}
            <div className="lg:col-span-3">
              {selectedEmployee ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <Contract
                    employee={selectedEmployee}
                    employer={companyData}
                    contract={selectedEmployee.contract}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-800 mb-2">
                    Sélectionnez un employé
                  </h3>
                  <p className="text-gray-600">
                    Choisissez un employé pour voir et gérer son contrat de travail
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedDocumentManager;
