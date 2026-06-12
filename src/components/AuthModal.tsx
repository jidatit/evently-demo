
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConsolidatedAuth } from "@/components/ConsolidatedAuthProvider";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, mode: initialMode }: AuthModalProps) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, signup } = useConsolidatedAuth();

  const validateForm = () => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Password validation
    if (mode === 'signup') {
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return false;
      }
    } else {
      if (!password || password.length < 6) {
        toast.error('Password is required');
        return false;
      }
    }

    // Name validation for signup
    if (mode === 'signup' && (!name.trim() || name.trim().length > 100)) {
      toast.error('Please enter a valid name (1-100 characters)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const result = await login(email.trim(), password);
        if (!result.error) {
          toast.success('Successfully signed in!');
          onClose();
          setEmail('');
          setPassword('');
          setName('');
        }
      } else {
        const result = await signup(email.trim(), password, name.trim());
        if (!result.error) {
          toast.success('Account created successfully! Please check your email to confirm your account.');
          onClose();
          setEmail('');
          setPassword('');
          setName('');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.message || 'Authentication failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="Enter your full name"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">
              Password
              {mode === 'signup' && ' (minimum 8 characters)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : 6}
              maxLength={128}
              placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
          {/* <div className="my-4 text-center text-gray-500">or</div>
          <Button 
            onClick={handleGoogleSignIn} 
            className="w-full bg-white border border-gray-300 text-black hover:bg-lime-500 hover:text-black font-bold flex items-center justify-center" 
            disabled={isLoading}
            type="button"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <g>
                <path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.69 30.18 0 24 0 14.82 0 6.71 5.82 2.69 14.09l7.98 6.19C12.13 13.13 17.56 9.5 24 9.5z"/>
                <path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.93 37.13 46.1 31.3 46.1 24.55z"/>
                <path fill="#FBBC05" d="M10.67 28.28c-1.01-2.99-1.01-6.19 0-9.18l-7.98-6.19C.99 17.82 0 20.81 0 24c0 3.19.99 6.18 2.69 8.91l7.98-6.19z"/>
                <path fill="#EA4335" d="M24 48c6.18 0 11.64-2.05 15.52-5.59l-7.19-5.59c-2.01 1.35-4.58 2.15-8.33 2.15-6.44 0-11.87-3.63-13.33-8.59l-7.98 6.19C6.71 42.18 14.82 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </g>
            </svg>
            {isLoading ? 'Signing In...' : 'Sign in with Google'}
          </Button> */}
          <div className="text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-lime-600 hover:text-lime-700 font-medium"
                >
                  Sign up
                </button>
                <br />
                <span className="text-xs text-gray-500 mt-1 block">
                  New to Book'D? Create an account to start booking vendors for your events.
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-lime-600 hover:text-lime-700 font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
