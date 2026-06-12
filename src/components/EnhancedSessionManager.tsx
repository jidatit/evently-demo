
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SessionSecurityManager } from '@/lib/session-security-manager';
import { supabase } from '@/integrations/supabase/client';

interface SessionManagerContextType {
  sessionMetrics: any;
  isSessionValid: boolean;
}

const SessionManagerContext = createContext<SessionManagerContextType | undefined>(undefined);

export const useSessionManager = () => {
  const context = useContext(SessionManagerContext);
  if (context === undefined) {
    throw new Error('useSessionManager must be used within a SessionManagerProvider');
  }
  return context;
};

export const EnhancedSessionManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [sessionMetrics, setSessionMetrics] = useState(null);
  const [isSessionValid, setIsSessionValid] = useState(true);

  useEffect(() => {
    if (user && session) {
      // Initialize session monitoring
      SessionSecurityManager.initializeSession(user.id);

      // Set up periodic session validation
      const intervalId = setInterval(() => {
        const metrics = SessionSecurityManager.getSessionMetrics(user.id);
        setSessionMetrics(metrics);

        const isValid = !SessionSecurityManager.checkSessionTimeout(user.id);
        setIsSessionValid(isValid);

        if (!isValid) {
          console.log('Session timeout detected, signing out');
          supabase.auth.signOut();
        }

        // Check for device changes
        if (SessionSecurityManager.detectDeviceChange(user.id)) {
          console.warn('Device change detected');
          // Could trigger additional security measures here
        }
      }, 60000); // Check every minute

      return () => {
        clearInterval(intervalId);
        SessionSecurityManager.endSession(user.id);
      };
    }
  }, [user, session]);

  return (
    <SessionManagerContext.Provider value={{ sessionMetrics, isSessionValid }}>
      {children}
    </SessionManagerContext.Provider>
  );
};
