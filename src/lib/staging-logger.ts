import { getApiConfig } from './environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  environment?: string;
}

class StagingLogger {
  private config = getApiConfig();

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableDetailedLogging) {
      return level === 'error';
    }

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevel = levels.indexOf(this.config.logLevel);
    const messageLevel = levels.indexOf(level);
    
    return messageLevel >= configLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const env = this.config.environment.toUpperCase();
    
    let formatted = `[${env}][${level.toUpperCase()}] ${timestamp} - ${message}`;
    
    if (context) {
      formatted += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    return formatted;
  }

  private async logToSupabase(level: LogLevel, message: string, context?: LogContext) {
    if (!this.config.enableDetailedLogging) return;

    try {
      // Log to Supabase edge function for centralized logging
      await fetch('/api/log-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          context: {
            ...context,
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            userAgent: navigator.userAgent,
            url: window.location.href,
          }
        })
      });
    } catch (error) {
      // Fallback to console if logging service fails
      console.warn('Failed to log to remote service:', error);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
      this.logToSupabase('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
      this.logToSupabase('info', message, context);
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
      this.logToSupabase('warn', message, context);
    }
  }

  error(message: string, context?: LogContext, error?: Error) {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };

    console.error(this.formatMessage('error', message, errorContext));
    this.logToSupabase('error', message, errorContext);
  }

  // Specialized methods for common scenarios
  logPaymentAttempt(paymentData: Record<string, any>, success: boolean) {
    this.info(`Payment ${success ? 'successful' : 'failed'}`, {
      component: 'Payment',
      action: 'process_payment',
      metadata: {
        success,
        amount: paymentData.amount,
        currency: paymentData.currency,
        paymentMethod: paymentData.payment_method,
        // Don't log sensitive data in staging
        maskedData: this.config.environment !== 'production',
      }
    });
  }

  logBookingAction(action: string, bookingId: string, userId?: string) {
    this.info(`Booking ${action}`, {
      component: 'Booking',
      action,
      userId,
      metadata: { bookingId }
    });
  }

  logEmailSent(recipient: string, subject: string, success: boolean) {
    this.info(`Email ${success ? 'sent' : 'failed'}`, {
      component: 'Email',
      action: 'send_email',
      metadata: {
        recipient: this.config.environment === 'production' ? 'masked' : recipient,
        subject,
        success,
        testMode: this.config.environment !== 'production'
      }
    });
  }

  logAuthEvent(event: string, userId?: string, success: boolean = true) {
    this.info(`Auth event: ${event}`, {
      component: 'Auth',
      action: event,
      userId,
      metadata: { success }
    });
  }
}

export const stagingLogger = new StagingLogger();