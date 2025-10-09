// src/components/TextCustomizationTest.jsx
// Composant de test pour la personnalisation des textes

import React, { useState } from 'react';
import TextTemplateManager from '../utils/textTemplates';

const TextCustomizationTest = () => {
  const [companyId] = useState('test-company-123');
  const [documentType, setDocumentType] = useState('offers');
  const [textKey, setTextKey] = useState('introduction');
  const [variables, setVariables] = useState({
    startDate: '15/01/2024',
    startTime: '09:00',
    position: 'Développeur',
    category: 'Ingénieur',
    echelon: '3',
    workplace: 'Douala'
  });
  const [result, setResult] = useState('');

  const textManager = new TextTemplateManager(companyId);

  const testGetText = () => {
    try {
      const text = textManager.getText(documentType, textKey, variables);
      setResult(text);
      console.log('Texte récupéré:', text);
    } catch (error) {
      console.error('Erreur lors du test:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  const testSaveText = () => {
    try {
      const customText = `Texte personnalisé pour ${textKey} - Testé le ${new Date().toLocaleTimeString()}`;
      textManager.saveCustomText(documentType, textKey, customText);
      setResult('Texte sauvegardé avec succès');
      console.log('Texte sauvegardé:', customText);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  const testGetFields = () => {
    try {
      const fields = textManager.getCustomizableFields(documentType);
      setResult(`Champs trouvés: ${fields.length} - ${fields.map(f => f.key).join(', ')}`);
      console.log('Champs personnalisables:', fields);
    } catch (error) {
      console.error('Erreur lors de la récupération des champs:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  const testGetDefaultTexts = () => {
    try {
      const defaultTexts = textManager.getDefaultTexts();
      const docTexts = defaultTexts[documentType];
      setResult(`Textes par défaut trouvés pour ${documentType}: ${Object.keys(docTexts || {}).length} clés`);
      console.log('Textes par défaut:', docTexts);
    } catch (error) {
      console.error('Erreur lors de la récupération des textes par défaut:', error);
      setResult('Erreur: ' + error.message);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Test de Personnalisation des Textes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Type de document</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="offers">Offres d'emploi</option>
                <option value="contracts">Contrats de travail</option>
                <option value="certificates">Certificats de travail</option>
                <option value="attestations">Attestations de virement</option>
                <option value="amendments">Avenants au contrat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Clé du texte</label>
              <input
                type="text"
                value={textKey}
                onChange={(e) => setTextKey(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="ex: introduction"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Variables (JSON)</label>
              <textarea
                value={JSON.stringify(variables, null, 2)}
                onChange={(e) => {
                  try {
                    setVariables(JSON.parse(e.target.value));
                  } catch (err) {
                    console.warn('JSON invalide:', err);
                  }
                }}
                rows={6}
                className="w-full p-2 border border-gray-300 rounded font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Tests</h3>
          
          <div className="space-y-3">
            <button
              onClick={testGetText}
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Test getText()
            </button>
            
            <button
              onClick={testSaveText}
              className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test saveText()
            </button>
            
            <button
              onClick={testGetFields}
              className="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test getFields()
            </button>
            
            <button
              onClick={testGetDefaultTexts}
              className="w-full p-3 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Test getDefaultTexts()
            </button>
          </div>

          <div className="mt-6">
            <h4 className="text-md font-semibold mb-2">Résultat</h4>
            <div className="p-3 bg-gray-100 rounded min-h-[100px] whitespace-pre-wrap">
              {result || 'Cliquez sur un bouton de test...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextCustomizationTest;
