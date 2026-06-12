import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';



export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checking, setChecking] = useState(true);
    const [success, setSuccess] = useState(false);
    const [touched, setTouched] = useState({ password: false, confirm: false });
    const { toast } = useToast();

    const navigate = useNavigate();


    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error || !session) {
                    toast({
                        title: 'Invalid Session',
                        description: 'Invalid session for password reset. Please try again.',
                        variant: 'destructive',
                    });
                    navigate('/');
                    return;
                }

                setIsValidSession(true);
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setChecking(false);
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsValidSession(true);
                setChecking(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const passwordValidations = {
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /\d/.test(newPassword),
    };

    const isPasswordValid = Object.values(passwordValidations).every(v => v);
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

    const handleResetPassword = async (e) => {
        e.preventDefault();

        setTouched({ password: true, confirm: true });

        if (!newPassword.trim() || !confirmPassword.trim()) {
            return;
        }

        if (!isPasswordValid) {
            return;
        }

        if (newPassword !== confirmPassword) {
            return;
        }

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) throw error;

            setSuccess(true);
            toast({
                title: 'Password Updated',
                description: 'Your password has been reset successfully.',
            });
            // In real app: redirect after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error('Password update error:', error);
            toast({
                title: 'Reset Failed',
                description: error.message || 'Failed to reset password.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return (
            <div className="min-h-screen bg-lime-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-500 rounded-xl mb-4 animate-pulse">
                        <span className="text-2xl font-bold text-black">B</span>
                    </div>
                    <p className="text-gray-600 font-medium">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (!isValidSession) {
        return null;
    }

    if (success) {
        return (
            <div className="min-h-screen bg-lime-50 flex items-center justify-center py-12 px-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-500 rounded-xl mb-6">
                        <CheckCircle2 className="w-10 h-10 text-black" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Password Reset Successful!</h1>
                    <p className="text-gray-600 mb-6">
                        Your password has been updated successfully. Redirecting you to the dashboard...
                    </p>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-lime-50 flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-lime-500 rounded-xl mb-4">
                        <span className="text-2xl font-bold text-black">B</span>
                    </div>
                    <h1 className="text-4xl font-bold text-lime-600 mb-2">Book'D</h1>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Lock className="h-6 w-6 text-gray-700" />
                        <h2 className="text-2xl font-semibold text-gray-900">Reset Password</h2>
                    </div>
                    <p className="text-gray-600">Create a new secure password for your account</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6">
                    {/* New Password Field */}
                    <div>
                        <label htmlFor="newPassword" className="text-sm font-medium text-gray-900 mb-2 block">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                placeholder="Enter new password"
                                disabled={loading}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 mb-2 block">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, confirm: true }))}
                                placeholder="Confirm new password"
                                disabled={loading}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                disabled={loading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5 text-gray-400" />
                                ) : (
                                    <Eye className="h-5 w-5 text-gray-400" />
                                )}
                            </button>
                        </div>
                        {touched.confirm && confirmPassword && !passwordsMatch && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                Passwords do not match
                            </p>
                        )}
                        {touched.confirm && passwordsMatch && (
                            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Passwords match
                            </p>
                        )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <p className="text-sm font-medium text-gray-900">Password must contain:</p>
                        <div className="space-y-2">
                            <ValidationItem
                                isValid={passwordValidations.length}
                                text="At least 8 characters"
                                touched={touched.password && newPassword.length > 0}
                            />
                            <ValidationItem
                                isValid={passwordValidations.uppercase}
                                text="One uppercase letter (A-Z)"
                                touched={touched.password && newPassword.length > 0}
                            />
                            <ValidationItem
                                isValid={passwordValidations.lowercase}
                                text="One lowercase letter (a-z)"
                                touched={touched.password && newPassword.length > 0}
                            />
                            <ValidationItem
                                isValid={passwordValidations.number}
                                text="One number (0-9)"
                                touched={touched.password && newPassword.length > 0}
                            />
                        </div>
                    </div>

                    <div className='flex justify-center'>
                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading || !isPasswordValid || !passwordsMatch}
                        >
                            {loading ? 'Resetting Password...' : 'Reset Password'}
                        </Button>
                    </div>

                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>
                        Remember your password?{' '}
                        <a href="/login" className="text-lime-600 font-medium hover:underline">
                            Back to login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

function ValidationItem({ isValid, text, touched }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {!touched ? (
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            ) : isValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
                <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span className={
                !touched ? 'text-gray-600' :
                    isValid ? 'text-green-700' : 'text-red-700'
            }>
                {text}
            </span>
        </div>
    );
}