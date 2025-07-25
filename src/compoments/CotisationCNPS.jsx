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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const CotisationCNPS = ({ companyId, cnpsEmployeur }) => {
  const [employees, setEmployees] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // Pour déclaration groupée
  const [formData, setFormData] = useState({}); // { [employeeId]: { ...fields } }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cotisations, setCotisations] = useState([]); // Aperçu Firestore
  const [moisApercu, setMoisApercu] = useState(getCurrentMonthYear().month);
  const [anneeApercu, setAnneeApercu] = useState(getCurrentMonthYear().year);

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
    const cotisEmployeur = +(base * (0.049 + 0.07 + (data.tauxRP || 0) / 100)).toFixed(0);
    const partEmployeur = +(base * 0.049).toFixed(0);
    const partPrestaFamille = +(base * 0.07).toFixed(0);
    const partRP = +(base * ((data.tauxRP || 0) / 100)).toFixed(0);
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

  // 5. Export PDF
  const handleExportPDF = () => {
    if (selectedIds.length === 0) return toast.error("Sélectionnez au moins un salarié");
    const doc = new jsPDF();
    // En-tête employeur
    doc.setFontSize(11);
    doc.text(`Numéro CNPS employeur : ${cnpsEmployeur || "N/A"}`, 15, 15);
    let startY = 25;
    autoTable(doc, {
      head: [[
        "Nom",
        "CNPS",
        "Brut",
        "Catégorie/Poste",
        "Taux RP",
        "Base cotisable",
        "Cotisation salarié",
        "Cotisation employeur",
        "Total employeur",
        "Total à verser",
        "Mois",
        "Année",
      ]],
      body: selectedIds.map((id) => {
        const d = formData[id];
        const c = getCalculs(d);
        return [
          d.nom,
          d.cnps,
          d.brut.toLocaleString(),
          d.poste,
          d.tauxRP + "%",
          c.base.toLocaleString(),
          c.cotisSalarie.toLocaleString(),
          c.cotisEmployeur.toLocaleString(),
          c.totalEmployeur.toLocaleString(),
          c.totalGlobal.toLocaleString(),
          d.mois,
          d.annee,
        ];
      }),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
      startY,
    });
    doc.save("cotisation_cnps.pdf");
  };

  // 6. Export Excel (sélection ou tout)
  const handleExportExcel = (all = false) => {
    let rows = [];
    if (all) {
      // Exporter toutes les cotisations enregistrées (aperçu)
      rows = cotisations.map((c) => [
        c.nom,
        c.cnps,
        c.brut,
        c.poste,
        c.tauxRP,
        c.base,
        c.cotisSalarie,
        c.cotisEmployeur,
        c.totalEmployeur,
        c.totalGlobal,
        c.mois,
        c.annee,
        c.cnpsEmployeur || cnpsEmployeur || "",
      ]);
    } else {
      // Exporter la sélection courante (formulaire)
      rows = selectedIds.map((id) => {
        const d = formData[id];
        const c = getCalculs(d);
        return [
          d.nom,
          d.cnps,
          d.brut,
          d.poste,
          d.tauxRP,
          c.base,
          c.cotisSalarie,
          c.cotisEmployeur,
          c.totalEmployeur,
          c.totalGlobal,
          d.mois,
          d.annee,
          cnpsEmployeur || "",
        ];
      });
    }
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Nom",
        "CNPS",
        "Brut",
        "Catégorie/Poste",
        "Taux RP",
        "Base cotisable",
        "Cotisation salarié",
        "Cotisation employeur",
        "Total employeur",
        "Total à verser",
        "Mois",
        "Année",
        "CNPS Employeur",
      ],
      ...rows,
    ]);
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
                  <span className="text-xs text-gray-700 font-mono">{Number(emp.baseSalary).toLocaleString()} FCFA</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">CNPS</th>
                <th className="p-2 border">Brut</th>
                <th className="p-2 border">Catégorie/Poste</th>
                <th className="p-2 border">Taux RP</th>
                <th className="p-2 border">Base cotisable</th>
                <th className="p-2 border">Cotisation salarié</th>
                <th className="p-2 border">Cotisation employeur</th>
                <th className="p-2 border">Total employeur</th>
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
                    <td className="p-2 border">{d.nom}</td>
                    <td className="p-2 border">{d.cnps}</td>
                    <td className="p-2 border">{Number(d.brut).toLocaleString()}</td>
                    <td className="p-2 border">{d.poste}</td>
                    <td className="p-2 border">{d.tauxRP}%</td>
                    <td className="p-2 border">{c.base.toLocaleString()}</td>
                    <td className="p-2 border">{c.cotisSalarie.toLocaleString()}</td>
                    <td className="p-2 border">{c.cotisEmployeur.toLocaleString()}</td>
                    <td className="p-2 border">{c.totalEmployeur.toLocaleString()}</td>
                    <td className="p-2 border font-bold">{c.totalGlobal.toLocaleString()}</td>
                    <td className="p-2 border">{d.mois}</td>
                    <td className="p-2 border">{d.annee}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="flex gap-4 mt-4 flex-wrap">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer déclaration"}
          </Button>
          <Button onClick={handleExportPDF} variant="secondary">
            Exporter en PDF
          </Button>
          <Button onClick={() => handleExportExcel(false)} variant="secondary">
            Exporter en Excel (sélection)
          </Button>
          <Button onClick={() => handleExportExcel(true)} variant="secondary">
            Exporter tout en Excel
          </Button>
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
                <th className="p-2 border">Nom</th>
                <th className="p-2 border">CNPS</th>
                <th className="p-2 border">Brut</th>
                <th className="p-2 border">Catégorie/Poste</th>
                <th className="p-2 border">Taux RP</th>
                <th className="p-2 border">Base cotisable</th>
                <th className="p-2 border">Cotisation salarié</th>
                <th className="p-2 border">Cotisation employeur</th>
                <th className="p-2 border">Total employeur</th>
                <th className="p-2 border">Total à verser</th>
                <th className="p-2 border">Mois</th>
                <th className="p-2 border">Année</th>
              </tr>
            </thead>
            <tbody>
              {cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).length === 0 ? (
                <tr><td colSpan={12} className="text-center text-gray-400 p-2">Aucune cotisation enregistrée pour cette période.</td></tr>
              ) : (
                cotisations.filter(c => c.mois === moisApercu && c.annee === anneeApercu).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{c.nom}</td>
                    <td className="p-2 border">{c.cnps}</td>
                    <td className="p-2 border">{Number(c.brut).toLocaleString()}</td>
                    <td className="p-2 border">{c.poste}</td>
                    <td className="p-2 border">{c.tauxRP}%</td>
                    <td className="p-2 border">{Number(c.base).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.cotisSalarie).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.cotisEmployeur).toLocaleString()}</td>
                    <td className="p-2 border">{Number(c.totalEmployeur).toLocaleString()}</td>
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
        <strong>Barème :</strong> Plafond base cotisable 750 000 FCFA. Salarié 4,2%. Employeur 4,9% + 7% + taux RP (voir catégorie).<br />
        <strong>Déclaration groupée :</strong> Sélectionnez plusieurs salariés pour générer une déclaration groupée.
      </div>
    </div>
  );
};

export default CotisationCNPS; 