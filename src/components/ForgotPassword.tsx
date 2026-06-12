import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockResetPasswordForEmail } from '@/mocks/handlers/auth';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
    isOpen,
    onClose
}) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter your email address',
                variant: 'destructive'
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await mockResetPasswordForEmail(email.trim());

            if (error) throw error;

            toast({
                title: 'Reset Email Sent',
                description: 'Check your inbox (and spam folder) for a password reset link.',
            });

            setEmail('');
            onClose();
        } catch (error: any) {
            console.error('Password reset error:', error);
            toast({
                title: 'Failed to Send Reset Email',
                description: error.message || 'Something went wrong. Please try again later.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md z-[100]">
                <DialogHeader>
                    <div className="flex flex-col items-center text-center mb-2">
                        <Mail className="h-12 w-12 text-lime-600 mb-4" />
                        <DialogTitle className="text-2xl">Reset Password</DialogTitle>
                        <p className="text-gray-600 mt-2 text-sm">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="block text-sm font-medium">
                            Email address
                        </Label>
                        <Input
                            id="forgot-email"
                            type="email"
                            placeholder="your@business.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="w-full border-2 border-border"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-lime-500 hover:bg-lime-600 text-black"
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};