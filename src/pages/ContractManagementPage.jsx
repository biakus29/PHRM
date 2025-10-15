// src/pages/ContractManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ContractManagement from '../compoments/ContractManagement';
import DismissalManagement from '../compoments/DismissalManagement';
import Contract from '../components/Contract';
import Button from '../components/Button';

const ContractManagementPage = ({ employees, onEmployeeUpdate }) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' or 'dismissals'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Filtrer les employés selon la recherche et le statut
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Gestionnaire de mise à jour de contrat
  const handleContractUpdate = (employeeId, contractData) => {
    const updatedEmployee = {
      ...employees.find(emp => emp.id === employeeId),
      contract: {
        ...contractData,
        history: [
          ...(employees.find(emp => emp.id === employeeId)?.contract?.history || []),
          {
            action: 'update',
            date: new Date().toISOString(),
            changes: contractData,
            user: 'current_user' // À adapter selon le système d'authentification
          }
        ]
      }
    };

    onEmployeeUpdate(employeeId, updatedEmployee);
  };

  // Gestionnaire de création de contrat
  const handleContractCreate = (employeeId, contractData) => {
    const updatedEmployee = {
      ...employees.find(emp => emp.id === employeeId),
      contract: {
        ...contractData,
        createdAt: new Date().toISOString(),
        history: [{
          action: 'create',
          date: new Date().toISOString(),
          changes: contractData,
          user: 'current_user'
        }]
      }
    };

    onEmployeeUpdate(employeeId, updatedEmployee);
  };

  // Gestionnaire de terminaison de contrat
  const handleContractTerminate = (employeeId, terminationData) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const updatedEmployee = {
      ...employee,
      status: terminationData.type === 'DEMISSION' ? 'Resigned' :
              terminationData.type === 'RETRAIT' ? 'Retired' : 'Dismissed',
      contract: {
        ...employee.contract,
        status: 'terminated',
        termination: {
          ...terminationData,
          terminatedAt: new Date().toISOString()
        },
        history: [
          ...(employee.contract?.history || []),
          {
            action: 'terminate',
            date: new Date().toISOString(),
            changes: terminationData,
            user: 'current_user'
          }
        ]
      }
    };

    onEmployeeUpdate(employeeId, updatedEmployee);
  };

  // Gestionnaire de création de licenciement
  const handleDismissalCreate = (dismissalData) => {
    const employee = employees.find(emp => emp.id === dismissalData.employeeId);
    const updatedEmployee = {
      ...employee,
      dismissals: [
        ...(employee.dismissals || []),
        dismissalData
      ]
    };

    onEmployeeUpdate(dismissalData.employeeId, updatedEmployee);
    toast.success('Licenciement enregistré avec succès');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Dismissed': return 'bg-red-100 text-red-800';
      case 'Resigned': return 'bg-blue-100 text-blue-800';
      case 'Retired': return 'bg-purple-100 text-purple-800';
      case 'On leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusColor = (contract) => {
    if (!contract) return 'bg-gray-100 text-gray-800';
    if (contract.status === 'terminated') return 'bg-red-100 text-red-800';
    if (contract.status === 'trial') return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestion des Contrats et Licenciements
          </h1>
          <p className="text-gray-600">
            Gérez les contrats de travail, modifications et procédures de licenciement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Liste des employés */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Employés ({filteredEmployees.length})
              </h2>

              {/* Filtres */}
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="Active">Actif</option>
                  <option value="Inactive">Inactif</option>
                  <option value="Dismissed">Licencié</option>
                  <option value="Resigned">Démissionnaire</option>
                  <option value="Retired">Retraité</option>
                  <option value="On leave">En congé</option>
                </select>
              </div>

              {/* Liste des employés */}
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
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {employee.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{employee.matricule}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getContractStatusColor(employee.contract)}`}>
                        {employee.contract ? (employee.contract.status === 'terminated' ? 'Terminé' :
                         employee.contract.status === 'trial' ? 'Essai' : 'Actif') : 'Aucun'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zone de contenu principal */}
          <div className="lg:col-span-3">
            {selectedEmployee ? (
              <div className="space-y-6">
                {/* Onglets */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      <button
                        onClick={() => setActiveTab('contracts')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'contracts'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Contrats
                      </button>
                      <button
                        onClick={() => setActiveTab('dismissals')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'dismissals'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Licenciements
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {activeTab === 'contracts' ? (
                      <div>
                        <Contract
                          employee={selectedEmployee}
                          employer={{
                            name: 'PHRM Company',
                            address: 'Douala, Cameroun',
                            cnpsNumber: 'A123456789',
                            taxpayerNumber: 'M123456789012A'
                          }}
                          contract={selectedEmployee.contract}
                          onContractUpdate={handleContractUpdate}
                        />
                        <ContractManagement
                          employee={selectedEmployee}
                          onContractUpdate={handleContractUpdate}
                          onContractCreate={handleContractCreate}
                          onContractTerminate={handleContractTerminate}
                        />
                      </div>
                    ) : (
                      <DismissalManagement
                        employee={selectedEmployee}
                        onDismissalCreate={handleDismissalCreate}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">
                  Sélectionnez un employé
                </h3>
                <p className="text-gray-600">
                  Choisissez un employé dans la liste pour gérer ses contrats et licenciements
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractManagementPage;
