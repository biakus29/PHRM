// Test des corrections apportées aux calculs de paie
console.log('=== TEST DES CORRECTIONS ===\n');

(async () => {
  try {
    const { computeNetPay, computePVID, formatCFA } = await import('./src/utils/payrollCalculations.js');

    // Données de test basées sur l'exemple utilisateur
    const testPayroll = {
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
        // On laisse PVID vide pour tester le calcul automatique
        irpp: 12283,
        cac: 1228,
        cfc: 2500,
        rav: 417,
        tdl: 1228
      }
    };

    // Test PVID isolé
    const expectedPVID = computePVID(250000);
    console.log(`PVID calculé: ${expectedPVID.toLocaleString()} FCFA (4.2% de 250,000)`);
    console.log(`PVID attendu: 10,500 FCFA`);
    console.log(`✅ Correct: ${expectedPVID === 10500 ? 'OUI' : 'NON'}\n`);

    // Test calcul complet
    const result = computeNetPay(testPayroll);

    console.log('=== RÉSULTATS CORRIGÉS ===');
    console.log(`Total brut: ${formatCFA(result.grossTotal)}`);
    console.log(`PVID: ${formatCFA(result.deductions.pvid)}`);
    console.log(`IRPP: ${formatCFA(result.deductions.irpp)}`);
    console.log(`TDL: ${formatCFA(result.deductions.tdl)}`);
    console.log(`Total déductions: ${formatCFA(result.deductionsTotal)}`);
    console.log(`Net à payer: ${formatCFA(result.netPay)}\n`);

    console.log('=== COMPARAISON AVEC ATTENDU ===');
    const expected = {
      grossTotal: 313000,
      pvid: 10500,
      irpp: 12283,
      tdl: 1228,
      totalDeductions: 28156,
      netPay: 284844
    };

    console.log(`Total brut: ${result.grossTotal === expected.grossTotal ? '✅' : '❌'} ${result.grossTotal} vs ${expected.grossTotal}`);
    console.log(`PVID: ${result.deductions.pvid === expected.pvid ? '✅' : '❌'} ${result.deductions.pvid} vs ${expected.pvid}`);
    console.log(`IRPP: ${result.deductions.irpp === expected.irpp ? '✅' : '❌'} ${result.deductions.irpp} vs ${expected.irpp}`);
    console.log(`TDL: ${result.deductions.tdl === expected.tdl ? '✅' : '❌'} ${result.deductions.tdl} vs ${expected.tdl}`);
    console.log(`Net: ${Math.abs(result.netPay - expected.netPay) <= 1 ? '✅' : '❌'} ${result.netPay} vs ${expected.netPay}`);
  } catch (error) {
    console.error('❌ Erreur lors du test corrigé:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  }
})();
