
import { useState, useCallback } from 'react';
import { EnhancedSecurityValidator } from '@/lib/enhanced-security';

interface ValidationResult {
  isValid: boolean;
  message: string;
}

interface ValidationRules {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  strongPassword?: boolean;
  noXSS?: boolean;
}

export const useSecureValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((
    fieldName: string,
    value: string,
    rules: ValidationRules = {}
  ): ValidationResult => {
    // Clear previous error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Required validation
    if (rules.required && (!value || value.trim().length === 0)) {
      const error = `${fieldName} is required`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
      return { isValid: true, message: 'Valid' };
    }

    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      const error = `${fieldName} must be at least ${rules.minLength} characters`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      const error = `${fieldName} must be less than ${rules.maxLength} characters`;
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    // Email validation
    if (rules.email && !EnhancedSecurityValidator.validateEmail(value)) {
      const error = 'Please enter a valid email address';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    // Phone validation
    if (rules.phone && !EnhancedSecurityValidator.validatePhone(value)) {
      const error = 'Please enter a valid phone number';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    // URL validation
    if (rules.url && !EnhancedSecurityValidator.validateUrl(value)) {
      const error = 'Please enter a valid HTTPS URL';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    // Strong password validation
    if (rules.strongPassword) {
      const passwordValidation = EnhancedSecurityValidator.validateStrongPassword(value);
      if (!passwordValidation.isValid) {
        setErrors(prev => ({ ...prev, [fieldName]: passwordValidation.message }));
        return passwordValidation;
      }
    }

    // XSS protection
    if (rules.noXSS && value !== EnhancedSecurityValidator.sanitizeHtml(value)) {
      const error = 'Invalid characters detected';
      setErrors(prev => ({ ...prev, [fieldName]: error }));
      return { isValid: false, message: error };
    }

    return { isValid: true, message: 'Valid' };
  }, []);

  const validateForm = useCallback((
    formData: Record<string, string>,
    rules: Record<string, ValidationRules>
  ): boolean => {
    let isFormValid = true;
    const newErrors: Record<string, string> = {};

    Object.entries(formData).forEach(([fieldName, value]) => {
      const fieldRules = rules[fieldName] || {};
      const result = validateField(fieldName, value, fieldRules);
      
      if (!result.isValid) {
        isFormValid = false;
        newErrors[fieldName] = result.message;
      }
    });

    setErrors(newErrors);
    return isFormValid;
  }, [validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0
  };
};
