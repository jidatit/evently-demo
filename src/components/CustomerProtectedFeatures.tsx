import React from 'react';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

interface CustomerProtectedFeaturesProps {
  children: React.ReactNode;
  featureName?: string;
  redirectMessage?: string;
}

export const CustomerProtectedFeatures: React.FC<CustomerProtectedFeaturesProps> = ({
  children,
  featureName = 'this feature',
  redirectMessage = 'Please log in to access this feature.'
}) => {
  const { user, isLoading } = useConsolidatedAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
        <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">{redirectMessage}</p>
        <div className="space-x-4">
          <Button 
            onClick={() => {
              sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
              window.location.href = '/auth?tab=login';
            }}
            className="bg-lime-500 hover:bg-lime-600 text-black"
          >
            Log In
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              sessionStorage.setItem('redirectAfterLogin', window.location.pathname); 
              window.location.href = '/auth?tab=signup';
            }}
          >
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};