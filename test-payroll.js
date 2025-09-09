// Test des calculs de paie avec les données utilisateur
console.log('=== TEST CALCULS PAIE PRHM ===\n');

(async () => {
  try {
    const { computeNetPay, formatCFA } = await import('./src/utils/payrollCalculations.js');

    // Données de l'exemple utilisateur
    const testData = {
      salaryDetails: { 
        baseSalary: 250000 
      },
      remuneration: {},
      primes: [
        { montant: 33000, type: 'Prime de rendement' },
        { montant: 10000, type: 'Prime de transport' }
      ],
      indemnites: [
        { montant: 20000, type: 'Indemnité logement' }
      ],
      deductions: {
        pvid: 10500,  // Corrigé de pvis à pvid
        irpp: 12283,
        cac: 1228,
        cfc: 2500,
        rav: 417,
        tdl: 1228
      }
    };

    console.log('📊 DONNÉES D\'ENTRÉE:');
    console.log(`Salaire de base: ${formatCFA(testData.salaryDetails.baseSalary)}`);
    console.log(`Primes: ${formatCFA(testData.primes.reduce((s,p) => s + p.montant, 0))}`);
    console.log(`Indemnités: ${formatCFA(testData.indemnites.reduce((s,i) => s + i.montant, 0))}`);

    // Calcul avec les fonctions centralisées
    const result = computeNetPay(testData);

    console.log('\n🧮 RÉSULTATS CALCULÉS:');
    console.log(`Total brut: ${formatCFA(result.grossTotal)}`);
    console.log(`PVID: ${formatCFA(result.deductions.pvid)}`);
    console.log(`IRPP: ${formatCFA(result.deductions.irpp)}`);
    console.log(`TDL: ${formatCFA(result.deductions.tdl)}`);
    console.log(`CAC: ${formatCFA(result.deductions.cac)}`);
    console.log(`CFC: ${formatCFA(result.deductions.cfc)}`);
    console.log(`RAV: ${formatCFA(result.deductions.rav)}`);
    console.log(`Total déductions: ${formatCFA(result.deductionsTotal)}`);
    console.log(`NET À PAYER: ${formatCFA(result.netPay)}`);

    console.log('\n📋 COMPARAISON AVEC DONNÉES UTILISATEUR:');
    console.log('Données utilisateur (problématiques):');
    console.log('- Total brut: 303 000 FCFA');
    console.log('- PVID: 15 771 FCFA');
    console.log('- IRPP: 20 000 FCFA');
    console.log('- Net à payer: 207 744 FCFA');

    console.log('\n✅ CALCULS ATTENDUS (corrects):');
    console.log(`- Total brut: ${formatCFA(result.grossTotal)}`);
    console.log(`- PVID: ${formatCFA(result.deductions.pvid)}`);
    console.log(`- IRPP: ${formatCFA(result.deductions.irpp)}`);
    console.log(`- Net à payer: ${formatCFA(result.netPay)}`);

    // Calcul manuel pour vérification
    const manualGross = 250000 + 33000 + 10000 + 20000;
    const manualDeductions = 10500 + 12283 + 1228 + 2500 + 417 + 1228;
    const manualNet = manualGross - manualDeductions;

    console.log('\n🔍 VÉRIFICATION MANUELLE:');
    console.log(`Total brut manuel: ${formatCFA(manualGross)}`);
    console.log(`Total déductions manuel: ${formatCFA(manualDeductions)}`);
    console.log(`Net manuel: ${formatCFA(manualNet)}`);

    console.log('\n📈 ÉCARTS IDENTIFIÉS:');
    console.log(`Écart brut: ${formatCFA(result.grossTotal - 303000)} (notre calcul vs données utilisateur)`);
    console.log(`Écart PVID: ${formatCFA(result.deductions.pvid - 15771)} (notre calcul vs données utilisateur)`);
    console.log(`Écart net: ${formatCFA(result.netPay - 207744)} (notre calcul vs données utilisateur)`);
  } catch (error) {
    console.error('❌ Erreur lors du test de paie:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  }
})();
