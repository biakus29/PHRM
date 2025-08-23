// src/utils/numberUtils.js

// Formatage FR (espaces pour milliers, sans décimales)
export const formatFR = (n) => {
  const num = Number(n) || 0;
  return Math.round(num).toLocaleString('fr-FR');
};

export default formatFR;
