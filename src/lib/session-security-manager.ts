
export interface DeviceFingerprint {
  screen: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  userAgent: string;
  hash: string;
}

export interface SessionMetrics {
  sessionDuration: number;
  inactivityDuration: number;
  lastActivity: number;
  createdAt: number;
  sessionHealth?: 'good' | 'warning' | 'critical';
}

export class SessionSecurityManager {
  private static sessions = new Map<string, SessionMetrics>();
  private static readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours

  static generateDeviceFingerprint(): DeviceFingerprint {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let canvasFingerprint = '';

      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint test', 2, 2);
        canvasFingerprint = canvas.toDataURL();
      }

      const fingerprint = {
        screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        userAgent: navigator.userAgent.substring(0, 100), // Limit length
        hash: ''
      };

      // Simple hash function for fingerprint
      fingerprint.hash = this.simpleHash(JSON.stringify(fingerprint) + canvasFingerprint);

      return fingerprint;
    } catch (error) {
      console.warn('Device fingerprinting failed:', error);
      return {
        screen: 'unknown',
        timezone: 'unknown',
        language: 'unknown',
        platform: 'unknown',
        cookieEnabled: false,
        userAgent: 'unknown',
        hash: 'unknown'
      };
    }
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  static initializeSession(userId: string = 'anonymous'): void {
    const now = Date.now();
    this.sessions.set(userId, {
      sessionDuration: 0,
      inactivityDuration: 0,
      lastActivity: now,
      createdAt: now,
      sessionHealth: 'good'
    });

    // Store device fingerprint
    try {
      const fingerprint = this.generateDeviceFingerprint();
      localStorage.setItem(`device_fingerprint_${userId}`, JSON.stringify(fingerprint));
    } catch (error) {
      console.warn('Failed to store device fingerprint:', error);
    }
  }

  static updateActivity(userId: string = 'anonymous'): void {
    const session = this.sessions.get(userId);
    if (session) {
      const now = Date.now();
      session.lastActivity = now;
      session.inactivityDuration = 0;
      session.sessionDuration = now - session.createdAt;
      
      // Update session health
      if (session.sessionDuration > this.SESSION_TIMEOUT) {
        session.sessionHealth = 'critical';
      } else if (now - session.lastActivity > this.INACTIVITY_TIMEOUT / 2) {
        session.sessionHealth = 'warning';
      } else {
        session.sessionHealth = 'good';
      }
    }
  }

  static checkSessionTimeout(userId: string = 'anonymous'): boolean {
    const session = this.sessions.get(userId);
    if (!session) return true; // No session = timeout

    const now = Date.now();
    const timeSinceLastActivity = now - session.lastActivity;
    const totalSessionTime = now - session.createdAt;

    return (
      timeSinceLastActivity > this.INACTIVITY_TIMEOUT ||
      totalSessionTime > this.SESSION_TIMEOUT
    );
  }

  static getSessionMetrics(userId: string = 'anonymous'): SessionMetrics | null {
    return this.sessions.get(userId) || null;
  }

  static endSession(userId: string = 'anonymous'): void {
    this.sessions.delete(userId);
    try {
      localStorage.removeItem(`device_fingerprint_${userId}`);
    } catch (error) {
      console.warn('Failed to remove device fingerprint:', error);
    }
  }

  static detectDeviceChange(userId: string = 'anonymous'): boolean {
    try {
      const storedFingerprint = localStorage.getItem(`device_fingerprint_${userId}`);
      if (!storedFingerprint) return false;

      const currentFingerprint = this.generateDeviceFingerprint();
      const stored = JSON.parse(storedFingerprint);

      // Allow some tolerance for minor changes
      const criticalFields = ['platform', 'screen', 'timezone'];
      
      return criticalFields.some(field => 
        stored[field] !== currentFingerprint[field]
      );
    } catch (error) {
      console.warn('Device change detection failed:', error);
      return false;
    }
  }

  static validateConcurrentSessions(userId: string = 'anonymous', maxSessions: number = 3): boolean {
    // This would typically be implemented with server-side session tracking
    // For now, we'll use a simplified client-side approach
    try {
      const sessions = JSON.parse(localStorage.getItem('active_sessions') || '[]');
      return sessions.length <= maxSessions;
    } catch (error) {
      return true; // Allow if we can't validate
    }
  }
}
