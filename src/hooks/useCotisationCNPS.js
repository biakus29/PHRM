// src/hooks/useCotisationCNPS.js
// Hook personnalisé pour la gestion des cotisations CNPS

import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { 
  computeNetPay, 
  computePVID, 
  computeGrossTotal, 
  computeSBT, 
  computeSBC,
  getCalculs,
  CNPS_CAP
} from "../utils/payrollCalculations";
import { 
  getPayslipCacheKeyFromCNPSRow, 
  getPayslipCacheKeyFromEmployee, 
  getLastPayslipCache 
} from "../utils/payslipCache";
import { getTauxRP } from "../utils/cnpsRates";
import { getCurrentMonthYear } from "../utils/dateUtils";
import { buildCnpsCode } from "../utils/cnpsUtils";

export const useCotisationCNPS = (companyId, cnpsEmployeur) => {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cotisations, setCotisations] = useState([]);
  const [moisApercu, setMoisApercu] = useState(getCurrentMonthYear().month);
  const [anneeApercu, setAnneeApercu] = useState(getCurrentMonthYear().year);
  const [uniformTransport, setUniformTransport] = useState(0);
  
  const [employerOptions, setEmployerOptions] = useState({
    includePF: true,
    ratePF: 7.0,
    includePVID: true,
    ratePVID: 4.9,
    includeRP: false,
    overrideRP: false,
    rateRP: 2.0,
  });

  const [taxOptions, setTaxOptions] = useState({
    cfcRate: 1.0,
    fneRate: 1.0,
  });

  // Charger les employés
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

  // Charger les cotisations
  useEffect(() => {
    if (!companyId) return;
    getDocs(collection(db, "clients", companyId, "cotisations_cnps"))
      .then((snap) => {
        setCotisations(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      })
      .catch(() => toast.error("Erreur chargement cotisations CNPS"));
  }, [companyId, saving]);

  // Fonction de rechargement depuis les bulletins
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
        const empKey = getPayslipCacheKeyFromCNPSRow({
          matriculeInterne: d.matriculeInterne,
          cnps: d.cnps,
          nom: d.nom,
        });
        
        if (!empKey) return;
        
        const cache = getLastPayslipCache(empKey);
        if (!cache) {
          // Calcul automatique si pas de cache
          const baseSalary = Number(d.brut) || 0;
          const primesImposables = Number(d.primesImposables) || 0;
          const indemniteTransport = Number(d.indemniteTransport) || 0;
          const housingAllowance = Number(d.housingAllowanceDisplay) || 0;
          const representationAllowance = Number(d.representationAllowanceDisplay) || 0;
          const dirtAllowance = Number(d.dirtAllowanceDisplay) || 0;
          const mealAllowance = Number(d.mealAllowanceDisplay) || 0;
          const overtime = Number(d.overtimeDisplay) || 0;
          const bonus = Number(d.bonusDisplay) || 0;
          
          // 1. Préparation des données de rémunération
          const salaryDetails = { 
            baseSalary,
            transportAllowance: indemniteTransport,
            housingAllowance,
            representationAllowance,
            dirtAllowance,
            mealAllowance
          };
          
          const primes = primesImposables > 0 ? [{ montant: primesImposables, type: 'Primes imposables' }] : [];
          const indemnites = [
            { montant: indemniteTransport, type: 'Indemnité transport' },
            { montant: housingAllowance, type: 'Indemnité logement' },
            { montant: representationAllowance, type: 'Indemnité représentation' },
            { montant: dirtAllowance, type: 'Indemnité salissure' },
            { montant: mealAllowance, type: 'Indemnité repas' }
          ].filter(i => i.montant > 0);
          
          // 2. Calcul du brut total
          const totalBrut = baseSalary + 
                           primesImposables + 
                           indemniteTransport + 
                           housingAllowance + 
                           representationAllowance + 
                           dirtAllowance + 
                           mealAllowance + 
                           overtime + 
                           bonus;
          
          // 3. Calcul des déductions
          const pvid = computePVID(baseSalary);
          const deductions = {
            pvid,
            irpp: Number(d.irpp || 0),
            cfc: Number(d.cfc || 0),
            cac: Number(d.cac || 0),
            rav: Number(d.rav || 0),
            tdl: Number(d.tdl || 0)
          };
          
          // 4. Calcul du net à payer
          const remuneration = {
            overtime,
            bonus,
            total: totalBrut
          };
          
          const autoCalc = computeNetPay({
            salaryDetails,
            remuneration,
            deductions,
            primes,
            indemnites
          });
          
          // Calcul des bases SBT et SBC avec les mêmes paramètres
          const sbtValue = computeSBT(salaryDetails, remuneration, primes, indemnites);
          const sbcValue = computeSBC(salaryDetails, remuneration, primes, indemnites);
          
          next[id] = {
            ...d,
            brut: totalBrut,
            sbt: sbtValue,
            sbc: sbcValue,
            netToPay: autoCalc.netPay || 0,
            net: autoCalc.netPay || 0,
            irpp: autoCalc.roundedDeductions?.irpp || 0,
            cac: autoCalc.roundedDeductions?.cac || 0,
            cfc: autoCalc.roundedDeductions?.cfc || 0,
            tdl: autoCalc.roundedDeductions?.tdl || 0,
            rav: autoCalc.roundedDeductions?.rav || 0,
            pvid: autoCalc.roundedDeductions?.pvis || 0,
            // Inject dynamic arrays to mirror payslip data for DIPE and tables
            primesArray: primes.length ? primes : undefined,
            indemnitesArray: indemnites.length ? indemnites : undefined,
          };
          updated += 1;
          return;
        }
        
        // Récupération depuis le cache
        try {
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
            indemnitesArray: indemnitesArr.length ? indemnitesArr : undefined,
            primesArray: primesArr.length ? primesArr : undefined,
            irpp: cache.deductions?.irpp || cache.irpp || 0,
            cac: cache.deductions?.cac || cache.cac || 0,
            tdl: cache.deductions?.tdl || cache.tdl || 0,
            cfc: cache.deductions?.cfc || cache.cfc || 0,
            rav: cache.deductions?.rav || cache.rav || 0,
            pvid: cache.deductions?.pvid || cache.deductions?.pvis || cache.pvid || cache.pvis || 0,
            // Respect centralized bases; do not fallback to gross totals
            sbt: Number(cache.sbt || 0),
            sbc: Math.min(Number(cache.sbc || 0), CNPS_CAP),
            netToPay: cache.netPay || cache.netToPay || cache.net || 0,
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

  // Pré-remplissage des données employé
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
            // Pré-remplissage depuis la fiche de paie Firestore si disponible
            const baseSalary = Number(emp.baseSalary) || 0;
            let initialData = {
              nom: emp.name || "",
              cnps: emp.cnpsNumber || "",
              brut: baseSalary,
              poste: emp.professionalCategory || emp.poste || "",
              tauxRP,
              mois: month,
              annee: year,
              matriculeInterne: emp.matricule || '',
              regime: emp.cnpsRegime || 'GC',
              joursTravailles: 30,
              // Initialisation des primes et indemnités
              primesImposables: 0,
              indemniteTransport: 0,
              housingAllowanceDisplay: 0,
              representationAllowanceDisplay: 0,
              dirtAllowanceDisplay: 0,
              mealAllowanceDisplay: 0,
              overtimeDisplay: 0,
              bonusDisplay: 0,
              indemniteNonImposable: 0,
            };

            // Tentative de récupération depuis les bulletins Firestore (payslips)
            try {
              const slips = Array.isArray(emp.payslips) ? emp.payslips : [];
              const slip = slips.find(s => {
                const sMonth = String(s.month || s.mois || '').padStart(2, '0');
                const sYear = String(s.year || s.annee || '');
                return sMonth === String(month).padStart(2, '0') && sYear === String(year);
              }) || slips[slips.length - 1];

              if (slip) {
                const indemArr = Array.isArray(slip.indemnites) ? slip.indemnites : [];
                const primesArr = Array.isArray(slip.primes) ? slip.primes : [];
                const findAmt = (arr, ...keywords) => {
                  const item = arr.find(it => {
                    const lbl = (it.label || it.name || it.type || '').toString().toLowerCase();
                    return keywords.some(k => lbl.includes(k));
                  });
                  return Number(item?.montant || item?.amount || item?.value || 0) || 0;
                };

                // Récupération depuis salaryDetails et remuneration si disponibles
                const salDetails = slip.salaryDetails || {};
                const remuData = slip.remuneration || {};
                
                const transportAllowance = Number(salDetails.transportAllowance || slip.transportAllowance || findAmt(indemArr, 'transport', 'déplacement'));
                const housingAllowance = Number(salDetails.housingAllowance || slip.housingAllowance || findAmt(indemArr, 'logement', 'habitation', 'housing'));
                const representationAllowance = Number(salDetails.representationAllowance || slip.representationAllowance || findAmt(indemArr, 'représentation', 'representation'));
                const dirtAllowance = Number(salDetails.dirtAllowance || slip.dirtAllowance || findAmt(indemArr, 'salissure', 'salissures', 'dirt'));
                const mealAllowance = Number(salDetails.mealAllowance || slip.mealAllowance || findAmt(indemArr, 'panier', 'repas', 'meal'));
                const overtime = Number(remuData.overtime || slip.overtime || slip.heuresSupp || findAmt(primesArr, 'heure sup', 'heures sup', 'hs', 'overtime'));
                const bonus = Number(slip.bonus || findAmt(primesArr, 'prime', 'bonus', 'gratification', 'transport'));

                initialData = {
                  ...initialData,
                  brut: Number(remuData.total || slip.grossTotal || slip.totalBrut || slip.brut) || (baseSalary + transportAllowance + housingAllowance + overtime + bonus),
                  indemniteTransport: transportAllowance,
                  primesImposables: bonus + overtime,
                  indemniteNonImposable: representationAllowance + dirtAllowance + mealAllowance,
                  housingAllowanceDisplay: housingAllowance,
                  representationAllowanceDisplay: representationAllowance,
                  dirtAllowanceDisplay: dirtAllowance,
                  mealAllowanceDisplay: mealAllowance,
                  overtimeDisplay: overtime,
                  bonusDisplay: bonus,
                  // Injecter les tableaux pour correspondance avec fiche de paie
                  primesArray: primesArr.length ? primesArr : undefined,
                  indemnitesArray: indemArr.length ? indemArr : undefined,
                  irpp: Number(slip.deductions?.irpp || slip.irpp || 0),
                  cac: Number(slip.deductions?.cac || slip.cac || 0),
                  cfc: Number(slip.deductions?.cfc || slip.cfc || 0),
                  tdl: Number(slip.deductions?.tdl || slip.tdl || 0),
                  rav: Number(slip.deductions?.rav || slip.rav || 0),
                  pvid: Number(slip.deductions?.pvid || slip.deductions?.pvis || slip.pvid || slip.pvis || 0),
                  pvis: Number(slip.deductions?.pvid || slip.deductions?.pvis || slip.pvid || slip.pvis || 0),
                  netToPay: Number(slip.netPay || slip.netToPay || slip.net || 0),
                  net: Number(slip.netPay || slip.netToPay || slip.net || 0),
                  sbt: Number(slip.sbt || 0),
                  sbc: Number(slip.sbc || 0),
                };
              }
            } catch (e) {
              console.warn('Erreur récupération bulletin pour', emp?.name, e);
            }

            // Calcul automatique si pas de données complètes
            if (!initialData.sbt || !initialData.pvid) {
              const salaryDetails = { 
                baseSalary,
                transportAllowance: initialData.indemniteTransport,
                housingAllowance: initialData.housingAllowanceDisplay,
                representationAllowance: initialData.representationAllowanceDisplay,
                dirtAllowance: initialData.dirtAllowanceDisplay,
                mealAllowance: initialData.mealAllowanceDisplay
              };
              const remuneration = { 
                overtime: initialData.overtimeDisplay, 
                bonus: initialData.bonusDisplay 
              };
              const primes = initialData.primesImposables > 0 ? [{ montant: initialData.primesImposables, type: 'Primes imposables' }] : [];
              const indemnites = [
                { montant: initialData.indemniteTransport, type: 'Indemnité transport' },
                { montant: initialData.housingAllowanceDisplay, type: 'Indemnité logement' },
                { montant: initialData.representationAllowanceDisplay, type: 'Indemnité représentation' },
                { montant: initialData.dirtAllowanceDisplay, type: 'Indemnité salissure' },
                { montant: initialData.mealAllowanceDisplay, type: 'Indemnité repas' }
              ].filter(i => i.montant > 0);
              
              const grossTotal = computeGrossTotal(salaryDetails, remuneration, primes, indemnites);
              const sbtValue = computeSBT(salaryDetails, remuneration, primes, indemnites);
              const sbcValue = computeSBC(salaryDetails, remuneration, primes, indemnites);
              const pvidValue = computePVID(baseSalary);
              
              const autoCalc = computeNetPay({
                salaryDetails,
                remuneration,
                deductions: { 
                  pvid: pvidValue,
                  irpp: initialData.irpp,
                  cac: initialData.cac,
                  cfc: initialData.cfc,
                  tdl: initialData.tdl,
                  rav: initialData.rav
                },
                primes,
                indemnites
              });

              initialData = {
                ...initialData,
                brut: grossTotal,
                sbt: sbtValue,
                sbc: sbcValue,
                pvid: pvidValue,
                pvis: pvidValue,
                irpp: initialData.irpp || autoCalc.roundedDeductions?.irpp || 0,
                cac: initialData.cac || autoCalc.roundedDeductions?.cac || 0,
                cfc: initialData.cfc || autoCalc.roundedDeductions?.cfc || 0,
                tdl: initialData.tdl || autoCalc.roundedDeductions?.tdl || 0,
                rav: initialData.rav || autoCalc.roundedDeductions?.rav || 0,
                netToPay: initialData.netToPay || autoCalc.netPay || 0,
                net: initialData.net || autoCalc.netPay || 0,
              };
            }

            next[id] = initialData;
          }
        }
      });
      return next;
    });
  }, [selectedIds, employees]);

  // Auto-synchronisation activée pour récupérer les nouvelles fiches de paie
  useEffect(() => {
    if (selectedIds && selectedIds.length > 0) {
      reloadAllFromPayslips(true);
    }
  }, [selectedIds, employees]); // Ajout de employees pour détecter les changements de payslips

  // Validation des données
  const validateEmployeeData = (data) => {
    const errors = [];
    if (!data.brut || data.brut <= 0) errors.push("Salaire brut requis");
    if (!data.cnps) errors.push("Numéro CNPS requis");
    if (data.brut > 0 && data.brut < 36270) errors.push("Salaire < SMIG (36 270 FCFA)");
    // Validate against actual centralized SBC computed from row data
    const sbc = getSBC(data);
    if (sbc > CNPS_CAP) errors.push("Base cotisable dépasse le plafond CNPS");
    return errors;
  };

  // Enregistrement Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
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

  return {
    // State
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
    
    // Setters
    setSelectedIds,
    setFormData,
    setMoisApercu,
    setAnneeApercu,
    setUniformTransport,
    setEmployerOptions,
    setTaxOptions,
    
    // Functions
    reloadAllFromPayslips,
    validateEmployeeData,
    handleSave,
  };
};
