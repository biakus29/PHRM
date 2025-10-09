// src/components/TextCustomizationDemo.jsx
// Composant de démonstration simple pour tester la personnalisation

import React, { useState } from 'react';
import TextTemplateManager from '../utils/textTemplates';

const TextCustomizationDemo = () => {
  const [companyId] = useState('demo-company-123');
  const [documentType] = useState('offers');
  const [textKey] = useState('introduction');
  const [result, setResult] = useState('');

  const textManager = new TextTemplateManager(companyId);

  const testGetText = () => {
    try {
      const variables = {
        startDate: '15/01/2024',
        startTime: '09:00',
        position: 'Développeur',
        category: 'Ingénieur',
        echelon: '3',
        workplace: 'Douala'
      };
      
      const text = textManager.getText(documentType, textKey, variables);
      setResult(text);
      console.log('✅ Test réussi:', text);
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  const testGetFields = () => {
    try {
      const fields = textManager.getCustomizableFields(documentType);
      setResult(`✅ ${fields.length} champs trouvés: ${fields.map(f => f.label).join(', ')}`);
      console.log('✅ Champs récupérés:', fields);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des champs:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">🧪 Test de Personnalisation</h2>
      
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Testez les fonctions de base de la personnalisation des textes
          </p>
        </div>

        <div className="flex space-x-4 justify-center">
          <button
            onClick={testGetText}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test getText()
          </button>
          
          <button
            onClick={testGetFields}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Test getFields()
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Résultat :</h3>
          <div className="p-4 bg-gray-100 rounded-lg min-h-[100px] whitespace-pre-wrap">
            {result || 'Cliquez sur un bouton de test...'}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Informations de test :</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Company ID: {companyId}</li>
            <li>• Document Type: {documentType}</li>
            <li>• Text Key: {textKey}</li>
            <li>• Variables: startDate, startTime, position, category, echelon, workplace</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TextCustomizationDemo;
