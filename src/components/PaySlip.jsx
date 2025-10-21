import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { INDEMNITIES, BONUSES } from "../utils/payrollLabels";
import { displayGeneratedAt } from "../utils/displayUtils";
import { 
  computeEffectiveDeductions, 
  computeRoundedDeductions, 
  computeNetPay, 
  computeGrossTotal, 
  computeSBT, 
  computeSBC, 
  validateDeductions, 
  formatCFA, 
  computePVID, 
  computeStatutoryDeductions 
} from "../utils/payrollCalculations";
import { calculateSeniorityPercent, formatSeniority } from "../utils/seniorityUtils";
import ExportPaySlip from "../compoments/ExportPaySlip";
import TemplateSelector from "../compoments/TemplateSelector";
import Modal from "./Modal";

const PaySlip = ({ employee, employer, salaryDetails, remuneration, deductions, payPeriod, generatedAt, primes = [], indemnites = [] }) => {
  // État pour gérer la modale et les champs manquants
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  // Sélection du modèle visible dans l'UI
  const initialTemplate = (remuneration?.selectedTemplate || salaryDetails?.selectedTemplate || 'eneo');
  const [selectedTemplate, setSelectedTemplate] = useState(String(initialTemplate).toLowerCase());
  const [formData, setFormData] = useState({
    matricule: "",
    pvis: "",
    irpp: "",
  });

  // Validation et uniformisation du salaire de base
  const baseSalary = employee?.baseSalary || salaryDetails?.baseSalary || 0;
  if (baseSalary === 0 || isNaN(baseSalary)) {
    console.warn("[PaySlip] Salaire de base non défini, nul ou invalide. Utilisation de 0 comme valeur par défaut.");
    toast.warn("Aucun salaire de base valide défini. La fiche de paie sera générée avec un salaire de base de 0 XAF.");
  }

  // Validation des props avec détection des champs manquants
  const validateProps = () => {
    const missing = [];
    if (!employee || !employee.matricule) missing.push("matricule de l'employé");
    if (!deductions || deductions.pvis === undefined) missing.push("PVIS");
    if (!deductions || deductions.irpp === undefined) missing.push("IRPP");
    return missing;
  };

  // Validation des déductions locale (évite conflit avec fonction centralisée)
  const validateDeductionsLocal = (deductions, baseSalary, formData) => {
    const warnings = [];
    const pvis = deductions?.pvis || formData?.pvis || 0;
    const irpp = deductions?.irpp || formData?.irpp || 0;
    
    // Validation via fonction centralisée
    const validationWarnings = validateDeductions(deductions, baseSalary);
    warnings.push(...validationWarnings);
    
    // Validation IRPP (basique)
    if (irpp > baseSalary * 0.3) {
      warnings.push(`IRPP: ${formatCFA(irpp)} (semble élevé)`);
    }
    
    return warnings;
  };

  // Cache du logo
  const cacheLogo = (companyId) => {
    try {
      const logoData = localStorage.getItem(`logo_${companyId}`);
      if (logoData) {
        return logoData;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du logo:", error);
    }
    return null;
  };

  // Gestion de la modale
  const handleModalSubmit = () => {
    // Mettre à jour les données avec les champs manquants
    const updatedDeductions = {
      ...deductions,
      pvis: parseFloat(formData.pvis) || 0,
      irpp: parseFloat(formData.irpp) || 0,
    };
    
    // Recalculer explicitement le total des déductions (évite le double comptage)
    const n = (v) => (Number(v) || 0);
    const totalDeductions =
      n(updatedDeductions.pvis) +
      n(updatedDeductions.irpp) +
      n(updatedDeductions.cac) +
      n(updatedDeductions.cfc) +
      n(updatedDeductions.rav) +
      n(updatedDeductions.tdl) +
      n(updatedDeductions.advance) +
      n(updatedDeductions.other);

    updatedDeductions.total = totalDeductions;
    
    // Fermer la modale
    setIsModalOpen(false);
    
    // Générer le PDF avec les données mises à jour
    // Le composant ExportPaySlip s'occupera de la génération
  };

  const handleModalSkip = () => {
    setIsModalOpen(false);
    // Continuer sans les champs manquants
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Vérifier les champs manquants au chargement
  useEffect(() => {
    const missing = validateProps();
    if (missing.length > 0) {
      setMissingFields(missing);
      setIsModalOpen(true);
    }
  }, [employee, deductions]);

  // Ancienneté: utiliser l'expérience totale renseignée manuellement
  const seniorityYears = Number(employee?.seniority || employee?.seniorityYears || 0);
  const seniorityPercent = seniorityYears >= 2 ? 2 : 0;
  const seniorityInfo = { years: seniorityYears, percent: seniorityPercent, isAnniversaryMonth: false };

  // Calculs
  // Fallback: si remuneration.total est absent ou nul, on recalcule le brut à partir des montants connus
  const num = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    const s = String(v).replace(/[^0-9+\-.,]/g, '').replace(/,/g, '.');
    // Garder seulement le dernier point comme séparateur décimal
    const parts = s.split('.');
    const normalized = parts.length > 1 ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1] : s;
    const n = Number(normalized);
    return isNaN(n) ? 0 : n;
  };
  const remunerationAmounts = { ...(salaryDetails || {}), ...(remuneration || {}) };
  // Unifier la source des primes/indemnités: props > remuneration.* > vide
  const primesAll = Array.isArray(primes) && primes.length > 0
    ? primes
    : (Array.isArray(remuneration?.primes) ? remuneration.primes : []);
  const indemAll = Array.isArray(indemnites) && indemnites.length > 0
    ? indemnites
    : (Array.isArray(remuneration?.indemnites) ? remuneration.indemnites : []);
  const primesSum = Array.isArray(primesAll)
    ? primesAll.reduce((sum, p) => sum + num(p?.montant ?? p?.amount ?? p?.value ?? p?.total ?? p?.somme), 0)
    : 0;
  const indemSum = Array.isArray(indemAll)
    ? indemAll.reduce((sum, i) => sum + num(i?.montant ?? i?.amount ?? i?.value ?? i?.total ?? i?.somme), 0)
    : 0;
  // Éviter les doubles comptes: clés déjà comptées par computeGrossTotal
  const knownKeys = new Set([
    'baseSalary',
    ...INDEMNITIES.map(i => i.key),
    ...BONUSES.map(b => b.key),
  ]);
  const dynamicPrimeSum = Object.entries(remunerationAmounts).reduce((sum, [key, val]) => {
    if (!knownKeys.has(key) && /^prime/i.test(key)) return sum + num(val);
    return sum;
  }, 0);
  const dynamicIndemSum = Object.entries(remunerationAmounts).reduce((sum, [key, val]) => {
    // capture clés type indemnite*, indemn*, ou *Allowance (ex: housingAllowance)
    if (!knownKeys.has(key) && (/^indem/i.test(key) || /Allowance$/i.test(key))) {
      return sum + num(val);
    }
    return sum;
  }, 0);
  // Removed redundant calculation - using centralized computeNetPay

  // Calculs SBT/SBC via utils centralisés
  const sbt = computeSBT(salaryDetails || {}, remuneration || {});
  const sbc = computeSBC(salaryDetails || {}, remuneration || {});

  // Calculs centralisés via utils
  const r = (v) => Math.round(num(v));
  // Construire des déductions statutaires si manquantes (IRPP, CAC, TDL, CFC, RAV, FNE)
  const statutory = computeStatutoryDeductions(salaryDetails || {}, remuneration || {}, primesAll, indemAll);
  // Ne pas laisser des props anciennes écraser les valeurs centralisées (IRPP, CAC, CFC, RAV, TDL, PVID)
  // On n'autorise que les champs non-statutaires à se fusionner (ex: avances, autres)
  const safeExtra = (() => {
    const src = deductions || {};
    return {
      advance: src.advance || 0,
      other: src.other || 0,
      loan: src.loan || 0,
      loanRepayment: src.loanRepayment || 0,
    };
  })();
  const mergedDeductions = { ...statutory, ...safeExtra };

  const payrollCalc = computeNetPay({
    salaryDetails: salaryDetails || {},
    remuneration: remuneration || {},
    deductions: mergedDeductions,
    primes: primesAll,
    indemnites: indemAll
  });
  const { grossTotal: remunerationTotal, deductions: effectiveDeductions, roundedDeductions: deductionsRounded, deductionsTotal, netPay: netToPay } = payrollCalc;

  // Validation des déductions via utils
  const deductionWarnings = validateDeductions(deductions, baseSalary);

  // DEBUG: tracer les valeurs utilisées pour le calcul
  useEffect(() => {
    try {
      // Limiter le bruit en prod
      if (process.env.NODE_ENV === 'production') return;
      console.debug('[PaySlip][DEBUG] Calcul brut/net', {
        employee: employee?.name,
        baseSalary,
        computeGrossTotalBase: computeGrossTotal({ ...(salaryDetails || {}), ...(remuneration || {}) }),
        primesArrayCount: Array.isArray(primes) ? primes.length : 0,
        primesSum,
        indemnitesArrayCount: Array.isArray(indemnites) ? indemnites.length : 0,
        indemSum,
        dynamicPrimeSum,
        dynamicIndemSum,
        grossTotal: payrollCalc.grossTotal,
        deductionsRounded,
        deductionsTotal,
        netToPay,
      });
    } catch (e) {
      // no-op
    }
  }, [employee?.name, baseSalary, primesSum, indemSum, dynamicPrimeSum, dynamicIndemSum, payrollCalc.grossTotal, deductionsTotal, netToPay]);

  // getNetToPay centralisé importé depuis utils/deductionsUtils

  return (
    <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
      <h2 className="text-xl sm:text-2xl font-bold text-center">Fiche de Paie</h2>
      <p className="text-center text-sm sm:text-base">Période: {payPeriod || 'N/A'}</p>
      <p className="text-center text-xs sm:text-sm text-gray-600">Généré le: {displayGeneratedAt(generatedAt || Date.now())}</p>
      
      {/* Sélecteur de modèle de fiche de paie */}
      <div className="mt-4">
        <TemplateSelector
          type="payslip"
          selectedTemplate={selectedTemplate}
          onTemplateChange={(key) => setSelectedTemplate(String(key).toLowerCase())}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Employé</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <p><span className="font-medium">Nom:</span> {employee?.name || "N/A"}</p>
            <p><span className="font-medium">Matricule:</span> {employee?.matricule || "N/A"}</p>
            <p><span className="font-medium">Poste:</span> {employee?.poste || "N/A"}</p>
            <p><span className="font-medium">Département:</span> {employee?.department || "Non spécifié"}</p>
            <p><span className="font-medium">Date d'embauche:</span> {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString('fr-FR') : "Non renseignée"}</p>
            <p><span className="font-medium">Statut:</span> {employee?.status || "Non renseigné"}</p>
            <p><span className="font-medium">Catégorie:</span> {employee?.professionalCategory || "N/A"}</p>
            <p><span className="font-medium">Diplômes:</span> {employee?.diplomas || "Non renseignés"}</p>
            <p><span className="font-medium">Échelon:</span> {employee?.echelon || "Non renseigné"}</p>
            <p><span className="font-medium">Service:</span> {employee?.service || "Non renseigné"}</p>
            <p><span className="font-medium">Superviseur:</span> {employee?.supervisor || "Non renseigné"}</p>
            <p><span className="font-medium">Date de naissance:</span> {employee?.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('fr-FR') : "Non renseignée"}</p>
            <p><span className="font-medium">Lieu de naissance:</span> {employee?.lieuNaissance || employee?.placeOfBirth || "Non renseigné"}</p>
            <p><span className="font-medium">Période d'essai:</span> {employee?.hasTrialPeriod ? (employee?.trialPeriodDuration || "Oui") : "Non"}</p>
            <p><span className="font-medium">Numéro CNPS:</span> {employee?.cnpsNumber || "N/A"}</p>
            <p className="truncate"><span className="font-medium">Email:</span> {employee?.email || "N/A"}</p>
            <p><span className="font-medium">Ancienneté:</span> {formatSeniority(seniorityInfo.years)} (expérience totale)</p>
            <p><span className="font-medium">Taux ancienneté:</span> {seniorityInfo.percent}%</p>
          </div>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Employeur</h3>
          <div className="space-y-1 text-xs sm:text-sm">
            <p><span className="font-medium">Entreprise:</span> {employer?.companyName}</p>
            <p><span className="font-medium">Adresse:</span> {employer?.address}</p>
            <p><span className="font-medium">Numéro contribuable:</span> {employer?.taxpayerNumber || "N/A"}</p>
            <p><span className="font-medium">Numéro CNPS:</span> {employer?.cnpsNumber}</p>
          </div>
        </div>
      </div>
      
      <h3 className="font-semibold mt-4 text-sm sm:text-base">Rémunération</h3>
      
      {/* Version mobile : cartes */}
      <div className="block sm:hidden space-y-2">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Salaire de base</span>
            <span className="text-sm font-bold">{formatCFA(salaryDetails?.baseSalary || 0)}</span>
          </div>
        </div>
      </div>
      
      {/* Version desktop : tableau */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
          <tbody>
            <tr className="border-b border-blue-100 hover:bg-gray-50">
              <td className="py-2 sm:py-3 px-3 sm:px-4 text-sm">Salaire de base</td>
              <td className="py-2 sm:py-3 px-3 sm:px-4 text-right text-sm font-medium">{formatCFA(salaryDetails?.baseSalary || 0)}</td>
            </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Taux journalier</td>
            <td className="py-2 px-4 text-right">{formatCFA(salaryDetails?.dailyRate || 0)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Taux horaire</td>
            <td className="py-2 px-4 text-right">{formatCFA(salaryDetails?.hourlyRate || 0)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Prime de transport</td>
            <td className="py-2 px-4 text-right">{formatCFA(
              // Priorité à la nouvelle clé primeTransport, fallback sur anciens champs
              remuneration?.primeTransport || salaryDetails?.primeTransport || salaryDetails?.transportAllowance || 0
            )}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Jours travaillés</td>
            <td className="py-2 px-4 text-right">{remuneration?.workedDays || 0}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Heures supplémentaires</td>
            <td className="py-2 px-4 text-right">{formatCFA(remuneration?.overtime || 0)}</td>
          </tr>

          {/* Injecter primes/indemnités directement dans le tableau de rémunération */}
          {Array.isArray(primesAll) && primesAll.length > 0 && (
            <>
              {primesAll.map((p, idx) => (
                <tr key={`rem-prime-${idx}`} className="border-b border-blue-100">
                  <td className="py-2 px-4">{p?.label || p?.type || p?.name || `Prime ${idx + 1}`}</td>
                  <td className="py-2 px-4 text-right">{formatCFA(Number(p?.montant) || 0)}</td>
                </tr>
              ))}
              <tr className="border-b border-blue-100">
                <td className="py-2 px-4 font-medium">Sous-total primes</td>
                <td className="py-2 px-4 font-medium text-right">{formatCFA(primesSum)}</td>
              </tr>
            </>
          )}

          {Array.isArray(indemAll) && indemAll.length > 0 && (
            <>
              {indemAll.map((i, idx) => (
                <tr key={`rem-indem-${idx}`} className="border-b border-blue-100">
                  <td className="py-2 px-4">{i?.label || i?.type || i?.name || `Indemnité ${idx + 1}`}</td>
                  <td className="py-2 px-4 text-right">{formatCFA(Number(i?.montant) || 0)}</td>
                </tr>
              ))}
              <tr className="border-b border-blue-100">
                <td className="py-2 px-4 font-medium">Sous-total indemnités</td>
                <td className="py-2 px-4 font-medium text-right">{formatCFA(indemSum)}</td>
              </tr>
            </>
          )}
          <tr className="border-b border-blue-100 bg-blue-50">
            <td className="py-2 px-4 font-semibold">TOTAL RÉMUNÉRATION</td>
            <td className="py-2 px-4 font-semibold text-right">{formatCFA(remunerationTotal)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Salaire Brut Taxable (SBT)</td>
            <td className="py-2 px-4 text-right">{formatCFA(sbt)}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">Salaire Brut Cotisable (SBC)</td>
            <td className="py-2 px-4 text-right">{formatCFA(sbc)}</td>
          </tr>
        </tbody>
      </table>
      </div>
      
      {/* Primes détaillées */}
      {Array.isArray(primesAll) && primesAll.length > 0 && (
        <>
          <h3 className="font-semibold mt-4">Primes</h3>
          <table className="w-full border-collapse">
            <tbody>
              {primesAll.map((p, idx) => (
                <tr key={`prime-${idx}`} className="border-b border-blue-100">
                  <td className="py-2 px-4">{p?.label || p?.type || p?.name || `Prime ${idx + 1}`}</td>
                  <td className="py-2 px-4 text-right">{formatCFA(Number(p?.montant) || 0)} FCFA</td>
                </tr>
              ))}
              <tr className="border-b border-blue-100 bg-blue-50">
                <td className="py-2 px-4 font-semibold">TOTAL PRIMES</td>
                <td className="py-2 px-4 font-semibold text-right">{formatCFA(primesSum)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {/* Indemnités détaillées */}
      {Array.isArray(indemAll) && indemAll.length > 0 && (
        <>
          <h3 className="font-semibold mt-4">Indemnités</h3>
          <table className="w-full border-collapse">
            <tbody>
              {indemAll.map((i, idx) => (
                <tr key={`indem-${idx}`} className="border-b border-blue-100">
                  <td className="py-2 px-4">{i?.label || i?.type || i?.name || `Indemnité ${idx + 1}`}</td>
                  <td className="py-2 px-4 text-right">{formatCFA(Number(i?.montant) || 0)} FCFA</td>
                </tr>
              ))}
              <tr className="border-b border-blue-100 bg-blue-50">
                <td className="py-2 px-4 font-semibold">TOTAL INDEMNITÉS</td>
                <td className="py-2 px-4 font-semibold text-right">{formatCFA(indemSum)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      <h3 className="font-semibold mt-4">Déductions</h3>
      <table className="w-full border-collapse">
        <tbody>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">PVID</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.pvid))}</td>
            </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">IRPP</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.irpp))}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">CAC</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.cac))}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">CFC</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.cfc))}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">RAV</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.rav))}</td>
          </tr>
          <tr className="border-b border-blue-100">
            <td className="py-2 px-4">TDL</td>
            <td className="py-2 px-4">{formatCFA(r(effectiveDeductions?.tdl))}</td>
          </tr>
          <tr className="border-b border-blue-100 bg-red-50">
            <td className="py-2 px-4 font-semibold">TOTAL DÉDUCTIONS</td>
            <td className="py-2 px-4 font-semibold">{formatCFA(deductionsTotal)}</td>
          </tr>
        </tbody>
      </table>
      
      {/* Calcul du net à payer : salaire de base + primes + indemnités - déductions */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-bold text-lg">NET À PAYER: {formatCFA(netToPay)}</h3>
      </div>
      
      {/* Avertissements sur les déductions */}
      {deductionWarnings.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Avertissements:</h4>
          <ul className="text-yellow-700">
            {deductionWarnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Composant ExportPaySlip pour générer le PDF */}
      <ExportPaySlip 
        employee={employee}
        employer={employer}
        salaryDetails={salaryDetails}
        remuneration={remuneration}
        deductions={deductions}
        payPeriod={payPeriod}
        generatedAt={generatedAt}
        template={selectedTemplate}
      />
      
      {/* Modale pour les champs manquants */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Informations manquantes</h3>
          <p className="mb-4">Certaines informations sont manquantes pour générer la fiche de paie :</p>
          <ul className="mb-4">
            {missingFields.map((field, index) => (
              <li key={index} className="text-red-600">• {field}</li>
            ))}
          </ul>
          
          <div className="space-y-4">
            {missingFields.includes("matricule de l'employé") && (
              <div>
                <label className="block text-sm font-medium mb-1">Matricule de l'employé</label>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Entrez le matricule"
                />
              </div>
            )}
            
            {missingFields.includes("PVIS") && (
              <div>
                <label className="block text-sm font-medium mb-1">PVIS</label>
                <input
                  type="number"
                  name="pvis"
                  value={formData.pvis}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Montant PVIS"
                />
              </div>
            )}
            
            {missingFields.includes("IRPP") && (
              <div>
                <label className="block text-sm font-medium mb-1">IRPP</label>
                <input
                  type="number"
                  name="irpp"
                  value={formData.irpp}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Montant IRPP"
                />
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
                onClick={handleModalSkip}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Continuer sans
            </button>
            <button
                onClick={handleModalSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
              Compléter et continuer
            </button>
            </div>
          </div>
      </Modal>
    </div>
  );
};

export default PaySlip;
