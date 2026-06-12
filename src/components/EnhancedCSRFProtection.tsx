
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CSRFContextType {
  csrfToken: string | null;
  generateToken: () => string;
  validateToken: (token: string) => boolean;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

export const useCSRF = () => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRF must be used within CSRFProvider');
  }
  return context;
};

interface CSRFProviderProps {
  children: ReactNode;
}

export const CSRFProvider: React.FC<CSRFProviderProps> = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const generateToken = (): string => {
    const token = crypto.randomUUID();
    setCsrfToken(token);
    sessionStorage.setItem('csrf_token', token);
    return token;
  };

  const validateToken = (token: string): boolean => {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token && token === csrfToken;
  };

  useEffect(() => {
    // Generate initial token
    const existingToken = sessionStorage.getItem('csrf_token');
    if (existingToken) {
      setCsrfToken(existingToken);
    } else {
      generateToken();
    }
  }, []);

  return (
    <CSRFContext.Provider value={{ csrfToken, generateToken, validateToken }}>
      {children}
    </CSRFContext.Provider>
  );
};

// Enhanced CSRF-protected form component
interface CSRFFormProps {
  onSubmit: (data: FormData, csrfToken: string) => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const CSRFProtectedForm: React.FC<CSRFFormProps> = ({ onSubmit, children, className }) => {
  const { csrfToken, generateToken, validateToken } = useCSRF();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!csrfToken) {
      throw new Error('CSRF token not available');
    }

    const formData = new FormData(e.currentTarget);
    const submittedToken = formData.get('csrf_token') as string;
    
    if (!validateToken(submittedToken)) {
      throw new Error('Invalid CSRF token');
    }

    await onSubmit(formData, csrfToken);
    
    // Generate new token after successful submission
    generateToken();
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input type="hidden" name="csrf_token" value={csrfToken || ''} />
      {children}
    </form>
  );
};
