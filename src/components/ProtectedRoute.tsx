import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { Button } from '@/components/ui/button';
import { Lock, MailCheck } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { EnhancedAuthModal } from './EnhancedAuthModal';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * Allowed values:
   * - 'admin' → only admins
   * - 'vendor' → completed vendors (has vendors row) or admins
   * - 'pending_vendor' → users in onboarding (pending_vendor metadata, no vendor row yet)
   * - 'customer' → regular customers (not vendor/pending)
   * - undefined → any authenticated user
   */
  requiredRole?: 'admin' | 'vendor' | 'pending_vendor' | 'customer';
  redirectTo?: string;
  requireEmailVerified?: boolean; // Extra gate for sensitive vendor flows
}

export const ProtectedRoute = ({
  children,
  fallback,
  requiredRole,
  redirectTo,
  requireEmailVerified = false,
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    isVendor,
    isPendingVendor,
    isCustomer,
    isAdmin,
  } = useConsolidatedAuth();


  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'signin' | 'signup' }>({
    isOpen: false,
    mode: 'signin',
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isEmailVerified = !!user?.email_confirmed_at;

  // Store attempted path for post-login redirect
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search);
    }
  }, [isAuthenticated, authLoading, location.pathname, location.search]);

  // Redirect after successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath && redirectPath !== location.pathname) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath, { replace: true });
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    if (redirectTo) {
      navigate(redirectTo);
      return null;
    }

    return (
      <>
        {fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <Lock className="h-16 w-16 text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold mb-3">Authentication Required</h3>
            <p className="text-gray-600 mb-8 max-w-md">
              Please sign in or create an account to access this page.
            </p>
            <div className="space-x-4">
              <Button
                className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
                onClick={() => setAuthModal({ isOpen: true, mode: 'signin' })}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
              >
                Sign Up
              </Button>
            </div>
          </div>
        )}

        {/* <AuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          mode={authModal.mode}
        /> */}
        <EnhancedAuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          initialMode={authModal.mode}
        />
      </>
    );
  }

  // Email verification required but not verified
  if (requireEmailVerified && !isEmailVerified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <MailCheck className="h-16 w-16 text-yellow-500 mb-6" />
        <h3 className="text-2xl font-semibold mb-3">Verify Your Email</h3>
        <p className="text-gray-600 mb-8 max-w-md">
          Please check your email and click the verification link before accessing this page.
        </p>
        <Button
          onClick={() => {
            // Optional: add resend verification logic here
            alert('Check your inbox (and spam) for the verification email.');
          }}
        >
          Resend Verification Email
        </Button>
      </div>
    );
  }

  // Role-based access control
  if (requiredRole) {
    let hasAccess = false;

    switch (requiredRole) {
      case 'admin':
        hasAccess = isAdmin;
        break;
      case 'vendor':
        hasAccess = isVendor || isAdmin;
        break;
      case 'pending_vendor':
        hasAccess = isPendingVendor || isAdmin;
        break;
      case 'customer':
        hasAccess = isCustomer;
        break;
      default:
        hasAccess = false;
    }

    if (!hasAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <Lock className="h-16 w-16 text-red-500 mb-6" />
          <h3 className="text-2xl font-semibold mb-3">Access Denied</h3>
          <p className="text-gray-600 mb-8 max-w-md">
            You don't have the required permissions to view this page.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      );
    }
  }

  // All checks passed → render children
  return <>{children}</>;
};