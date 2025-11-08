import React, { useEffect, useState } from 'react';
import { useDemo } from '../contexts/DemoContext';
import { INDEMNITIES, BONUSES } from '../utils/payrollLabels';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import { displayGeneratedAt, displayDate } from "../utils/displayUtils";
import { getPayslipRenderer } from "../utils/pdfTemplates/modeletemplate";
import { computeEffectiveDeductions, computeRoundedDeductions, computeNetPay, formatCFA, computeStatutoryDeductions, computeSBT, computeSBC, computeCompletePayroll } from "../utils/payrollCalculations";
import { getPayslipCacheKeyFromEmployee, setLastPayslipCache } from "../utils/payslipCache";

// Formatage monétaire importé depuis utils centralisés

// Formatage pourcentage
const formatPercent = (rate) => {
  return `${Number(rate) || 0}%`;
};

const REQUIRED_FIELDS = [
  { key: 'employee.name', label: "Nom de l'employé" },
  { key: 'employee.matricule', label: 'Matricule' },
  { key: 'salaryDetails.baseSalary', label: 'Salaire de base' },
  { key: 'payPeriod', label: 'Période de paie' },
];

function getValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

const ExportPaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt, primes, indemnites, template = 'eneo', auto = false, onExported }) => {
  // Templates disponibles (alignés avec modeletemplate.js)
  const TEMPLATE_OPTIONS = [
    { value: 'eneo', label: 'ENEO (officiel)' },
    { value: 'classic', label: 'Classique' },
    { value: 'bulletin_paie', label: 'Bulletin de Paie' },
    { value: 'compta_online', label: 'Compta Online' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  // Détection mode démo
  const { isDemoAccount } = useDemo();

  // État local pour le modèle sélectionné dans ce composant
  const initialTemplate = (template || salaryDetails?.selectedTemplate || remuneration?.selectedTemplate || 'eneo');
  const [selectedTemplate, setSelectedTemplate] = useState(String(initialTemplate).toLowerCase());

  // Synchroniser quand la prop template change depuis l'amont
  useEffect(() => {
    const next = (template || salaryDetails?.selectedTemplate || remuneration?.selectedTemplate || 'eneo');
    setSelectedTemplate(String(next).toLowerCase());
  }, [template, salaryDetails?.selectedTemplate, remuneration?.selectedTemplate]);
  
  const generatePaySlipPDF = () => {
    // En mode démo, l'export PDF est désactivé
    if (isDemoAccount) {
      if (toast) toast.info("Mode démo : l'export PDF est désactivé. Vous pouvez voir l'aperçu à l'écran.");
      return;
    }
    // Vérification des champs obligatoires
    const payslip = { employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt };
    const missing = REQUIRED_FIELDS.filter(f => !getValue(payslip, f.key));
    if (missing.length > 0) {
      const msg = "Impossible de générer le PDF. Champs manquants :\n" + missing.map(f => `- ${f.label}`).join("\n");
      if (toast) toast.error(msg);
      else alert(msg);
      return;
    }

    try {
      // Données avec fallback
      const payslipData = {
        employee: employee || {},
        employer: employer || {},
        salaryDetails: salaryDetails || {},
        remuneration: remuneration || {},
        deductions: deductions || {},
        // IMPORTANT: include variable arrays so PDF calc matches UI calc
        primes: Array.isArray(primes) ? primes : [],
        indemnites: Array.isArray(indemnites) ? indemnites : [],
        payPeriod: payPeriod || 'N/A',
        generatedAt: generatedAt || new Date(),
      };
      
      // Valeurs employé
      const emp = payslipData.employee;
      const empName = emp.name || 'N/A';
      const empMatricule = emp.matricule || 'N/A';
      const empPoste = emp.poste || emp.position || 'N/A';
      const empCategory = emp.professionalCategory || emp.category || 'N/A';
      const empCNPS = emp.cnpsNumber || 'N/A';
      const empEmail = emp.email || 'N/A';
      const empPhone = emp.phone || 'N/A';
      
      // Valeurs employeur
      const employerName = payslipData.employer.companyName || payslipData.employer.name || 'N/A';
      const employerAddress = payslipData.employer.address || 'N/A';
      const employerCNPS = payslipData.employer.cnpsNumber || 'N/A';
      const employerPhone = payslipData.employer.phone || 'N/A';
      const employerEmail = payslipData.employer.email || 'N/A';
      
      // Calculs rémunération
      const baseSalary = Number(payslipData.salaryDetails.baseSalary) || 0;
      const transportAllowance = Number(payslipData.salaryDetails.transportAllowance) || 0;
      const housingAllowance = Number(payslipData.salaryDetails.housingAllowance) || 0;
      const overtime = Number(payslipData.remuneration.overtime) || 0;
      const bonus = Number(payslipData.remuneration.bonus) || 0;
      const workedDaysInit = Number(payslipData.remuneration.workedDays) || 0;
      const workedHours = Number(payslipData.remuneration.workedHours) || 0;
      
      // Calculs centralisés via computeCompletePayroll
      const calc = computeCompletePayroll(payslipData);
      const totalGross = calc.grossTotal;
      const d = calc.deductions;
      const totalDeductions = calc.deductions.total;
      const netSalary = calc.netPay;
      const sbt = calc.sbt;
      const sbc = calc.sbc;
      
      // Valeurs supplémentaires pour compatibilité
      const representationAllowance = Number(payslipData.salaryDetails.representationAllowance) || 0;
      const dirtAllowance = Number(payslipData.salaryDetails.dirtAllowance) || 0;
      const mealAllowance = Number(payslipData.salaryDetails.mealAllowance) || 0;
      
      // Cache local des montants utiles pour CNPS (pré-remplissage)
      try {
        const empKey = getPayslipCacheKeyFromEmployee(emp);
        if (empKey) {
          const cachePayload = {
            baseSalary,
            transportAllowance,
            housingAllowance,
            overtime,
            bonus,
            representationAllowance,
            dirtAllowance,
            mealAllowance,
            // Ajout des montants calculés pour CNPS
            netToPay: Number(netSalary) || 0,
            net: Number(netSalary) || 0,
            sbt: Number(sbt) || 0,
            irpp: Number(d.irpp) || 0,
            cac: Number(d.cac) || 0,
            cfc: Number(d.cfc) || 0,
            tdl: Number(d.tdl) || 0,
            rav: Number(d.rav) || 0,
            pvis: Number(d.pvis) || 0,
            // Persist dynamic arrays when available
            primes: Array.isArray(primes)
              ? primes.map(p => ({ label: p.label || p.type, montant: Number(p.montant) || 0 }))
              : undefined,
            indemnites: Array.isArray(indemnites)
              ? indemnites.map(i => ({ label: i.label || i.type, montant: Number(i.montant) || 0 }))
              : undefined,
          };
          setLastPayslipCache(empKey, cachePayload);
        }
      } catch (e) {
        console.warn('Cache payslip CNPS indisponible:', e);
      }

      // Configuration PDF
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 12;
      let currentY = margin;

      // === MULTI-TEMPLATE SWITCH ===
      // Determine template key: local UI selection > prop > salaryDetails.selectedTemplate > remuneration.selectedTemplate
      const templateKey = (selectedTemplate || '').toLowerCase() || (template || '').toLowerCase() || (String(salaryDetails?.selectedTemplate || remuneration?.selectedTemplate || 'eneo').toLowerCase());
      const renderer = getPayslipRenderer(templateKey);
      const result = renderer(doc, {
        pageWidth,
        pageHeight,
        margin,
        currentY,
        payslipData,
        employerName,
        employerAddress,
        employerCNPS,
        employerPhone,
        emp,
        empName,
        empMatricule,
        empPoste,
        empCategory,
        empCNPS,
        baseSalary,
        transportAllowance,
        housingAllowance,
        overtime,
        bonus,
        representationAllowance,
        dirtAllowance,
        mealAllowance,
        primes: payslipData.primes || [],
        indemnites: payslipData.indemnites || [],
        d,
        totalGross,
        totalDeductions,
        netSalary,
        sbt,
        sbc,
        displayDate,
        formatCFA,
      });
      if (result?.completed) {
        if (onExported) onExported();
        if (toast) toast.success('Bulletin de salaire généré avec succès !');
        return;
      }
      
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      const errorMsg = 'Erreur lors de la génération du bulletin de salaire';
      if (toast) toast.error(errorMsg);
      else alert(errorMsg);
    }
  };

  useEffect(() => {
    if (auto) {
      generatePaySlipPDF();
    }
  }, [auto]);

  // Auto-met à jour le cache local des montants utiles pour CNPS dès qu'on modifie les données
  useEffect(() => {
    try {
      const empKey = getPayslipCacheKeyFromEmployee(employee || {});
      if (!empKey) return;
      // Recalcule le bulletin pour obtenir net et retenues à jour
      const statutory2 = computeStatutoryDeductions(salaryDetails || {}, remuneration || {}, primes || [], indemnites || []);
      const mergedDeductions2 = { ...statutory2, ...(deductions || {}) };
      const calc = computeNetPay({
        salaryDetails: salaryDetails || {},
        remuneration: remuneration || {},
        deductions: mergedDeductions2,
        primes: primes || [],
        indemnites: indemnites || [],
      });
      const { roundedDeductions: d2, netPay: net2 } = calc;
      const baseSalary2 = Number(salaryDetails?.baseSalary) || 0;
      // Use centralized SBT/SBC computations to keep cache consistent with PDFs/UI
      const sbt2 = computeSBT(
        salaryDetails || {},
        remuneration || {},
        primes || [],
        indemnites || []
      );
      const sbc2 = computeSBC(
        salaryDetails || {},
        remuneration || {},
        primes || [],
        indemnites || []
      );
      const payload = {
        baseSalary: baseSalary2,
        transportAllowance: Number(salaryDetails?.transportAllowance) || 0,
        housingAllowance: Number(salaryDetails?.housingAllowance) || 0,
        representationAllowance: Number(salaryDetails?.representationAllowance) || 0,
        dirtAllowance: Number(salaryDetails?.dirtAllowance) || 0,
        mealAllowance: Number(salaryDetails?.mealAllowance) || 0,
        overtime: Number(remuneration?.overtime) || 0,
        bonus: Number(remuneration?.bonus) || 0,
        // Champs pour CNPS
        netToPay: Number(net2) || 0,
        net: Number(net2) || 0,
        sbt: Number(sbt2) || 0,
        sbc: Number(sbc2) || 0,
        irpp: Number(d2?.irpp) || 0,
        cac: Number(d2?.cac) || 0,
        cfc: Number(d2?.cfc) || 0,
        tdl: Number(d2?.tdl) || 0,
        rav: Number(d2?.rav) || 0,
        pvid: Number(d2?.pvid) || 0,
        // Persist dynamic arrays when available
        primes: Array.isArray(primes)
          ? primes.map(p => ({ label: p.label || p.type, montant: Number(p.montant) || 0 }))
          : undefined,
        indemnites: Array.isArray(indemnites)
          ? indemnites.map(i => ({ label: i.label || i.type, montant: Number(i.montant) || 0 }))
          : undefined,
      };
      setLastPayslipCache(empKey, payload);
    } catch {}
  }, [
    employee?.matricule,
    employee?.cnpsNumber,
    employee?.name,
    salaryDetails?.baseSalary,
    salaryDetails?.transportAllowance,
    salaryDetails?.housingAllowance,
    salaryDetails?.representationAllowance,
    salaryDetails?.dirtAllowance,
    salaryDetails?.mealAllowance,
    remuneration?.overtime,
    remuneration?.bonus,
    // include arrays so cache updates if user edits them upstream
    primes,
    indemnites,
  ]);

  if (auto) return null;

  // Calcul UI centralisé
  const statutory3 = computeStatutoryDeductions(salaryDetails || {}, remuneration || {}, primes || [], indemnites || []);
  const mergedDeductions3 = { ...statutory3, ...(deductions || {}) };
  const uiCalc = computeNetPay({
    salaryDetails: salaryDetails || {},
    remuneration: remuneration || {},
    deductions: mergedDeductions3,
    primes: primes || [],
    indemnites: indemnites || []
  });
  const netToPay = uiCalc.netPay;

  return (
    <div className="mt-6 p-6 border border-gray-300 rounded-lg bg-white shadow-md">
      {/* Sélecteur de modèle (inline) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Modèle de fiche de paie</label>
        <select
          className="w-full p-2 border rounded-md"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {TEMPLATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Le modèle sélectionné ici sera utilisé pour ce PDF.</p>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Bulletin de Salaire</h3>
          <p className="text-sm text-gray-600">Format officiel République du Cameroun</p>
        </div>
      </div>
      
      <div className="bg-gray-50 p-4 rounded border mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Employé :</span>
            <span className="ml-2 text-gray-900">{employee?.name || 'Non défini'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Matricule :</span>
            <span className="ml-2 text-gray-900">{employee?.matricule || 'Non défini'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Période :</span>
            <span className="ml-2 text-gray-900">{payPeriod || 'Non définie'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Salaire de base :</span>
            <span className="ml-2 text-gray-900">{formatCFA(salaryDetails?.baseSalary)} F CFA</span>
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold text-gray-700">Net à payer :</span>
            <span className="ml-2 font-bold text-green-700 text-base">
              {formatCFA(netToPay)} F CFA
            </span>
          </div>
        </div>
      </div>
      
      {isDemoAccount ? (
        <div className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded flex items-center justify-center gap-2 border">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Mode démo — l'export PDF est désactivé. Aperçu écran uniquement.
        </div>
      ) : (
        <button
          onClick={generatePaySlipPDF}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Générer le Bulletin de Salaire PDF
        </button>
      )}

      {/* Aperçu dynamique Type / Montant (écran) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Indemnités */}
        <div className="bg-gray-50 rounded border p-4">
          <div className="font-semibold text-gray-800 mb-3">Indemnités</div>
          <div className="space-y-2">
            {INDEMNITIES
              .map(item => ({
                label: item.label,
                amount: Number(salaryDetails?.[item.key]) || 0,
              }))
              .filter(x => x.amount > 0)
              .map((x, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{x.label}</span>
                  <span className="font-medium">{formatCFA(x.amount)} F CFA</span>
                </div>
              ))}
            {INDEMNITIES.every(i => (Number(salaryDetails?.[i.key]) || 0) === 0) && (
              <div className="text-gray-400">—</div>
            )}
          </div>
        </div>

        {/* Primes */}
        <div className="bg-gray-50 rounded border p-4">
          <div className="font-semibold text-gray-800 mb-3">Primes</div>
          <div className="space-y-2">
            {BONUSES
              .map(item => ({
                label: item.label,
                amount: Number(remuneration?.[item.key]) || 0,
              }))
              .filter(x => x.amount > 0)
              .map((x, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700">{x.label}</span>
                  <span className="font-medium">{formatCFA(x.amount)} F CFA</span>
                </div>
              ))}
            {BONUSES.every(b => (Number(remuneration?.[b.key]) || 0) === 0) && (
              <div className="text-gray-400">—</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Conforme à la réglementation camerounaise</p>
            <ul className="text-xs space-y-1">
              <li>• Cotisations CNPS : 4,2% (salarié PVID) + 11,9% (employeur hors RP)</li>
              <li>• Crédit Foncier : 1% du salaire brut (part salarié)</li>
              <li>• Format officiel avec en-tête République du Cameroun</li>
              <li>• Calculs conformes au Code du Travail camerounais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPaySlip;