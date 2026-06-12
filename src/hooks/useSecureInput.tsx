
import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface UseSecureInputReturn {
  value: string;
  error: string | null;
  isValid: boolean;
  setValue: (value: string) => void;
  validate: () => boolean;
  reset: () => void;
}

export const useSecureInput = (
  initialValue: string = '',
  rules: ValidationRule = {}
): UseSecureInputReturn => {
  const [value, setValueState] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validateValue = useCallback((val: string): string | null => {
    // Required validation
    if (rules.required && !val.trim()) {
      return 'This field is required';
    }

    // Length validations
    if (rules.minLength && val.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }

    if (rules.maxLength && val.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && val && !rules.pattern.test(val)) {
      return 'Invalid format';
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(val);
    }

    return null;
  }, [rules]);

  const setValue = useCallback((newValue: string) => {
    // Sanitize input - remove potentially dangerous characters
    const sanitized = newValue.replace(/[<>\"'&]/g, '');
    setValueState(sanitized);
    setError(validateValue(sanitized));
  }, [validateValue]);

  const validate = useCallback((): boolean => {
    const validationError = validateValue(value);
    setError(validationError);
    return validationError === null;
  }, [value, validateValue]);

  const reset = useCallback(() => {
    setValueState(initialValue);
    setError(null);
  }, [initialValue]);

  return {
    value,
    error,
    isValid: error === null,
    setValue,
    validate,
    reset
  };
};
