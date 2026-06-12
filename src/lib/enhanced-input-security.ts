
import DOMPurify from 'isomorphic-dompurify';

export interface InputValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedName?: string;
}

export class EnhancedInputSecurity {
  private static readonly MAX_INPUT_LENGTH = 10000;
  private static readonly ALLOWED_FILE_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'text/plain', 'text/csv'
  ];
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static sanitizeInput(
    input: string, 
    options: {
      maxLength?: number;
      allowHtml?: boolean;
      stripScripts?: boolean;
    } = {}
  ): InputValidationResult {
    const {
      maxLength = this.MAX_INPUT_LENGTH,
      allowHtml = false,
      stripScripts = true
    } = options;

    let sanitized = input || '';
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Basic validation
    if (!sanitized.trim()) {
      return {
        isValid: false,
        sanitized: '',
        errors: ['Input cannot be empty'],
        riskLevel: 'low'
      };
    }

    // Length validation
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      errors.push(`Input truncated to ${maxLength} characters`);
      riskLevel = 'medium';
    }

    // XSS pattern detection
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /expression\s*\(/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Potentially dangerous content detected');
        riskLevel = 'high';
        break;
      }
    }

    // SQL injection pattern detection
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
      /(UNION\s+SELECT)/gi,
      /('|(\\')|(;)|(--)|(\|)|(\*)|(%))|\b(OR|AND)\b.*?=/gi
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('SQL injection pattern detected');
        riskLevel = 'critical';
        break;
      }
    }

    // HTML sanitization
    if (allowHtml) {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
    } else if (stripScripts) {
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    }

    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    return {
      isValid: errors.length === 0 || riskLevel === 'low',
      sanitized: sanitized.trim(),
      errors,
      riskLevel
    };
  }

  static validateEmail(email: string): InputValidationResult {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    let sanitized = email.trim().toLowerCase();
    const errors: string[] = [];

    if (!emailRegex.test(sanitized)) {
      errors.push('Invalid email format');
    }

    // Check for email injection patterns
    const injectionPatterns = [/\r|\n/g, /%0a|%0d/gi, /content-type:/gi, /bcc:/gi, /cc:/gi];
    
    for (const pattern of injectionPatterns) {
      if (pattern.test(sanitized)) {
        errors.push('Email injection attempt detected');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      riskLevel: errors.length > 0 ? 'high' : 'low'
    };
  }

  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    // File size check
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // File type check
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Filename sanitization
    let sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (sanitizedName !== file.name) {
      sanitizedName = sanitizedName.substring(0, 100); // Limit filename length
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName
    };
  }

  static validateUrl(url: string): InputValidationResult {
    const errors: string[] = [];
    let sanitized = url.trim();

    try {
      const urlObj = new URL(sanitized);
      
      // Only allow HTTP and HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('Only HTTP and HTTPS URLs are allowed');
      }

      // Block localhost and private IPs in production
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        if (urlObj.hostname === 'localhost' || urlObj.hostname.startsWith('192.168.') || urlObj.hostname.startsWith('10.')) {
          errors.push('Private network URLs are not allowed');
        }
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      riskLevel: errors.length > 0 ? 'medium' : 'low'
    };
  }
}
