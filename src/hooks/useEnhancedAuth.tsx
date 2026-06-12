
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { SecurityLogger } from '@/lib/enhanced-security';

interface SecurityMetrics {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutTime?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  securityMetrics: SecurityMetrics;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useEnhancedAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    isLocked: false,
    remainingAttempts: 5
  });
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Log auth events
        if (event === 'SIGNED_IN' && session?.user) {
          SecurityLogger.logSecurityEvent('USER_SIGNED_IN', {
            userId: session.user.id,
            timestamp: Date.now()
          });
        } else if (event === 'SIGNED_OUT') {
          SecurityLogger.logSecurityEvent('USER_SIGNED_OUT', {
            timestamp: Date.now()
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Update security metrics on failed login
        setSecurityMetrics(prev => ({
          ...prev,
          remainingAttempts: Math.max(0, prev.remainingAttempts - 1),
          isLocked: prev.remainingAttempts <= 1
        }));

        SecurityLogger.logSecurityEvent('LOGIN_FAILED', {
          email: email.substring(0, 3) + '***',
          error: error.message
        });
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      } else {
        // Reset security metrics on successful login
        setSecurityMetrics({
          isLocked: false,
          remainingAttempts: 5
        });
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
      }
      
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) {
        toast({
          title: 'Signup Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account Created!',
          description: 'Please check your email to confirm your account.',
        });
      }

      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      SecurityLogger.logSecurityEvent('USER_LOGOUT_INITIATED', {
        userId: user?.id,
        timestamp: Date.now()
      });
      
      const { error } = await supabase.auth.signOut();
      if (!error) {
        toast({
          title: 'Logged out',
          description: 'You have been successfully logged out.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions.',
      });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      login,
      signup,
      logout,
      resetPassword,
      securityMetrics,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
