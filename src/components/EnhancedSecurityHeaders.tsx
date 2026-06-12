
import { useEffect } from 'react';

// Enhanced security headers with stricter CSP - removed problematic X-Frame-Options
const ENHANCED_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
    frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim()
};

export const EnhancedSecurityHeaders = () => {
  useEffect(() => {
    const metaTags: HTMLMetaElement[] = [];

    // Set enhanced security headers via meta tags (excluding problematic ones)
    Object.entries(ENHANCED_SECURITY_HEADERS).forEach(([name, content]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = content;
      document.head.appendChild(meta);
      metaTags.push(meta);
    });

    // Enhanced security monitoring
    const handleSecurityViolation = (event: Event) => {
      console.warn('[SECURITY] Policy violation detected:', event);
      // In production, send to security monitoring service
    };

    // Listen for CSP violations
    document.addEventListener('securitypolicyviolation', handleSecurityViolation);
    
    // Enhanced right-click protection in production
    const handleContextMenu = (e: Event) => {
      if (process.env.NODE_ENV === 'production') {
        e.preventDefault();
        console.warn('[SECURITY] Right-click disabled in production');
      }
    };

    // Enhanced dev tools detection
    const detectDevTools = () => {
      if (process.env.NODE_ENV === 'production') {
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          console.warn('[SECURITY] Developer tools detected');
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    const devToolsInterval = setInterval(detectDevTools, 5000); // Less frequent checking

    return () => {
      // Cleanup
      metaTags.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
      document.removeEventListener('securitypolicyviolation', handleSecurityViolation);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null;
};
