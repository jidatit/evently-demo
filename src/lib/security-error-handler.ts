
// Enhanced security error handler with generic error messages
export class SecurityErrorHandler {
  private static logSecurityEvent(event: string, details?: any) {
    console.error(`[SECURITY] ${event}`, details);
    // In production, this would send to a security monitoring service
  }

  static handleAuthError(error: any): string {
    this.logSecurityEvent('AUTH_ERROR', { message: error.message });
    
    // Return generic error messages to prevent information disclosure
    if (error.message?.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (error.message?.includes('Email not confirmed')) {
      return 'Please check your email and confirm your account before signing in.';
    }
    
    if (error.message?.includes('Too many requests')) {
      return 'Too many login attempts. Please try again later.';
    }
    
    // Generic fallback
    return 'Authentication failed. Please try again.';
  }

  static handleValidationError(error: any): string {
    this.logSecurityEvent('VALIDATION_ERROR', { message: error.message });
    return 'Invalid input provided. Please check your data and try again.';
  }

  static handleDatabaseError(error: any): string {
    this.logSecurityEvent('DATABASE_ERROR', { message: error.message });
    return 'A system error occurred. Please try again later.';
  }

  static handleGenericError(error: any): string {
    this.logSecurityEvent('GENERIC_ERROR', { message: error.message });
    return 'An unexpected error occurred. Please try again.';
  }
}
