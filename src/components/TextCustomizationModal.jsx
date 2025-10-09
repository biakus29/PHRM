// src/components/TextCustomizationModal.jsx
// Modal pour la personnalisation des textes des documents

import React, { useState } from 'react';
import { FiX, FiEdit3, FiSave, FiRotateCcw, FiHelpCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import TextTemplateManager from '../utils/textTemplates';
import TextCustomizationHelp from './TextCustomizationHelp';

const TextCustomizationModal = ({ 
  isOpen, 
  onClose, 
  documentType, 
  companyId, 
  onTextsUpdated 
}) => {
  const [texts, setTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [textManager] = useState(new TextTemplateManager(companyId));

  const documentTypes = {
    offers: { name: 'Offres d\'emploi', icon: '📄' },
    contracts: { name: 'Contrats de travail', icon: '📋' },
    certificates: { name: 'Certificats de travail', icon: '🏆' },
    attestations: { name: 'Attestations de virement', icon: '💳' },
    amendments: { name: 'Avenants au contrat', icon: '📝' }
  };

  // Charger les textes personnalisés quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen && documentType && companyId) {
      loadCustomTexts();
    }
  }, [isOpen, documentType, companyId]);

  const loadCustomTexts = () => {
    if (!companyId) return;
    const customTexts = textManager.getAllCustomTexts(documentType);
    setTexts(customTexts);
  };

  const handleTextChange = (textKey, value) => {
    setTexts(prev => ({
      ...prev,
      [textKey]: value
    }));
  };

  const saveTexts = async () => {
    if (!companyId) {
      toast.error('ID entreprise manquant');
      return;
    }
    
    setLoading(true);
    try {
      textManager.saveAllTexts(documentType, texts);
      toast.success('Textes sauvegardés avec succès !');
      if (onTextsUpdated) {
        onTextsUpdated(documentType, texts);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des textes');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefault = () => {
    if (!companyId) {
      toast.error('ID entreprise manquant');
      return;
    }
    
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les textes aux valeurs par défaut ?')) {
      textManager.resetToDefault(documentType);
      loadCustomTexts();
      toast.success('Textes réinitialisés aux valeurs par défaut');
    }
  };

  const getFieldValue = (fieldKey) => {
    const customValue = texts[fieldKey];
    if (customValue !== undefined) {
      return customValue;
    }
    
    const defaultTexts = textManager.getDefaultTexts();
    const documentDefaults = defaultTexts[documentType];
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
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              rows={field.rows || 4}
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none resize-y transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
              placeholder={`Écrivez votre texte personnalisé ici...`}
            />
            <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-gray-400">
              {value.length} caractères
            </div>
          </div>
        );
      
      case 'text':
        return (
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => handleTextChange(field.key, e.target.value)}
              className="w-full p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
              placeholder={`Écrivez votre texte personnalisé ici...`}
            />
            <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {value.length} caractères
            </div>
          </div>
        );
      
      case 'array':
        return (
          <ArrayInput
            value={Array.isArray(value) ? value : []}
            onChange={(newValue) => handleTextChange(field.key, newValue)}
            placeholder="Ajouter un élément"
          />
        );
      
      default:
        return null;
    }
  };

  const fields = textManager.getCustomizableFields(documentType);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-xs sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 animate-slideUp">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative flex items-center justify-between p-4 sm:p-6 lg:p-8">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg sm:rounded-xl backdrop-blur-sm flex-shrink-0">
                <span className="text-2xl sm:text-3xl lg:text-4xl">{documentTypes[documentType]?.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 truncate">
                  Personnaliser vos Documents
                </h2>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg truncate">
                  Adaptez les textes de vos {documentTypes[documentType]?.name.toLowerCase()} à votre entreprise
                </p>
                <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 mt-2 lg:mt-3">
                  <div className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="hidden lg:inline">Modifications en temps réel</span>
                    <span className="lg:hidden">Temps réel</span>
                  </div>
                  <div className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm">
                    <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 bg-yellow-400 rounded-full"></div>
                    <span className="hidden lg:inline">Variables automatiques</span>
                    <span className="lg:hidden">Variables</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 sm:p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Guide d'utilisation"
              >
                <FiHelpCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
              <button
                onClick={onClose}
                className="p-2 sm:p-3 text-white hover:bg-white hover:bg-opacity-20 rounded-lg sm:rounded-xl transition-all duration-200 backdrop-blur-sm"
                title="Fermer"
              >
                <FiX className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(95vh-140px)] sm:h-[calc(90vh-180px)]">
          {/* Sidebar avec navigation - Mobile: en haut, Desktop: à gauche */}
          <div className="w-full lg:w-64 xl:w-72 2xl:w-80 bg-gray-50 lg:border-r border-b lg:border-b-0 border-gray-200 p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-40 sm:max-h-48 lg:max-h-none">
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Sections à personnaliser</h3>
              <div className="space-y-1 sm:space-y-2">
                {fields.map((field, index) => (
                  <button
                    key={field.key}
                    onClick={() => {
                      const element = document.getElementById(`field-${field.key}`);
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="w-full text-left p-2 sm:p-3 rounded-lg hover:bg-white hover:shadow-sm hover-lift transition-all duration-200 border border-transparent hover:border-gray-200 group"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className="text-sm sm:text-base lg:text-lg flex-shrink-0">{field.label.split(' ')[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-800 text-xs sm:text-sm truncate">
                          {field.label.replace(/^[^\s]+ /, '')}
                        </div>
                        <div className="text-xs text-gray-500 truncate hidden sm:block">
                          {field.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Guide rapide - Masqué sur mobile */}
            <div className="hidden lg:block bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2 text-xs sm:text-sm">💡 Guide rapide</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Cliquez sur une section pour y aller</li>
                <li>• Modifiez le texte dans la zone</li>
                <li>• Les {'{{variables}}'} sont automatiques</li>
                <li>• Sauvegardez vos modifications</li>
              </ul>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 overflow-y-auto h-full">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {fields.map((field) => (
                <div key={field.key} id={`field-${field.key}`} className="scroll-mt-8 animate-slideInLeft">
                  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-md hover-lift transition-all duration-200">
                    <div className="mb-4 sm:mb-6">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <span className="text-lg sm:text-xl lg:text-2xl flex-shrink-0">{field.label.split(' ')[0]}</span>
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-800 truncate">
                          {field.label.replace(/^[^\s]+ /, '')}
                        </h3>
                      </div>
                      <p className="text-gray-600 bg-gray-50 p-3 sm:p-4 rounded-lg text-xs sm:text-sm leading-relaxed">
                        {field.description}
                      </p>
                    </div>
                    
                    {renderField(field)}
                    
                    {/* Aide pour les variables */}
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="text-blue-600 text-sm sm:text-lg flex-shrink-0">ℹ️</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-blue-800 font-medium mb-2 sm:mb-3">
                            Les informations entre accolades seront automatiquement remplacées :
                          </p>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono">{'{{nom}}'}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono">{'{{poste}}'}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono">{'{{salaire}}'}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono">{'{{date}}'}</span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-mono">{'{{entreprise}}'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50 border-t border-gray-200 p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between space-y-3 sm:space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center justify-center lg:justify-start space-x-2 sm:space-x-4 lg:space-x-6">
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium hidden sm:inline">Modifications en temps réel</span>
                <span className="font-medium sm:hidden">Temps réel</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                <span className="hidden sm:inline">Variables automatiques</span>
                <span className="sm:hidden">Variables</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-600">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                <span className="hidden sm:inline">PDF instantané</span>
                <span className="sm:hidden">PDF</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-4 w-full lg:w-auto">
              <button
                onClick={resetToDefault}
                className="flex items-center px-3 sm:px-4 py-2 text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg sm:rounded-xl transition-all duration-200 font-medium w-full sm:w-auto text-sm sm:text-base"
              >
                <FiRotateCcw className="mr-1 sm:mr-2" size={14} />
                <span className="hidden sm:inline">Réinitialiser</span>
                <span className="sm:hidden">Reset</span>
              </button>
              
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 rounded-lg sm:rounded-xl transition-all duration-200 font-medium w-full sm:w-auto text-sm sm:text-base"
              >
                Annuler
              </button>
              
              <button
                onClick={saveTexts}
                disabled={loading}
                className="flex items-center px-6 sm:px-8 py-2 sm:py-3 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl rounded-lg sm:rounded-xl font-semibold w-full sm:w-auto text-sm sm:text-base"
              >
                <FiSave className="mr-1 sm:mr-2" size={16} />
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
          
          {/* Barre de progression ou message de statut */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              💡 <strong>Astuce :</strong> Vos modifications seront automatiquement appliquées à tous les futurs documents PDF générés
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'aide */}
      <TextCustomizationHelp
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
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
    <div className="space-y-2 sm:space-y-3">
      {value.map((item, index) => (
        <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              className="w-full p-2 sm:p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 text-sm sm:text-base"
              placeholder={placeholder}
            />
          </div>
          <button
            onClick={() => removeItem(index)}
            className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-red-600 bg-red-100 hover:bg-red-200 rounded-lg transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="w-full p-3 sm:p-4 text-blue-600 bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-lg sm:rounded-xl transition-all duration-200 font-medium flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base"
      >
        <span className="text-lg sm:text-xl">+</span>
        <span className="hidden sm:inline">Ajouter un élément</span>
        <span className="sm:hidden">Ajouter</span>
      </button>
      
      {value.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-2">
          {value.length} élément{value.length > 1 ? 's' : ''} dans la liste
        </div>
      )}
    </div>
  );
};

export default TextCustomizationModal;
