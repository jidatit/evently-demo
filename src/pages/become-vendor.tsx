import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { EnhancedSecurityValidator, SecurityLogger } from '@/lib/enhanced-security';
import { SecurityErrorHandler } from '@/lib/security-error-handler';
import { EnhancedCSRFProtection } from '@/lib/csrf-enhanced';
import { ResendVerificationButton } from '@/components/ResendVerificationButton';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { DemoQuickLogin } from '@/components/DemoQuickLogin';

const BecomeVendor: React.FC = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ isValid: boolean; message: string }>({
    isValid: false,
    message: '',
  });
  const [showPassword, setShowPassword] = useState(false);


  const navigate = useNavigate();
  const {
    signup,
    isAuthenticated,
    isPendingVendor,
    isVendor,
    user,
    isLoading: authLoading,
  } = useConsolidatedAuth();

  // Auto-redirect logic
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (isVendor) {
        navigate('/vendor-dashboard');
      } else if (isPendingVendor && user.email_confirmed_at) {
        navigate('/vendor-onboarding');
      }
      // If pending but not verified → stay here (user will see success message)
    }
  }, [isAuthenticated, isPendingVendor, isVendor, user, authLoading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const maxLength = name === 'email' ? 255 : name === 'password' ? 128 : 100;

    if (value.length <= maxLength) {
      setForm((prev) => ({ ...prev, [name]: value }));

      if (name === 'password') {
        const validation = EnhancedSecurityValidator.validateStrongPassword(value);
        setPasswordStrength(validation);
      }
    }
  };

  const validateForm = (): boolean => {
    if (!form.email || !EnhancedSecurityValidator.validateEmail(form.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!form.password || !passwordStrength.isValid) {
      toast.error(passwordStrength.message || 'Please create a strong password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Rate limiting
    if (!EnhancedSecurityValidator.checkRateLimit(form.email, 3, 15 * 60 * 1000)) {
      toast.error('Too many attempts. Please try again in 15 minutes.');
      return;
    }

    setLoading(true);
    EnhancedCSRFProtection.getToken(); // Just to ensure it's generated

    try {
      const { error, exists } = await signup(
        form.email.trim(),
        form.password,
        form.name || undefined,
        'vendor' // Fixed: this page is only for vendors
      );

      if (error) throw error;

      if (exists) {
        toast.success('Account already exists! Please check your email to verify or log in.');
        SecurityLogger.logSecurityEvent('VENDOR_SIGNUP_EXISTS', { email: form.email });
        return;
      }

      // Success: new account created
      SecurityLogger.logSecurityEvent('VENDOR_SIGNUP_SUCCESS', {
        email: form.email,
        hasCSRF: true,
      });

      toast.success('Account created! Please check your email to verify before continuing.');

      // Reset form
      setForm({ email: '', password: '', name: '' });
      setPasswordStrength({ isValid: false, message: '' });

      // Redirect will be handled by useEffect if email is already confirmed (rare)
    } catch (error: any) {
      const message = SecurityErrorHandler.handleAuthError(error);
      toast.error(message);

      SecurityLogger.logSecurityEvent('VENDOR_SIGNUP_ERROR', {
        email: form.email,
        error: 'signup_failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled = loading || authLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-lime-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Become a Vendor on Evently</h1>
        <p className="text-gray-600 text-center mb-6">Create your account to start offering services</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your Full Name (optional)"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            maxLength={100}
            disabled={isFormDisabled}
          />

          <input
            type="email"
            name="email"
            placeholder="Business Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            required
            maxLength={255}
            autoComplete="email"
            disabled={isFormDisabled}
          />

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 pr-10"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                disabled={isFormDisabled}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isFormDisabled}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {form.password && (
              <div className={`text-sm mt-1 ${passwordStrength.isValid ? 'text-green-600' : 'text-red-600'}`}>
                {passwordStrength.message}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-party hover:shadow-party-hover transition-all duration-300 font-cta px-6"
            disabled={isFormDisabled || !passwordStrength.isValid}
          >
            {loading ? 'Creating Account...' : 'Create Vendor Account'}
          </Button>
        </form>

        <DemoQuickLogin className="mt-4" />

        {/* <div className="my-4 text-center text-gray-500">or</div>

        <Button
          onClick={handleGoogleSignup}
          className="w-full bg-white border border-gray-300 text-black hover:bg-lime-500 hover:text-black font-bold flex items-center justify-center"
          disabled={isFormDisabled}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
            <g>
              <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.69 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.19C12.13 13.13 17.56 9.5 24 9.5z" />
              <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z" />
              <path fill="#FBBC05" d="M10.67 28.28c-1.01-2.99-1.01-6.19 0-9.18l-7.98-6.19C.99 17.82 0 20.81 0 24c0 3.19.99 6.18 2.69 8.91l7.98-6.19z" />
              <path fill="#EA4335" d="M24 48c6.18 0 11.64-2.05 15.52-5.59l-7.19-5.59c-2.01 1.35-4.58 2.15-8.33 2.15-6.44 0-11.87-3.63-13.33-8.59l-7.98 6.19C6.71 42.18 14.82 48 24 48z" />
              <path fill="none" d="M0 0h48v48H0z" />
            </g>
          </svg>
          {loading ? 'Signing up...' : 'Sign up with Google'}
        </Button> */}

        <div className="mt-6 space-y-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-3">Didn't receive verification email?</p>
            <ResendVerificationButton email={form.email} />
          </div>

          <p className="text-sm text-gray-600">
            Already have a vendor account?{' '}
            <a href="/vendor-login" className="text-lime-600 font-medium hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BecomeVendor;