
import { useEffect } from 'react';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com;
    frame-src https://js.stripe.com https://hooks.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim()
};

export const SecurityHeaders = () => {
  useEffect(() => {
    const metaTags: HTMLMetaElement[] = [];

    // Set security headers via meta tags
    Object.entries(SECURITY_HEADERS).forEach(([name, content]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = content;
      document.head.appendChild(meta);
      metaTags.push(meta);
    });

    // Set up rate limiting cleanup
    const cleanupInterval = setInterval(() => {
      import('@/lib/security').then(({ SecurityValidator }) => {
        SecurityValidator.cleanupRateLimit();
      });
    }, 5 * 60 * 1000); // Every 5 minutes

    // Security event monitoring
    const handleSecurityEvent = (event: Event) => {
      if (event.type === 'error') {
        console.warn('Security: Potential XSS attempt detected', event);
      }
    };

    // Monitor for potential security issues
    window.addEventListener('error', handleSecurityEvent);
    
    // Disable right-click in production (optional security measure)
    const handleContextMenu = (e: Event) => {
      if (process.env.NODE_ENV === 'production') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      // Cleanup
      metaTags.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
      clearInterval(cleanupInterval);
      window.removeEventListener('error', handleSecurityEvent);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null; // This component doesn't render anything
};
