
import { SecurityLogger } from './enhanced-security';

interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class SecureErrorHandler {
  // Map of error patterns to user-friendly messages
  private static readonly ERROR_MAPPINGS = {
    // Authentication errors
    'auth': 'Authentication failed. Please check your credentials.',
    'unauthorized': 'You are not authorized to perform this action.',
    'session': 'Your session has expired. Please sign in again.',
    'token': 'Authentication token is invalid. Please sign in again.',
    
    // Network errors
    'network': 'Network error occurred. Please check your connection.',
    'timeout': 'Request timed out. Please try again.',
    'connection': 'Connection failed. Please try again.',
    
    // Validation errors
    'validation': 'Invalid input provided. Please check your information.',
    'required': 'Required fields are missing.',
    'format': 'Input format is invalid.',
    
    // Rate limiting
    'rate': 'Too many requests. Please try again later.',
    'limit': 'Request limit exceeded. Please try again later.',
    
    // Database errors
    'database': 'A database error occurred. Please try again.',
    'constraint': 'Data validation failed. Please check your input.',
    'duplicate': 'This information already exists.',
    
    // Permission errors
    'permission': 'You do not have permission to perform this action.',
    'access': 'Access denied. Please check your permissions.',
    
    // File/Upload errors
    'upload': 'File upload failed. Please try again.',
    'size': 'File size is too large.',
    'type': 'File type is not supported.',
  };

  static handleError(
    error: unknown, 
    context: ErrorContext,
    fallbackMessage: string = 'An unexpected error occurred. Please try again.'
  ): string {
    // Log the actual error for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    SecurityLogger.logSecurityEvent('ERROR_HANDLED', {
      context,
      originalError: errorMessage,
      timestamp: Date.now()
    });

    // Console log for development (will be automatically available to AI)
    console.error(`[${context.component}:${context.action}] Error:`, error);

    // Return user-friendly message
    return this.getUserFriendlyMessage(errorMessage, fallbackMessage);
  }

  private static getUserFriendlyMessage(errorMessage: string, fallback: string): string {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Check for specific error patterns
    for (const [pattern, message] of Object.entries(this.ERROR_MAPPINGS)) {
      if (lowerMessage.includes(pattern)) {
        return message;
      }
    }
    
    // Check for common Supabase error messages
    if (lowerMessage.includes('row level security')) {
      return 'You do not have permission to access this data.';
    }
    
    if (lowerMessage.includes('foreign key')) {
      return 'Unable to complete operation due to data dependencies.';
    }
    
    if (lowerMessage.includes('unique constraint')) {
      return 'This information already exists in the system.';
    }
    
    // Return fallback message
    return fallback;
  }

  // Specific error handlers for common scenarios
  static handleAuthError(error: unknown, action: string): string {
    return this.handleError(error, {
      component: 'Authentication',
      action
    }, 'Authentication failed. Please try again.');
  }

  static handleDatabaseError(error: unknown, component: string, action: string): string {
    return this.handleError(error, {
      component,
      action
    }, 'Database operation failed. Please try again.');
  }

  static handleValidationError(error: unknown, component: string): string {
    return this.handleError(error, {
      component,
      action: 'validation'
    }, 'Invalid input provided. Please check your information.');
  }

  static handleNetworkError(error: unknown, component: string): string {
    return this.handleError(error, {
      component,
      action: 'network'
    }, 'Network error occurred. Please check your connection.');
  }
}

// Utility function for async operations with error handling
export const withSecureErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: ErrorContext,
  fallbackMessage?: string
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const userMessage = SecureErrorHandler.handleError(error, context, fallbackMessage);
    return { data: null, error: userMessage };
  }
};
