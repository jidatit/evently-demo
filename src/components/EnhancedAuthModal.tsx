import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { EnhancedSecurityValidator } from '@/lib/enhanced-security';
import { ForgotPasswordModal } from '@/components/ForgotPassword';
import { DemoQuickLogin } from '@/components/DemoQuickLogin';

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin'
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, signup, securityMetrics } = useConsolidatedAuth();

  const validatePasswordStrength = (password: string) => {
    const validation = EnhancedSecurityValidator.validateStrongPassword(password);
    setPasswordErrors(validation.isValid ? [] : [validation.message]);

    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    setPasswordStrength(Math.min(strength, 100));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === 'signup') {
      validatePasswordStrength(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emailValidation = EnhancedSecurityValidator.validateUserInput(email, 'Email', 255);
      if (!emailValidation.isValid) {
        setError(emailValidation.message);
        return;
      }

      if (!EnhancedSecurityValidator.validateEmail(email)) {
        setError('Please provide a valid email address');
        return;
      }

      if (mode === 'signup') {
        const nameValidation = EnhancedSecurityValidator.validateUserInput(name, 'Name', 100);
        if (!nameValidation.isValid) {
          setError(nameValidation.message);
          return;
        }

        if (passwordErrors.length > 0) {
          setError('Please fix password requirements before continuing');
          return;
        }

        await signup(email, password, name, 'customer');
      } else {
        await login(email, password);
      }

      onClose();
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 40) return 'bg-red-500';
    if (strength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 40) return 'Weak';
    if (strength < 70) return 'Medium';
    return 'Strong';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {mode === 'signin' ? 'Secure Sign In' : 'Create Account'}
            </DialogTitle>
          </DialogHeader>

          {securityMetrics.isLocked && (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                Account is temporarily locked due to multiple failed attempts.
              </AlertDescription>
            </Alert>
          )}

          {securityMetrics.remainingAttempts < 3 && !securityMetrics.isLocked && (
            <Alert className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-700">
                Warning: {securityMetrics.remainingAttempts} login attempts remaining before account lockout.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                  maxLength={100}
                  className='border border-border'
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading || securityMetrics.isLocked}
                maxLength={255}
                className='border border-border'
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a strong password'}
                  required
                  disabled={loading || securityMetrics.isLocked}
                  maxLength={128}
                  className='border border-border'
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {mode === 'signup' && password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Password Strength:</span>
                    <span className={`font-medium ${passwordStrength < 40 ? 'text-red-600' :
                      passwordStrength < 70 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  {passwordErrors.length > 0 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700 text-sm">
                        {passwordErrors[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            {error && (
              <Alert className="border-red-500 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || securityMetrics.isLocked || (mode === 'signup' && passwordErrors.length > 0)}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In Securely' : 'Create Account'}
            </Button>


            <div className="text-center space-y-3">
              {/* Forgot password */}
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-primary hover:underline disabled:opacity-50"
                disabled={loading}
              >
                Forgot your password?
              </button>

              {/* Sign up / Sign in switch */}
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? "Don’t have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  disabled={loading}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>


            <div className="text-xs text-gray-500 text-center mt-4 p-2 bg-gray-50 rounded">
              <Shield className="h-3 w-3 inline-block mr-1" />
              Your connection is secured with enterprise-grade encryption
            </div>
          </form>

          <DemoQuickLogin className="mt-3" onComplete={onClose} />
        </DialogContent>
      </Dialog>

      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </>
  );
};