
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown, AlertTriangle, Clock } from 'lucide-react';
import { EnhancedPasswordValidator } from '@/components/EnhancedPasswordValidator';
import { CSRFProtectedForm, useCSRF } from '@/components/EnhancedCSRFProtection';
import { useEnhancedRateLimit } from '@/hooks/useEnhancedRateLimit';

const EnhancedAdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [setupAllowed, setSetupAllowed] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  const { toast } = useToast();
  const { csrfToken } = useCSRF();
  const { checkRateLimit } = useEnhancedRateLimit();

  useEffect(() => {
    checkSetupStatus();
    
    // Update countdown timer
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const checkSetupStatus = async () => {
    try {
      const { data: setupStatus, error } = await supabase
        .from('admin_setup_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error checking setup status:', error);
        return;
      }

      if (setupStatus?.is_setup_completed) {
        setSetupAllowed(false);
        toast({
          title: 'Setup Already Completed',
          description: 'Admin setup has already been completed for this system.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    }
  };

  const updateCountdown = () => {
    // This would normally fetch the actual expiry time from the database
    // For now, showing a placeholder countdown
    const now = new Date();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) {
      setTimeLeft('Expired');
      setSetupAllowed(false);
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    }
  };

  const handleSecureSubmit = async (formData: FormData, token: string) => {
    if (!setupAllowed) {
      toast({
        title: 'Setup Not Allowed',
        description: 'Admin setup is not currently available or has expired.',
        variant: 'destructive',
      });
      return;
    }

    if (!email || !password || !confirmPassword || !adminKey) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!isPasswordValid || passwordScore < 80) {
      toast({
        title: 'Weak Password',
        description: 'Please choose a stronger password that meets all security requirements.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(
        `admin_setup_${window.location.hostname}`,
        'admin_setup',
        3, // max 3 attempts
        60, // per hour
        true // strict mode
      );

      if (!rateLimitResult.allowed) {
        toast({
          title: 'Rate Limited',
          description: `Too many setup attempts. Please wait ${Math.ceil((new Date(rateLimitResult.reset_time || '').getTime() - Date.now()) / 60000)} minutes.`,
          variant: 'destructive',
        });
        return;
      }

      // First create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0]
          }
        }
      });

      if (signUpError) throw signUpError;

      // Then call the admin setup function
      const { data, error } = await supabase.functions.invoke('set-admin', {
        body: { 
          email, 
          adminKey,
          csrfToken: token,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      });

      if (error) throw error;

      toast({
        title: 'Admin Setup Complete!',
        description: 'Your admin account has been created successfully. Please check your email to verify your account.',
      });

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAdminKey('');
      setSetupAllowed(false);
      
    } catch (error: any) {
      console.error('Admin setup error:', error);
      toast({
        title: 'Setup Failed',
        description: error.message || 'Failed to set up admin account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!setupAllowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2 text-red-900">Setup Not Available</h1>
            <p className="text-red-700">
              Admin setup is either completed or has expired. Contact system administrator for assistance.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <CardTitle className="text-2xl font-bold">Enhanced Admin Setup</CardTitle>
          <p className="text-gray-600">Create your secure admin account</p>
          
          <div className="flex items-center justify-center gap-2 mt-4 p-2 bg-yellow-50 rounded-lg">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              Setup expires in: <strong>{timeLeft}</strong>
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <CSRFProtectedForm onSubmit={handleSecureSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Admin Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                  maxLength={255}
                />
              </div>

              <div>
                <Label htmlFor="password">Secure Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  required
                  disabled={loading}
                  maxLength={128}
                />
                <EnhancedPasswordValidator
                  password={password}
                  onValidationChange={(isValid, score) => {
                    setIsPasswordValid(isValid);
                    setPasswordScore(score);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                  maxLength={128}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                )}
              </div>

              <div>
                <Label htmlFor="adminKey">Admin Setup Key *</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Enter the admin setup key"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !csrfToken || !isPasswordValid || passwordScore < 80}
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </Button>
          </CSRFProtectedForm>

          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Security Notice:</strong> This setup page should be removed after creating your admin account. 
              Your password must meet all security requirements for maximum protection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAdminSetup;
