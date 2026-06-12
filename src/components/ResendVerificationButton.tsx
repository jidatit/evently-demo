import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { mockGetUser, mockResendSignup } from '@/mocks/handlers/auth';

interface ResendVerificationButtonProps {
  email?: string;
}

export const ResendVerificationButton: React.FC<ResendVerificationButtonProps> = ({ email }) => {
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      const { user } = await mockGetUser();
      const targetEmail = email?.trim() || user?.email;

      if (!targetEmail) {
        toast.error('Please enter your email address first');
        return;
      }

      const { error } = await mockResendSignup(targetEmail);
      if (error) throw error;

      toast.success('Verification email sent! (demo mode)');
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleResend}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Sending...' : 'Resend Verification Email'}
    </Button>
  );
};
