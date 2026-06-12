
import { EnhancedSecurityValidator } from './enhanced-security';

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'url' | 'date' | 'uuid';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => { isValid: boolean; message?: string };
  sanitize?: boolean;
}

export interface ValidationSchema {
  [fieldName: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: Record<string, any>;
}

export class EnhancedInputValidator {
  static validateObject(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = data[fieldName];
      const validation = this.validateField(fieldName, value, rule);
      
      if (!validation.isValid) {
        errors[fieldName] = validation.message;
      } else {
        sanitizedData[fieldName] = validation.sanitizedValue;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  }

  static validateField(fieldName: string, value: any, rule: ValidationRule): {
    isValid: boolean;
    message: string;
    sanitizedValue: any;
  } {
    let sanitizedValue = value;

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return {
        isValid: false,
        message: `${fieldName} is required`,
        sanitizedValue: null
      };
    }

    // Skip other validations if not required and empty
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return {
        isValid: true,
        message: '',
        sanitizedValue: null
      };
    }

    // Type validation and conversion
    if (rule.type) {
      const typeValidation = this.validateType(value, rule.type);
      if (!typeValidation.isValid) {
        return {
          isValid: false,
          message: `${fieldName} must be a valid ${rule.type}`,
          sanitizedValue: null
        };
      }
      sanitizedValue = typeValidation.convertedValue;
    }

    // String-specific validations
    if (typeof sanitizedValue === 'string') {
      // Sanitize if requested
      if (rule.sanitize) {
        sanitizedValue = EnhancedSecurityValidator.sanitizeHtml(sanitizedValue);
      }

      // Length validations
      if (rule.minLength && sanitizedValue.length < rule.minLength) {
        return {
          isValid: false,
          message: `${fieldName} must be at least ${rule.minLength} characters`,
          sanitizedValue
        };
      }

      if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
        return {
          isValid: false,
          message: `${fieldName} must be no more than ${rule.maxLength} characters`,
          sanitizedValue
        };
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
        return {
          isValid: false,
          message: `${fieldName} format is invalid`,
          sanitizedValue
        };
      }
    }

    // Number-specific validations
    if (typeof sanitizedValue === 'number') {
      if (rule.min !== undefined && sanitizedValue < rule.min) {
        return {
          isValid: false,
          message: `${fieldName} must be at least ${rule.min}`,
          sanitizedValue
        };
      }

      if (rule.max !== undefined && sanitizedValue > rule.max) {
        return {
          isValid: false,
          message: `${fieldName} must be no more than ${rule.max}`,
          sanitizedValue
        };
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(sanitizedValue);
      if (!customResult.isValid) {
        return {
          isValid: false,
          message: customResult.message || `${fieldName} is invalid`,
          sanitizedValue
        };
      }
    }

    return {
      isValid: true,
      message: '',
      sanitizedValue
    };
  }

  private static validateType(value: any, type: string): {
    isValid: boolean;
    convertedValue: any;
  } {
    switch (type) {
      case 'string':
        return {
          isValid: typeof value === 'string',
          convertedValue: String(value)
        };

      case 'number':
        const num = Number(value);
        return {
          isValid: !isNaN(num) && isFinite(num),
          convertedValue: num
        };

      case 'email':
        const emailValid = EnhancedSecurityValidator.validateEmail(String(value));
        return {
          isValid: emailValid,
          convertedValue: String(value).toLowerCase().trim()
        };

      case 'phone':
        const phoneValid = EnhancedSecurityValidator.validatePhone(String(value));
        return {
          isValid: phoneValid,
          convertedValue: String(value).replace(/\D/g, '')
        };

      case 'url':
        const urlValid = EnhancedSecurityValidator.validateUrl(String(value));
        return {
          isValid: urlValid,
          convertedValue: String(value)
        };

      case 'date':
        const date = new Date(value);
        return {
          isValid: !isNaN(date.getTime()),
          convertedValue: date.toISOString()
        };

      case 'uuid':
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return {
          isValid: uuidPattern.test(String(value)),
          convertedValue: String(value)
        };

      default:
        return {
          isValid: true,
          convertedValue: value
        };
    }
  }
}
