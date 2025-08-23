// src/utils/cnpsUtils.js

// Construit le code CNPS attendu: Mois + Matricule employeur + Régime + Année + Matricule employé + Nombre de jours travaillés
export const buildCnpsCode = ({ mois, matriculeEmployeur, regime, annee, matriculeEmploye, joursTravailles }) => {
  const m = String(mois || '').padStart(2, '0');
  const emp = String(matriculeEmployeur || '');
  const reg = String(regime || '');
  const y = String(annee || '');
  const me = String(matriculeEmploye || '');
  const j = String(joursTravailles ?? '');
  return `${m}${emp}${reg}${y}${me}${j}`;
};

export default buildCnpsCode;
