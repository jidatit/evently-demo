
// CSRF Protection utilities
export class CSRFProtection {
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';
  private static readonly TOKEN_KEY = 'csrf_token';

  // Generate a CSRF token
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Store CSRF token
  static setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  // Get stored CSRF token
  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Add CSRF token to request headers
  static addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers[this.TOKEN_HEADER] = token;
    }
    return headers;
  }

  // Validate CSRF token on server side
  static validateToken(request: Request): boolean {
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    const storedToken = this.getToken();
    
    if (!headerToken || !storedToken) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return this.constantTimeEqual(headerToken, storedToken);
  }

  // Constant-time string comparison
  private static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Initialize CSRF protection
  static initialize(): void {
    // Generate and store initial token
    const token = this.generateToken();
    this.setToken(token);
    
    // Refresh token periodically
    setInterval(() => {
      const newToken = this.generateToken();
      this.setToken(newToken);
    }, 30 * 60 * 1000); // Refresh every 30 minutes
  }

  // Clear token (on logout)
  static clearToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }
}
