// src/utils/cnpsCalc.js

// Constants
export const CNPS_CAP = 750_000; // plafond base cotisable
export const RATE_PVID_SAL = 0.042; // 4.2% salarié
export const RATE_PVID_EMP = 0.049; // 4.9% employeur
export const RATE_PF_EMP = 0.07; // 7% prestations familiales (default)

// Catégorisation unifiée des montants (primes/indemnités)
// data: { brut, primesArray, indemnitesArray, ...fields }
export function categorizeAmounts(data = {}) {
  const primes = Array.isArray(data.primesArray) ? data.primesArray : [];
  const indemnites = Array.isArray(data.indemnitesArray) ? data.indemnitesArray : [];

  let primesImposables = 0;          // va dans SBT
  let indemnitesCotisables = 0;      // s'ajoute au SBT pour SBC (hors transport désormais)
  let indemnitesNonImposables = 0;   // hors SBT

  // Helpers de détection par libellé (uniformisation par type)
  const isTransportLike = (lbl) =>
    lbl.includes("transport") ||
    lbl.includes("transports") ||
    lbl.includes("frais de transport") ||
    lbl.includes("deplacement") ||
    lbl.includes("déplacement");
  const isHousingLike = (lbl) =>
    lbl.includes("logement") || lbl.includes("housing") || lbl.includes("loyer");
  const isRepresentationLike = (lbl) =>
    lbl.includes("represent") || lbl.includes("représent");
  const isMealLike = (lbl) =>
    lbl.includes("repas") || lbl.includes("meal") || lbl.includes("panier") || lbl.includes("cantine");
  const isDirtLike = (lbl) =>
    lbl.includes("saliss") || lbl.includes("salubre") || lbl.includes("insalubr") || lbl.includes("dirt");
  const isPrimeImposableLike = (lbl) =>
    lbl.includes("heure sup") ||
    lbl.includes("heures sup") ||
    lbl.includes("hs") ||
    lbl.includes("overtime") ||
    lbl.includes("prime") ||
    lbl.includes("bonus") ||
    lbl.includes("rendement") ||
    lbl.includes("gratification") ||
    lbl.includes("anciennet");

  // 1) Parcours des tableaux dynamiques
  primes.forEach((p) => {
    const lbl = (p.label || p.name || p.type || "").toString().toLowerCase();
    const val = Number(p.amount || p.value || p.montant || 0) || 0;

    // 1.a Uniformisation: reclasser par type, même si saisi comme prime
    if (isTransportLike(lbl)) {
      // Transport est traité comme prime imposable (uniforme)
      primesImposables += val;
      return;
    }
    if (isHousingLike(lbl) || isRepresentationLike(lbl) || isMealLike(lbl) || isDirtLike(lbl)) {
      indemnitesNonImposables += val;
      return;
    }

    if (isPrimeImposableLike(lbl)) {
      primesImposables += val;
    }
  });

  indemnites.forEach((i) => {
    const lbl = (i.label || i.name || i.type || "").toString().toLowerCase();
    const val = Number(i.amount || i.value || i.montant || 0) || 0;
    if (isTransportLike(lbl)) {
      // Transport reclassé en prime imposable
      primesImposables += val;
      return;
    }
    if (isHousingLike(lbl) || isRepresentationLike(lbl) || isMealLike(lbl) || isDirtLike(lbl)) {
      indemnitesNonImposables += val;
      return;
    }
    // Par défaut: NI
    indemnitesNonImposables += val;
  });

  // 2) Prise en compte des champs fixes de l'UI si présents
  // Primes imposables (ex: heures sup + bonus agrégés)
  primesImposables += Number(data.primesImposables || 0) || 0;
  primesImposables += Number(data.overtimeDisplay || 0) || 0;
  primesImposables += Number(data.bonusDisplay || 0) || 0;

  // Transport (champ fixe) reclassé en prime imposable uniforme
  primesImposables += Number(data.indemniteTransport || 0) || 0;

  // Indemnités non imposables explicites (affichage)
  indemnitesNonImposables += Number(data.housingAllowanceDisplay || 0) || 0;
  indemnitesNonImposables += Number(data.representationAllowanceDisplay || 0) || 0;
  indemnitesNonImposables += Number(data.dirtAllowanceDisplay || 0) || 0;
  indemnitesNonImposables += Number(data.mealAllowanceDisplay || 0) || 0;

  // Champs agrégés
  indemnitesNonImposables += Number(data.indemniteNonImposable || 0) || 0;

  return { primesImposables, indemnitesCotisables, indemnitesNonImposables };
}

// SBT (Salaire Brut Taxable): Salaire de base + primes imposables uniquement
export const getSBT = (data = {}) => {
  const brut = Number(data.brut || 0) || 0;
  const { primesImposables } = categorizeAmounts(data);
  return Math.max(0, Math.round(brut + primesImposables));
};

// SBC (Salaire Brut Cotisable): SBT + indemnités cotisables (hors transport), plafonné à 750 000 FCFA
export const getSBC = (data = {}) => {
  const { indemnitesCotisables } = categorizeAmounts(data);
  const sbt = getSBT(data);
  return Math.min(CNPS_CAP, Math.round(sbt + indemnitesCotisables));
};

// SBT (Salaire Brut Taxable): Salaire de base + primes imposables uniquement
// Main CNPS calculations
// options: { includeRP: bool, overrideRP: bool, rateRP: number }
export const getCalculs = (data = {}, options = {}) => {
  const sbc = getSBC(data); // déjà plafonné via getSBC
  const baseCotisable = sbc;

  const cotisSalarie = Math.round(baseCotisable * RATE_PVID_SAL);

  const rpRate = options.includeRP
    ? (options.overrideRP ? Number(options.rateRP) || 0 : (Number(data.tauxRP) || 0))
    : 0;

  const pvidEmployeur = Math.round(baseCotisable * RATE_PVID_EMP);
  const prestationsFamilles = Math.round(baseCotisable * RATE_PF_EMP);
  const risquesProfessionnels = Math.round(baseCotisable * (rpRate / 100));
  const cotisEmployeur = pvidEmployeur + prestationsFamilles + risquesProfessionnels;

  return {
    sbc,
    baseCotisable,
    cotisSalarie,
    pvidEmployeur,
    prestationsFamilles,
    risquesProfessionnels,
    cotisEmployeur,
    totalGlobal: cotisSalarie + cotisEmployeur,
  };
};
