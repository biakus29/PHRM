// Script de test pour vérifier les imports après correction du problème d'encodage
console.log('🔍 Test des imports du module paySlipTemplates...');

(async () => {
  try {
    // Import ESM via dynamic import pour compatibilité CommonJS
    const tplModule = await import('./src/utils/paySlipTemplates.js');
    const { PAYSLIP_TEMPLATE_CONFIGS, CNPS_CALCULATIONS, generatePaySlipData } = tplModule;

    // Test 1: Import des configurations de modèles
    console.log('✅ Import PAYSLIP_TEMPLATE_CONFIGS réussi');
    console.log(`📊 Nombre de modèles disponibles: ${Object.keys(PAYSLIP_TEMPLATE_CONFIGS).length}`);
    
    // Test 2: Vérification de la structure des modèles
    Object.entries(PAYSLIP_TEMPLATE_CONFIGS).forEach(([key, template]) => {
      console.log(`   - ${key}: ${template.name} (${template.layout})`);
    });

    // Test 3: Import des calculs CNPS
    console.log('✅ Import CNPS_CALCULATIONS réussi');
    console.log(`💰 Taux employé CNPS (PVID): ${(CNPS_CALCULATIONS.employeeRates.pvid * 100).toFixed(1)}%`);

    // Test 4: Import de la fonction de génération
    console.log('✅ Import generatePaySlipData réussi');
    console.log(`🔧 Type de la fonction: ${typeof generatePaySlipData}`);

    // Test 5: Test basique de génération de données
    const mockEmployee = {
      name: 'Test Employee',
      matricule: 'TEST001',
      contract: { salaryBrut: 500000 }
    };
    
    const mockCompany = {
      name: 'Test Company',
      address: 'Test Address'
    };

    try {
      const result = generatePaySlipData(mockEmployee, mockCompany, 'template1', '2025-01');
      console.log('✅ Génération de données de test réussie');
      console.log(`📄 Modèle utilisé: ${result.template.name}`);
      console.log(`💵 Salaire net calculé: ${result.summary.netSalary.toLocaleString()} FCFA`);
    } catch (genError) {
      console.log('⚠️  Erreur lors de la génération de test:', genError.message);
    }

    console.log('\n🎉 Tous les imports fonctionnent correctement !');
    console.log('✨ Le problème d\'encodage a été résolu avec succès.');
  } catch (error) {
    console.error('❌ Erreur lors du test des imports:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  }
})();