import React, { useMemo, useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  getSBT,
  getSBC,
  getCalculs,
  computeTaxes,
  computeNetPay,
  exportCnpsPDF,
  exportTaxesPDF,
  getLastPayslipCache,
  getPayslipCacheKeyFromCNPSRow,
  formatFR,
  round0,
} from '../utils/payrollCalculations';

const CotisationCNPS = ({ companyId }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});
  const [employees, setEmployees] = useState([]);
  const employerOptions = {
    includePF: true,
    ratePF: 7, // Conforme Cameroun
    includePVID: true,
    ratePVID: 4.2, // Ajusté pour Cameroun (au lieu de 4.9%)
    includeRP: true,
    rateRP: 2, // Taux par défaut, peut être variable
    overrideRP: false,
    CNPS_CAP: 750000, // Conforme Cameroun
  };
  const taxOptions = {
    fneRate: 1, // Ajusté pour Cameroun (1% employeur uniquement)
    cacRate: 10, // Conforme Cameroun
    // Supprimé : cfcRate, tdlRate
  };

  // Charger les employés depuis Firestore
  useEffect(() => {
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, `clients/${companyId}/employees`));
      const employeeData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(employeeData);
    };
    fetchEmployees();
  }, [companyId]);

  // Synchronisation automatique des données
  useEffect(() => {
    const interval = setInterval(() => reloadAllFromPayslips(), 3000);
    return () => clearInterval(interval);
  }, [formData, selectedIds, employees]);

  // Validation des données employé
  const validateEmployeeData = (data) => {
    return (
      data.brut > 0 &&
      data.cnps &&
      data.brut >= 62245 && // Ajusté pour SMIG Cameroun
      getSBC(data) <= employerOptions.CNPS_CAP
    );
  };

  // Pré-remplissage des données depuis le cache des fiches de paie
  const reloadAllFromPayslips = () => {
    const newFormData = { ...formData };
    selectedIds.forEach(id => {
      const employee = employees.find(emp => emp.id === id);
      if (!employee) return;
      const cacheKey = getPayslipCacheKeyFromCNPSRow({ ...employee, ...formData[id] });
      const cache = getLastPayslipCache(cacheKey);
      if (cache) {
        newFormData[id] = {
          ...formData[id],
          brut: cache.brut || formData[id]?.brut || 0,
          sbt: cache.sbt || getSBT({ ...employee, ...formData[id] }, employerOptions),
          sbc: cache.sbc || getSBC({ ...employee, ...formData[id] }, employerOptions.CNPS_CAP),
          netToPay: cache.net || computeNetPay(
            { ...employee, ...formData[id] },
            employerOptions,
            taxOptions
          ),
          irpp: cache.irpp || 0,
          cac: cache.cac || 0,
          fne: cache.fne || 0, // Ajusté pour FNE employeur uniquement
          pvid: cache.pvid || computePVID({ ...employee, ...formData[id] }, employerOptions),
          indemniteTransport: cache.indemniteTransport || 0,
          primesImposables: cache.primesImposables || [],
        };
      } else {
        console.log(`Cache manquant pour ${id}, calcul automatique`);
        newFormData[id] = {
          ...formData[id],
          brut: formData[id]?.brut || employee.baseSalary || 0,
          sbt: getSBT({ ...employee, ...formData[id] }, employerOptions),
          sbc: getSBC({ ...employee, ...formData[id] }, employerOptions.CNPS_CAP),
          netToPay: computeNetPay(
            { ...employee, ...formData[id] },
            employerOptions,
            taxOptions
          ),
          irpp: 0,
          cac: 0,
          fne: 0,
          pvid: computePVID({ ...employee, ...formData[id] }, employerOptions),
        };
      }
    });
    setFormData(newFormData);
  };

  // Résumé employeur
  const employerSummary = useMemo(() => {
    const result = {
      totalBrut: 0,
      totalBase: 0,
      totalPF: 0,
      totalPVID: 0,
      totalRP: 0,
      totalEmployeurDu: 0,
    };
    selectedIds.forEach(id => {
      const d = formData[id] || {};
      const sbc = getSBC(d, employerOptions.CNPS_CAP);
      result.totalBrut += round0(d.brut || 0);
      result.totalBase += round0(sbc);
      if (employerOptions.includePF) {
        result.totalPF += round0(sbc * (employerOptions.ratePF / 100));
      }
      if (employerOptions.includePVID) {
        result.totalPVID += round0(sbc * (employerOptions.ratePVID / 100)); // 4.2% Cameroun
      }
      if (employerOptions.includeRP) {
        const tauxRP = employerOptions.overrideRP ? employerOptions.rateRP : d.tauxRP || employerOptions.rateRP;
        result.totalRP += round0(sbc * (tauxRP / 100));
      }
    });
    result.totalEmployeurDu = result.totalPF + result.totalPVID + result.totalRP;
    return result;
  }, [selectedIds, formData, employerOptions]);

  // Totaux du tableau
  const tableTotals = useMemo(() => {
    const result = { base: 0, pf: 0, pvid: 0, rp: 0, sal: 0, emp: 0, global: 0 };
    selectedIds.forEach(id => {
      const d = formData[id] || {};
      const calculs = getCalculs(d, employerOptions);
      result.base += round0(calculs.baseCotisable);
      result.pf += round0(calculs.prestationsFamilles);
      result.pvid += round0(calculs.pvidEmployeur);
      result.rp += round0(calculs.risquesProfessionnels);
      result.sal += round0(calculs.cotisSalarie);
      result.emp += round0(calculs.cotisEmployeur);
      result.global += round0(calculs.totalGlobal);
    });
    return result;
  }, [selectedIds, formData, employerOptions]);

  // Données fiscales
  const taxesData = useMemo(() => {
    return computeTaxes(selectedIds, formData, employerOptions, taxOptions);
  }, [selectedIds, formData, employerOptions, taxOptions]);

  // Total net
  const totalNet = useMemo(() => {
    let total = 0;
    selectedIds.forEach(id => {
      const d = formData[id] || {};
      if (d.netToPay || d.net) {
        total += round0(d.netToPay || d.net);
      } else {
        const net = computeNetPay(d, employerOptions, taxOptions);
        total += round0(net);
      }
    });
    return total;
  }, [selectedIds, formData, taxOptions]);

  // Exportation PDF Déclaration CNPS
  const handleExportDeclarationPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const rows = selectedIds.map(id => {
      const d = formData[id] || {};
      const calculs = getCalculs(d, employerOptions);
      return [
        d.matricule || '',
        d.nom || '',
        formatFR(calculs.baseCotisable),
        formatFR(calculs.cotisSalarie),
        formatFR(calculs.prestationsFamilles),
        formatFR(calculs.pvidEmployeur),
        formatFR(calculs.risquesProfessionnels),
        formatFR(calculs.cotisEmployeur),
        formatFR(calculs.totalGlobal),
      ];
    });
    const totalsRow = [
      'Totaux',
      '',
      formatFR(tableTotals.base),
      formatFR(tableTotals.sal),
      formatFR(tableTotals.pf),
      formatFR(tableTotals.pvid),
      formatFR(tableTotals.rp),
      formatFR(tableTotals.emp),
      formatFR(tableTotals.global),
    ];
    autoTable(doc, {
      head: [['Matricule', 'Nom', 'Base Cot.', 'PVID Salarié', 'PF', 'PVID Employeur', 'RP', 'Cot. Employeur', 'Total']],
      body: [...rows, totalsRow],
    });
    doc.save('declaration_cnps.pdf');
  };

  // Exportation Excel Déclaration CNPS
  const handleExportDeclarationExcel = () => {
    const rows = selectedIds.map(id => {
      const d = formData[id] || {};
      const calculs = getCalculs(d, employerOptions);
      return {
        Matricule: d.matricule || '',
        Nom: d.nom || '',
        'Base Cotisable': calculs.baseCotisable,
        'PVID Salarié': calculs.cotisSalarie,
        PF: calculs.prestationsFamilles,
        'PVID Employeur': calculs.pvidEmployeur,
        RP: calculs.risquesProfessionnels,
        'Cot. Employeur': calculs.cotisEmployeur,
        Total: calculs.totalGlobal,
      };
    });
    const totalsRow = {
      Matricule: 'Totaux',
      Nom: '',
      'Base Cotisable': tableTotals.base,
      'PVID Salarié': tableTotals.sal,
      PF: tableTotals.pf,
      'PVID Employeur': tableTotals.pvid,
      RP: tableTotals.rp,
      'Cot. Employeur': tableTotals.emp,
      Total: tableTotals.global,
    };
    const ws = XLSX.utils.json_to_sheet([...rows, totalsRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Déclaration CNPS');
    XLSX.write(wb, 'declaration_cnps.xlsx');
  };

  // Exportation Excel complète
  const handleExportExcel = (all = false) => {
    const data = (all ? Object.keys(formData) : selectedIds).map(id => {
      const d = formData[id] || {};
      const sbt = getSBT(d, employerOptions);
      const sbc = getSBC(d, employerOptions.CNPS_CAP);
      const calculs = getCalculs(d, employerOptions);
      const taxes = computeTaxes([id], formData, employerOptions, taxOptions).rows[0] || {};
      return {
        Matricule: d.matricule || '',
        Nom: d.nom || '',
        'Salaire Brut': d.brut || 0,
        'Base Taxable': sbt,
        'Base Cotisable': sbc,
        IRPP: taxes.irpp || 0,
        CAC: taxes.cac || 0,
        FNE: taxes.fne || 0, // Ajusté pour FNE employeur
        'PVID Salarié': calculs.cotisSalarie,
        PF: calculs.prestationsFamilles,
        'PVID Employeur': calculs.pvidEmployeur,
        RP: calculs.risquesProfessionnels,
        'Cot. Employeur': calculs.cotisEmployeur,
        'Net à Payer': d.netToPay || computeNetPay(d, employerOptions, taxOptions),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cotisations');
    XLSX.write(wb, 'cotisations.xlsx');
  };

  return (
    <div>
      {/* Interface utilisateur : tableaux, sélections, boutons d'exportation */}
      <button onClick={handleExportDeclarationPDF}>Exporter Déclaration CNPS (PDF)</button>
      <button onClick={handleExportDeclarationExcel}>Exporter Déclaration CNPS (Excel)</button>
      <button onClick={() => handleExportExcel(false)}>Exporter Sélection (Excel)</button>
      <button onClick={() => handleExportExcel(true)}>Exporter Tout (Excel)</button>
    </div>
  );
};

export default CotisationCNPS;