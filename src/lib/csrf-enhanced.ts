
// Enhanced CSRF protection with SameSite cookies
export class EnhancedCSRFProtection {
  private static token: string | null = null;
  private static readonly TOKEN_HEADER = 'X-CSRF-Token';

  static initialize(): string {
    this.token = crypto.randomUUID();
    
    // Set CSRF token in a secure cookie with SameSite attribute
    document.cookie = `csrf_token=${this.token}; SameSite=Strict; Secure; Path=/`;
    
    // Also store in session storage as backup
    sessionStorage.setItem('csrf_token', this.token);
    
    return this.token;
  }

  static getToken(): string | null {
    if (!this.token) {
      // Try to get from session storage
      this.token = sessionStorage.getItem('csrf_token');
    }
    return this.token;
  }

  static validateToken(token: string): boolean {
    return this.token === token && token !== null;
  }

  static getHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { [this.TOKEN_HEADER]: token } : {};
  }

  static attachToForm(formElement: HTMLFormElement) {
    const token = this.getToken();
    if (!token) return;

    // Remove existing CSRF input if present
    const existingInput = formElement.querySelector('input[name="csrf_token"]');
    if (existingInput) {
      existingInput.remove();
    }

    // Add new CSRF token input
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = token;
    formElement.appendChild(csrfInput);
  }
}
