// src/components/TextCustomizationManager.jsx
// Interface de personnalisation des textes des documents PDF

import React, { useState, useEffect } from 'react';
import { FiEdit3, FiSave, FiRotateCcw, FiEye, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import TextTemplateManager from '../utils/textTemplates';

const TextCustomizationManager = ({ companyId, onTextsUpdated }) => {
  const [activeDocument, setActiveDocument] = useState('offers');
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [textManager] = useState(new TextTemplateManager(companyId));

  const documentTypes = {
    offers: { name: 'Offres d\'emploi', icon: '📄', color: 'blue' },
    contracts: { name: 'Contrats de travail', icon: '📋', color: 'green' },
    certificates: { name: 'Certificats de travail', icon: '🏆', color: 'purple' },
    attestations: { name: 'Attestations de virement', icon: '💳', color: 'orange' },
    amendments: { name: 'Avenants au contrat', icon: '📝', color: 'indigo' }
  };

  // Charger les textes personnalisés au montage du composant
  useEffect(() => {
    loadCustomTexts();
  }, [activeDocument]);

  const loadCustomTexts = () => {
    const customTexts = textManager.getAllCustomTexts(activeDocument);
    setTexts(customTexts);
  };

  const handleTextChange = (textKey, value) => {
    setTexts(prev => ({
      ...prev,
      [textKey]: value
    }));
  };

  const handleArrayChange = (textKey, value) => {
    setTexts(prev => ({
      ...prev,
      [textKey]: value
    }));
  };

  const saveTexts = async () => {
    setLoading(true);
    try {
      textManager.saveAllTexts(activeDocument, texts);
      toast.success('Textes sauvegardés avec succès !');
      if (onTextsUpdated) {
        onTextsUpdated(activeDocument, texts);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des textes');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les textes aux valeurs par défaut ?')) {
      textManager.resetToDefault(activeDocument);
      loadCustomTexts();
      toast.success('Textes réinitialisés aux valeurs par défaut');
    }
  };

  const previewDocument = () => {
    // Ici on pourrait ouvrir un modal de prévisualisation
    toast.info('Fonctionnalité de prévisualisation à venir');
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getFieldValue = (fieldKey) => {
    const customValue = texts[fieldKey];
    if (customValue !== undefined) {
      return customValue;
    }
    
    const defaultTexts = textManager.getDefaultTexts();
    const documentDefaults = defaultTexts[activeDocument];
    if (documentDefaults && documentDefaults[fieldKey] !== undefined) {
      return documentDefaults[fieldKey];
    }
    
    return '';
  };

  const renderField = (field) => {
    const value = getFieldValue(field.key);
    
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleTextChange(field.key, e.target.value)}
            rows={field.rows || 3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            placeholder={`Texte personnalisé pour ${field.label}`}
          />
        );
      
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleTextChange(field.key, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Texte personnalisé pour ${field.label}`}
          />
        );
      
      case 'array':
        return (
          <ArrayInput
            value={Array.isArray(value) ? value : []}
            onChange={(newValue) => handleArrayChange(field.key, newValue)}
            placeholder="Ajouter un élément"
          />
        );
      
      default:
        return null;
    }
  };

  const fields = textManager.getCustomizableFields(activeDocument);

  return (
    <div className="text-customization-manager bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Personnalisation des Textes des Documents
        </h2>
        <p className="text-gray-600">
          Personnalisez les textes internes de vos documents PDF pour les adapter à votre entreprise.
        </p>
      </div>

      {/* Sélection du type de document */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type de document à personnaliser
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(documentTypes).map(([key, doc]) => (
            <button
              key={key}
              onClick={() => setActiveDocument(key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                activeDocument === key
                  ? `border-${doc.color}-500 bg-${doc.color}-50 text-${doc.color}-700`
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-2">{doc.icon}</div>
              <div className="text-sm font-medium">{doc.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire de personnalisation */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Textes personnalisables - {documentTypes[activeDocument].name}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={previewDocument}
              className="flex items-center px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FiEye className="mr-2" />
              Aperçu
            </button>
            <button
              onClick={resetToDefault}
              className="flex items-center px-4 py-2 text-orange-600 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <FiRotateCcw className="mr-2" />
              Réinitialiser
            </button>
            <button
              onClick={saveTexts}
              disabled={loading}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <FiSave className="mr-2" />
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => toggleSection(field.key)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{field.label}</h4>
                    <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                  </div>
                  {expandedSections[field.key] ? (
                    <FiChevronDown className="text-gray-400" />
                  ) : (
                    <FiChevronRight className="text-gray-400" />
                  )}
                </div>
              </button>
              
              {expandedSections[field.key] && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="mt-4">
                    {renderField(field)}
                  </div>
                  
                  {/* Aide pour les variables */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Variables disponibles :</strong> Utilisez <code className="bg-blue-100 px-1 rounded">{'{{variable}}'}</code> pour insérer des données dynamiques.
                      <br />
                      <strong>Exemple :</strong> <code className="bg-blue-100 px-1 rounded">{'{{employeeName}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{position}}'}</code>, <code className="bg-blue-100 px-1 rounded">{'{{totalSalary}}'}</code>
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Composant pour gérer les listes d'éléments
const ArrayInput = ({ value, onChange, placeholder }) => {
  const addItem = () => {
    onChange([...value, '']);
  };

  const updateItem = (index, newValue) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(newArray);
  };

  const removeItem = (index) => {
    const newArray = value.filter((_, i) => i !== index);
    onChange(newArray);
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
          <button
            onClick={() => removeItem(index)}
            className="px-3 py-2 text-red-600 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            Supprimer
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full p-2 text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
      >
        + Ajouter un élément
      </button>
    </div>
  );
};

export default TextCustomizationManager;
