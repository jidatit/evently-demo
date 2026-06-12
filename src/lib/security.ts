
// Security utilities and validation helpers
export class SecurityValidator {
  // XSS Prevention
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Enhanced input validation with length limits
  static validateEmail(email: string): boolean {
    if (!email || email.length > 255) return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  static validatePhone(phone: string): boolean {
    if (!phone || phone.length > 20) return false;
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  static validateUrl(url: string): boolean {
    if (!url || url.length > 2048) return false;
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'https:' || parsedUrl.hostname === 'localhost';
    } catch {
      return false;
    }
  }

  // Enhanced text validation with length limits
  static validateText(text: string, maxLength: number = 1000): boolean {
    if (!text || typeof text !== 'string') return false;
    return text.length <= maxLength && text.trim().length > 0;
  }

  static validatePassword(password: string): boolean {
    if (!password || password.length < 6 || password.length > 128) return false;
    // Check for at least one number and one letter
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    return hasNumber && hasLetter;
  }

  // Rate limiting (simple implementation)
  private static attempts: Map<string, { count: number; timestamp: number }> = new Map();

  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (now - attempt.timestamp > windowMs) {
      this.attempts.set(identifier, { count: 1, timestamp: now });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  // Clean up old rate limit entries
  static cleanupRateLimit(): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes

    for (const [key, value] of this.attempts.entries()) {
      if (now - value.timestamp > windowMs) {
        this.attempts.delete(key);
      }
    }
  }
}

// Secure API client with enhanced security
export class SecureApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async secureRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    // Validate URL
    if (!SecurityValidator.validateUrl(url)) {
      throw new Error('Invalid URL');
    }

    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        ...options.headers,
      },
    };

    // Add request size limit
    if (options.body) {
      const bodySize = new Blob([options.body as string]).size;
      if (bodySize > 1024 * 1024) { // 1MB limit
        throw new Error('Request too large');
      }
    }

    try {
      const response = await fetch(url, secureOptions);

      if (!response.ok) {
        // Generic error message to avoid information disclosure
        throw new Error('Request failed');
      }

      return response;
    } catch (error) {
      console.error('Secure request failed');
      throw new Error('Network error occurred');
    }
  }
}

// Content Security Policy helper
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://wtlwtjwlvvtrxprlwnqv.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

// Security middleware for error handling
export const handleSecureError = (error: unknown): string => {
  console.error('Security error:', error);

  // Return generic error messages to avoid information disclosure
  if (error instanceof Error) {
    if (error.message.includes('auth') || error.message.includes('login')) {
      return 'Authentication failed';
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error occurred';
    }
    if (error.message.includes('validation')) {
      return 'Invalid input provided';
    }
  }

  return 'An error occurred. Please try again.';
};
