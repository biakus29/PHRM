import React, { useState } from 'react';
import { PAYSLIP_TEMPLATE_CONFIGS } from '../utils/paySlipTemplates';
import PaySlipTemplate from '../compoments/PaySlipTemplate';
import ContractTemplate from '../compoments/ContractTemplate';
import PaySlipTemplates from '../components/PaySlipTemplates';
import ContractTemplates from '../components/ContractTemplates';

const TemplatePreviewDemo = () => {
  const [selectedPayslipTemplate, setSelectedPayslipTemplate] = useState('template1');
  const [selectedContractTemplate, setSelectedContractTemplate] = useState('contract1');
  const [activeTab, setActiveTab] = useState('payslip');
  const [previewMode, setPreviewMode] = useState('selector'); // 'selector' ou 'preview'

  // Données de démonstration pour les aperçus
  const mockEmployee = {
    name: 'NKOMO Jean Pierre',
    matricule: 'EMP001',
    dateOfBirth: '1985-03-15',
    lieuNaissance: 'Yaoundé',
    poste: 'Développeur Senior',
    department: 'Informatique',
    service: 'Développement',
    supervisor: 'MBALLA Marie',
    professionalCategory: 'Cadre',
    cnpsNumber: 'CNPS123456',
    email: 'jean.nkomo@vigilcam.cm',
    residence: 'Quartier Bastos, Yaoundé',
    hoursPerMonth: 160
  };

  const mockEmployer = {
    companyName: 'VIGILCAM SECURITY & SERVICES SARL',
    name: 'VIGILCAM SECURITY & SERVICES SARL',
    address: 'BP 16194 Yaoundé, Cameroun',
    cnpsNumber: 'J123456789',
    representant: 'NDJOCK Parfait',
    phone: '22214081'
  };

  const mockSalaryDetails = {
    baseSalary: 750000,
    dailyRate: 25000,
    hourlyRate: 3125,
    transportAllowance: 50000,
    monthlyRate: 750000
  };

  const mockRemuneration = {
    workedDays: 22,
    overtime: 45000,
    total: 845000
  };

  const mockDeductions = {
    pvid: 31500,
    irpp: 45000,
    cac: 4500,
    cfc: 8450,
    rav: 750,
    tdl: 0,
    fne: 0,
    total: 90200
  };

  const mockContract = {
    type: 'CDI',
    position: 'Développeur Senior',
    startDate: '2024-01-15',
    salary: 750000,
    trialPeriod: '3 mois',
    duration: 'Indéterminée',
    clauses: 'Clause de confidentialité et de non-concurrence applicable pendant 12 mois après la fin du contrat.'
  };

  const mockPayPeriod = {
    start: '2025-01-01',
    end: '2025-01-31'
  };

  const handlePreviewPayslip = (template) => {
    setSelectedPayslipTemplate(template.id);
    setPreviewMode('preview');
  };

  const handlePreviewContract = (template) => {
    setSelectedContractTemplate(template.id);
    setPreviewMode('preview');
  };

  const getPayslipTemplateStyle = (templateId) => {
    const config = PAYSLIP_TEMPLATE_CONFIGS[templateId];
    if (!config) return 'default';
    
    switch (config.layout) {
      case 'modern': return 'modern';
      case 'detailed': return 'default';
      case 'premium': return 'modern';
      case 'official': return 'minimal';
      default: return 'default';
    }
  };

  const getContractTemplateStyle = (templateId) => {
    switch (templateId) {
      case 'contract1': return 'default';
      case 'contract2': return 'legal';
      case 'contract3': return 'minimal';
      case 'contract4': return 'modern';
      case 'contract5': return 'legal';
      case 'contract6': return 'modern';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Démonstration des Modèles PRHM
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Visualisez et testez tous les modèles de fiches de paie et de contrats disponibles
          </p>
          
          {/* Navigation par onglets */}
          <div className="flex justify-center space-x-4 mb-6">
            <button
              onClick={() => {
                setActiveTab('payslip');
                setPreviewMode('selector');
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'payslip'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📄 Fiches de Paie
            </button>
            <button
              onClick={() => {
                setActiveTab('contract');
                setPreviewMode('selector');
              }}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'contract'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 Contrats
            </button>
          </div>

          {/* Mode de vue */}
          {previewMode === 'preview' && (
            <button
              onClick={() => setPreviewMode('selector')}
              className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Retour à la sélection
            </button>
          )}
        </div>

        {/* Contenu principal */}
        {previewMode === 'selector' ? (
          // Mode sélection des modèles
          <div>
            {activeTab === 'payslip' ? (
              <PaySlipTemplates
                selectedTemplate={selectedPayslipTemplate}
                onSelectTemplate={setSelectedPayslipTemplate}
                onPreview={handlePreviewPayslip}
                onDownload={(template) => alert(`Téléchargement du modèle: ${template.name}`)}
              />
            ) : (
              <ContractTemplates
                selectedTemplate={selectedContractTemplate}
                onSelectTemplate={setSelectedContractTemplate}
                onPreview={handlePreviewContract}
                onDownload={(template) => alert(`Téléchargement du modèle: ${template.name}`)}
              />
            )}
          </div>
        ) : (
          // Mode aperçu
          <div>
            {activeTab === 'payslip' ? (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">
                    Aperçu: {PAYSLIP_TEMPLATE_CONFIGS[selectedPayslipTemplate]?.name}
                  </h2>
                  <p className="text-gray-600">
                    Layout: {PAYSLIP_TEMPLATE_CONFIGS[selectedPayslipTemplate]?.layout}
                  </p>
                </div>
                <PaySlipTemplate
                  employee={mockEmployee}
                  employer={mockEmployer}
                  salaryDetails={mockSalaryDetails}
                  remuneration={mockRemuneration}
                  deductions={mockDeductions}
                  payPeriod={mockPayPeriod}
                  generatedAt={new Date().toISOString()}
                  template={getPayslipTemplateStyle(selectedPayslipTemplate)}
                  primes={[
                    { label: 'Prime de rendement', montant: 25000 },
                    { label: 'Prime de transport', montant: 15000 }
                  ]}
                  indemnites={[
                    { label: 'Indemnité de logement', montant: 50000 }
                  ]}
                />
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Aperçu: Contrat {selectedContractTemplate}
                  </h2>
                </div>
                <ContractTemplate
                  employee={mockEmployee}
                  employer={mockEmployer}
                  contract={mockContract}
                  template={getContractTemplateStyle(selectedContractTemplate)}
                />
              </div>
            )}
          </div>
        )}

        {/* Informations techniques */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Informations Techniques
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Modèles de Fiches de Paie</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {Object.entries(PAYSLIP_TEMPLATE_CONFIGS).map(([key, template]) => (
                  <li key={key} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    <strong>{key}:</strong> {template.name} ({template.layout})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Utilisation dans l'Application</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <code>PaySlipGenerator.jsx</code> - Génération principale</li>
                <li>• <code>ExportPaySlip.jsx</code> - Export PDF avec styles</li>
                <li>• <code>PaySlipTemplates.jsx</code> - Interface de sélection</li>
                <li>• <code>PaySlipTemplate.jsx</code> - Rendu des modèles</li>
                <li>• <code>paySlipTemplates.js</code> - Configuration et calculs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatePreviewDemo;