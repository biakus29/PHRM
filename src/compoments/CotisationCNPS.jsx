import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import Button from "./Button";
import { toast } from "react-toastify";
import { formatFR } from "../utils/numberUtils";
import { buildCnpsCode } from "../utils/cnpsUtils";
import { exportCnpsPDF, exportTaxesPDF } from "../utils/pdfCnps";
import * as XLSX from "xlsx";

// Mapping local Catégorie/Poste → taux de risque professionnel (en %)
const TAUX_RP = {
  "Ouvrier": 2.5,
  "Cadre": 1.75,
  "Employé": 1.75,
  "Agent de maîtrise": 2.0,
  "Technicien": 2.0,
  "Chauffeur": 3.0,
  "Sécurité": 3.0,
  // Ajoutez d'autres catégories/postes si besoin
};

const getTauxRP = (posteOuCategorie) => {
  if (!posteOuCategorie) return 1.75;
  // Recherche stricte puis partielle
  if (TAUX_RP[posteOuCategorie]) return TAUX_RP[posteOuCategorie];
  const found = Object.entries(TAUX_RP).find(([k]) =>
    posteOuCategorie.toLowerCase().includes(k.toLowerCase())
  );
  return found ? found[1] : 1.75;
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    year: String(now.getFullYear()),
  };
};

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

  // 3. Calculs automatiques
  const getCalculs = (data) => {
    const base = Math.min(Number(data.brut) || 0, 750000);
    const cotisSalarie = +(base * 0.042).toFixed(0);
    // RP uniquement si l'employeur l'active
    const rpRate = employerOptions.includeRP
      ? (employerOptions.overrideRP ? employerOptions.rateRP : (Number(data.tauxRP) || 0))
      : 0;
    const cotisEmployeur = +(base * (0.049 + 0.07 + rpRate / 100)).toFixed(0);
    const partEmployeur = +(base * 0.049).toFixed(0); // PVID
    const partPrestaFamille = +(base * 0.07).toFixed(0); // PF
    const partRP = +(base * (rpRate / 100)).toFixed(0);
    const totalEmployeur = cotisEmployeur;
    const totalGlobal = cotisSalarie + cotisEmployeur;
    return {
      base,
      cotisSalarie,
      partEmployeur,
      partPrestaFamille,
      partRP,
      cotisEmployeur,
      totalEmployeur,
      totalGlobal,
    };
  };

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
      const base = Math.min(Number(d.brut) || 0, 750000);
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
    let base = 0, pf = 0, pvid = 0, rp = 0, sal = 0, emp = 0, empTot = 0, global = 0;
    selectedIds.forEach((id) => {
      const d = formData[id];
      if (!d) return;
      const c = getCalculs(d);
      base += c.base;
      pf += c.partPrestaFamille;
      pvid += c.partEmployeur;
      rp += c.partRP;
      sal += c.cotisSalarie;
      emp += c.cotisEmployeur;
      empTot += c.totalEmployeur;
      global += c.totalGlobal;
    });
    const round0 = (n) => Math.round(n || 0);
    return {
      base: round0(base), pf: round0(pf), pvid: round0(pvid), rp: round0(rp),
      sal: round0(sal), emp: round0(emp), empTot: round0(empTot), global: round0(global)
    };
  }, [selectedIds, formData]);

  // Helper: calcul du Salaire Brut Taxable (SBT) selon normes camerounaises
  // Logique: prioriser un champ spécifique s'il est fourni (brutTaxable/sbt), sinon partir du brut.
  // Vous pouvez étendre ceci pour soustraire les indemnités non imposables et avantages exonérés
  // si ces champs sont ajoutés plus tard (ex: indemniteNonImposable, avantagesExoneres).
  const getSBT = (data) => {
    const brut = Number(data.brut) || 0;
    const brutTaxable = Number(data.brutTaxable ?? data.sbt) || 0;
    // Si un brut taxable est fourni, l'utiliser; sinon fallback sur brut actuel
    const base = brutTaxable > 0 ? brutTaxable : brut;
    // Normaliser à >= 0
    return Math.max(0, Math.round(base));
  };

  // Données pour Déclaration des impôts (simplifiée avec taux paramétrables)
  const taxesData = React.useMemo(() => {
    const rows = [];
    let totals = { sbt: 0, irpp: 0, cac: 0, cfc: 0, fneSal: 0, fneEmp: 0 };
    const ABATTEMENT_ANNUEL = 500000; // FCFA
    const ABATTEMENT_MENSUEL = ABATTEMENT_ANNUEL / 12;
    selectedIds.forEach((id) => {
      const d = formData[id] || {};
      const c = getCalculs(d);
      // Salaire Brut Taxable
      const sbt = getSBT(d);
      const pvidSal = c.cotisSalarie || 0; // 4.2% PVID salarié
      // SNC mensuel = 70% SBT – PVID – 500000/12
      let snc = 0.7 * sbt - pvidSal - ABATTEMENT_MENSUEL;
      if (sbt < 62000) snc = 0; // En dessous de 62 000, IRPP = 0
      snc = Math.max(0, snc);
      // Barème IRPP mensuel
      let irpp = 0;
      if (snc > 416667) {
        irpp = 70833.75 + (snc - 416667) * 0.35;
      } else if (snc > 250000) {
        irpp = 29167 + (snc - 250000) * 0.25;
      } else if (snc > 166667) {
        irpp = 16667 + (snc - 166667) * 0.15;
      } else if (snc > 0) {
        irpp = snc * 0.10;
      } else {
        irpp = 0;
      }
      irpp = Math.round(irpp);
      const cac = Math.round(irpp * 0.10); // 10% de l'IRPP
      const cfc = Math.round(sbt * (Number(taxOptions.cfcRate) / 100));
      const fneSal = Math.round(sbt * 0.01);
      const fneEmp = Math.round(sbt * 0.015);
      rows.push({ id, matricule: d.matriculeInterne, nom: d.nom, sbt, irpp, cac, cfc, fneSal, fneEmp });
      totals.sbt += sbt; totals.irpp += irpp; totals.cac += cac; totals.cfc += cfc; totals.fneSal += fneSal; totals.fneEmp += fneEmp;
    });
    const round0 = (n) => Math.round(n || 0);
    totals = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, round0(v)]));
    return { rows, totals };
  }, [selectedIds, formData, taxOptions]);

  // 4. Enregistrement Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      for (const id of selectedIds) {
        const data = formData[id];
        const calculs = getCalculs(data);
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
            matriculeEmploye: data.matriculeInterne,
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

  // 6. Export Excel (sélection ou tout)
  const handleExportExcel = (all = false) => {
    let rows = [];
    if (all) {
      // Exporter toutes les cotisations enregistrées (aperçu)
      rows = cotisations.map((c) => {
        const row = [
          c.matriculeInterne || '',
          c.cnpsCode || buildCnpsCode({
            mois: c.mois,
            matriculeEmployeur: c.cnpsEmployeur || cnpsEmployeur,
            regime: c.regime,
            annee: c.annee,
            matriculeEmploye: c.matriculeInterne,
            joursTravailles: c.joursTravailles,
          }),
          c.nom,
          c.cnps,
          c.brut,
          c.poste,
        ];
        if (employerOptions.includeRP) row.push(c.tauxRP);
        row.push(
          c.base,
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
        const c = getCalculs(d);
        const row = [
          d.matriculeInterne,
          buildCnpsCode({
            mois: d.mois,
            matriculeEmployeur: cnpsEmployeur,
            regime: d.regime,
            annee: d.annee,
            matriculeEmploye: d.matriculeInterne,
            joursTravailles: d.joursTravailles,
          }),
          d.nom,
          d.cnps,
          d.brut,
          d.poste,
        ];
        if (employerOptions.includeRP) row.push(d.tauxRP);
        row.push(
          c.base,
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
      "Matricule interne",
      "Code CNPS",
      "Nom",
      "CNPS",
      "Brut",
      "Catégorie/Poste",
    ];
    if (employerOptions.includeRP) wsHead.push("Taux RP");
    wsHead.push(
      "Base cotisable",
      "Cotisation salarié",
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
      <h2 className="text-2xl font-bold mb-4">Déclaration Mensuelle Cotisation CNPS</h2>
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
          <table className="min-w-full border text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-2 border">Matricule interne</th>
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
                <th className="p-2 border">Base cotisable</th>
                <th className="p-2 border">Détail salarié</th>
                <th className="p-2 border">Cotisation salarié</th>
                <th className="p-2 border">Cotisation employeur</th>
                <th className="p-2 border">Total à verser</th>
                <th className="p-2 border">Mois</th>
                <th className="p-2 border">Année</th>
              </tr>
            </thead>
            <tbody>
              {selectedIds.map(id => {
                const d = formData[id] || {};
                const c = getCalculs(d);
                return (
                  <tr key={id} className="hover:bg-blue-50">
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={d.matriculeInterne || ''}
                        onChange={e => setFormData(prev => ({ ...prev, [id]: { ...prev[id], matriculeInterne: e.target.value } }))}
                        className="w-28 border rounded px-2 py-1"
                        placeholder="Matricule"
                      />
                    </td>
                    <td className="p-2 border font-mono">
                      {buildCnpsCode({ mois: d.mois, matriculeEmployeur: cnpsEmployeur, regime: d.regime, annee: d.annee, matriculeEmploye: d.matriculeInterne, joursTravailles: d.joursTravailles })}
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
                    <td className="p-2 border">{formatFR(c.base)}</td>
                    <td className="p-2 border text-xs text-gray-700">PVID 4,2%</td>
                    <td className="p-2 border">{formatFR(c.cotisSalarie)}</td>
                    <td className="p-2 border">{formatFR(c.cotisEmployeur)}</td>
                    <td className="p-2 border font-bold">{formatFR(c.totalGlobal)}</td>
                    <td className="p-2 border">{d.mois}</td>
                    <td className="p-2 border">{d.annee}</td>
                  </tr>
                );
              })}
            </tbody>
            {selectedIds.length > 0 && (
              <tfoot>
                <tr className="bg-blue-50 font-semibold">
                  <td className="p-2 border" colSpan={employerOptions.includeRP ? 9 : 8}>Totaux</td>
                  <td className="p-2 border">{formatFR(tableTotals.base)}</td>
                  <td className="p-2 border"></td>
                  <td className="p-2 border">{formatFR(tableTotals.sal)}</td>
                  <td className="p-2 border">{formatFR(tableTotals.emp)}</td>
                  <td className="p-2 border">{formatFR(tableTotals.global)}</td>
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
            <div className="text-gray-600">FNE: <span className="font-semibold">1% salarié</span> + <span className="font-semibold">1,5% employeur</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs">
              <thead className="bg-amber-100">
                <tr>
                  <th className="p-2 border">Matricule</th>
                  <th className="p-2 border">Nom</th>
                  <th className="p-2 border">Salaire taxable (SBT)</th>
                  <th className="p-2 border">IRPP</th>
                  <th className="p-2 border">CAC (10% IRPP)</th>
                  <th className="p-2 border">CFC SAL (2,5%)</th>
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
          <table className="min-w-full border text-xs">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Matricule interne</th>
                <th className="p-2 border">Code CNPS</th>
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">CNPS</th>
                <th className="p-2 border">Brut</th>
                <th className="p-2 border">Catégorie/Poste</th>
                {employerOptions.includeRP && (
                  <th className="p-2 border">Taux RP</th>
                )}
                <th className="p-2 border">Base cotisable</th>
                <th className="p-2 border">Cotisation salarié</th>
                <th className="p-2 border">Cotisation employeur</th>
                <th className="p-2 border">Total à verser</th>
                <th className="p-2 border">Mois</th>
                <th className="p-2 border">Année</th>
              </tr>
            </thead>
            <tbody>
              {cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).length === 0 ? (
                <tr><td colSpan={employerOptions.includeRP ? 13 : 12} className="text-center text-gray-400 p-2">Aucune cotisation enregistrée pour cette période.</td></tr>
              ) : (
                cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{c.matriculeInterne}</td>
                    <td className="p-2 border font-mono">{c.cnpsCode || buildCnpsCode({ mois: c.mois, matriculeEmployeur: c.cnpsEmployeur || cnpsEmployeur, regime: c.regime, annee: c.annee, matriculeEmploye: c.matriculeInterne, joursTravailles: c.joursTravailles })}</td>
                    <td className="p-2 border">{c.nom}</td>
                    <td className="p-2 border">{c.cnps}</td>
                    <td className="p-2 border">{Number(c.brut).toLocaleString()}</td>
                    <td className="p-2 border">{c.poste}</td>
                    {employerOptions.includeRP && (
                      <td className="p-2 border">{c.tauxRP}</td>
                    )}
                    <td className="p-2 border">{Number(c.base).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.cotisSalarie).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.cotisEmployeur).toLocaleString()}</td>
                    <td className="p-2 border font-bold">{Number(c.totalGlobal).toLocaleString()}</td>
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