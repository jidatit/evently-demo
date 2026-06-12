// Environment configuration for Book'D
export type Environment = 'development' | 'staging' | 'production';

export const getEnvironment = (): Environment => {
  // Check for explicit staging flag first
  if (typeof window !== 'undefined' && window.location.hostname.includes('staging')) {
    return 'staging';
  }

  // Check for development
  if (import.meta.env.DEV) {
    return 'development';
  }

  // Default to production
  return 'production';
};

export const isStaging = (): boolean => {
  return getEnvironment() === 'staging';
};

export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

export const getApiConfig = () => {
  const env = getEnvironment();

  return {
    environment: env,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://wtlwtjwlvvtrxprlwnqv.supabase.co',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VrKc7an1pQm8GBk25a3_3A_z2TiKdau',
    // Stripe keys will be different for staging vs production
    useTestStripe: env !== 'production',
    // Email routing config
    testEmailRecipient: 'staging-test@bookd-testing.com',
    // Logging configuration
    enableDetailedLogging: env !== 'production',
    logLevel: env === 'production' ? 'error' : 'debug',
  };
};