// src/components/CotisationCNPSTable.jsx
// Composant tableau pour l'affichage des cotisations CNPS - Version optimisée sans scroll
// ACTUALISÉ: 27/09/2025 - Disposition responsive et identification claire

import React from "react";
import { formatFR } from "../utils/numberUtils";
import { 
  getCalculs, 
  computeTaxes, 
  computeSBT,
  computeSBC,
  computeSNC,
  computeIRPPFromSNC,
  categorizeAmounts, 
  getPayComponents,
  computeNetPay,
  computeStatutoryDeductions,
  computeGrossTotal,
  computePVID,
  computeTDL,
  CNPS_CAP,
  calculerCNPS,
  applyEmployerOptionsToCNPS,
  computeEmployerChargesFromBases,
  computeCompletePayroll
} from "../utils/payrollCalculations";
import { checkCalculationsUpdated } from "../utils/calculationChecker";

const CotisationCNPSTable = ({ 
  selectedIds, 
  formData, 
  employerOptions, 
  taxOptions, 
  tableTotals,
  onEmployeeSelect,
  onEmployeeDeselect = () => {},
  viewMode = 'detailed',
  cnpsEmployeur,
  employees
}) => {
  
  // Vérification de l'actualisation des calculs au chargement
  React.useEffect(() => {
    console.log('🔄 Vérification de l\'actualisation des calculs...');
    try {
      checkCalculationsUpdated();
    } catch (error) {
      console.warn('⚠️ Erreur lors de la vérification des calculs:', error);
    }
  }, []);

  // Calculs centralisés pour tous les employés sélectionnés
  const employeeCalculations = React.useMemo(() => {
    const calculations = {};
    selectedIds.forEach((id) => {
      const d = formData[id] || {};
      const emp = employees?.find(e => e.id === id);
      const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
      const latestPayslip = payslips[payslips.length - 1] || {};
      
      const baseSalaryValue = Number(
        latestPayslip.salaryDetails?.baseSalary ?? d.baseSalary ?? d.brut ?? emp?.baseSalary ?? 0
      );
      const salaryDetails = { baseSalary: baseSalaryValue };
      
      const remuneration = {
        total: Number(latestPayslip.remuneration?.total ?? d.brut ?? baseSalaryValue ?? 0)
      };
      
      const primes = Array.isArray(latestPayslip.primes) ? latestPayslip.primes : [];
      const indemnites = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites : [];
      
      // Utiliser computeCompletePayroll pour garantir la cohérence
      const payslipData = {
        salaryDetails,
        remuneration,
        primes,
        indemnites
      };
      const calc = computeCompletePayroll(payslipData);
      
      // Calculs CNPS avec les bases correctes
      const employerCharges = computeEmployerChargesFromBases(calc.sbc, calc.sbt, { 
        baseSalary: baseSalaryValue,
        rpCategory: employerOptions?.rpCategory || 'A'
      });
      
      const cnpsCalculs = {
        baseCotisable: calc.sbc,
        cotisSalarie: calc.deductions.pvid,
        prestationsFamilles: employerCharges.prestationsFamiliales,
        prestationsFamiliales: employerCharges.prestationsFamiliales,
        pvidEmployeur: employerCharges.pvidEmployeur,
        risquesProfessionnels: employerCharges.risquesPro,
        cotisEmployeur: employerCharges.totalCNPS_Employeur,
        fneEmployeur: employerCharges.fneEmployeur,
        cfcEmployeur: employerCharges.cfcEmployeur,
        totalGlobal: calc.deductions.pvid + employerCharges.totalCNPS_Employeur
      };
      
      calculations[id] = {
        employee: emp,
        latestPayslip,
        salaryDetails,
        remuneration,
        primes,
        indemnites,
        netPayResult: { netPay: calc.netPay, grossTotal: calc.grossTotal },
        statutoryDeductions: calc.deductions,
        cnpsCalculs,
        sbt: calc.sbt,
        sbc: calc.sbc
      };
    });
    return calculations;
  }, [selectedIds, formData, employerOptions, taxOptions, employees]);

  if (selectedIds.length === 0) {
    return (
      <div className="w-full text-center py-12 px-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun employé sélectionné</h3>
        <p className="text-gray-600">Sélectionnez des employés pour afficher le tableau des cotisations</p>
      </div>
    );
  }

  // Vue IMPÔTS - Format tableau comme les autres vues
  if (viewMode === 'impots') {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">💰</span>
          <h2 className="text-xl font-bold text-gray-800">Tableau des Impôts et Taxes</h2>
        </div>

        {/* Version Mobile uniquement : Cards responsive */}
        <div className="md:hidden space-y-4">
          {selectedIds.map((id, index) => {
            const d = formData[id] || {};
            const calc = employeeCalculations[id];
            if (!calc) return null;
            
            const { sbt, sbc, statutoryDeductions, salaryDetails } = calc;
            const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
            const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
            
            const r = (n) => Math.round(n || 0);
            const vIrpp = r(statutoryDeductions.irpp || 0);
            const vCac = r(statutoryDeductions.cac || 0);
            const vCfc = r(statutoryDeductions.cfc || 0);
            const vRav = r(statutoryDeductions.rav || 0);
            const vTdl = r(statutoryDeductions.tdl || 0);
            const vFne = r(statutoryDeductions.fne || 0);

            return (
              <div key={id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* En-tête employé */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{d.nom || 'N/A'}</h3>
                      <p className="text-orange-100 text-sm">N° {index + 1} | CNPS: {d.cnps || 'N/A'}</p>
                      <p className="text-orange-100 text-xs">SBT: {formatFR(sbt)} FCFA</p>
                    </div>
                    <button
                      onClick={() => onEmployeeDeselect(id)}
                      className="text-white hover:text-red-200 text-xl"
                      title="Retirer de la sélection"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {/* Impôts et taxes */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-xs text-gray-600">IRPP</div>
                      <div className="font-bold text-blue-600">{formatFR(vIrpp)} FCFA</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs text-gray-600">CAC (10%)</div>
                      <div className="font-bold">{formatFR(vCac)} FCFA</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-xs text-gray-600">CFC Salarié (1%)</div>
                      <div className="font-bold">{formatFR(vCfc)} FCFA</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-xs text-gray-600">CFC Employeur (1,5%)</div>
                      <div className="font-bold text-green-600">{formatFR(employerCharges.cfcEmployeur)} FCFA</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">RAV</div>
                      <div className="font-bold">{formatFR(vRav)} FCFA</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-xs text-gray-600">TDL</div>
                      <div className="font-bold">{formatFR(vTdl)} FCFA</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between font-bold">
                      <span>Total Impôts Salarié:</span>
                      <span className="text-red-600">{formatFR(vIrpp + vCac + vCfc + vRav + vTdl)} FCFA</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Version Tablette/Desktop : Tableau */}
        <div className="hidden md:block w-full overflow-x-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full min-w-[1024px] md:min-w-0">
              <thead className="bg-orange-500 text-white">
                <tr>
                  <th className="p-3 text-left whitespace-nowrap">Employé</th>
                  <th className="p-3 text-right whitespace-nowrap">SBT</th>
                  <th className="p-3 text-right whitespace-nowrap">IRPP</th>
                  <th className="p-3 text-right whitespace-nowrap">CAC</th>
                  <th className="p-3 text-right whitespace-nowrap">CFC Sal</th>
                  <th className="p-3 text-right whitespace-nowrap">CFC Emp</th>
                  <th className="p-3 text-right whitespace-nowrap">RAV</th>
                  <th className="p-3 text-right whitespace-nowrap">TDL</th>
                  <th className="p-3 text-right whitespace-nowrap">Total Sal</th>
                  <th className="p-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedIds.map((id, index) => {
                  const d = formData[id] || {};
                  const calc = employeeCalculations[id];
                  if (!calc) return null;
                  
                  const { sbt, sbc, statutoryDeductions, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  
                  const r = (n) => Math.round(n || 0);
                  const vIrpp = r(statutoryDeductions.irpp || 0);
                  const vCac = r(statutoryDeductions.cac || 0);
                  const vCfc = r(statutoryDeductions.cfc || 0);
                  const vRav = r(statutoryDeductions.rav || 0);
                  const vTdl = r(statutoryDeductions.tdl || 0);
                  const totalSalarie = vIrpp + vCac + vCfc + vRav + vTdl;

                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{d.nom || 'N/A'}</div>
                          <div className="text-xs text-gray-500">CNPS: {d.cnps || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium whitespace-nowrap">{formatFR(sbt)}</td>
                      <td className="p-3 text-right text-blue-600 whitespace-nowrap">{formatFR(vIrpp)}</td>
                      <td className="p-3 text-right whitespace-nowrap">{formatFR(vCac)}</td>
                      <td className="p-3 text-right whitespace-nowrap">{formatFR(vCfc)}</td>
                      <td className="p-3 text-right text-green-600 whitespace-nowrap">{formatFR(employerCharges.cfcEmployeur)}</td>
                      <td className="p-3 text-right whitespace-nowrap">{formatFR(vRav)}</td>
                      <td className="p-3 text-right whitespace-nowrap">{formatFR(vTdl)}</td>
                      <td className="p-3 text-right font-bold text-red-600 whitespace-nowrap">{formatFR(totalSalarie)}</td>
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onEmployeeDeselect(id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                          title="Retirer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-3">TOTAUX</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + (calc?.sbt || 0);
                  }, 0))}</td>
                  <td className="p-3 text-right text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.irpp || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.cac || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.cfc || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right text-green-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    const { sbt, sbc, salaryDetails } = calc;
                    const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                    const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                    return acc + (employerCharges.cfcEmployeur || 0);
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.rav || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.tdl || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right text-red-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    const vIrpp = Math.round(Number(calc?.statutoryDeductions.irpp || 0));
                    const vCac = Math.round(Number(calc?.statutoryDeductions.cac || 0));
                    const vCfc = Math.round(Number(calc?.statutoryDeductions.cfc || 0));
                    const vRav = Math.round(Number(calc?.statutoryDeductions.rav || 0));
                    const vTdl = Math.round(Number(calc?.statutoryDeductions.tdl || 0));
                    return acc + (vIrpp + vCac + vCfc + vRav + vTdl);
                  }, 0))}</td>
                  <td className="p-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Vue DÉCLARATION CNPS - Format tableau optimisé
  if (viewMode === 'declaration') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">🏛️</span>
          <h2 className="text-xl font-bold text-gray-800">Déclaration CNPS Officielle</h2>
        </div>
        
        {/* Version mobile uniquement : Cards responsive */}
        <div className="md:hidden space-y-4">
          {selectedIds.map(id => {
            const d = formData[id] || {};
            const calc = employeeCalculations[id];
            if (!calc) return null;
            
            const { cnpsCalculs } = calc;

            return (
              <div key={id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{d.nom || 'N/A'}</h3>
                    <p className="text-sm text-gray-500">Mat: {d.matricule || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => onEmployeeDeselect(id)}
                    className="text-red-500 hover:text-red-700 text-xl"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Base Cotisable</div>
                    <div className="font-medium">{formatFR(cnpsCalculs.baseCotisable)} FCFA</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">PVID Salarié</div>
                    <div className="font-medium">{formatFR(cnpsCalculs.cotisSalarie)} FCFA</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Prestations Familiales</div>
                    <div className="font-medium">{formatFR(cnpsCalculs.prestationsFamilles)} FCFA</div>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">PVID Employeur</div>
                    <div className="font-medium">{formatFR(cnpsCalculs.pvidEmployeur)} FCFA</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Risques Prof.</div>
                    <div className="font-medium">{formatFR(cnpsCalculs.risquesProfessionnels)} FCFA</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600 text-xs">Total Global</div>
                    <div className="font-bold text-lg">{formatFR(cnpsCalculs.totalGlobal)} FCFA</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Version Tablette/Desktop : Tableau */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="p-3 text-left font-semibold">Matricule</th>
                <th className="p-3 text-left font-semibold">Nom Complet</th>
                <th className="p-3 text-right font-semibold">Base Cotisable</th>
                <th className="p-3 text-right font-semibold">PVID Salarié</th>
                <th className="p-3 text-right font-semibold">Prestations Fam.</th>
                <th className="p-3 text-right font-semibold">PVID Employeur</th>
                <th className="p-3 text-right font-semibold">Risques Prof.</th>
                <th className="p-3 text-right font-semibold">Total Global</th>
                <th className="p-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedIds.map((id, index) => {
                const d = formData[id] || {};
                const calc = employeeCalculations[id];
                if (!calc) return null;
                
                const { cnpsCalculs } = calc;

                return (
                  <tr key={id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-3 border-b border-gray-100">{d.matricule || '-'}</td>
                    <td className="p-3 border-b border-gray-100 font-medium">{d.nom || '-'}</td>
                    <td className="p-3 border-b border-gray-100 text-right">{formatFR(cnpsCalculs.baseCotisable)}</td>
                    <td className="p-3 border-b border-gray-100 text-right text-green-600">{formatFR(cnpsCalculs.cotisSalarie)}</td>
                    <td className="p-3 border-b border-gray-100 text-right text-yellow-600">{formatFR(cnpsCalculs.prestationsFamilles)}</td>
                    <td className="p-3 border-b border-gray-100 text-right text-purple-600">{formatFR(cnpsCalculs.pvidEmployeur)}</td>
                    <td className="p-3 border-b border-gray-100 text-right text-red-600">{formatFR(cnpsCalculs.risquesProfessionnels)}</td>
                    <td className="p-3 border-b border-gray-100 text-right font-bold text-blue-600">{formatFR(cnpsCalculs.totalGlobal)}</td>
                    <td className="p-3 border-b border-gray-100 text-center">
                      <button
                        onClick={() => onEmployeeDeselect(id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                        title="Retirer de la sélection"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200">
              <tr className="font-bold">
                <td className="p-3 border-t-2 border-gray-300">TOTAUX</td>
                <td className="p-3 border-t-2 border-gray-300">-</td>
                <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.baseCotisable) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.cotisSalarie) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.prestationsFamilles) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.pvidEmployeur) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.risquesProfessionnels) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300 text-right text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  return acc + (Number(calc?.cnpsCalculs.totalGlobal) || 0);
                }, 0))}</td>
                <td className="p-3 border-t-2 border-gray-300">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // Vue DIPE - Format tableau comme les autres vues
  if (viewMode === 'dipe') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-2xl">📋</span>
          <h2 className="text-xl font-bold text-gray-800">Format DIPE - Déclaration Fiscale</h2>
        </div>

        {/* Version Mobile uniquement : Cards responsive */}
        <div className="md:hidden space-y-4">
          {selectedIds.map((id, index) => {
            const d = formData[id] || {};
            const calc = employeeCalculations[id];
            if (!calc) return null;
            
            const { sbt, sbc, statutoryDeductions, primes, indemnites, salaryDetails, remuneration, netPayResult } = calc;
            const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
            const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
            
            // Code CNPS
            const mois = String(d.mois || '').padStart(2, '0');
            const annee = String(d.annee || '');
            const regime = d.regime || 'GC';
            const cnpsEmp = (cnpsEmployeur || '').toString();
            const cnpsSal = (d.cnps || '').toString();
            const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
            const codeCNPS = `${annee}${mois}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;

            const r = (n) => Math.round(n || 0);
            const vIrpp = r(statutoryDeductions.irpp || 0);
            const vCac = r(statutoryDeductions.cac || 0);
            const vCfc = r(statutoryDeductions.cfc || 0);
            const vRav = r(statutoryDeductions.rav || 0);
            const vTdl = r(statutoryDeductions.tdl || 0);

            return (
              <div key={id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* En-tête employé */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{d.nom || 'N/A'}</h3>
                      <p className="text-purple-100 text-sm">N° {index + 1} | CNPS: {d.cnps || 'N/A'}</p>
                      <p className="text-purple-100 text-xs">Code: {codeCNPS}</p>
                    </div>
                    <button
                      onClick={() => onEmployeeDeselect(id)}
                      className="text-white hover:text-red-200 text-xl"
                      title="Retirer de la sélection"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {/* Section Salarié */}
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-800 mb-2">👤 Déductions Salarié</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>IRPP:</span>
                        <span className="font-medium">{formatFR(vIrpp)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CAC:</span>
                        <span className="font-medium">{formatFR(vCac)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CFC:</span>
                        <span className="font-medium">{formatFR(vCfc)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAV:</span>
                        <span className="font-medium">{formatFR(vRav)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>TDL:</span>
                        <span className="font-medium">{formatFR(vTdl)} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Section Employeur */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-green-800 mb-2">🏢 Charges Employeur</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>PVID Emp:</span>
                        <span className="font-medium">{formatFR(employerCharges.pvidEmployeur)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PF:</span>
                        <span className="font-medium">{formatFR(employerCharges.prestationsFamiliales)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RP:</span>
                        <span className="font-medium">{formatFR(employerCharges.risquesPro)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FNE Emp:</span>
                        <span className="font-medium">{formatFR(employerCharges.fneEmployeur)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CFC Emp:</span>
                        <span className="font-medium">{formatFR(employerCharges.cfcEmployeur)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Version Tablette/Desktop : Tableau */}
        <div className="hidden md:block overflow-x-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-purple-500 text-white">
                <tr>
                  <th className="p-3 text-left">Employé</th>
                  <th className="p-3 text-center">Code CNPS</th>
                  <th className="p-3 text-right">IRPP</th>
                  <th className="p-3 text-right">CAC</th>
                  <th className="p-3 text-right">CFC Sal</th>
                  <th className="p-3 text-right">RAV</th>
                  <th className="p-3 text-right">TDL</th>
                  <th className="p-3 text-right">FNE Emp</th>
                  <th className="p-3 text-right">CFC Emp</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedIds.map((id, index) => {
                  const d = formData[id] || {};
                  const calc = employeeCalculations[id];
                  if (!calc) return null;
                  
                  const { sbt, sbc, statutoryDeductions, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  
                  const mois = String(d.mois || '').padStart(2, '0');
                  const annee = String(d.annee || '');
                  const regime = d.regime || 'GC';
                  const cnpsEmp = (cnpsEmployeur || '').toString();
                  const cnpsSal = (d.cnps || '').toString();
                  const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
                  const codeCNPS = `${annee}${mois}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;

                  const r = (n) => Math.round(n || 0);
                  const vIrpp = r(statutoryDeductions.irpp || 0);
                  const vCac = r(statutoryDeductions.cac || 0);
                  const vCfc = r(statutoryDeductions.cfc || 0);
                  const vRav = r(statutoryDeductions.rav || 0);
                  const vTdl = r(statutoryDeductions.tdl || 0);

                  return (
                    <tr key={id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{d.nom || 'N/A'}</div>
                          <div className="text-xs text-gray-500">CNPS: {d.cnps || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-3 text-center text-xs font-mono">{codeCNPS}</td>
                      <td className="p-3 text-right">{formatFR(vIrpp)}</td>
                      <td className="p-3 text-right">{formatFR(vCac)}</td>
                      <td className="p-3 text-right">{formatFR(vCfc)}</td>
                      <td className="p-3 text-right">{formatFR(vRav)}</td>
                      <td className="p-3 text-right">{formatFR(vTdl)}</td>
                      <td className="p-3 text-right text-green-600">{formatFR(employerCharges.fneEmployeur)}</td>
                      <td className="p-3 text-right text-green-600">{formatFR(employerCharges.cfcEmployeur)}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{formatFR(vIrpp + vCac + vCfc + vRav + vTdl + employerCharges.fneEmployeur + employerCharges.cfcEmployeur)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onEmployeeDeselect(id)}
                          className="text-red-500 hover:text-red-700"
                          title="Retirer"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td className="p-3">TOTAUX</td>
                  <td className="p-3 text-center">-</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.irpp || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.cac || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.cfc || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.rav || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.tdl || 0));
                  }, 0))}</td>
                  <td className="p-3 text-right text-green-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    const { sbt, sbc, salaryDetails } = calc;
                    const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                    const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                    return acc + (employerCharges.fneEmployeur || 0);
                  }, 0))}</td>
                  <td className="p-3 text-right text-green-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    const { sbt, sbc, salaryDetails } = calc;
                    const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                    const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                    return acc + (employerCharges.cfcEmployeur || 0);
                  }, 0))}</td>
                  <td className="p-3 text-right font-bold text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    const { sbt, sbc, statutoryDeductions, salaryDetails } = calc;
                    const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                    const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                    const vIrpp = Math.round(Number(statutoryDeductions.irpp || 0));
                    const vCac = Math.round(Number(statutoryDeductions.cac || 0));
                    const vCfc = Math.round(Number(statutoryDeductions.cfc || 0));
                    const vRav = Math.round(Number(statutoryDeductions.rav || 0));
                    const vTdl = Math.round(Number(statutoryDeductions.tdl || 0));
                    return acc + (vIrpp + vCac + vCfc + vRav + vTdl + employerCharges.fneEmployeur + employerCharges.cfcEmployeur);
                  }, 0))}</td>
                  <td className="p-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Vue DÉTAILLÉE - Format responsive avec priorité aux informations essentielles
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📊</span>
        <h2 className="text-xl font-bold text-gray-800">Tableau Détaillé des Cotisations</h2>
      </div>

      {/* Version Mobile uniquement : Cards responsive */}
      <div className="md:hidden space-y-4">
        {selectedIds.map((id, index) => {
          const d = formData[id] || {};
          const calc = employeeCalculations[id];
          if (!calc) return null;
          
          const { sbt, sbc, statutoryDeductions, primes, indemnites, salaryDetails, remuneration, netPayResult } = calc;
          
          // Code CNPS
          const mois = String(d.mois || '').padStart(2, '0');
          const annee = String(d.annee || '');
          const regime = d.regime || 'GC';
          const cnpsEmp = (cnpsEmployeur || '').toString();
          const cnpsSal = (d.cnps || '').toString();
          const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
          const codeCNPS = `${annee}${mois}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;
          
          // Primes et indemnités
          const primesTotal = primes.reduce((sum, p) => sum + (Number(p.montant ?? p.amount ?? 0)), 0);
          const indemnitesTotal = indemnites.reduce((sum, i) => sum + (Number(i.montant ?? i.amount ?? 0)), 0);
          const totalPrimesIndemnites = primesTotal + indemnitesTotal;

          // Déductions
          const r = (n) => Math.round(n || 0);
          const vIrpp = r(statutoryDeductions.irpp || 0);
          const vCac = r(statutoryDeductions.cac || 0);
          const vCfc = r(statutoryDeductions.cfc || 0);
          const vRav = r(statutoryDeductions.rav || 0);
          const vTdl = r(statutoryDeductions.tdl || 0);
          const vPvid = r(statutoryDeductions.pvid || 0);
          const fneEmpDet = r(statutoryDeductions.fne || 0);
          const netToPay = r(netPayResult.netPay || 0);

          return (
            <div key={id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* En-tête employé */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{d.nom || 'N/A'}</h3>
                    <p className="text-blue-100 text-sm">N° {index + 1} | CNPS: {d.cnps || 'N/A'}</p>
                    <p className="text-blue-100 text-xs">Code: {codeCNPS}</p>
                  </div>
                  <button
                    onClick={() => onEmployeeDeselect(id)}
                    className="text-white hover:text-red-200 text-xl"
                    title="Retirer de la sélection"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* Informations de base */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">💰 Rémunération</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-xs text-gray-600">Salaire de Base</div>
                      <div className="font-bold text-sm">{formatFR(salaryDetails.baseSalary)} FCFA</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-xs text-gray-600">SBT (Taxable)</div>
                      <div className="font-bold text-sm">{formatFR(sbt)} FCFA</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <div className="text-xs text-gray-600">SBC (Cotisable)</div>
                      <div className="font-bold text-sm">{formatFR(sbc)} FCFA</div>
                    </div>
                  </div>
                </div>

                {/* Primes et indemnités */}
                {totalPrimesIndemnites > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">🎁 Primes & Indemnités</h4>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between text-sm">
                        <span>Total</span>
                        <span className="font-bold">{formatFR(totalPrimesIndemnites)} FCFA</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Primes: {formatFR(primesTotal)} | Indemnités: {formatFR(indemnitesTotal)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Déductions */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2">📋 Déductions</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">IRPP:</span>
                        <span className="font-medium text-red-600">{formatFR(vIrpp)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CAC:</span>
                        <span className="font-medium">{formatFR(vCac)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CFC:</span>
                        <span className="font-medium">{formatFR(vCfc)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PVID:</span>
                        <span className="font-medium text-blue-600">{formatFR(vPvid)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">RAV:</span>
                        <span className="font-medium">{formatFR(vRav)} FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">TDL:</span>
                        <span className="font-medium">{formatFR(vTdl)} FCFA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net à payer */}
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">💵 Net à Payer</span>
                    <span className="font-bold text-lg text-green-600">{formatFR(netToPay)} FCFA</span>
                  </div>
                </div>

                {/* Période */}
                <div className="mt-3 text-center text-xs text-gray-500 bg-gray-50 py-2 rounded">
                  Période: {mois}/{annee} | Poste: {d.poste || 'N/A'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Version Tablette/Desktop : Tableau optimisé */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left font-semibold sticky left-0 bg-blue-500">Employé</th>
                  <th className="p-3 text-right font-semibold">Salaire Base</th>
                  <th className="p-3 text-right font-semibold">Brut Total</th>
                  <th className="p-3 text-right font-semibold">SBT</th>
                  <th className="p-3 text-right font-semibold">SBC</th>
                  <th className="p-3 text-right font-semibold">Primes & Indem.</th>
                  <th className="p-3 text-right font-semibold">IRPP</th>
                  <th className="p-3 text-right font-semibold">PVID</th>
                  <th className="p-3 text-right font-semibold">Autres Déd.</th>
                  <th className="p-3 text-right font-semibold">Net à Payer</th>
                  <th className="p-3 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {selectedIds.map((id, index) => {
                  const d = formData[id] || {};
                  const calc = employeeCalculations[id];
                  if (!calc) return null;
                  
                  const { sbt, sbc, statutoryDeductions, primes, indemnites, salaryDetails, remuneration, netPayResult } = calc;
                  
                  const primesTotal = primes.reduce((sum, p) => sum + (Number(p.montant) || 0), 0);
                  const indemnitesTotal = indemnites.reduce((sum, i) => sum + (Number(i.montant) || 0), 0);
                  const totalPrimesIndemnites = primesTotal + indemnitesTotal;

                  const r = (n) => Math.round(n || 0);
                  const vIrpp = r(statutoryDeductions.irpp || 0);
                  const vPvid = r(statutoryDeductions.pvid || 0);
                  const vCfc = r(statutoryDeductions.cfc || 0);
                  const vCac = r(statutoryDeductions.cac || 0);
                  const vRav = r(statutoryDeductions.rav || 0);
                  const vTdl = r(statutoryDeductions.tdl || 0);
                  const autresDeductions = vCfc + vCac + vRav + vTdl;
                  const netToPay = r(netPayResult.netPay || 0);

                  return (
                    <tr key={id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-3 border-b border-gray-100 sticky left-0 bg-white">
                        <div>
                          <div className="font-medium text-gray-900">{d.nom || 'N/A'}</div>
                          <div className="text-xs text-gray-500">CNPS: {d.cnps || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-3 border-b border-gray-100 text-right">{formatFR(salaryDetails.baseSalary)}</td>
                      <td className="p-3 border-b border-gray-100 text-right">{formatFR(netPayResult.grossTotal)}</td>
                      <td className="p-3 border-b border-gray-100 text-right font-medium text-blue-600">{formatFR(sbt)}</td>
                      <td className="p-3 border-b border-gray-100 text-right font-medium text-purple-600">{formatFR(sbc)}</td>
                      <td className="p-3 border-b border-gray-100 text-right">{totalPrimesIndemnites > 0 ? formatFR(totalPrimesIndemnites) : '-'}</td>
                      <td className="p-3 border-b border-gray-100 text-right font-medium text-red-600">{formatFR(vIrpp)}</td>
                      <td className="p-3 border-b border-gray-100 text-right font-medium text-blue-600">{formatFR(vPvid)}</td>
                      <td className="p-3 border-b border-gray-100 text-right">{autresDeductions > 0 ? formatFR(autresDeductions) : '-'}</td>
                      <td className="p-3 border-b border-gray-100 text-right font-bold text-green-600">{formatFR(netToPay)}</td>
                      <td className="p-3 border-b border-gray-100 text-center">
                        <button
                          onClick={() => onEmployeeDeselect(id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                          title="Retirer de la sélection"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gradient-to-r from-gray-100 to-gray-200">
                <tr className="font-bold">
                  <td className="p-3 border-t-2 border-gray-300 sticky left-0 bg-gray-100">
                    TOTAUX ({selectedIds.length} employés)
                  </td>
                  <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + (Number(calc?.salaryDetails.baseSalary) || 0);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + (Number(calc?.netPayResult.grossTotal) || 0);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + (calc?.sbt || 0);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right text-purple-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + (calc?.sbc || 0);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    if (!calc) return acc;
                    const primesTotal = calc.primes.reduce((sum, p) => sum + (Number(p.montant ?? p.amount ?? 0)), 0);
                    const indemnitesTotal = calc.indemnites.reduce((sum, i) => sum + (Number(i.montant ?? i.amount ?? 0)), 0);
                    return acc + (primesTotal + indemnitesTotal);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right text-red-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.irpp || 0));
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.statutoryDeductions.pvid || 0));
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    if (!calc) return acc;
                    const vCfc = Math.round(Number(calc.statutoryDeductions.cfc || 0));
                    const vCac = Math.round(Number(calc.statutoryDeductions.cac || 0));
                    const vRav = Math.round(Number(calc.statutoryDeductions.rav || 0));
                    const vTdl = Math.round(Number(calc.statutoryDeductions.tdl || 0));
                    return acc + (vCfc + vCac + vRav + vTdl);
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300 text-right text-green-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const calc = employeeCalculations[id];
                    return acc + Math.round(Number(calc?.netPayResult.netPay || 0));
                  }, 0))}</td>
                  <td className="p-3 border-t-2 border-gray-300">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Résumé Employeur - Charges CNPS */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-500 text-white p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>🏛️</span>
            Charges CNPS Employeur
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-green-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.pvidEmployeur || 0);
                }, 0))}
              </div>
              <div className="text-xs text-gray-600">PVID Employeur</div>
              <div className="text-xs text-gray-500">(4,2% du SBC)</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.prestationsFamiliales || 0);
                }, 0))}
              </div>
              <div className="text-xs text-gray-600">Prestations Familiales</div>
              <div className="text-xs text-gray-500">(7% du SBC)</div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-orange-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.risquesPro || 0);
                }, 0))}
              </div>
              <div className="text-xs text-gray-600">Risques Professionnels</div>
              <div className="text-xs text-gray-500">(1,75% du SBC)</div>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-100 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-800">Total Charges CNPS:</span>
              <span className="text-xl font-bold text-blue-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.totalCNPS_Employeur || 0);
                }, 0))} FCFA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé Employeur - Charges Fiscales */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-purple-500 text-white p-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>💰</span>
            Charges Fiscales Employeur
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-yellow-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.fneEmployeur || 0);
                }, 0))}
              </div>
              <div className="text-xs text-gray-600">FNE Employeur</div>
              <div className="text-xs text-gray-500">(1% du SBT)</div>
            </div>
            
            <div className="bg-teal-50 p-4 rounded-lg text-center">
              <div className="text-xl font-bold text-teal-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.cfcEmployeur || 0);
                }, 0))}
              </div>
              <div className="text-xs text-gray-600">CFC Employeur</div>
              <div className="text-xs text-gray-500">(1,5% du SBT)</div>
            </div>
          </div>
          
          <div className="mt-4 bg-purple-100 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-purple-800">Total Charges Fiscales:</span>
              <span className="text-xl font-bold text-purple-600">
                {formatFR(selectedIds.reduce((acc, id) => {
                  const calc = employeeCalculations[id];
                  const { sbt, sbc, salaryDetails } = calc;
                  const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
                  const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
                  return acc + (employerCharges.totalAutresEmployeur || 0);
                }, 0))} FCFA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Général */}
      <div className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm opacity-90">TOTAL GÉNÉRAL CHARGES EMPLOYEUR</div>
            <div className="text-xs opacity-75 mt-1">CNPS + Fiscales pour {selectedIds.length} employé{selectedIds.length > 1 ? 's' : ''}</div>
          </div>
          <div className="text-3xl font-bold">
            {formatFR(selectedIds.reduce((acc, id) => {
              const calc = employeeCalculations[id];
              const { sbt, sbc, salaryDetails } = calc;
              const baseSalaryValue = Number(salaryDetails?.baseSalary || 0);
              const employerCharges = computeEmployerChargesFromBases(sbc, sbt, { 
              baseSalary: baseSalaryValue,
              rpCategory: employerOptions?.rpCategory || 'A'
            });
              return acc + (employerCharges.totalEmployeur || 0);
            }, 0))} FCFA
          </div>
        </div>
      </div>
    </div>
  );
};

export default CotisationCNPSTable;