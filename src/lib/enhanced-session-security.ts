
// Enhanced session security with device fingerprinting and concurrent session limits
export class EnhancedSessionSecurity {
  private static readonly MAX_CONCURRENT_SESSIONS = 3;
  private static readonly SESSION_FIXATION_KEY = 'session_token';

  static generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    };
    
    return btoa(JSON.stringify(fingerprint)).substring(0, 32);
  }

  static preventSessionFixation() {
    const currentToken = localStorage.getItem(this.SESSION_FIXATION_KEY);
    const newToken = crypto.randomUUID();
    
    if (!currentToken || currentToken !== sessionStorage.getItem(this.SESSION_FIXATION_KEY)) {
      localStorage.setItem(this.SESSION_FIXATION_KEY, newToken);
      sessionStorage.setItem(this.SESSION_FIXATION_KEY, newToken);
    }
  }

  static checkConcurrentSessions(userId: string): boolean {
    const storageKey = `active_sessions_${userId}`;
    const sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const currentSession = {
      id: crypto.randomUUID(),
      fingerprint: this.generateDeviceFingerprint(),
      timestamp: Date.now()
    };

    // Clean old sessions (older than 24 hours)
    const validSessions = sessions.filter((session: any) => 
      Date.now() - session.timestamp < 24 * 60 * 60 * 1000
    );

    // Check if we exceed max sessions
    if (validSessions.length >= this.MAX_CONCURRENT_SESSIONS) {
      return false;
    }

    // Add current session
    validSessions.push(currentSession);
    localStorage.setItem(storageKey, JSON.stringify(validSessions));
    
    return true;
  }

  static invalidateAllSessions(userId: string) {
    const storageKey = `active_sessions_${userId}`;
    localStorage.removeItem(storageKey);
    sessionStorage.clear();
  }
}
