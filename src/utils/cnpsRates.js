// src/utils/cnpsRates.js

// Mapping local Catégorie/Poste → taux de risque professionnel (en %)
export const TAUX_RP = {
  Ouvrier: 2.5,
  Cadre: 1.75,
  Employé: 1.75,
  "Agent de maîtrise": 2.0,
  Technicien: 2.0,
  Chauffeur: 3.0,
  Sécurité: 3.0,
  // Ajoutez d'autres catégories/postes si besoin
};

export const getTauxRP = (posteOuCategorie) => {
  if (!posteOuCategorie) return 1.75;
  if (TAUX_RP[posteOuCategorie]) return TAUX_RP[posteOuCategorie];
  const found = Object.entries(TAUX_RP).find(([k]) =>
    String(posteOuCategorie).toLowerCase().includes(k.toLowerCase())
  );
  return found ? found[1] : 1.75;
};
