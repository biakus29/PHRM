// Utilitaire pour vérifier que les calculs sont actualisés
// CRÉÉ: 26/09/2025 14:55

import { computeStatutoryDeductions } from './payrollCalculations';

export const checkCalculationsUpdated = () => {
  console.log('🔄 Vérification des calculs actualisés...');
  
  // Test avec François
  const testData = {
    salaryDetails: { baseSalary: 85000 },
    remuneration: { total: 140000 },
    primes: [
      { label: 'Prime de transport', montant: 25000 },
      { label: 'Prime de rendement', montant: 15000 },
      { label: 'Prime exceptionnelle', montant: 15000 }
    ],
    indemnites: []
  };
  
  const deductions = computeStatutoryDeductions(
    testData.salaryDetails, 
    testData.remuneration, 
    testData.primes, 
    testData.indemnites
  );
  
  const expected = {
    pvid: 3570,
    irpp: 1426,
    cac: 143,
    cfc: 850,
    rav: 750,
    tdl: 143
  };
  
  const total = deductions.pvid + deductions.irpp + deductions.cac + deductions.cfc + deductions.rav + deductions.tdl;
  const net = 140000 - total;
  
  console.log('📊 Résultats actuels:');
  console.log('PVID:', deductions.pvid, expected.pvid === deductions.pvid ? '✅' : '❌');
  console.log('IRPP:', deductions.irpp, expected.irpp === deductions.irpp ? '✅' : '❌');
  console.log('CAC:', deductions.cac, expected.cac === deductions.cac ? '✅' : '❌');
  console.log('CFC:', deductions.cfc, expected.cfc === deductions.cfc ? '✅' : '❌');
  console.log('RAV:', deductions.rav, expected.rav === deductions.rav ? '✅' : '❌');
  console.log('TDL:', deductions.tdl, expected.tdl === deductions.tdl ? '✅' : '❌');
  console.log('TOTAL:', total, total === 6882 ? '✅' : '❌');
  console.log('NET:', net, net === 133118 ? '✅' : '❌');
  
  const allCorrect = 
    expected.pvid === deductions.pvid &&
    expected.irpp === deductions.irpp &&
    expected.cac === deductions.cac &&
    expected.cfc === deductions.cfc &&
    expected.rav === deductions.rav &&
    expected.tdl === deductions.tdl;
    
  if (allCorrect) {
    console.log('🎉 TOUS LES CALCULS SONT ACTUALISÉS ET CORRECTS !');
  } else {
    console.log('⚠️ CERTAINS CALCULS NE SONT PAS ENCORE ACTUALISÉS');
  }
  
  return allCorrect;
};

// Auto-exécution pour test immédiat
if (typeof window !== 'undefined') {
  window.checkCalculations = checkCalculationsUpdated;
  console.log('✅ Checker de calculs disponible via window.checkCalculations()');
}
