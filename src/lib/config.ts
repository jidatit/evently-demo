
// Configuration management for secure API keys
export const config = {
  stripe: {
    // SECURITY: Secret keys should NEVER be in frontend code
    // All Stripe operations with secret keys must be done in Edge Functions
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  },
  api: {
    baseUrl: import.meta.env.PROD ? 'https://your-domain.com' : 'http://localhost:3000',
  }
};

// Validation helper
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.stripe.publishableKey) {
    errors.push('VITE_STRIPE_PUBLISHABLE_KEY is required');
  }
  
  if (errors.length > 0) {
    console.warn('Configuration warnings:', errors);
  }
  
  return errors.length === 0;
};
