import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { EnhancedAuthModal } from './EnhancedAuthModal';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';
import BookDLogo from './BookDLogo';
import { HowItWorksLink } from '@/components/marketing/HowItWorksLink';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const {
    isAuthenticated,
    isVendor,
    isPendingVendor,
    isAdmin,
    user,
    role,
    logout,
    isLoading: authLoading, // ← This is key
  } = useConsolidatedAuth();



  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardUrl = () => {
    if (isAdmin) return '/admin-dashboard';
    if (isPendingVendor) return '/vendor-onboarding';
    if (isVendor) return '/vendor-dashboard';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Dashboard';
    if (isPendingVendor) return 'Complete Onboarding';
    if (isVendor) return 'Vendor Dashboard';
    return 'Dashboard';
  };

  // Skeleton while auth is loading
  if (authLoading) {
    return (
      <nav className="bg-background/95 backdrop-blur-sm shadow-party border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="hover:scale-105 transition-transform duration-300">
              <BookDLogo size="md" />
            </div>

            {/* Desktop Skeleton */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Right Side Skeleton */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-10 w-28 bg-gray-200 rounded-full animate-pulse" />
            </div>

            {/* Mobile Skeleton */}
            <div className="md:hidden">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="bg-background/95 backdrop-blur-sm shadow-party border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="hover:scale-105 transition-transform duration-300">
              <BookDLogo size="md" />
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="font-body font-medium text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                Home
              </Link>
              <Link to="/browse" className="font-body font-medium text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                Browse Vendors
              </Link>
              <HowItWorksLink className="font-body font-medium text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                How It Works
              </HowItWorksLink>
              <Link to="/vendor-landing" className="font-body font-medium text-foreground hover:text-primary transition-all duration-300 hover:scale-105">
                For Vendors
              </Link>
            </div>

            {/* Right Side Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    Welcome, {user?.user_metadata?.name || user?.email?.split('@')[0]} 🎉
                  </span>

                  <Link to={getDashboardUrl()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-party hover:shadow-party-hover transition-all duration-300"
                    >
                      {getDashboardLabel()}
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="rounded-full border-2"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-party hover:shadow-party-hover transition-all duration-300 font-cta"
                  >
                    Log In
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-party hover:shadow-party-hover transition-all duration-300 font-cta px-6"
                  >
                    Sign Up
                  </Button>

                  <Link to="/become-vendor">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-party hover:shadow-party-hover transition-all duration-300 font-cta px-4"
                    >
                      Become a Vendor
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="rounded-full"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/98 backdrop-blur-sm shadow-party border-t border-border py-4 px-6">
            <div className="space-y-4">
              <Link to="/" className="block py-2 font-body font-medium text-foreground hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/browse" className="block py-2 font-body font-medium text-foreground hover:text-primary transition-colors">
                Browse Vendors
              </Link>
              <HowItWorksLink
                className="block py-2 font-body font-medium text-foreground hover:text-primary transition-colors"
                onNavigate={() => setIsMenuOpen(false)}
              >
                How It Works
              </HowItWorksLink>
              <Link to="/vendor-landing" className="block py-2 font-body font-medium text-foreground hover:text-primary transition-colors">
                For Vendors
              </Link>

              <div className="pt-4 space-y-3 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Welcome, {user?.user_metadata?.name || user?.email?.split('@')[0]} 🎉
                    </p>

                    <Link to={getDashboardUrl()} className="block">
                      <Button variant="outline" size="sm" className="w-full rounded-full">
                        {getDashboardLabel()}
                      </Button>
                    </Link>

                    <Button variant="outline" size="sm" className="w-full rounded-full" onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-2 border-primary text-primary font-cta"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Log In
                    </Button>

                    <Button
                      size="sm"
                      className="w-full rounded-full bg-primary font-cta"
                      onClick={() => setIsAuthModalOpen(true)}
                    >
                      Sign Up
                    </Button>

                    <Link to="/become-vendor" className="block">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full rounded-full bg-secondary font-cta"
                      >
                        Become a Vendor
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <EnhancedAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

export default Navigation;