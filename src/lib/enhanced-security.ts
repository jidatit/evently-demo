// Enhanced security utilities with comprehensive validation and monitoring
import { SecurityValidator } from "./security";

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationMs: number;
  sessionTimeoutMs: number;
  sessionWarningMs: number; // New: when to show warning
  passwordMinLength: number;
  requireEmailVerification: boolean;
  maxRequestsPerMinute: number; // New: rate limiting
  suspiciousActivityThreshold: number; // New: anomaly detection
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes
  sessionTimeoutMs: 8 * 60 * 60 * 1000, // 8 hours
  sessionWarningMs: 5 * 60 * 1000, // 5 minutes before timeout
  passwordMinLength: 8,
  requireEmailVerification: true,
  maxRequestsPerMinute: 60,
  suspiciousActivityThreshold: 10,
};

// Enhanced password validation with complexity requirements
export class EnhancedSecurityValidator extends SecurityValidator {
  static validateStrongPassword(password: string): {
    isValid: boolean;
    message: string;
  } {
    if (
      !password ||
      password.length < DEFAULT_SECURITY_CONFIG.passwordMinLength
    ) {
      return {
        isValid: false,
        message: `Password must be at least ${DEFAULT_SECURITY_CONFIG.passwordMinLength} characters long`,
      };
    }

    if (password.length > 128) {
      return {
        isValid: false,
        message: "Password must be less than 128 characters",
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const missingRequirements = [];
    if (!hasUppercase) missingRequirements.push("uppercase letter");
    if (!hasLowercase) missingRequirements.push("lowercase letter");
    if (!hasNumber) missingRequirements.push("number");
    if (!hasSpecialChar) missingRequirements.push("special character");

    if (missingRequirements.length > 0) {
      return {
        isValid: false,
        message: `Password must contain at least one: ${missingRequirements.join(
          ", "
        )}`,
      };
    }

    return { isValid: true, message: "Password meets security requirements" };
  }

  // Enhanced input validation with consistent error messages
  static validateUserInput(
    input: string,
    fieldName: string,
    maxLength: number = 255
  ): { isValid: boolean; message: string } {
    if (!input || typeof input !== "string") {
      return { isValid: false, message: `${fieldName} is required` };
    }

    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { isValid: false, message: `${fieldName} cannot be empty` };
    }

    if (trimmed.length > maxLength) {
      return {
        isValid: false,
        message: `${fieldName} must be less than ${maxLength} characters`,
      };
    }

    return { isValid: true, message: "Valid input" };
  }

  // New: Enhanced rate limiting with IP tracking
  private static requestCounts: Map<
    string,
    { count: number; timestamp: number; requests: number[] }
  > = new Map();

  static checkEnhancedRateLimit(
    identifier: string,
    maxRequests: number = DEFAULT_SECURITY_CONFIG.maxRequestsPerMinute
  ): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    let userRequests = this.requestCounts.get(identifier);

    if (!userRequests) {
      userRequests = { count: 1, timestamp: now, requests: [now] };
      this.requestCounts.set(identifier, userRequests);
      return true;
    }

    // Filter out requests older than the window
    userRequests.requests = userRequests.requests.filter(
      (time) => now - time < windowMs
    );

    if (userRequests.requests.length >= maxRequests) {
      SecurityLogger.logSecurityEvent("RATE_LIMIT_EXCEEDED", {
        identifier: this.hashIdentifier(identifier),
        requestCount: userRequests.requests.length,
        windowMs,
      });
      return false;
    }

    userRequests.requests.push(now);
    userRequests.count++;
    return true;
  }

  // New: Suspicious activity detection
  static detectSuspiciousActivity(identifier: string, action: string): boolean {
    const userRequests = this.requestCounts.get(identifier);
    if (!userRequests) return false;

    const recentRequests = userRequests.requests.filter(
      (time) => Date.now() - time < 60000 // Last minute
    );

    // Check for rapid-fire requests (potential bot behavior)
    if (
      recentRequests.length >=
      DEFAULT_SECURITY_CONFIG.suspiciousActivityThreshold
    ) {
      const timeDiffs = recentRequests
        .slice(1)
        .map((time, index) => time - recentRequests[index]);

      const avgTimeBetweenRequests =
        timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

      // If average time between requests is less than 100ms, it's suspicious
      if (avgTimeBetweenRequests < 100) {
        SecurityLogger.logSecurityEvent("SUSPICIOUS_ACTIVITY_DETECTED", {
          identifier: this.hashIdentifier(identifier),
          action,
          requestCount: recentRequests.length,
          avgTimeBetweenRequests,
        });
        return true;
      }
    }

    return false;
  }

  private static hashIdentifier(identifier: string): string {
    // Simple hash for logging (not cryptographic)
    return btoa(identifier).slice(0, 8);
  }
}

// Enhanced Account lockout management
export class AccountSecurity {
  private static lockouts: Map<
    string,
    { attempts: number; lockedUntil: number }
  > = new Map();

  static isAccountLocked(identifier: string): boolean {
    const lockout = this.lockouts.get(identifier);
    if (!lockout) return false;

    if (Date.now() > lockout.lockedUntil) {
      this.lockouts.delete(identifier);
      return false;
    }

    return true;
  }

  static recordFailedAttempt(identifier: string): {
    isLocked: boolean;
    remainingAttempts: number;
  } {
    const lockout = this.lockouts.get(identifier) || {
      attempts: 0,
      lockedUntil: 0,
    };
    lockout.attempts++;

    if (lockout.attempts >= DEFAULT_SECURITY_CONFIG.maxLoginAttempts) {
      lockout.lockedUntil =
        Date.now() + DEFAULT_SECURITY_CONFIG.lockoutDurationMs;
      this.lockouts.set(identifier, lockout);

      // Log security event
      SecurityLogger.logSecurityEvent("ACCOUNT_LOCKED", {
        identifier: this.hashIdentifier(identifier),
        attempts: lockout.attempts,
      });

      return { isLocked: true, remainingAttempts: 0 };
    }

    this.lockouts.set(identifier, lockout);
    return {
      isLocked: false,
      remainingAttempts:
        DEFAULT_SECURITY_CONFIG.maxLoginAttempts - lockout.attempts,
    };
  }

  static clearFailedAttempts(identifier: string): void {
    this.lockouts.delete(identifier);
  }

  private static hashIdentifier(identifier: string): string {
    // Simple hash for logging (not cryptographic)
    return btoa(identifier).slice(0, 8);
  }

  // Clean up expired lockouts periodically
  static cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.lockouts.entries()) {
      if (now > value.lockedUntil) {
        this.lockouts.delete(key);
      }
    }
  }

  // New: Get security metrics for monitoring
  static getSecurityMetrics(): {
    activeLockouts: number;
    totalAttempts: number;
    suspiciousActivityCount: number;
  } {
    const logs = SecurityLogger.getSecurityLogs();

    return {
      activeLockouts: this.lockouts.size,
      totalAttempts: Array.from(this.lockouts.values()).reduce(
        (sum, lockout) => sum + lockout.attempts,
        0
      ),
      suspiciousActivityCount: logs.filter(
        (log) => log.eventType === "SUSPICIOUS_ACTIVITY_DETECTED"
      ).length,
    };
  }
}

// Enhanced Security event logging
export class SecurityLogger {
  static logSecurityEvent(eventType: string, data: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      data: {
        ...data,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
    };

    console.warn(`SECURITY EVENT [${eventType}]:`, logEntry);

    // Store in localStorage for basic persistence (in production, send to logging service)
    try {
      const logs = JSON.parse(localStorage.getItem("security_logs") || "[]");
      logs.push(logEntry);

      // Keep only last 100 entries
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem("security_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  static getSecurityLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem("security_logs") || "[]");
    } catch {
      return [];
    }
  }

  static clearSecurityLogs(): void {
    localStorage.removeItem("security_logs");
  }

  // New: Get security events by type
  static getSecurityEventsByType(eventType: string, hours: number = 24): any[] {
    const logs = this.getSecurityLogs();
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    return logs.filter(
      (log) =>
        log.eventType === eventType &&
        new Date(log.timestamp).getTime() > cutoff
    );
  }

  // New: Security health check
  static getSecurityHealthReport(): {
    status: "healthy" | "warning" | "critical";
    issues: string[];
    metrics: Record<string, number>;
  } {
    const logs = this.getSecurityLogs();
    const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
    const recentLogs = logs.filter(
      (log) => new Date(log.timestamp).getTime() > last24Hours
    );

    const issues: string[] = [];
    const metrics = {
      failedLogins: recentLogs.filter((log) => log.eventType === "LOGIN_FAILED")
        .length,
      accountLockouts: recentLogs.filter(
        (log) => log.eventType === "ACCOUNT_LOCKED"
      ).length,
      suspiciousActivity: recentLogs.filter(
        (log) => log.eventType === "SUSPICIOUS_ACTIVITY_DETECTED"
      ).length,
      sessionTimeouts: recentLogs.filter(
        (log) => log.eventType === "SESSION_TIMEOUT"
      ).length,
    };

    // Determine health status
    if (metrics.accountLockouts > 10 || metrics.suspiciousActivity > 5) {
      issues.push("High number of security events detected");
    }

    if (metrics.failedLogins > 50) {
      issues.push("Excessive failed login attempts");
    }

    const status =
      issues.length === 0
        ? "healthy"
        : issues.length <= 2
        ? "warning"
        : "critical";

    return { status, issues, metrics };
  }
}

// Enhanced Session management utilities
export class SessionManager {
  private static sessionStartTime: number | null = null;
  private static lastActivityTime: number | null = null;
  private static timeoutWarningShown: boolean = false;

  static startSession(): void {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.timeoutWarningShown = false;

    SecurityLogger.logSecurityEvent("SESSION_STARTED", {
      startTime: this.sessionStartTime,
    });
  }

  static updateActivity(): void {
    this.lastActivityTime = Date.now();
    this.timeoutWarningShown = false;
  }

  static isSessionExpired(): boolean {
    if (!this.sessionStartTime || !this.lastActivityTime) return false;

    const now = Date.now();
    const sessionDuration = now - this.sessionStartTime;
    const inactivityDuration = now - this.lastActivityTime;

    return (
      sessionDuration > DEFAULT_SECURITY_CONFIG.sessionTimeoutMs ||
      inactivityDuration > DEFAULT_SECURITY_CONFIG.sessionTimeoutMs / 2
    );
  }

  static shouldShowTimeoutWarning(): boolean {
    if (!this.lastActivityTime || this.timeoutWarningShown) return false;

    const now = Date.now();
    const inactivityDuration = now - this.lastActivityTime;
    const warningThreshold =
      DEFAULT_SECURITY_CONFIG.sessionTimeoutMs / 2 - 5 * 60 * 1000; // 5 minutes before timeout

    return inactivityDuration > warningThreshold;
  }

  static markWarningShown(): void {
    this.timeoutWarningShown = true;
  }

  static endSession(): void {
    if (this.sessionStartTime) {
      SecurityLogger.logSecurityEvent("SESSION_ENDED", {
        duration: Date.now() - this.sessionStartTime,
      });
    }

    this.sessionStartTime = null;
    this.lastActivityTime = null;
    this.timeoutWarningShown = false;
  }

  // New: Session integrity check
  static validateSessionIntegrity(session: any): boolean {
    if (!session || !session.access_token) return false;

    try {
      // Basic JWT structure validation (don't decode for security)
      const parts = session.access_token.split(".");
      if (parts.length !== 3) return false;

      // Check expiration without decoding
      if (session.expires_at && session.expires_at * 1000 < Date.now()) {
        SecurityLogger.logSecurityEvent("SESSION_EXPIRED_TOKEN", {
          expiresAt: session.expires_at,
        });
        return false;
      }

      return true;
    } catch (error) {
      SecurityLogger.logSecurityEvent("SESSION_VALIDATION_ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // New: Enhanced session metrics
  static getSessionMetrics(): {
    sessionDuration: number;
    inactivityDuration: number;
    isHealthy: boolean;
  } {
    const now = Date.now();

    return {
      sessionDuration: this.sessionStartTime ? now - this.sessionStartTime : 0,
      inactivityDuration: this.lastActivityTime
        ? now - this.lastActivityTime
        : 0,
      isHealthy:
        !this.isSessionExpired() &&
        this.lastActivityTime !== null &&
        this.sessionStartTime !== null,
    };
  }
}

// Generic security error handler
export const handleSecurityError = (
  error: unknown,
  context: string
): string => {
  SecurityLogger.logSecurityEvent("SECURITY_ERROR", {
    context,
    error: error instanceof Error ? error.message : String(error),
  });

  // Return generic error messages to avoid information disclosure
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("auth") ||
      message.includes("login") ||
      message.includes("password")
    ) {
      return "Authentication failed. Please check your credentials.";
    }

    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection")
    ) {
      return "Network error occurred. Please try again.";
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return "Invalid input provided. Please check your information.";
    }

    if (message.includes("rate") || message.includes("limit")) {
      return "Too many requests. Please try again later.";
    }
  }

  return "An error occurred. Please try again.";
};
