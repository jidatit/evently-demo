import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { mockVerifyEmailToken } from '@/mocks/handlers/auth';

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const token = searchParams.get('token');
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    const verifyEmailToken = async () => {
      if (!token) {
        setVerificationResult({
          success: false,
          message: 'No verification token provided',
        });
        setIsVerifying(false);
        return;
      }

      try {
        const data = await mockVerifyEmailToken(token);

        if (data.success) {
          setVerificationResult({
            success: true,
            message: data.message || 'Email verified successfully!',
          });

          toast.success('Email verified successfully! You can now access your dashboard.');

          setTimeout(() => {
            if (redirectTo === 'vendor-dashboard') {
              navigate('/vendor-dashboard');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          setVerificationResult({
            success: false,
            message: data.error || 'Invalid or expired verification token',
          });
        }
      } catch (error) {
        console.error('Verification exception:', error);
        setVerificationResult({
          success: false,
          message: 'An unexpected error occurred during verification',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmailToken();
  }, [token, redirectTo, navigate]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-coral-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <LoadingSpinner />
            <h2 className="text-xl font-semibold mt-4 mb-2">Verifying Your Email</h2>
            <p className="text-muted-foreground text-center">
              Please wait while we verify your email address...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-coral-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verificationResult?.success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verificationResult?.success ? 'Email Verified!' : 'Verification Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{verificationResult?.message}</p>

          {verificationResult?.success ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600">Redirecting you to your dashboard...</p>
              <Button
                onClick={() =>
                  navigate(redirectTo === 'vendor-dashboard' ? '/vendor-dashboard' : '/dashboard')
                }
                className="w-full"
              >
                Continue to Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button onClick={() => navigate('/')} className="w-full">
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
