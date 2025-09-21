// src/components/CotisationCNPSTable.jsx
// Composant tableau pour l'affichage des cotisations CNPS

import React from "react";
import { formatFR } from "../utils/numberUtils";
import { getCalculs, computeTaxes, getSBT, getSBC, categorizeAmounts, getPayComponents } from "../utils/payrollCalculations";
import { calculatePrimesIndemnitesTotal, getNormalizedPrimesIndemnites } from "../utils/primesIndemnitesNormalizer";

const CNPS_CAP = 750000;

const CotisationCNPSTable = ({ 
  selectedIds, 
  formData, 
  employerOptions, 
  taxOptions, 
  tableTotals,
  onEmployeeSelect,
  onEmployeeDeselect,
  viewMode = 'detailed', // 'detailed' | 'declaration' | 'dipe'
  cnpsEmployeur,
  employees
}) => {
  const taxesData = React.useMemo(
    () => computeTaxes(selectedIds, formData, employerOptions, taxOptions),
    [selectedIds, formData, employerOptions, taxOptions]
  );

  if (selectedIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Sélectionnez des employés pour voir le tableau des cotisations
      </div>
    );
  }

  // Render for 'impots' view (taxes table)
  if (viewMode === 'impots') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Nom</th>
              <th className="p-2 border">CNPS</th>
              <th className="p-2 border">SBT (Taxable)</th>
              <th className="p-2 border">IRPP</th>
              <th className="p-2 border">CAC (10% IRPP)</th>
              <th className="p-2 border">CFC Sal.</th>
              <th className="p-2 border">FNE (Sal.)</th>
              <th className="p-2 border">TDL</th>
              <th className="p-2 border">Total Impôts</th>
              <th className="p-2 border">Mois</th>
              <th className="p-2 border">Année</th>
              <th className="p-2 border">🔄</th>
            </tr>
          </thead>
          <tbody>
            {selectedIds.map((id) => {
              const d = formData[id] || {};
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const r = (n) => Math.round(Number(n || 0));
              const sbt = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
              const irpp = r(latestPayslip.deductions?.irpp || d.irpp || 0);
              const cac = r((latestPayslip.deductions?.cac != null ? latestPayslip.deductions.cac : (irpp * 0.10)));
              const cfc = r((latestPayslip.deductions?.cfc != null ? latestPayslip.deductions.cfc : (sbt * ((taxOptions?.cfcRate ?? 2.5) / 100))));
              const fne = r(sbt * ((taxOptions?.fneRate ?? 1.0) / 100));
              const tdl = r(latestPayslip.deductions?.tdl || d.tdl || 0);
              const totalImpots = irpp + cac + cfc + fne + tdl;
              const mois = String(d.mois || '').padStart(2, '0');
              const annee = String(d.annee || '');

              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="p-2 border">{d.nom || ''}</td>
                  <td className="p-2 border">{d.cnps || ''}</td>
                  <td className="p-2 border">{formatFR(sbt)} FCFA</td>
                  <td className="p-2 border">{formatFR(irpp)} FCFA</td>
                  <td className="p-2 border">{formatFR(cac)} FCFA</td>
                  <td className="p-2 border">{formatFR(cfc)} FCFA</td>
                  <td className="p-2 border">{formatFR(fne)} FCFA</td>
                  <td className="p-2 border">{formatFR(tdl)} FCFA</td>
                  <td className="p-2 border">{formatFR(totalImpots)} FCFA</td>
                  <td className="p-2 border">{mois}</td>
                  <td className="p-2 border">{annee}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => onEmployeeDeselect(id)}
                      className="text-red-600 hover:text-red-800"
                      title="Retirer de la sélection"
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="p-2 border">Totaux</td>
              <td className="p-2 border">-</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const sbt = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
                return acc + sbt;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const irpp = Math.round(Number(latestPayslip.deductions?.irpp || d.irpp || 0));
                return acc + irpp;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const irpp = Math.round(Number(latestPayslip.deductions?.irpp || d.irpp || 0));
                const cac = Math.round(Number(latestPayslip.deductions?.cac != null ? latestPayslip.deductions.cac : (irpp * 0.10)));
                return acc + cac;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const sbt = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
                const cfc = Math.round(Number(latestPayslip.deductions?.cfc != null ? latestPayslip.deductions.cfc : (sbt * ((taxOptions?.cfcRate ?? 2.5) / 100))));
                return acc + cfc;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const sbt = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
                const fne = Math.round(sbt * ((taxOptions?.fneRate ?? 1.0) / 100));
                return acc + fne;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const tdl = Math.round(Number(latestPayslip.deductions?.tdl || d.tdl || 0));
                return acc + tdl;
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const sbt = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
                const irpp = Math.round(Number(latestPayslip.deductions?.irpp || d.irpp || 0));
                const cac = Math.round(Number(latestPayslip.deductions?.cac != null ? latestPayslip.deductions.cac : (irpp * 0.10)));
                const cfc = Math.round(Number(latestPayslip.deductions?.cfc != null ? latestPayslip.deductions.cfc : (sbt * ((taxOptions?.cfcRate ?? 2.5) / 100))));
                const fne = Math.round(sbt * ((taxOptions?.fneRate ?? 1.0) / 100));
                const tdl = Math.round(Number(latestPayslip.deductions?.tdl || d.tdl || 0));
                return acc + (irpp + cac + cfc + fne + tdl);
              }, 0))}</td>
              <td className="p-2 border">-</td>
              <td className="p-2 border">-</td>
              <td className="p-2 border">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // Render for 'declaration' (formal CNPS) view
  if (viewMode === 'declaration') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Matricule</th>
              <th className="p-2 border">Nom</th>
              <th className="p-2 border">Base Cot.</th>
              <th className="p-2 border">PVID Salarié</th>
              <th className="p-2 border">PF</th>
              <th className="p-2 border">PVID Employeur</th>
              <th className="p-2 border">RP</th>
              <th className="p-2 border">Cot. Employeur</th>
              <th className="p-2 border">Total</th>
              <th className="p-2 border">🔄</th>
            </tr>
          </thead>
          <tbody>
            {selectedIds.map(id => {
              const d = formData[id] || {};
              // Aligner la base sur le dernier bulletin si disponible
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
              const dForCalc = baseFromPayslip
                ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                : d;
              const calculs = getCalculs(dForCalc, employerOptions);
              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="p-2 border">{d.matricule || ''}</td>
                  <td className="p-2 border">{d.nom || ''}</td>
                  <td className="p-2 border">{formatFR(calculs.baseCotisable)}</td>
                  <td className="p-2 border">{formatFR(calculs.cotisSalarie)}</td>
                  <td className="p-2 border">{formatFR(calculs.prestationsFamilles)}</td>
                  <td className="p-2 border">{formatFR(calculs.pvidEmployeur)}</td>
                  <td className="p-2 border">{formatFR(calculs.risquesProfessionnels)}</td>
                  <td className="p-2 border">{formatFR(calculs.cotisEmployeur)}</td>
                  <td className="p-2 border">{formatFR(calculs.totalGlobal)}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => onEmployeeDeselect(id)}
                      className="text-red-600 hover:text-red-800"
                      title="Retirer de la sélection"
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 font-semibold">
            <tr>
              <td className="p-2 border">Totaux</td>
              <td className="p-2 border">-</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.baseCotisable) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.cotisSalarie) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.prestationsFamilles) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.pvidEmployeur) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.risquesProfessionnels) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.cotisEmployeur) || 0);
              }, 0))}</td>
              <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                const d = formData[id] || {};
                const emp = employees?.find(e => e.id === id);
                const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
                const latestPayslip = payslips[payslips.length - 1] || {};
                const baseFromPayslip = Number(latestPayslip.salaryDetails?.baseSalary || 0) || 0;
                const dForCalc = baseFromPayslip
                  ? { ...d, salaryDetails: { ...(d.salaryDetails || {}), baseSalary: baseFromPayslip }, baseSalary: baseFromPayslip }
                  : d;
                const c = getCalculs(dForCalc, employerOptions);
                return acc + (Number(c.totalGlobal) || 0);
              }, 0))}</td>
              <td className="p-2 border">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ... rest of the code remains the same ...
  // Render for 'dipe' view (magnetic DIPE format)
  if (viewMode === 'dipe') {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">code cnps</th>
              <th className="p-2 border">CNPS</th>
              <th className="p-2 border">Sal cotis</th>
              <th className="p-2 border">S C P</th>
              <th className="p-2 border">N° ORD</th>
              <th className="p-2 border">matricule interne</th>
              <th className="p-2 border">IRPP</th>
              <th className="p-2 border">CAC</th>
              <th className="p-2 border">CFC</th>
              <th className="p-2 border">FNE</th>
              <th className="p-2 border">RAV</th>
              <th className="p-2 border">TDL</th>
              <th className="p-2 border">PVID</th>
              <th className="p-2 border">Primes + Indemnités</th>
              <th className="p-2 border">Total Déductions</th>
              <th className="p-2 border">🔄</th>
            </tr>
          </thead>
          <tbody>
            {selectedIds.map((id, index) => {
              const d = formData[id] || {};
              const fmt = (n) => (Number(n || 0) ? formatFR(n) : '-');
              const mois = String(d.mois || '').padStart(2, '0');
              const annee = String(d.annee || '');
              const regime = d.regime || 'GC';
              const cnpsEmp = (cnpsEmployeur || '').toString();
              const cnpsSal = (d.cnps || '').toString();
              const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
              const yearMonth = `${annee}${mois}`;
              const codeCNPS = `${yearMonth}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;

              const sbt = getSBT(d);
              const sbcDebug = getSBC(d); // Valeur SBC calculée
              console.log(`Employé ID: ${id}, SBC: ${sbcDebug}, SBC min: ${Math.min(sbcDebug, CNPS_CAP)}`);
              const sbc = sbcDebug;
              const scp = Math.min(sbc, CNPS_CAP);

              // Récupération directe depuis les payslips pour vue DIPE, en priorisant les calculs centralisés si payslip manquant
              const emp = employees.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const sbtValue = Number(latestPayslip.sbt) || getSBT(d);
              const sbcValue = Number(latestPayslip.sbc) || getSBC(d);
              const scpValue = Math.min(sbcValue, CNPS_CAP);

              // Utilise les données déjà calculées dans les payslips
              const primesTotal = Array.isArray(latestPayslip.primes) 
                ? latestPayslip.primes.reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
                : 0;
              const indemnitesTotal = Array.isArray(latestPayslip.indemnites)
                ? latestPayslip.indemnites.reduce((sum, i) => sum + (Number(i.montant) || 0), 0)
                : 0;
              const totalPrimesIndemnites = primesTotal + indemnitesTotal;

              // Total déductions depuis les champs de la fiche
              const r = (n) => Math.round(n || 0);
              const vIrpp = r(Number(latestPayslip.deductions?.irpp || d.irpp || 0));
              const vCac  = r(Number(latestPayslip.deductions?.cac || d.cac  || 0));
              const vCfc  = r(Number(latestPayslip.deductions?.cfc || d.cfc  || 0));
              const vRav  = r(Number(latestPayslip.deductions?.rav || d.rav  || 0));
              const vTdl  = r(Number(latestPayslip.deductions?.tdl || d.tdl  || 0));
              const vPvid = r(Number(latestPayslip.deductions?.pvid || latestPayslip.deductions?.pvis || d.pvid || d.pvis || 0));
              const fneSal = r((latestPayslip.sbt || getSBT(d) || 0) * ((taxOptions?.fneRate ?? 1.0) / 100));
              const totalDeductions = vIrpp + vCac + vCfc + fneSal + vRav + vTdl + vPvid;

              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="p-2 border">{codeCNPS}</td>
                  <td className="p-2 border">{d.cnps || ''}</td>
                  <td className="p-2 border">{fmt(sbtValue)}</td>
                  <td className="p-2 border">{fmt(scpValue)}</td>
                  <td className="p-2 border">{index + 1}</td>
                  <td className="p-2 border">{d.matricule || ''}</td>
                  <td className="p-2 border">{fmt(vIrpp)}</td>
                  <td className="p-2 border">{fmt(vCac)}</td>
                  <td className="p-2 border">{fmt(vCfc)}</td>
                  <td className="p-2 border">{fmt(fneSal)}</td>
                  <td className="p-2 border">{fmt(vRav)}</td>
                  <td className="p-2 border">{fmt(vTdl)}</td>
                  <td className="p-2 border">{fmt(vPvid)}</td>
                  <td className="p-2 border" title={`Primes: ${formatFR(primesTotal)} | Indemnités: ${formatFR(indemnitesTotal)}`}>{fmt(totalPrimesIndemnites)}</td>
                  <td className="p-2 border">{fmt(totalDeductions)}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => onEmployeeDeselect(id)}
                      className="text-red-600 hover:text-red-800"
                      title="Retirer de la sélection"
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // Default: 'detailed' view
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Code CNPS</th>
            <th className="p-2 border">N° ORD</th>
            <th className="p-2 border">Nom</th>
            <th className="p-2 border">CNPS</th>
            <th className="p-2 border">Salaire de base</th>
            <th className="p-2 border">Brut</th>
            <th className="p-2 border">Catégorie/Poste</th>
            <th className="p-2 border">SBT (Taxable)</th>
            <th className="p-2 border">SBC (Cotisable)</th>
            <th className="p-2 border">Primes + Indemnités</th>
            <th className="p-2 border">IRPP</th>
            <th className="p-2 border">CFC</th>
            <th className="p-2 border">FNE (Emp. 1%)</th>
            <th className="p-2 border">CAC</th>
            <th className="p-2 border">RAV</th>
            <th className="p-2 border">TDL</th>
            <th className="p-2 border">PVID (Sal. 4,2%)</th>
            <th className="p-2 border">Net à payer</th>
            <th className="p-2 border">Mois</th>
            <th className="p-2 border">Année</th>
            <th className="p-2 border">🔄</th>
          </tr>
        </thead>
        <tbody>
          {selectedIds.map((id, index) => {
            const d = formData[id] || {};
            const c = getCalculs(d, employerOptions);
            const taxRow = taxesData.rows.find(r => r.id === id) || { 
              sbt: 0, 
              irpp: 0, 
              cac: 0, 
              tdl: 0,
              rav: 0,
              pvis: 0
            };

            const sbt = getSBT(d);
            const sbc = getSBC(d);
            const scp = Math.min(sbc, 750000);
            
            // Code CNPS generation
            const mois = String(d.mois || '').padStart(2, '0');
            const annee = String(d.annee || '');
            const regime = d.regime || 'GC';
            const cnpsEmp = (cnpsEmployeur || '').toString();
            const cnpsSal = (d.cnps || '').toString();
            const jours = String(d.joursTravailles != null ? d.joursTravailles : 30).padStart(2, '0');
            const yearMonth = `${annee}${mois}`;
            const codeCNPS = `${yearMonth}-${cnpsEmp}-${regime}-${cnpsSal}-${jours}`;

            // Récupération directe depuis les payslips sans recalculs
            const emp = employees.find(e => e.id === id);
            const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
            const latestPayslip = payslips[payslips.length - 1] || {};
            
            // Utilise les données déjà calculées dans les payslips
            const primesTotal = Array.isArray(latestPayslip.primes) 
              ? latestPayslip.primes.reduce((sum, p) => sum + (Number(p.montant) || 0), 0)
              : 0;
            const indemnitesTotal = Array.isArray(latestPayslip.indemnites)
              ? latestPayslip.indemnites.reduce((sum, i) => sum + (Number(i.montant) || 0), 0)
              : 0;
            const totalPrimesIndemnites = primesTotal + indemnitesTotal;

            // Total déductions depuis les champs de la fiche
            const r = (n) => Math.round(n || 0);
            // Préparer les déductions affichées (détaillé)
            const vIrpp = r(Number(latestPayslip.deductions?.irpp || d.irpp || taxRow.irpp || 0));
            const vCac  = r(Number(latestPayslip.deductions?.cac  || d.cac  || taxRow.cac  || 0));
            const vCfc  = r(Number(latestPayslip.deductions?.cfc  || d.cfc  || taxRow.cfc  || 0));
            const vRav  = r(Number(latestPayslip.deductions?.rav  || d.rav  || taxRow.rav  || 0));
            const vTdl  = r(Number(latestPayslip.deductions?.tdl  || d.tdl  || taxRow.tdl  || 0));
            const vPvid = r(Number(latestPayslip.deductions?.pvid || latestPayslip.deductions?.pvis || d.pvid || d.pvis || taxRow.pvis || 0));
            // FNE Employeur uniquement (1% sur SBT) - n'entre pas dans le net salarié
            const fneEmpDet = r((latestPayslip.sbt || sbt || 0) * 0.01);
            // Recalcul du net à payer sans FNE salarié (seul l'employeur paie le FNE)
            const totalDeductionsCalculated = vIrpp + vCac + vCfc + vRav + vTdl + vPvid;
            const brutFromPayslip = Number(latestPayslip.remuneration?.total || d.brut || 0);
            const netToPay = r(brutFromPayslip - totalDeductionsCalculated);
            const baseSalary = Number(latestPayslip.salaryDetails?.baseSalary || d.baseSalary || 250000);
            
            return (
              <tr key={id} className="hover:bg-gray-50">
                <td className="p-2 border">{codeCNPS}</td>
                <td className="p-2 border">{index + 1}</td>
                <td className="p-2 border">{d.nom || ''}</td>
                <td className="p-2 border">{d.cnps || ''}</td>
                <td className="p-2 border">{formatFR(baseSalary)} FCFA</td>
                <td className="p-2 border">{formatFR(latestPayslip.remuneration?.total || d.brut)} FCFA</td>
                <td className="p-2 border">{d.poste || ''}</td>
                <td className="p-2 border">{formatFR(sbt)} FCFA</td>
                <td className="p-2 border">{formatFR(sbc)} FCFA</td>
                <td className="p-2 border">{formatFR(totalPrimesIndemnites)} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.irpp || d.irpp || taxRow.irpp || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.cfc || d.cfc || taxRow.cfc || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{formatFR(fneEmpDet)} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.cac || d.cac || taxRow.cac || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.rav || d.rav || taxRow.rav || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.tdl || d.tdl || taxRow.tdl || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{r(Number(latestPayslip.deductions?.pvid || latestPayslip.deductions?.pvis || d.pvid || d.pvis || taxRow.pvis || 0)).toLocaleString()} FCFA</td>
                <td className="p-2 border">{netToPay.toLocaleString()} FCFA</td>
                <td className="p-2 border">{String(d.mois || '').padStart(2, '0')}</td>
                <td className="p-2 border">{d.annee || ''}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => onEmployeeDeselect(id)}
                    className="text-red-600 hover:text-red-800"
                    title="Retirer de la sélection"
                  >
                    🔄
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-100 font-semibold">
          <tr>
            <td className="p-2 border">-</td>
            <td className="p-2 border">-</td>
            <td className="p-2 border">Totaux</td>
            <td className="p-2 border">-</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.salaryDetails?.baseSalary || 250000);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.remuneration?.total || 0);
            }, 0))}</td>
            <td className="p-2 border">-</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const d = formData[id] || {};
              return acc + Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const d = formData[id] || {};
              return acc + Number(latestPayslip.sbc || d.sbc || getSBC(d) || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const primesTotal = Array.isArray(latestPayslip.primes) ? latestPayslip.primes.reduce((sum, p) => sum + (Number(p.montant) || 0), 0) : 0;
              const indemnitesTotal = Array.isArray(latestPayslip.indemnites) ? latestPayslip.indemnites.reduce((sum, i) => sum + (Number(i.montant) || 0), 0) : 0;
              return acc + (primesTotal + indemnitesTotal);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.irpp || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.cfc || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              const d = formData[id] || {};
              const sbtVal = Number(latestPayslip.sbt || d.sbt || getSBT(d) || 0);
              const fneE = Math.round(sbtVal * 0.01); // FNE Employeur 1%
              return acc + fneE;
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.cac || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.rav || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.tdl || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              return acc + Number(latestPayslip.deductions?.pvid || latestPayslip.deductions?.pvis || 0);
            }, 0))}</td>
            <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
              const emp = employees?.find(e => e.id === id);
              const payslips = Array.isArray(emp?.payslips) ? emp.payslips : [];
              const latestPayslip = payslips[payslips.length - 1] || {};
              // Recalcul du net pour cohérence avec déductions affichées
              const r = (n) => Math.round(n || 0);
              const vIrpp = r(Number(latestPayslip.deductions?.irpp || 0));
              const vCac = r(Number(latestPayslip.deductions?.cac || 0));
              const vCfc = r(Number(latestPayslip.deductions?.cfc || 0));
              const vRav = r(Number(latestPayslip.deductions?.rav || 0));
              const vTdl = r(Number(latestPayslip.deductions?.tdl || 0));
              const vPvid = r(Number(latestPayslip.deductions?.pvid || latestPayslip.deductions?.pvis || 0));
              const totalDeductions = vIrpp + vCac + vCfc + vRav + vTdl + vPvid; // Sans FNE salarié
              const brut = Number(latestPayslip.remuneration?.total || 0);
              return acc + r(brut - totalDeductions);
            }, 0))}</td>
            <td className="p-2 border">-</td>
            <td className="p-2 border">-</td>
            <td className="p-2 border">-</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CotisationCNPSTable;
