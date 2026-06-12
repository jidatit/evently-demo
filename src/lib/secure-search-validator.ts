
import { EnhancedInputSecurity } from './enhanced-input-security';

export interface SearchValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  riskAssessment: 'safe' | 'suspicious' | 'dangerous';
}

export class SecureSearchValidator {
  private static readonly MAX_SEARCH_LENGTH = 100;
  private static readonly BLOCKED_PATTERNS = [
    // SQL injection patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(UNION\s+SELECT)/gi,
    /('|(\\')|(;)|(--)|(\|)|(\*))/gi,
    
    // Script injection patterns
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // Command injection patterns
    /[;&|`$(){}[\]]/g,
    
    // Path traversal patterns
    /\.\./g,
    /\/etc\/|\/proc\/|\/sys\//gi
  ];

  static validateSearchInput(input: string, fieldName: string = 'Search'): SearchValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: false,
        sanitized: '',
        errors: [`${fieldName} cannot be empty`],
        riskAssessment: 'safe'
      };
    }

    // Check length
    if (input.length > this.MAX_SEARCH_LENGTH) {
      return {
        isValid: false,
        sanitized: input.substring(0, this.MAX_SEARCH_LENGTH),
        errors: [`${fieldName} exceeds maximum length of ${this.MAX_SEARCH_LENGTH} characters`],
        riskAssessment: 'suspicious'
      };
    }

    let riskLevel: 'safe' | 'suspicious' | 'dangerous' = 'safe';
    const errors: string[] = [];

    // Check for blocked patterns
    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(input)) {
        riskLevel = 'dangerous';
        errors.push(`${fieldName} contains potentially dangerous content`);
        break;
      }
    }

    // Use enhanced input security for additional validation
    const securityResult = EnhancedInputSecurity.sanitizeInput(input, {
      maxLength: this.MAX_SEARCH_LENGTH,
      allowHtml: false,
      stripScripts: true
    });

    if (securityResult.riskLevel === 'critical' || securityResult.riskLevel === 'high') {
      riskLevel = 'dangerous';
      errors.push(...securityResult.errors);
    } else if (securityResult.riskLevel === 'medium') {
      riskLevel = 'suspicious';
      errors.push(...securityResult.errors);
    }

    return {
      isValid: riskLevel !== 'dangerous' && errors.length === 0,
      sanitized: securityResult.sanitized,
      errors,
      riskAssessment: riskLevel
    };
  }

  static validateCategoryInput(category: string, allowedCategories: string[]): SearchValidationResult {
    if (!category || category === 'all') {
      return {
        isValid: true,
        sanitized: category || 'all',
        errors: [],
        riskAssessment: 'safe'
      };
    }

    if (!allowedCategories.includes(category)) {
      return {
        isValid: false,
        sanitized: 'all',
        errors: ['Invalid category selected'],
        riskAssessment: 'suspicious'
      };
    }

    return {
      isValid: true,
      sanitized: category,
      errors: [],
      riskAssessment: 'safe'
    };
  }

  static sanitizeForDatabase(input: string): string {
    // Remove or escape characters that could be problematic in database queries
    return input
      .replace(/['"\\]/g, '') // Remove quotes and backslashes
      .replace(/[;&|]/g, '') // Remove command separators
      .replace(/--/g, '') // Remove SQL comments
      .replace(/%/g, '') // Remove wildcard characters that weren't intended
      .trim();
  }
}
