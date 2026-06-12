import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { SecurityLogger } from '@/lib/enhanced-security';
import { subscribeAuth } from '@/mocks/auth-events';
import {
  mockGetSession,
  mockQuickLogin,
  mockResetPasswordForEmail,
  mockResendSignup,
  mockSignInWithPassword,
  mockSignOut,
  mockSignUp,
} from '@/mocks/handlers/auth';
import type { UserRole } from '@/mocks/types';

interface SecurityMetrics {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutTime?: number;
  sessionValid: boolean;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  suspiciousActivity: number;
  sessionCount: number;
}

interface ConsolidatedAuthContextType {
  user: User | null;
  session: Session | null;
  role: 'pending_vendor' | 'vendor' | 'customer' | 'admin' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVendor: boolean;
  isPendingVendor: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (
    email: string,
    password: string,
    name?: string,
    type?: 'vendor' | 'customer'
  ) => Promise<{ error: any; data?: any; exists?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  quickLogin: (role: 'customer' | 'vendor' | 'admin') => Promise<void>;
  securityMetrics: SecurityMetrics;
}

const ConsolidatedAuthContext = createContext<ConsolidatedAuthContextType | undefined>(undefined);

export const useConsolidatedAuth = () => {
  const context = useContext(ConsolidatedAuthContext);
  if (context === undefined) {
    throw new Error('useConsolidatedAuth must be used within a ConsolidatedAuthProvider');
  }
  return context;
};

export const ConsolidatedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    isLocked: false,
    remainingAttempts: 5,
    sessionValid: true,
    threatLevel: 'low',
    suspiciousActivity: 0,
    sessionCount: 1,
  });
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { session: initialSession } = await mockGetSession();
      if (mounted) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsLoading(false);
      }
    };

    void initializeAuth();

    const unsubscribe = subscribeAuth((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      if (event === 'SIGNED_IN' && newSession?.user) {
        SecurityLogger.logSecurityEvent('USER_SIGNED_IN', {
          userId: newSession.user.id,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
        setSecurityMetrics((prev) => ({
          ...prev,
          isLocked: false,
          remainingAttempts: 5,
          threatLevel: 'low',
        }));
      } else if (event === 'SIGNED_OUT') {
        SecurityLogger.logSecurityEvent('USER_SIGNED_OUT', { timestamp: Date.now() });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await mockSignInWithPassword(email, password);

      if (error) {
        setSecurityMetrics((prev) => ({
          ...prev,
          remainingAttempts: Math.max(0, prev.remainingAttempts - 1),
          isLocked: prev.remainingAttempts <= 1,
          threatLevel: prev.remainingAttempts <= 1 ? 'high' : 'medium',
        }));

        SecurityLogger.logSecurityEvent('LOGIN_FAILED', {
          email: email.substring(0, 3) + '***',
          error: error.message,
        });

        toast({
          title: 'Login Failed',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Welcome back!',
          description: 'Successfully logged in.',
        });
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name?: string,
    type: 'vendor' | 'customer' = 'customer'
  ) => {
    setIsLoading(true);

    try {
      const { data, error, exists } = await mockSignUp(email, password, name, type);

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
        return { error };
      }

      if (exists) {
        await mockResendSignup(email);
        toast({
          title: 'Account Already Exists',
          description: 'We resent the verification email if needed. Check your inbox & spam folder.',
        });
        return { error: null, data, exists: true };
      }

      if (data.user && !data.session) {
        if (type === 'vendor') {
          toast({
            title: 'Account Created!',
            description: 'Please verify your email to continue onboarding. Check inbox & spam folder.',
          });
        } else {
          toast({
            title: 'Welcome!',
            description: 'Account created successfully. Please verify your email.',
          });
        }
        return { error: null, data, exists: false };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        toast({
          title: 'Welcome!',
          description: 'Account created and logged in successfully.',
        });
        return { error: null, data, exists: false };
      }

      throw new Error('Unexpected signup response');
    } catch (err: any) {
      console.error('Signup error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Something went wrong during signup.',
        variant: 'destructive',
      });
      return { error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await mockSignOut();
      toast({ title: 'Logged out', description: 'You have been successfully logged out.' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await mockResetPasswordForEmail(email);

    if (error) {
      toast({ title: 'Error', description: 'Failed to send reset email.', variant: 'destructive' });
    } else {
      toast({ title: 'Reset email sent', description: 'Check your email for instructions (demo mode).' });
    }

    return { error };
  };

  const quickLogin = async (role: 'customer' | 'vendor' | 'admin') => {
    setIsLoading(true);
    try {
      await mockQuickLogin(role as UserRole);
      toast({
        title: 'Demo login',
        description: `Signed in as ${role}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!session && !!user;
  const role = (user?.user_metadata?.role as 'pending_vendor' | 'vendor' | 'customer' | 'admin' | undefined) || null;

  const isPendingVendor = role === 'pending_vendor';
  const isVendor = role === 'vendor';
  const isCustomer = role === 'customer' || role === null;
  const isAdmin = role === 'admin';

  return (
    <ConsolidatedAuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        isAuthenticated,
        isVendor,
        isPendingVendor,
        isCustomer,
        isAdmin,
        login,
        signup,
        logout,
        resetPassword,
        quickLogin,
        securityMetrics,
      }}
    >
      {children}
    </ConsolidatedAuthContext.Provider>
  );
};
