// src/components/DocumentsManager/DocumentForm.jsx
// Formulaire générique pour tous les types de documents

import React from 'react';
import { FiX } from 'react-icons/fi';
import { DOCUMENT_TYPES } from '../../config/documentConfig';

/**
 * Formulaire générique de document
 */
const DocumentForm = ({ 
  documentType,
  formData,
  onFieldChange,
  onSubmit,
  onCancel,
  isEditing,
  loading,
  errors = {}
}) => {
  const config = DOCUMENT_TYPES[documentType];
  const fields = config.fields;
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Modifier' : 'Créer'} {config.title}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.key] || ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    rows={3}
                    required={field.required}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.key] || ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={field.required}
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map(option => {
                      if (typeof option === 'object' && option.value && option.label) {
                        return <option key={option.value} value={option.value}>{option.label}</option>;
                      }
                      return <option key={option} value={option}>{option}</option>;
                    })}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required={field.required}
                  />
                )}
                
                {errors[field.key] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Sauvegarde...' : (isEditing ? 'Modifier' : 'Créer')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentForm;
