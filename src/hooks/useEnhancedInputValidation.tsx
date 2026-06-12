
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  is_valid: boolean;
  sanitized: string;
  errors: string[];
  field_name: string;
}

interface ValidationOptions {
  maxLength?: number;
  allowHtml?: boolean;
  fieldName?: string;
}

export const useEnhancedInputValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateInput = async (
    input: string,
    options: ValidationOptions = {}
  ): Promise<ValidationResult> => {
    setIsValidating(true);
    
    const { maxLength = 1000, allowHtml = false, fieldName = 'Input' } = options;
    
    try {
      const { data, error } = await supabase.rpc('validate_and_sanitize_input_enhanced', {
        input_text: input,
        max_length: maxLength,
        allow_html: allowHtml,
        field_name: fieldName
      });

      if (error) {
        console.error('Validation error:', error);
        return {
          is_valid: false,
          sanitized: '',
          errors: ['Validation service unavailable'],
          field_name: fieldName
        };
      }

      // Type assertion with proper checking
      const result = data as unknown;
      if (typeof result === 'object' && result !== null && 
          'is_valid' in result && 'sanitized' in result && 
          'errors' in result && 'field_name' in result) {
        return result as ValidationResult;
      }

      // Fallback if data doesn't match expected structure
      return {
        is_valid: false,
        sanitized: input,
        errors: ['Invalid validation response'],
        field_name: fieldName
      };
    } catch (error) {
      console.error('Input validation error:', error);
      return {
        is_valid: false,
        sanitized: input,
        errors: ['Validation failed'],
        field_name: fieldName
      };
    } finally {
      setIsValidating(false);
    }
  };

  const validateFormData = async (
    formData: Record<string, string>,
    fieldConfigs: Record<string, ValidationOptions> = {}
  ): Promise<{
    isValid: boolean;
    sanitizedData: Record<string, string>;
    errors: Record<string, string[]>;
  }> => {
    const results: Record<string, ValidationResult> = {};
    
    // Validate each field
    for (const [field, value] of Object.entries(formData)) {
      const config = fieldConfigs[field] || { fieldName: field };
      results[field] = await validateInput(value, config);
    }
    
    const isValid = Object.values(results).every(result => result.is_valid);
    const sanitizedData: Record<string, string> = {};
    const errors: Record<string, string[]> = {};
    
    for (const [field, result] of Object.entries(results)) {
      sanitizedData[field] = result.sanitized;
      if (!result.is_valid) {
        errors[field] = result.errors;
      }
    }
    
    return { isValid, sanitizedData, errors };
  };

  return {
    validateInput,
    validateFormData,
    isValidating
  };
};
