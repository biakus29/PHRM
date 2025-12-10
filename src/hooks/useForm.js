import { useState, useCallback, useEffect } from "react";

/**
 * Hook useForm
 * 
 * Hook générique pour gérer les formulaires avec validation.
 * Gère l'état des valeurs, erreurs, et soumission.
 * 
 * Utilisation:
 * const {
 *   values,
 *   errors,
 *   touched,
 *   isSubmitting,
 *   handleChange,
 *   handleBlur,
 *   handleSubmit,
 *   setValues,
 *   setFieldValue,
 *   setFieldError,
 *   resetForm,
 *   setTouched
 * } = useForm({
 *   initialValues: { name: '', email: '' },
 *   validators: {
 *     name: (value) => value.trim() ? '' : 'Le nom est requis',
 *     email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Email invalide'
 *   },
 *   onSubmit: async (values) => {
 *     // Soumettre le formulaire
 *   }
 * });
 */

export const useForm = ({
  initialValues = {},
  validators = {},
  onSubmit = null,
  onError = null,
} = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ==================== VALIDATION ====================
  const validateField = useCallback(
    (name, value) => {
      const validator = validators[name];
      if (!validator) return "";

      if (typeof validator === "function") {
        return validator(value) || "";
      }

      return "";
    },
    [validators]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validators).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validators, values, validateField]);

  // ==================== HANDLERS ====================
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));
    setIsDirty(true);

    // Valider le champ si déjà touché
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Valider le champ
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, [validateField]);

  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      // Marquer tous les champs comme touchés
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Valider le formulaire
      const isValid = validateForm();
      if (!isValid) {
        if (onError) {
          onError(errors);
        }
        return;
      }

      // Soumettre
      if (onSubmit) {
        setIsSubmitting(true);
        try {
          await onSubmit(values);
        } catch (error) {
          console.error("[useForm] Erreur soumission:", error);
          if (onError) {
            onError({ submit: error.message });
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validateForm, onSubmit, onError, errors]
  );

  // ==================== FIELD HELPERS ====================
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);

    // Valider si déjà touché
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [touched, validateField]);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const setFieldTouched = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: isTouched,
    }));
  }, []);

  // ==================== RESET ====================
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
    setIsSubmitting(false);
  }, [initialValues]);

  // ==================== RESET WHEN INITIAL VALUES CHANGE ====================
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  // ==================== RETURN ====================
  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    resetForm,
    validateField,
    validateForm,
  };
};

export default useForm;
