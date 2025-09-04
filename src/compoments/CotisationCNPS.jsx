import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatFR } from "../utils/numberUtils";
import { buildCnpsCode } from "../utils/cnpsUtils";
import { exportCnpsPDF, exportTaxesPDF } from "../utils/pdfCnps";
import { getSBT, getSBC, getCalculs, CNPS_CAP } from "../utils/cnpsCalc";
import { computeTaxes } from "../utils/taxCalc";
import { getTauxRP } from "../utils/cnpsRates";
import { getCurrentMonthYear } from "../utils/dateUtils";
import { INDEMNITIES, BONUSES } from "../utils/payrollLabels";
import Button from "./Button";

// Helpers moved to utils: `getTauxRP` in `src/utils/cnpsRates.js` and `getCurrentMonthYear` in `src/utils/dateUtils.js`

// formatFR et buildCnpsCode sont importés depuis utils

const CotisationCNPS = ({ companyId, cnpsEmployeur }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // Pour déclaration groupée
  const [formData, setFormData] = useState({}); // { [employeeId]: { ...fields } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cotisations, setCotisations] = useState([]); // Aperçu Firestore
  const [moisApercu, setMoisApercu] = useState(getCurrentMonthYear().month);
  const [anneeApercu, setAnneeApercu] = useState(getCurrentMonthYear().year);
  const [uniformTransport, setUniformTransport] = useState(0); // prime transport uniforme
  const [employerOptions, setEmployerOptions] = useState({
    includePF: true,
    ratePF: 7.0, // Prestations familiales
    includePVID: true,
    ratePVID: 4.9, // Pension vieillesse invalidité décès
    includeRP: false,
    overrideRP: false,
    rateRP: 2.0, // Valeur par défaut si override
  });

  // Options impôts (déclaration)
  const [taxOptions, setTaxOptions] = useState({
    cfcRate: 2.5,  // CFC SAL % sur SBT (fixe 2.5)
    fneRate: 1.0,  // FNE % sur SBT
  });

  // Recharge en masse depuis le cache du dernier bulletin
  const reloadAllFromPayslips = (silent = false) => {
    if (selectedIds.length === 0) {
      if (!silent) toast.info('Sélectionnez au moins un salarié');
      return;
    }
    let updated = 0;
    setFormData(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => {
        const d = next[id] || {};
        const empKey = d.matriculeInterne || d.cnps || d.nom;
        if (!empKey) return;
        const cacheRaw = localStorage.getItem(`lastPayslip_${empKey}`);
        if (!cacheRaw) return;
        try {
          const cache = JSON.parse(cacheRaw);

          const indemnitesArr = Array.isArray(cache.indemnites) ? cache.indemnites : [];
          const primesArr = Array.isArray(cache.primes) ? cache.primes : [];

          const findAmt = (arr, ...keywords) => {
            const item = arr.find(it => {
              const lbl = (it.label || it.name || it.type || '').toString().toLowerCase();
              return keywords.some(k => lbl.includes(k));
            });
            return Number(item?.amount || item?.value || item?.montant || 0) || 0;
          };

          const transportAllowance = Number(cache.transportAllowance || findAmt(indemnitesArr, 'transport'));
          const housingAllowance = Number(cache.housingAllowance || findAmt(indemnitesArr, 'logement', 'habitation', 'housing'));
          const representationAllowance = Number(cache.representationAllowance || findAmt(indemnitesArr, 'représentation', 'representation'));
          const dirtAllowance = Number(cache.dirtAllowance || findAmt(indemnitesArr, 'salissure', 'salissures', 'dirt'));
          const mealAllowance = Number(cache.mealAllowance || findAmt(indemnitesArr, 'panier', 'repas', 'meal'));

          const overtime = Number(cache.overtime || findAmt(primesArr, 'heure sup', 'heures sup', 'hs', 'overtime'));
          const bonus = Number(cache.bonus || findAmt(primesArr, 'prime', 'bonus', 'gratification'));
          next[id] = {
            ...d,
            indemniteTransport: transportAllowance,
            primesImposables: bonus + overtime,
            indemniteNonImposable: representationAllowance + dirtAllowance + mealAllowance,
            housingAllowanceDisplay: housingAllowance,
            representationAllowanceDisplay: representationAllowance,
            dirtAllowanceDisplay: dirtAllowance,
            mealAllowanceDisplay: mealAllowance,
            overtimeDisplay: overtime,
            bonusDisplay: bonus,
            // Arrays (if provided by payslip cache)
            indemnitesArray: indemnitesArr.length ? indemnitesArr : undefined,
            primesArray: primesArr.length ? primesArr : undefined,
          };
          updated += 1;
        } catch {}
      });
      return next;
    });
    if (!silent) {
      if (updated > 0) toast.success(`Détails rechargés pour ${updated} salarié(s)`);
      else toast.info('Aucun bulletin récent trouvé pour la sélection');
    }
  };

  // Auto-synchroniser dès que la sélection change (sans interaction utilisateur)
  useEffect(() => {
    if (selectedIds && selectedIds.length > 0) {
      reloadAllFromPayslips(true);
    }
  }, [selectedIds]);

  // Auto-sync périodique + sur retour de focus fenêtre
  useEffect(() => {
    if (!selectedIds || selectedIds.length === 0) return;

    const onFocus = () => reloadAllFromPayslips(true);
    window.addEventListener('focus', onFocus);

    const intervalId = setInterval(() => {
      reloadAllFromPayslips(true);
    }, 3000); // sync toutes les 3s tant qu'il y a une sélection

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(intervalId);
    };
  }, [selectedIds]);

  // 1. Récupérer les employés
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getDocs(collection(db, "clients", companyId, "employees"))
      .then((snap) => {
        setEmployees(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      })
      .catch(() => toast.error("Erreur chargement employés"))
      .finally(() => setLoading(false));
  }, [companyId]);

  // 2. Pré-remplir les champs à la sélection
  useEffect(() => {
    if (selectedIds.length === 0) return;
    setFormData((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (!next[id]) {
          const emp = employees.find((e) => e.id === id);
          if (emp) {
            const tauxRP = getTauxRP(emp.professionalCategory || emp.poste);
            const { month, year } = getCurrentMonthYear();
            next[id] = {
              nom: emp.name || "",
              cnps: emp.cnpsNumber || "",
              brut: Number(emp.baseSalary) || 0,
              poste: emp.professionalCategory || emp.poste || "",
              tauxRP,
              mois: month,
              annee: year,
              matriculeInterne: emp.matricule || '',
              regime: emp.cnpsRegime || 'GC',
              joursTravailles: 30,
            };
            // 2a. Pré-remplissage depuis la fiche de paie Firestore (si disponible)
            try {
              const slips = Array.isArray(emp.payslips) ? emp.payslips : [];
              // match mois/année exacts (supports 'mois'|'month' et 'annee'|'year')
              const slip = slips.find(s => {
                const sMonth = String(s.mois || s.month || '').padStart(2, '0');
                const sYear = String(s.annee || s.year || '');
                return sMonth === String(month).padStart(2, '0') && sYear === String(year);
              }) || slips[slips.length - 1]; // sinon, dernier bulletin dispo

              if (slip) {
                const indemArr = Array.isArray(slip.indemnites) ? slip.indemnites : [];
                const primesArr = Array.isArray(slip.primes) ? slip.primes : [];
                const findAmt = (arr, ...keywords) => {
                  const item = arr.find(it => {
                    const lbl = (it.label || it.name || '').toString().toLowerCase();
                    return keywords.some(k => lbl.includes(k));
                  });
                  return Number(item?.amount || item?.value || 0) || 0;
                };

                const transportAllowance = Number(slip.indemniteTransport || slip.transportAllowance || findAmt(indemArr, 'transport'));
                const housingAllowance = Number(slip.housingAllowance || findAmt(indemArr, 'logement', 'habitation', 'housing'));
                const representationAllowance = Number(slip.representationAllowance || findAmt(indemArr, 'représentation', 'representation'));
                const dirtAllowance = Number(slip.dirtAllowance || findAmt(indemArr, 'salissure', 'salissures', 'dirt'));
                const mealAllowance = Number(slip.mealAllowance || findAmt(indemArr, 'panier', 'repas', 'meal'));
                const overtime = Number(slip.overtime || slip.heuresSupp || findAmt(primesArr, 'heure sup', 'heures sup', 'hs', 'overtime'));
                const bonus = Number(slip.bonus || findAmt(primesArr, 'prime', 'bonus', 'gratification'));
                const primesImposables = Number(slip.primesImposables || 0) || (bonus + overtime);
                const primesNaturesSociales = Number(slip.primesNaturesSociales || slip.primesSociales || 0);
                const avantagesNature = Number(slip.avantagesNature || 0);

                next[id] = {
                  ...next[id],
                  indemniteTransport: transportAllowance,
                  primesImposables,
                  indemniteNonImposable: representationAllowance + dirtAllowance + mealAllowance,
                  housingAllowanceDisplay: housingAllowance,
                  representationAllowanceDisplay: representationAllowance,
                  dirtAllowanceDisplay: dirtAllowance,
                  mealAllowanceDisplay: mealAllowance,
                  overtimeDisplay: overtime,
                  bonusDisplay: bonus,
                  primesNaturesSociales,
                  avantagesNature,
                  indemnitesArray: indemArr.length ? indemArr : undefined,
                  primesArray: primesArr.length ? primesArr : undefined,
                };
              }
            } catch (e) {
              console.warn('Pré-remplissage fiche de paie (Firestore) indisponible pour', emp?.name, e);
            }
            // Pré-remplissage depuis le dernier bulletin (cache local)
            try {
              const empKey = emp.matricule || emp.cnpsNumber || emp.name;
              const cacheRaw = empKey ? localStorage.getItem(`lastPayslip_${empKey}`) : null;
              if (cacheRaw) {
                const cache = JSON.parse(cacheRaw);
                const transportAllowance = Number(cache.transportAllowance || 0);
                const bonus = Number(cache.bonus || 0);
                const housingAllowance = Number(cache.housingAllowance || 0);
                const overtime = Number(cache.overtime || 0);
                const representationAllowance = Number(cache.representationAllowance || 0);
                const dirtAllowance = Number(cache.dirtAllowance || 0);
                const mealAllowance = Number(cache.mealAllowance || 0);
                next[id] = {
                  ...next[id],
                  indemniteTransport: transportAllowance,
                  // Primes imposables (alignées sur la fiche de paie): Heures supp + Prime/Bonus
                  primesImposables: bonus + overtime,
                  // Indemnités non imposables usuelles depuis le bulletin
                  indemniteNonImposable: representationAllowance + dirtAllowance + mealAllowance,
                  // Détails pour affichage (non utilisés dans les calculs CNPS)
                  housingAllowanceDisplay: housingAllowance,
                  representationAllowanceDisplay: representationAllowance,
                  dirtAllowanceDisplay: dirtAllowance,
                  mealAllowanceDisplay: mealAllowance,
                  overtimeDisplay: overtime,
                  bonusDisplay: bonus,
                  // Arrays (if provided by payslip cache)
                  indemnitesArray: Array.isArray(cache.indemnites) ? cache.indemnites : undefined,
                  primesArray: Array.isArray(cache.primes) ? cache.primes : undefined,
                };
              }
            } catch (e) {
              console.warn('Pré-remplissage CNPS indisponible pour', emp?.name, e);
            }
          }
        }
      });
      return next;
    });
  }, [selectedIds, employees]);

  // Aperçu : récupérer les cotisations Firestore
  useEffect(() => {
    if (!companyId) return;
    getDocs(collection(db, "clients", companyId, "cotisations_cnps"))
      .then((snap) => {
        setCotisations(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      })
      .catch(() => toast.error("Erreur chargement cotisations CNPS"));
  }, [companyId, saving]);

  // 3. Calculs SBT/SBC et cotisations (modularisés dans utils/cnpsCalc)

  // Résumé employeur (sous le tableau sélection)
  const employerSummary = React.useMemo(() => {
    const ids = selectedIds;
    let totalBrut = 0;
    let totalBase = 0;
    let totalPF = 0;
    let totalPVID = 0;
    let totalRP = 0;
    ids.forEach((id) => {
      const d = formData[id];
      if (!d) return;
      const base = Math.min(getSBC(d), CNPS_CAP);
      totalBrut += Number(d.brut) || 0;
      totalBase += base;
      if (employerOptions.includePF) totalPF += base * (employerOptions.ratePF / 100);
      if (employerOptions.includePVID) totalPVID += base * (employerOptions.ratePVID / 100);
      if (employerOptions.includeRP) {
        const rpRate = employerOptions.overrideRP ? employerOptions.rateRP : (Number(d.tauxRP) || 0);
        totalRP += base * (rpRate / 100);
      }
    });
    const round0 = (n) => Math.round(n || 0);
    const due = round0(totalPF) + round0(totalPVID) + round0(totalRP);
    return {
      totalBrut: round0(totalBrut),
      totalBase: round0(totalBase),
      totalPF: round0(totalPF),
      totalPVID: round0(totalPVID),
      totalRP: round0(totalRP),
      totalEmployeurDu: due,
    };
  }, [selectedIds, formData, employerOptions]);

  // Totaux du tableau de sélection (pour pied de tableau)
  const tableTotals = React.useMemo(() => {
    let baseCot = 0, pf = 0, pvid = 0, rp = 0, sal = 0, emp = 0, global = 0;
    selectedIds.forEach((id) => {
      const d = formData[id];
      if (!d) return;
      const c = getCalculs(d, employerOptions);
      baseCot += c.baseCotisable;
      pf += c.prestationsFamilles;
      pvid += c.pvidEmployeur;
      rp += c.risquesProfessionnels;
      sal += c.cotisSalarie;
      emp += c.cotisEmployeur;
      global += c.totalGlobal;
    });
    const round0 = (n) => Math.round(n || 0);
    return {
      base: round0(baseCot), pf: round0(pf), pvid: round0(pvid), rp: round0(rp),
      sal: round0(sal), emp: round0(emp), global: round0(global)
    };
  }, [selectedIds, formData]);

  // Colonnes fixes à afficher pour chaque employé (toujours visibles)
  const fixedAllowanceCols = React.useMemo(() => ([
    { key: 'indemniteTransport', label: 'Indemnité Transport', source: 'field' },
    { key: 'housingAllowanceDisplay', label: 'Indemnité Logement', source: 'field' },
    { key: 'representationAllowanceDisplay', label: 'Indemnité Représentation', source: 'field' },
    { key: 'dirtAllowanceDisplay', label: 'Prime de Salissures', source: 'field' },
    { key: 'mealAllowanceDisplay', label: 'Prime de Panier', source: 'field' },
    { key: 'overtimeDisplay', label: 'Heures Supplémentaires', source: 'field' },
    { key: 'bonusDisplay', label: 'Prime/Bonus', source: 'field' },
    { key: 'primesImposables', label: 'Primes Imposables', source: 'field' },
    { key: 'primesNaturesSociales', label: 'Primes Nat. Sociales', source: 'field' },
    { key: 'avantagesNature', label: 'Avantages Nature', source: 'field' },
    { key: 'indemniteNonImposable', label: 'Indemnité Non Imposable', source: 'field' },
  ]), []);

  // Colonnes dynamiques et colonne Détails supprimées pour simplification du tableau

  // 3b. Validation des données (2025)
  const validateEmployeeData = (data) => {
    const errors = [];
    if (!data.brut || data.brut <= 0) errors.push("Salaire brut requis");
    if (!data.cnps) errors.push("Numéro CNPS requis");
    if (data.brut > 0 && data.brut < 36270) errors.push("Salaire < SMIG (36 270 FCFA)");
    const sbc = getSBC(data);
    if (sbc > CNPS_CAP) errors.push("Base cotisable dépasse le plafond CNPS");
    return errors;
  };

  // Données pour Déclaration des impôts (extraites dans utils/taxCalc)
  const taxesData = React.useMemo(
    () => computeTaxes(selectedIds, formData, employerOptions, taxOptions),
    [selectedIds, formData, employerOptions, taxOptions]
  );

  // Total NET (affiché sous la colonne SBC, n'affecte pas les calculs CNPS)
  const totalNet = React.useMemo(() => {
    let total = 0;
    selectedIds.forEach((id) => {
      const d = formData[id];
      if (!d) return;
      const c = getCalculs(d, employerOptions);
      const taxRow = (taxesData.rows || []).find(r => r.id === id) || {};
      const brut = Number(d.brut || 0);
      const net = brut
        - Number(c.cotisSalarie || 0)
        - Number(taxRow.irpp || 0)
        - Number(taxRow.cac || 0)
        - Number(taxRow.tdl || 0)
        - Number(taxRow.cfc || 0)
        - Number(taxRow.fneSal || 0);
      total += net;
    });
    return Math.round(total || 0);
  }, [selectedIds, formData, employerOptions, taxesData]);

  // 4. Enregistrement Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      // Validation avant enregistrement
      for (const id of selectedIds) {
        const data = formData[id];
        const errs = validateEmployeeData(data);
        if (errs.length > 0) {
          setSaving(false);
          return toast.error(`Erreur données ${data?.nom || id} : ${errs[0]}`);
        }
      }
      for (const id of selectedIds) {
        const data = formData[id];
        const calculs = getCalculs(data, employerOptions);
        await addDoc(collection(db, "clients", companyId, "cotisations_cnps"), {
          employeeId: id,
          ...data,
          ...calculs,
          cnpsEmployeur: cnpsEmployeur || "",
          cnpsCode: buildCnpsCode({
            mois: data.mois,
            matriculeEmployeur: cnpsEmployeur,
            regime: data.regime,
            annee: data.annee,
            matriculeEmploye: data.cnps,
            joursTravailles: data.joursTravailles,
          }),
          createdAt: Timestamp.now(),
        });
      }
      toast.success("Cotisation(s) enregistrée(s) dans Firestore !");
    } catch (e) {
      toast.error("Erreur lors de l'enregistrement Firestore");
    } finally {
      setSaving(false);
    }
  };

  // 5. Export PDF - CNPS (paysage)
  const handleExportCNPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    exportCnpsPDF({ selectedIds, formData, employerOptions, employerSummary, cnpsEmployeur });
  };

  // 5b. Export PDF - Impôts (portrait)
  const handleExportTaxesPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    exportTaxesPDF({ selectedIds, taxesData, formData, cnpsEmployeur });
  };

  // 6a. Export Déclaration CNPS (PDF)
  const handleExportDeclarationPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.width;
    
    // Titre
    doc.setFontSize(16);
    doc.text('DÉCLARATION CNPS - CHARGES EMPLOYEUR', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Entreprise: ${cnpsEmployeur || 'N/A'}`, 20, 35);
    doc.text(`Période: ${getCurrentMonthYear().month}/${getCurrentMonthYear().year}`, 20, 42);
    doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, 49);
    
    // Données du tableau
    const tableData = selectedIds.map(id => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      const row = [
        d.cnps || '',
        d.nom || '',
        formatFR(c.baseCotisable),
        formatFR(c.pvidEmployeur),
        formatFR(c.prestationsFamilles),
      ];
      if (employerOptions.includeRP) row.push(formatFR(c.risquesProfessionnels));
      row.push(
        formatFR(c.cotisEmployeur),
        formatFR(c.cotisSalarie),
        formatFR(c.totalGlobal)
      );
      return row;
    });
    
    // En-têtes
    const headers = [
      'Matricule CNPS', 'Nom', 'Base Cotisable', 'PVID Emp (4,9%)', 'PF (7%)'
    ];
    if (employerOptions.includeRP) headers.push('RP');
    headers.push('Total Emp', 'PVID Sal (4,2%)', 'Total à Verser');
    
    // Totaux
    const totals = ['', 'TOTAUX'];
    const totalBase = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.baseCotisable;
    }, 0);
    const totalPvidEmp = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.pvidEmployeur;
    }, 0);
    const totalPF = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.prestationsFamilles;
    }, 0);
    const totalRP = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.risquesProfessionnels;
    }, 0);
    const totalEmp = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.cotisEmployeur;
    }, 0);
    const totalSal = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.cotisSalarie;
    }, 0);
    const totalGlobal = selectedIds.reduce((acc, id) => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      return acc + c.totalGlobal;
    }, 0);
    
    totals.push(formatFR(totalBase), formatFR(totalPvidEmp), formatFR(totalPF));
    if (employerOptions.includeRP) totals.push(formatFR(totalRP));
    totals.push(formatFR(totalEmp), formatFR(totalSal), formatFR(totalGlobal));
    
    // Générer le tableau PDF
    autoTable(doc, {
      head: [headers],
      body: [...tableData, totals],
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [255, 235, 59] },
      footStyles: { fillColor: [255, 193, 7], fontStyle: 'bold' }
    });
    
    doc.save(`declaration_cnps_${getCurrentMonthYear().month}_${getCurrentMonthYear().year}.pdf`);
  };

  // 6b. Export Déclaration CNPS (Excel)
  const handleExportDeclarationExcel = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    
    const rows = selectedIds.map(id => {
      const d = formData[id] || {};
      const c = getCalculs(d, employerOptions);
      const row = [
        d.cnps || '',
        d.nom || '',
        c.baseCotisable,
        c.pvidEmployeur,
        c.prestationsFamilles,
      ];
      if (employerOptions.includeRP) row.push(c.risquesProfessionnels);
      row.push(c.cotisEmployeur, c.cotisSalarie, c.totalGlobal);
      return row;
    });
    
    const headers = [
      'Matricule CNPS', 'Nom', 'Base Cotisable', 'PVID Employeur (4,9%)', 'PF (7%)'
    ];
    if (employerOptions.includeRP) headers.push('RP');
    headers.push('Total Employeur', 'PVID Salarié (4,2%)', 'Total à Verser CNPS');
    
    // Totaux
    const totalRow = ['', 'TOTAUX'];
    const totals = [
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).baseCotisable, 0),
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).pvidEmployeur, 0),
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).prestationsFamilles, 0),
    ];
    if (employerOptions.includeRP) {
      totals.push(selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).risquesProfessionnels, 0));
    }
    totals.push(
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).cotisEmployeur, 0),
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).cotisSalarie, 0),
      selectedIds.reduce((acc, id) => acc + getCalculs(formData[id] || {}, employerOptions).totalGlobal, 0)
    );
    totalRow.push(...totals);
    
    const wsData = [
      [`DÉCLARATION CNPS - CHARGES EMPLOYEUR`],
      [`Entreprise: ${cnpsEmployeur || 'N/A'}`],
      [`Période: ${getCurrentMonthYear().month}/${getCurrentMonthYear().year}`],
      [`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      headers,
      ...rows,
      totalRow,
      [],
      ['Récapitulatif'],
      ['PVID Employeur (4,9%)', totals[1]],
      ['Prestations Familiales (7%)', totals[2]],
      ...(employerOptions.includeRP ? [['Risques Professionnels', totals[3]]] : []),
      ['Total Charges Employeur', totals[employerOptions.includeRP ? 4 : 3]],
      ['Retenues Salarié (4,2%)', totals[employerOptions.includeRP ? 5 : 4]],
      ['TOTAL À VERSER CNPS', totals[employerOptions.includeRP ? 6 : 5]]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Déclaration CNPS");
    XLSX.writeFile(wb, `declaration_cnps_${getCurrentMonthYear().month}_${getCurrentMonthYear().year}.xlsx`);
  };

  // 6. Export Excel (sélection ou tout)
  const handleExportExcel = (all = false) => {
    let rows = [];
    if (all) {
      // Exporter toutes les cotisations enregistrées (aperçu)
      rows = cotisations.map((c) => {
        // Recalcule SBT/SBC depuis les données enregistrées
        const sbtValue = getSBT(c);
        const sbcValue = getSBC(c);
        const sumItems = (arr = []) => arr.reduce((acc, it) => acc + (Number(it?.montant ?? it?.amount ?? it?.value ?? 0) || 0), 0);
        const totalPrimes = Array.isArray(c.primesArray) && c.primesArray.length
          ? sumItems(c.primesArray)
          : (Number(c.primesImposables || 0) || (Number(c.overtimeDisplay || 0) + Number(c.bonusDisplay || 0)));
        const totalIndemnites = Array.isArray(c.indemnitesArray) && c.indemnitesArray.length
          ? sumItems(c.indemnitesArray)
          : (
              Number(c.indemniteTransport || 0)
              + Number(c.housingAllowanceDisplay || 0)
              + Number(c.representationAllowanceDisplay || 0)
              + Number(c.dirtAllowanceDisplay || 0)
              + Number(c.mealAllowanceDisplay || 0)
            );
        const row = [
          c.cnps || '',
          c.cnpsCode || buildCnpsCode({
            mois: c.mois,
            matriculeEmployeur: c.cnpsEmployeur || cnpsEmployeur,
            regime: c.regime,
            annee: c.annee,
            matriculeEmploye: c.cnps,
            joursTravailles: c.joursTravailles,
          }),
          c.nom,
          c.cnps,
          c.brut,
          c.poste,
        ];
        if (employerOptions.includeRP) row.push(c.tauxRP);
        row.push(
          sbtValue,
          sbcValue,
          Number(c.indemniteTransport || 0),
          Number(c.primesImposables || 0),
          totalPrimes,
          totalIndemnites,
          c.baseCotisable ?? c.base ?? Math.min(sbcValue, CNPS_CAP),
          c.cotisSalarie,
          c.cotisEmployeur,
          c.totalGlobal,
          c.mois,
          c.annee,
          c.cnpsEmployeur || cnpsEmployeur || "",
        );
        return row;
      });
    } else {
      // Exporter la sélection courante (formulaire)
      rows = selectedIds.map((id) => {
        const d = formData[id];
        const c = getCalculs(d, employerOptions);
        const taxRow = taxesData.rows.find(r => r.id === id) || { sbt: 0, sbc: 0, irpp: 0, cac: 0, tdl: 0, cfc: 0 };
        const sbtValue = getSBT(d);
        const sbcValue = getSBC(d);
        const sumItems = (arr = []) => arr.reduce((acc, it) => acc + (Number(it?.montant ?? it?.amount ?? it?.value ?? 0) || 0), 0);
        const totalPrimes = Array.isArray(d.primesArray) && d.primesArray.length
          ? sumItems(d.primesArray)
          : (Number(d.primesImposables || 0) || (Number(d.overtimeDisplay || 0) + Number(d.bonusDisplay || 0)));
        const totalIndemnites = Array.isArray(d.indemnitesArray) && d.indemnitesArray.length
          ? sumItems(d.indemnitesArray)
          : (
              Number(d.indemniteTransport || 0)
              + Number(d.housingAllowanceDisplay || 0)
              + Number(d.representationAllowanceDisplay || 0)
              + Number(d.dirtAllowanceDisplay || 0)
              + Number(d.mealAllowanceDisplay || 0)
            );
        const row = [
          d.cnps,
          buildCnpsCode({
            mois: d.mois,
            matriculeEmployeur: cnpsEmployeur,
            regime: d.regime,
            annee: d.annee,
            matriculeEmploye: d.cnps,
            joursTravailles: d.joursTravailles,
          }),
          d.nom,
          d.cnps,
          d.brut,
          d.poste,
        ];
        if (employerOptions.includeRP) row.push(d.tauxRP);
        row.push(
          sbtValue,
          sbcValue,
          Number(d.indemniteTransport || 0),
          Number(d.primesImposables || 0),
          totalPrimes,
          totalIndemnites,
          c.baseCotisable,
          c.cotisSalarie,
          c.cotisEmployeur,
          c.totalGlobal,
          d.mois,
          d.annee,
          cnpsEmployeur || "",
        );
        return row;
      });
    }
    const wsHead = [
      "Matricule CNPS",
      "Code CNPS",
      "Nom",
      "CNPS",
      "Brut",
      "Catégorie/Poste",
    ];
    if (employerOptions.includeRP) wsHead.push("Taux RP");
    wsHead.push(
      "SBT (Taxable)",
      "SBC (Cotisable)",
      "Prime Transport",
      "Primes Imposables",
      "Total Primes",
      "Total Indemnités",
      "Base cotisable",
      "PVID salarié (4,2%)",
      "Cotisation employeur",
      "Total à verser",
      "Mois",
      "Année",
      "CNPS Employeur",
    );
    const wsData = [
      wsHead,
      ...rows,
      [],
      ["Récapitulatif employeur", "Montant (FCFA)"],
      ["PF (" + employerOptions.ratePF + "%)", employerSummary.totalPF],
      ["PVID (" + employerOptions.ratePVID + "%)", employerSummary.totalPVID],
      ["RP" + (employerOptions.includeRP ? " (activé)" : " (désactivé)"), employerSummary.totalRP],
      ["Total dû employeur", employerSummary.totalEmployeurDu],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotisations CNPS");
    XLSX.writeFile(wb, all ? "cotisations_cnps_tous.xlsx" : "cotisations_cnps_selection.xlsx");
  };

  // 7. UI
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h2 className="text-2xl font-bold mb-4">Déclaration Mensuelle </h2>
      <div className="mb-2 text-sm text-gray-700">Numéro CNPS employeur : <span className="font-semibold">{cnpsEmployeur || "N/A"}</span></div>
      {loading ? (
        <div className="text-center text-blue-600">Chargement des employés...</div>
      ) : (
        <div className="mb-4">
          <label className="block font-semibold mb-1">Sélectionner salarié(s)</label>
          {/* Sélection moderne avec cases à cocher */}
          <div className="border rounded divide-y divide-gray-100 bg-gray-50">
            <div className="flex items-center px-3 py-2 bg-gray-100 sticky top-0 z-10">
              <input
                type="checkbox"
                checked={selectedIds.length === employees.length && employees.length > 0}
                onChange={e => {
                  if (e.target.checked) {
                    setSelectedIds(employees.map(emp => emp.id));
                  } else {
                    setSelectedIds([]);
                  }
                }}
                className="mr-2"
                id="selectAllEmp"
              />
              <label htmlFor="selectAllEmp" className="font-medium cursor-pointer">Tout sélectionner</label>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {employees.map(emp => (
                <label key={emp.id} className={`flex items-center px-3 py-2 cursor-pointer hover:bg-blue-50 transition ${selectedIds.includes(emp.id) ? 'bg-blue-50' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedIds(prev => [...prev, emp.id]);
                      } else {
                        setSelectedIds(prev => prev.filter(id => id !== emp.id));
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="flex-1">
                    <span className="font-medium">{emp.name}</span>
                    <span className="ml-2 text-xs text-gray-500">CNPS: {emp.cnpsNumber || 'N/A'}</span>
                    <span className="ml-2 text-xs text-gray-500">{emp.professionalCategory || emp.poste || ''}</span>
                  </span>
                  <span className="text-xs text-gray-700 font-mono">{formatFR(emp.baseSalary)} FCFA</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Déclaration des impôts sera rendue plus bas comme 2e tableau */}
      {selectedIds.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex items-center justify-between mb-2 text-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                className="px-2 py-1 border rounded hover:bg-blue-50"
                onClick={() => reloadAllFromPayslips(false)}
              >Mettre à jour depuis bulletins (sélection)</button>
              <button
                type="button"
                className="px-2 py-1 border rounded hover:bg-green-50 text-green-700"
                onClick={() => {
                  // Rechargement programmatique sans perdre l'auth
                  setLoading(true);
                  setSelectedIds([]);
                  setFormData({});
                  // Recharger employés
                  if (companyId) {
                    getDocs(collection(db, "clients", companyId, "employees"))
                      .then((snap) => {
                        setEmployees(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                      })
                      .catch(() => toast.error("Erreur chargement employés"))
                      .finally(() => setLoading(false));
                    // Recharger cotisations
                    getDocs(collection(db, "clients", companyId, "cotisations_cnps"))
                      .then((snap) => {
                        setCotisations(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
                      })
                      .catch(() => toast.error("Erreur chargement cotisations"));
                  }
                  toast.success("Données actualisées");
                }}
                title="Actualiser les données sans perdre la session"
              >🔄 Actualiser</button>
              <div className="flex items-center gap-2 ml-2">
                <label className="text-gray-700">Prime Transport (uniforme)</label>
                <input
                  type="number"
                  value={Number(uniformTransport || 0)}
                  onChange={e => setUniformTransport(Number(e.target.value) || 0)}
                  className="w-24 border rounded px-2 py-1 text-right"
                />
                <button
                  type="button"
                  className="px-2 py-1 border rounded hover:bg-blue-50"
                  onClick={() => {
                    if (!selectedIds.length) return toast.info('Sélectionnez au moins un salarié');
                    setFormData(prev => {
                      const next = { ...prev };
                      selectedIds.forEach(id => {
                        next[id] = { ...(next[id] || {}), indemniteTransport: Number(uniformTransport || 0) };
                      });
                      return next;
                    });
                    toast.success('Prime transport appliquée à la sélection');
                  }}
                >Appliquer à la sélection</button>
              </div>
            </div>
          </div>
          <table className="min-w-full border text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-2 border">Matricule CNPS</th>
                <th className="p-2 border">Code CNPS</th>
                <th className="p-2 border">Régime</th>
                <th className="p-2 border">Jours trav.</th>
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">CNPS</th>
                <th className="p-2 border">Brut</th>
                <th className="p-2 border">Catégorie/Poste</th>
                {employerOptions.includeRP && (
                  <th className="p-2 border">Taux RP</th>
                )}
                <th className="p-2 border">SBT (Taxable)</th>
                <th className="p-2 border">SBC (Cotisable)</th>
                <th className="p-2 border">Prime Transport</th>
                <th className="p-2 border">Heures Supplémentaires</th>
                <th className="p-2 border">Prime/Bonus</th>
                <th className="p-2 border">Total Primes</th>
                <th className="p-2 border">Total Indemnités</th>
                <th className="p-2 border">IRPP</th>
                <th className="p-2 border">CFC</th>
                <th className="p-2 border">CAC</th>
                <th className="p-2 border">TDL</th>
                <th className="p-2 border">PVID (Sal. 4,2%)</th>
                <th className="p-2 border">Net à payer</th>
                <th className="p-2 border">Mois</th>
                <th className="p-2 border">Année</th>
              </tr>
            </thead>
            <tbody>
              {selectedIds.map(id => {
                const d = formData[id] || {};
                const c = getCalculs(d);
                const taxRow = taxesData.rows.find(r => r.id === id) || { sbt: 0, irpp: 0, cac: 0, tdl: 0, cfc: 0 };
                const sumItems = (arr = []) => arr.reduce((acc, it) => acc + (Number(it?.montant ?? it?.amount ?? it?.value ?? 0) || 0), 0);
                const totalPrimes = Array.isArray(d.primesArray) && d.primesArray.length
                  ? (sumItems(d.primesArray) + Number(d.indemniteTransport || 0))
                  : (Number(d.primesImposables || 0) || (Number(d.overtimeDisplay || 0) + Number(d.bonusDisplay || 0))) + Number(d.indemniteTransport || 0);
                const totalIndemnites = Array.isArray(d.indemnitesArray) && d.indemnitesArray.length
                  ? sumItems(d.indemnitesArray)
                  : (
                      Number(d.housingAllowanceDisplay || 0)
                      + Number(d.representationAllowanceDisplay || 0)
                      + Number(d.dirtAllowanceDisplay || 0)
                      + Number(d.mealAllowanceDisplay || 0)
                    );
                const handleReloadFromPayslip = () => {
                  try {
                    const empKey = d.matriculeInterne || d.cnps || d.nom;
                    if (!empKey) return;
                    const cacheRaw = localStorage.getItem(`lastPayslip_${empKey}`);
                    if (!cacheRaw) return toast.info('Aucun bulletin récent trouvé');
                    const cache = JSON.parse(cacheRaw);
                    const indemnitesArr = Array.isArray(cache.indemnites) ? cache.indemnites : [];
                    const primesArr = Array.isArray(cache.primes) ? cache.primes : [];
                    const findAmt = (arr, ...keywords) => {
                      const item = arr.find(it => {
                        const lbl = (it.label || it.name || '').toString().toLowerCase();
                        return keywords.some(k => lbl.includes(k));
                      });
                      return Number(item?.amount || item?.value || item?.montant || 0) || 0;
                    };
                    const transportAllowance = Number(cache.transportAllowance || findAmt(indemnitesArr, 'transport'));
                    const housingAllowance = Number(cache.housingAllowance || findAmt(indemnitesArr, 'logement', 'habitation', 'housing'));
                    const representationAllowance = Number(cache.representationAllowance || findAmt(indemnitesArr, 'représentation', 'representation'));
                    const dirtAllowance = Number(cache.dirtAllowance || findAmt(indemnitesArr, 'salissure', 'salissures', 'dirt'));
                    const mealAllowance = Number(cache.mealAllowance || findAmt(indemnitesArr, 'panier', 'repas', 'meal'));
                    const overtime = Number(cache.overtime || findAmt(primesArr, 'heure sup', 'heures sup', 'hs', 'overtime'));
                    const bonus = Number(cache.bonus || findAmt(primesArr, 'prime', 'bonus', 'gratification'));

                    setFormData(prev => ({
                      ...prev,
                      [id]: {
                        ...prev[id],
                        indemniteTransport: transportAllowance,
                        primesImposables: bonus + overtime,
                        indemniteNonImposable: representationAllowance + dirtAllowance + mealAllowance,
                        housingAllowanceDisplay: housingAllowance,
                        representationAllowanceDisplay: representationAllowance,
                        dirtAllowanceDisplay: dirtAllowance,
                        mealAllowanceDisplay: mealAllowance,
                        overtimeDisplay: overtime,
                        bonusDisplay: bonus,
                        indemnitesArray: indemnitesArr.length ? indemnitesArr : undefined,
                        primesArray: primesArr.length ? primesArr : undefined,
                      }
                    }));
                    toast.success('Détails rechargés depuis la fiche de paie');
                  } catch (e) {
                    toast.error('Erreur de rechargement depuis le bulletin');
                  }
                };
                return (
                  <tr key={id} className="hover:bg-blue-50">
                    <td className="p-2 border">{d.cnps || ''}</td>
                    <td className="p-2 border font-mono">
                      {buildCnpsCode({ mois: d.mois, matriculeEmployeur: cnpsEmployeur, regime: d.regime, annee: d.annee, matriculeEmploye: d.cnps, joursTravailles: d.joursTravailles })}
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={d.regime || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [id]: { ...prev[id], regime: e.target.value.toUpperCase() } }))}
                        className="w-16 border rounded px-2 py-1 text-center"
                        placeholder="GC"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        min={0}
                        max={31}
                        value={Number(d.joursTravailles ?? 0)}
                        onChange={e => {
                          const val = Math.max(0, Math.min(31, Number(e.target.value || 0)));
                          setFormData(prev => ({ ...prev, [id]: { ...prev[id], joursTravailles: val } }));
                        }}
                        className="w-20 border rounded px-2 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 border">{d.nom}</td>
                    <td className="p-2 border">{d.cnps}</td>
                    <td className="p-2 border">{formatFR(d.brut)}</td>
                    <td className="p-2 border">{d.poste}</td>
                    {employerOptions.includeRP && (
                      <td className="p-2 border">{d.tauxRP}%</td>
                    )}
                    <td className="p-2 border">{formatFR(getSBT(d))}</td>
                    {/* SBC réel (base cotisable CNPS) */}
                    <td className="p-2 border">{formatFR(getSBC(d))}</td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={Number(d.indemniteTransport || 0)}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          [id]: { ...prev[id], indemniteTransport: Number(e.target.value) || 0 }
                        }))}
                        className="w-20 border rounded px-1 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={Number(d.overtimeDisplay || 0)}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          [id]: { ...prev[id], overtimeDisplay: Number(e.target.value) || 0 }
                        }))}
                        className="w-20 border rounded px-1 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="number"
                        value={Number(d.bonusDisplay || 0)}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          [id]: { ...prev[id], bonusDisplay: Number(e.target.value) || 0 }
                        }))}
                        className="w-20 border rounded px-1 py-1 text-right"
                      />
                    </td>
                    <td className="p-2 border">{formatFR(totalPrimes)}</td>
                    <td className="p-2 border">{formatFR(totalIndemnites)}</td>
                    <td className="p-2 border">{formatFR(taxRow.irpp)}</td>
                    <td className="p-2 border">{formatFR(taxRow.cfc)}</td>
                    <td className="p-2 border">{formatFR(taxRow.cac)}</td>
                    <td className="p-2 border">{formatFR(taxRow.tdl)}</td>
                    <td className="p-2 border">{formatFR(c.cotisSalarie)}</td>
                    {/* Net à payer (affichage) */}
                    <td className="p-2 border">
                      {(() => {
                        const taxRow2 = taxesData.rows.find(r => r.id === id) || { irpp: 0, cac: 0, tdl: 0, cfc: 0, fneSal: 0 };
                        const net2 = Number(d.brut || 0)
                          - Number(c.cotisSalarie || 0)
                          - Number(taxRow2.irpp || 0)
                          - Number(taxRow2.cac || 0)
                          - Number(taxRow2.tdl || 0)
                          - Number(taxRow2.cfc || 0)
                          - Number(taxRow2.fneSal || 0);
                        return formatFR(net2);
                      })()}
                    </td>
                    <td className="p-2 border">{d.mois}</td>
                    <td className="p-2 border">{d.annee}</td>
                  </tr>
                );
              })}
            </tbody>
            {selectedIds.length > 0 && (
              <tfoot>
                <tr className="bg-blue-50 font-semibold">
                  <td className="p-2 border" colSpan={(employerOptions.includeRP ? 9 : 8)}>Totaux</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.sbt)}</td>
                  {/* Total SBC (base cotisable CNPS) */}
                  <td className="p-2 border">{formatFR(tableTotals.base)}</td>
                  {/* Placeholders for: Indemnité Transport, Heures Supplémentaires, Prime/Bonus */}
                  <td className="p-2 border"></td>
                  <td className="p-2 border"></td>
                  <td className="p-2 border"></td>
                  {/* Totaux primes/indemnités sur la sélection */}
                  <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const arr = Array.isArray(d.primesArray) ? d.primesArray : null;
                    if (arr && arr.length) return acc + arr.reduce((s, it) => s + (Number(it?.montant ?? it?.amount ?? it?.value ?? 0) || 0), 0) + Number(d.indemniteTransport || 0);
                    return acc + ((Number(d.primesImposables || 0) || (Number(d.overtimeDisplay || 0) + Number(d.bonusDisplay || 0))) + Number(d.indemniteTransport || 0));
                  }, 0))}</td>
                  <td className="p-2 border">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const arr = Array.isArray(d.indemnitesArray) ? d.indemnitesArray : null;
                    if (arr && arr.length) return acc + arr.reduce((s, it) => s + (Number(it?.montant ?? it?.amount ?? it?.value ?? 0) || 0), 0);
                    return acc + (
                      Number(d.housingAllowanceDisplay || 0)
                      + Number(d.representationAllowanceDisplay || 0)
                      + Number(d.dirtAllowanceDisplay || 0)
                      + Number(d.mealAllowanceDisplay || 0)
                    );
                  }, 0))}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.irpp)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.cfc)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.cac)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.tdl)}</td>
                  <td className="p-2 border">{formatFR(tableTotals.sal)}</td>
                  {/* Total Net à payer */}
                  <td className="p-2 border">{formatFR(totalNet)}</td>
                  <td className="p-2 border"></td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Déclaration des impôts</h4>
          <div className="flex flex-wrap items-end gap-6 mb-3 text-sm">
            <div>
              <div className="text-gray-600">CFC SAL: <span className="font-semibold">{taxOptions.cfcRate}%</span> (fixe)</div>
            </div>
            <div className="text-gray-600">FNE: <span className="font-semibold">{taxOptions.fneRate}% salarié</span> + <span className="font-semibold">{(Number(taxOptions.fneRate || 0) * 1.5)}% employeur</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs">
              <thead className="bg-amber-100">
                <tr>
                  <th className="p-2 border">Matricule CNPS</th>
                  <th className="p-2 border">Nom</th>
                  <th className="p-2 border">Salaire taxable (SBT)</th>
                  <th className="p-2 border">IRPP</th>
                  <th className="p-2 border">CAC (10% IRPP)</th>
                  <th className="p-2 border">CFC SAL (2,5%)</th>
                  <th className="p-2 border">TDL (10% IRPP)</th>
                  <th className="p-2 border">FNE sal. (1%)</th>
                  <th className="p-2 border">FNE emp. (1,5%)</th>
                </tr>
              </thead>
              <tbody>
                {taxesData.rows.map(r => (
                  <tr key={r.id} className="hover:bg-amber-50">
                    <td className="p-2 border">{r.matricule}</td>
                    <td className="p-2 border">{r.nom}</td>
                    <td className="p-2 border">{formatFR(r.sbt)}</td>
                    <td className="p-2 border">{formatFR(r.irpp)}</td>
                    <td className="p-2 border">{formatFR(r.cac)}</td>
                    <td className="p-2 border">{formatFR(r.cfc)}</td>
                    <td className="p-2 border">{formatFR(r.tdl)}</td>
                    <td className="p-2 border">{formatFR(r.fneSal)}</td>
                    <td className="p-2 border">{formatFR(r.fneEmp)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 font-semibold">
                  <td className="p-2 border" colSpan={2}>Totaux</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.sbt)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.irpp)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.cac)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.cfc)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.tdl)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.fneSal)}</td>
                  <td className="p-2 border">{formatFR(taxesData.totals.fneEmp)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex gap-4 mt-4 flex-wrap">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer déclaration"}
          </Button>
          <Button onClick={handleExportCNPDF} variant="secondary">
            Exporter CNPS (PDF - paysage)
          </Button>
          <Button onClick={handleExportTaxesPDF} variant="secondary">
            Exporter Impôts (PDF)
          </Button>
          <Button onClick={() => handleExportExcel(false)} variant="secondary">
            Exporter en Excel (sélection)
          </Button>
          <Button onClick={() => handleExportExcel(true)} variant="secondary">
            Exporter tout en Excel
          </Button>
          <Button onClick={() => reloadAllFromPayslips(false)} variant="secondary">
            Recharger tout depuis bulletins
          </Button>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h4 className="font-semibold mb-3">Récapitulatif employeur</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
            <div className="p-2 bg-white rounded border">
              <div className="text-gray-500">Total salaires (brut)</div>
              <div className="font-bold">{formatFR(employerSummary.totalBrut)} FCFA</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-gray-500">Total base cotisable</div>
              <div className="font-bold">{formatFR(employerSummary.totalBase)} FCFA</div>
            </div>
            <div className="p-2 bg-white rounded border">
              <div className="text-gray-500">Total dû employeur</div>
              <div className="font-bold text-blue-700">{formatFR(employerSummary.totalEmployeurDu)} FCFA</div>
            </div>
            <div className="p-2 bg-white rounded border md:col-span-3">
              <div className="text-gray-500">Retenues salarié (4,2%)</div>
              <div className="font-bold">{formatFR(tableTotals.sal)} FCFA</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-white rounded border">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={employerOptions.includePF} onChange={e => setEmployerOptions(o => ({ ...o, includePF: e.target.checked }))} />
                <span className="w-24">PF</span>
              </label>
              <span className="text-gray-500">Taux (%)</span>
              <input type="number" step="0.1" min={0} max={100} value={employerOptions.ratePF}
                     onChange={e => setEmployerOptions(o => ({ ...o, ratePF: Number(e.target.value) }))}
                     className="w-20 border rounded px-2 py-1 text-right" />
              <span className="ml-auto font-semibold">{employerSummary.totalPF.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white rounded border">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={employerOptions.includePVID} onChange={e => setEmployerOptions(o => ({ ...o, includePVID: e.target.checked }))} />
                <span className="w-24">PVID</span>
              </label>
              <span className="text-gray-500">Taux (%)</span>
              <input type="number" step="0.1" min={0} max={100} value={employerOptions.ratePVID}
                     onChange={e => setEmployerOptions(o => ({ ...o, ratePVID: Number(e.target.value) }))}
                     className="w-20 border rounded px-2 py-1 text-right" />
              <span className="ml-auto font-semibold">{employerSummary.totalPVID.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white rounded border">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={employerOptions.includeRP} onChange={e => setEmployerOptions(o => ({ ...o, includeRP: e.target.checked }))} />
                <span className="w-24">RP</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={employerOptions.overrideRP} onChange={e => setEmployerOptions(o => ({ ...o, overrideRP: e.target.checked }))} />
                <span className="text-gray-600">Forcer taux</span>
              </label>
              <span className="text-gray-500">Taux (%)</span>
              <input type="number" step="0.1" min={0} max={100} disabled={!employerOptions.overrideRP} value={employerOptions.rateRP}
                     onChange={e => setEmployerOptions(o => ({ ...o, rateRP: Number(e.target.value) }))}
                     className="w-20 border rounded px-2 py-1 text-right disabled:bg-gray-100" />
              <span className="ml-auto font-semibold">{employerSummary.totalRP.toLocaleString()} FCFA</span>
            </div>
          </div>
        </div>
      )}
      {/* Déclaration CNPS Employeur */}
      {selectedIds.length > 0 && (
        <div className="mt-8 p-4 border rounded bg-yellow-50">
          <h3 className="font-semibold mb-4 text-lg">Déclaration CNPS - Charges Employeur</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-yellow-100">
                <tr>
                  <th className="p-3 border">Matricule CNPS</th>
                  <th className="p-3 border">Nom</th>
                  <th className="p-3 border">Base Cotisable</th>
                  <th className="p-3 border">PVID Employeur (4,9%)</th>
                  <th className="p-3 border">PF (7%)</th>
                  {employerOptions.includeRP && (
                    <th className="p-3 border">RP ({employerOptions.overrideRP ? employerOptions.rateRP : 'Variable'}%)</th>
                  )}
                  <th className="p-3 border">Total Employeur</th>
                  <th className="p-3 border">PVID Salarié (4,2%)</th>
                  <th className="p-3 border">Total à Verser CNPS</th>
                </tr>
              </thead>
              <tbody>
                {selectedIds.map(id => {
                  const d = formData[id] || {};
                  const c = getCalculs(d, employerOptions);
                  return (
                    <tr key={id} className="hover:bg-yellow-50">
                      <td className="p-3 border">{d.cnps}</td>
                      <td className="p-3 border">{d.nom}</td>
                      <td className="p-3 border font-mono">{formatFR(c.baseCotisable)}</td>
                      <td className="p-3 border font-mono">{formatFR(c.pvidEmployeur)}</td>
                      <td className="p-3 border font-mono">{formatFR(c.prestationsFamilles)}</td>
                      {employerOptions.includeRP && (
                        <td className="p-3 border font-mono">{formatFR(c.risquesProfessionnels)}</td>
                      )}
                      <td className="p-3 border font-mono font-semibold text-blue-700">{formatFR(c.cotisEmployeur)}</td>
                      <td className="p-3 border font-mono">{formatFR(c.cotisSalarie)}</td>
                      <td className="p-3 border font-mono font-bold text-green-700">{formatFR(c.totalGlobal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-yellow-200 font-semibold">
                  <td className="p-3 border" colSpan={2}>TOTAUX</td>
                  <td className="p-3 border font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.baseCotisable;
                  }, 0))}</td>
                  <td className="p-3 border font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.pvidEmployeur;
                  }, 0))}</td>
                  <td className="p-3 border font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.prestationsFamilles;
                  }, 0))}</td>
                  {employerOptions.includeRP && (
                    <td className="p-3 border font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                      const d = formData[id] || {};
                      const c = getCalculs(d, employerOptions);
                      return acc + c.risquesProfessionnels;
                    }, 0))}</td>
                  )}
                  <td className="p-3 border font-mono font-bold text-blue-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.cotisEmployeur;
                  }, 0))}</td>
                  <td className="p-3 border font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.cotisSalarie;
                  }, 0))}</td>
                  <td className="p-3 border font-mono font-bold text-green-700">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.totalGlobal;
                  }, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white rounded border">
              <div className="font-semibold text-gray-700">Récapitulatif Employeur</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>PVID Employeur (4,9%):</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.pvidEmployeur;
                  }, 0))} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Prestations Familiales (7%):</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.prestationsFamilles;
                  }, 0))} FCFA</span>
                </div>
                {employerOptions.includeRP && (
                  <div className="flex justify-between">
                    <span>Risques Professionnels:</span>
                    <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                      const d = formData[id] || {};
                      const c = getCalculs(d, employerOptions);
                      return acc + c.risquesProfessionnels;
                    }, 0))} FCFA</span>
                  </div>
                )}
                <hr className="my-2" />
                <div className="flex justify-between font-semibold text-blue-700">
                  <span>Total Charges Employeur:</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.cotisEmployeur;
                  }, 0))} FCFA</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-white rounded border">
              <div className="font-semibold text-gray-700">Total à Verser CNPS</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Retenues Salarié (4,2%):</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.cotisSalarie;
                  }, 0))} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Charges Employeur:</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.cotisEmployeur;
                  }, 0))} FCFA</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-green-700 text-lg">
                  <span>TOTAL À VERSER:</span>
                  <span className="font-mono">{formatFR(selectedIds.reduce((acc, id) => {
                    const d = formData[id] || {};
                    const c = getCalculs(d, employerOptions);
                    return acc + c.totalGlobal;
                  }, 0))} FCFA</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3 flex-wrap">
            <Button 
              onClick={() => handleExportDeclarationPDF()}
              variant="secondary"
            >
              Exporter Déclaration CNPS (PDF)
            </Button>
            <Button 
              onClick={() => handleExportDeclarationExcel()}
              variant="secondary"
            >
              Exporter Déclaration CNPS (Excel)
            </Button>
          </div>
        </div>
      )}

      {/* Aperçu des cotisations enregistrées */}
      <div className="mt-8">
        <h3 className="font-semibold mb-2">Aperçu des cotisations enregistrées</h3>
        <div className="flex gap-2 mb-2">
          <label>Mois :</label>
          <select value={moisApercu} onChange={e => setMoisApercu(e.target.value)} className="border rounded px-2 py-1">
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={String(i+1).padStart(2, "0")}>{String(i+1).padStart(2, "0")}</option>
            ))}
          </select>
          <label>Année :</label>
          <select value={anneeApercu} onChange={e => setAnneeApercu(e.target.value)} className="border rounded px-2 py-1">
            {Array.from(new Set(cotisations.map(c => c.annee))).sort().map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          {/* Légende des tags de calcul */}
          <div className="text-[11px] text-gray-600 mb-1">
            <span className="inline-block mr-3"><span className="px-1 py-0.5 border rounded">SBT</span> = Inclus Salaire Brut Taxable</span>
            <span className="inline-block mr-3"><span className="px-1 py-0.5 border rounded">SBC</span> = Inclus Salaire Brut Cotisable</span>
            <span className="inline-block mr-3"><span className="px-1 py-0.5 border rounded">IMPOSABLE</span> = Inclus dans Total Primes</span>
            <span className="inline-block"><span className="px-1 py-0.5 border rounded">NI</span> = Non imposable (hors SBT)</span>
          </div>
          <table className="min-w-full border text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Matricule CNPS</th>
                <th className="p-2 border">Code CNPS</th>
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">CNPS</th>
                <th className="p-2 border">Brut</th>
                <th className="p-2 border">Catégorie/Poste</th>
                {employerOptions.includeRP && (
                  <th className="p-2 border">Taux RP</th>
                )}
                <th className="p-2 border">Base cotisable</th>
                <th className="p-2 border">PVID (Sal. 4,2%)</th>
                
                <th className="p-2 border">Mois</th>
                <th className="p-2 border">Année</th>
              </tr>
            </thead>
            <tbody>
              {cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).length === 0 ? (
                <tr><td colSpan={employerOptions.includeRP ? 12 : 11} className="text-center text-gray-400 p-2">Aucune cotisation enregistrée pour cette période.</td></tr>
              ) : (
                cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{c.cnps}</td>
                    <td className="p-2 border font-mono">{c.cnpsCode || buildCnpsCode({ mois: c.mois, matriculeEmployeur: c.cnpsEmployeur || cnpsEmployeur, regime: c.regime, annee: c.annee, matriculeEmploye: c.cnps, joursTravailles: c.joursTravailles })}</td>
                    <td className="p-2 border">{c.nom}</td>
                    <td className="p-2 border">{c.cnps}</td>
                    <td className="p-2 border">{Number(c.brut).toLocaleString()}</td>
                    <td className="p-2 border">{c.poste}</td>
                    {employerOptions.includeRP && (
                      <td className="p-2 border">{c.tauxRP}</td>
                    )}
                    <td className="p-2 border">{Number(c.baseCotisable ?? c.base).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.cotisSalarie).toLocaleString()}</td>
                    <td className="p-2 border">{c.mois}</td>
                    <td className="p-2 border">{c.annee}</td>
                  </tr>
                ))
              )}
          
  </tbody>
          </table>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-6">
        <strong>Barème :</strong> Plafond base cotisable 750 000 FCFA. Salarié 4,2% (PVID). Employeur 4,9% (PVID) + 7% (PF) + taux RP (voir catégorie).<br />
        <strong>Déclaration groupée :</strong> Sélectionnez plusieurs salariés pour générer une déclaration groupée.
      </div>
    </div>
  );
};

export default CotisationCNPS; 