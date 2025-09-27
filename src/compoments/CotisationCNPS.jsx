import React from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { formatFR } from "../utils/numberUtils";
import { exportCnpsPDF, exportTaxesPDF } from "../utils/pdfCnps";
import { 
  computeTaxes,
  calculateEmployerSummary, 
  calculateTableTotals, 
  calculateTotalNet,
  generateExcelData 
} from "../utils/payrollCalculations";
import { useCotisationCNPS } from "../hooks/useCotisationCNPS";
import CotisationEmployeeSelector from "../components/CotisationEmployeeSelector";
import CotisationCNPSControls from "../components/CotisationCNPSControls";
import CotisationCNPSTable from "../components/CotisationCNPSTable";
import Button from "../components/Button";

const CotisationCNPS = ({ companyId, cnpsEmployeur }) => {
  const {
    employees,
    selectedIds,
    formData,
    loading,
    saving,
    cotisations,
    moisApercu,
    anneeApercu,
    uniformTransport,
    employerOptions,
    taxOptions,
    setSelectedIds,
    setFormData,
    setMoisApercu,
    setAnneeApercu,
    setUniformTransport,
    setEmployerOptions,
    setTaxOptions,
    reloadAllFromPayslips,
    handleSave,
  } = useCotisationCNPS(companyId, cnpsEmployeur);

  // Vue: 'detailed' (défaut), 'declaration' (formalisme CNPS), 'dipe' (export DIPE)
  const [viewMode, setViewMode] = React.useState('detailed');

  // Quand on passe en vue DIPE ou DÉCLARATION, recharger depuis les bulletins pour garantir
  // la présence des tableaux dynamiques (primes/indemnités) et des déductions
  React.useEffect(() => {
    if ((viewMode === 'dipe' || viewMode === 'declaration') && selectedIds.length > 0) {
      reloadAllFromPayslips(true);
    }
  }, [viewMode, selectedIds]);

  // Bouton pour forcer le rechargement manuel des données
  const handleForceReload = () => {
    reloadAllFromPayslips(false);
  };

  // Calculs centralisés - tous depuis payrollCalculations.js
  const employerSummary = React.useMemo(
    () => calculateEmployerSummary(selectedIds, formData, employees, employerOptions),
    [selectedIds, formData, employees, employerOptions]
  );

  const tableTotals = React.useMemo(
    () => calculateTableTotals(selectedIds, formData, employees, employerOptions),
    [selectedIds, formData, employees, employerOptions]
  );

  const taxesData = React.useMemo(
    () => computeTaxes(selectedIds, formData, employerOptions, taxOptions),
    [selectedIds, formData, employerOptions, taxOptions]
  );

  const totalNet = React.useMemo(
    () => calculateTotalNet(selectedIds, formData, taxOptions),
    [selectedIds, formData, taxOptions]
  );

  // Gestionnaires d'événements
  const handleEmployeeSelect = (employeeId) => {
    setSelectedIds(prev => [...prev, employeeId]);
  };

  const handleEmployeeDeselect = (employeeId) => {
    setSelectedIds(prev => prev.filter(id => id !== employeeId));
  };

  const handleSelectAll = () => {
    setSelectedIds(employees.map(e => e.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Export PDF CNPS
  const handleExportCNPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    exportCnpsPDF({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur });
  };

  // Export PDF Impôts
  const handleExportTaxesPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    exportTaxesPDF({ selectedIds, taxesData, formData, cnpsEmployeur });
  };

  // Export Excel
  const handleExportExcel = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    
    const data = generateExcelData(selectedIds, formData, employerOptions, cnpsEmployeur);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotisations CNPS");
    XLSX.writeFile(wb, `cotisations_cnps_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Export Excel généré avec succès!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Cotisations CNPS</h2>

        {/* Sélecteur d'employés */}
        <CotisationEmployeeSelector
          employees={employees}
          selectedIds={selectedIds}
          onEmployeeSelect={handleEmployeeSelect}
          onEmployeeDeselect={handleEmployeeDeselect}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          loading={loading}
        />
      </div>

      {/* Contrôles et options */}
      <CotisationCNPSControls
        employerOptions={employerOptions}
        setEmployerOptions={setEmployerOptions}
        taxOptions={taxOptions}
        setTaxOptions={setTaxOptions}
        uniformTransport={uniformTransport}
        setUniformTransport={setUniformTransport}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onReloadFromPayslips={handleForceReload}
        onSave={handleSave}
        onExportCNPDF={handleExportCNPDF}
        onExportTaxesPDF={handleExportTaxesPDF}
        onExportExcel={handleExportExcel}
        selectedIds={selectedIds}
        saving={saving}
        loading={loading}
      />

      {/* Tableau des cotisations */}
      {selectedIds.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">
            Tableau des Cotisations ({selectedIds.length} employé{selectedIds.length > 1 ? 's' : ''})
          </h3>

          {/* Switch de vue */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Vue:</span>
            <button
              className={`px-3 py-1 rounded border ${viewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => setViewMode('detailed')}
            >
              Détaillée
            </button>
            <button
              className={`px-3 py-1 rounded border ${viewMode === 'declaration' ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => setViewMode('declaration')}
            >
              Déclaration CNPS
            </button>
            <button
              className={`px-3 py-1 rounded border ${viewMode === 'dipe' ? 'bg-blue-600 text-white' : 'bg-white'}`}
              onClick={() => setViewMode('dipe')}
            >
              DIPE
            </button>
          </div>
          
          <CotisationCNPSTable
            selectedIds={selectedIds}
            formData={formData}
            employerOptions={employerOptions}
            taxOptions={taxOptions}
            tableTotals={tableTotals}
            onEmployeeSelect={handleEmployeeSelect}
            onEmployeeDeselect={handleEmployeeDeselect}
            viewMode={viewMode}
            cnpsEmployeur={cnpsEmployeur}
            employees={employees}
          />
        </div>
      )}

    </div>
  );
};

export default CotisationCNPS;
