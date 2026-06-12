import React, { useState, useEffect } from 'react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, X } from 'lucide-react';
import { ForgotPasswordModal } from '@/components/ForgotPassword';
import { DemoQuickLogin } from '@/components/DemoQuickLogin';

const VendorLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);

  const {
    login,
    logout,
    isAuthenticated,
    isVendor,
    isPendingVendor,
    user,
    isLoading: authLoading,
  } = useConsolidatedAuth();

  const { toast } = useToast();
  const navigate = useNavigate();

  // Smart redirect after login
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (isVendor) {
        toast({ title: 'Welcome back!', description: 'Redirecting to your dashboard...' });
        navigate('/vendor-dashboard');
      } else if (isPendingVendor) {
        if (user.email_confirmed_at) {
          toast({ title: 'Welcome back!', description: 'Continuing your onboarding...' });
          navigate('/vendor-onboarding');
        } else {
          toast({
            title: 'Email Not Verified',
            description: 'Please check your email and verify before continuing.',
            variant: 'destructive',
          });
          logout(); // Prevent access until verified
        }
      } else {
        // User is not a vendor at all — block access
        toast({
          title: 'Access Denied',
          description: 'This login is for vendors only. Please use the customer login or sign up as a vendor.',
          variant: 'destructive',
        });
        logout();
        navigate('/become-vendor');
      }
    }
  }, [
    isAuthenticated,
    isVendor,
    isPendingVendor,
    user,
    authLoading,
    navigate,
    toast,
    logout,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Missing Fields', description: 'Please enter email and password.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await login(email.trim(), password);

      if (error) throw error;

      // Success toast will be shown in useEffect redirect
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: 'Coming Soon',
      description: 'Google login for vendors will be available soon.',
    });
  };


  const isFormDisabled = isLoading || authLoading;

  return (
    <div className="min-h-screen bg-lime-50 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl mb-4">
            <span className="text-2xl font-bold text-white">E</span>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Evently</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Vendor Log In</h2>
          <p className="text-gray-600">Access your vendor dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-900 mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@business.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isFormDisabled}
              className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-900 mb-2 block">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isFormDisabled}
                className="w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent pr-10"
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
          </div>

          <Button
            type="submit"
            disabled={isFormDisabled}
            className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-party hover:shadow-party-hover transition-all duration-300 font-cta px-6"
          >
            {isLoading ? 'Logging in...' : 'Log In to Vendor Dashboard'}
          </Button>
        </form>

        <DemoQuickLogin className="mt-4" />

        {/* <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={isFormDisabled}
            className="w-full mt-4 border-gray-300 hover:bg-gray-50 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Log in with Google (Coming Soon)
          </Button>
        </div> */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-sm text-lime-600 hover:underline"
            disabled={isFormDisabled}
          >
            Forgot your password?
          </button>
        </div>
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Don't have a vendor account yet?{' '}
            <a href="/become-vendor" className="text-lime-600 font-medium hover:underline">
              Sign up here
            </a>
          </p>
        </div>
      </div>
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

    </div>
  );
};

export default VendorLogin;