import React from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { formatFR } from "../utils/numberUtils";
import { exportCnpsPDF, exportTaxesPDF } from "../utils/pdfCnps";
import { 
  computeTaxesForEmployees,
  calculateEmployerSummary, 
  calculateTableTotals, 
  calculateTotalNet
} from "../utils/payrollCalculations";
import { generateExcelData, generateDeclarationCNPSExcelData, generateDIPEExcelData } from "../utils/excelExports";
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
    () => computeTaxesForEmployees(selectedIds, formData, employerOptions, taxOptions, employees),
    [selectedIds, formData, employerOptions, taxOptions, employees]
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
    exportCnpsPDF({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur, employees });
  };

  // Export PDF Impôts
  const handleExportTaxesPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    exportTaxesPDF({ selectedIds, taxesData, formData, cnpsEmployeur });
  };

  // Export Excel CNPS (adapté selon la vue)
  const handleExportExcelCNPS = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    
    let data, sheetName, fileName;
    
    if (viewMode === 'declaration') {
      // Vue Déclaration CNPS Officielle
      data = generateDeclarationCNPSExcelData(selectedIds, formData, employees, employerOptions);
      sheetName = "Déclaration CNPS";
      fileName = `declaration_cnps_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      // Vue Detailed (par défaut)
      data = generateExcelData(selectedIds, formData, employees, employerOptions);
      sheetName = "Cotisations CNPS";
      fileName = `cotisations_cnps_${new Date().toISOString().split('T')[0]}.xlsx`;
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
    toast.success("Export Excel CNPS généré avec succès!");
  };

  // Export Excel DIPE
  const handleExportExcelDIPE = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    
    const data = generateDIPEExcelData(selectedIds, formData, employees, employerOptions);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DIPE");
    XLSX.writeFile(wb, `dipe_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Export Excel DIPE généré avec succès!");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">

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
        onExportExcelCNPS={handleExportExcelCNPS}
        onExportExcelDIPE={handleExportExcelDIPE}
        selectedIds={selectedIds}
        saving={saving}
        loading={loading}
      />

      {/* Tableau des cotisations */}
      {selectedIds.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">

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
