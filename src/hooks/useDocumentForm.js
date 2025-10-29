// src/hooks/useDocumentForm.js
// Hook pour gérer l'état et la validation des formulaires de documents

import { useState, useCallback, useMemo } from 'react';
import { getDefaultValues } from '../utils/documentHelpers';

/**
 * Hook pour gérer les formulaires de documents
 * @param {string} documentType - Type de document
 * @param {Object} companyData - Données de l'entreprise
 * @param {Object} selectedEmployee - Employé sélectionné
 * @returns {Object} - État du formulaire et fonctions de gestion
 */
export const useDocumentForm = (documentType, companyData = null, selectedEmployee = null) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  /**
   * Ouvre le formulaire pour créer un nouveau document
   */
  const openCreateForm = useCallback(() => {
    const defaults = getDefaultValues(documentType, companyData, selectedEmployee);
    setFormData(defaults);
    setEditingDoc(null);
    setErrors({});
    setShowForm(true);
  }, [documentType, companyData, selectedEmployee]);

  /**
   * Ouvre le formulaire pour éditer un document existant
   */
  const openEditForm = useCallback((document) => {
    setFormData(document);
    setEditingDoc(document);
    setErrors({});
    setShowForm(true);
  }, []);

  /**
   * Ferme le formulaire et réinitialise l'état
   */
  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingDoc(null);
    setFormData({});
    setErrors({});
  }, []);

  /**
   * Met à jour un champ du formulaire
   */
  const updateField = useCallback((fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
    
    // Efface l'erreur du champ si elle existe
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Met à jour plusieurs champs à la fois
   */
  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }));
  }, []);

  /**
   * Valide le formulaire
   */
  const validateForm = useCallback((fields) => {
    const newErrors = {};
    
    fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} est requis`;
      }
      
      // Validation spécifique pour les emails
      if (field.type === 'email' && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key])) {
          newErrors[field.key] = 'Email invalide';
        }
      }
      
      // Validation pour les nombres
      if (field.type === 'number' && formData[field.key] && isNaN(formData[field.key])) {
        newErrors[field.key] = 'Doit être un nombre';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Vérifie si le formulaire est en mode édition
   */
  const isEditing = useMemo(() => !!editingDoc, [editingDoc]);

  /**
   * Vérifie si le formulaire a des erreurs
   */
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    // États
    showForm,
    editingDoc,
    formData,
    errors,
    isEditing,
    hasErrors,
    
    // Actions
    openCreateForm,
    openEditForm,
    closeForm,
    updateField,
    updateFields,
    validateForm,
    setFormData
  };
};
