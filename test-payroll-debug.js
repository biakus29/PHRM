// Test script to debug payroll calculation discrepancies
// Based on user's provided data comparison

const testData = {
  // Expected calculation
  expected: {
    baseSalary: 250000,
    primes: [
      { montant: 33000, type: 'Prime de rendement' },
      { montant: 10000, type: 'Prime de transport' }
    ],
    indemnites: [
      { montant: 20000, type: 'Indemnité logement' }
    ],
    grossTotal: 313000, // 250k + 43k + 20k
    deductions: {
      pvid: 10500,  // 4.2% of 250k
      irpp: 12283,
      cac: 1228,
      cfc: 2500,
      rav: 417,
      tdl: 1228     // 10% of IRPP
    },
    totalDeductions: 28156,
    netPay: 284844
  },
  
  // Actual problematic calculation
  actual: {
    baseSalary: 250000,
    grossTotal: 303000,  // Missing 10k
    primes: 43000,
    indemnites: 20000,
    deductions: {
      pvid: 15771,  // Too high
      irpp: 20000,  // Too high (was 7575 in raw data?)
      cac: 7575,    // Too high
      cfc: 1577,    // Too low
      rav: 1577,    // Too high
      tdl: 1577     // Based on wrong IRPP
    },
    netPay: 207744
  }
};

console.log('=== ANALYSE DES ÉCARTS DE CALCUL ===\n');

// Gross total analysis
console.log('1. TOTAL BRUT:');
console.log(`   Attendu: ${testData.expected.grossTotal.toLocaleString()} FCFA`);
console.log(`   Actuel:  ${testData.actual.grossTotal.toLocaleString()} FCFA`);
console.log(`   Écart:   ${(testData.expected.grossTotal - testData.actual.grossTotal).toLocaleString()} FCFA\n`);

// PVID analysis
console.log('2. PVID (4.2% du salaire de base):');
const expectedPvid = Math.round(testData.expected.baseSalary * 0.042);
console.log(`   Attendu: ${expectedPvid.toLocaleString()} FCFA (4.2% de ${testData.expected.baseSalary.toLocaleString()})`);
console.log(`   Actuel:  ${testData.actual.deductions.pvid.toLocaleString()} FCFA`);
console.log(`   Écart:   ${(testData.actual.deductions.pvid - expectedPvid).toLocaleString()} FCFA`);

// Calculate what base would give actual PVID
const impliedBase = Math.round(testData.actual.deductions.pvid / 0.042);
console.log(`   Base implicite: ${impliedBase.toLocaleString()} FCFA (pour obtenir ${testData.actual.deductions.pvid.toLocaleString()})\n`);

// IRPP analysis
console.log('3. IRPP:');
console.log(`   Attendu: ${testData.expected.deductions.irpp.toLocaleString()} FCFA`);
console.log(`   Actuel:  ${testData.actual.deductions.irpp.toLocaleString()} FCFA`);
console.log(`   Écart:   ${(testData.actual.deductions.irpp - testData.expected.deductions.irpp).toLocaleString()} FCFA\n`);

// TDL analysis
console.log('4. TDL (10% de l\'IRPP):');
const expectedTdl = Math.round(testData.expected.deductions.irpp * 0.10);
const actualTdlFromIrpp = Math.round(testData.actual.deductions.irpp * 0.10);
console.log(`   Attendu: ${expectedTdl.toLocaleString()} FCFA (10% de ${testData.expected.deductions.irpp.toLocaleString()})`);
console.log(`   Actuel:  ${testData.actual.deductions.tdl.toLocaleString()} FCFA`);
console.log(`   Si 10% IRPP actuel: ${actualTdlFromIrpp.toLocaleString()} FCFA\n`);

// Net pay analysis
console.log('5. NET À PAYER:');
const expectedNet = testData.expected.grossTotal - testData.expected.totalDeductions;
const actualTotalDeductions = Object.values(testData.actual.deductions).reduce((sum, val) => sum + val, 0);
const actualNet = testData.actual.grossTotal - actualTotalDeductions;
console.log(`   Attendu: ${expectedNet.toLocaleString()} FCFA`);
console.log(`   Actuel:  ${testData.actual.netPay.toLocaleString()} FCFA`);
console.log(`   Calculé: ${actualNet.toLocaleString()} FCFA (${testData.actual.grossTotal.toLocaleString()} - ${actualTotalDeductions.toLocaleString()})`);
console.log(`   Écart:   ${(expectedNet - testData.actual.netPay).toLocaleString()} FCFA\n`);

console.log('=== HYPOTHÈSES SUR LES CAUSES ===');
console.log('1. Total brut: Manque une prime/indemnité de 10,000 FCFA');
console.log('2. PVID: Calculé sur un montant de ~375,500 FCFA au lieu de 250,000 FCFA');
console.log('3. IRPP: Surévalué, possiblement lié au calcul sur mauvaise base');
console.log('4. Autres déductions: Incohérentes avec les barèmes standards');
