
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useRole } from '@/hooks/useRole';

export const ResponsiveNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useEnhancedAuth();
  const { isAdmin, isVendor } = useRole();

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Browse Vendors', href: '/browse' },
    ...(user ? [
      ...(isVendor ? [{ name: 'Vendor Dashboard', href: '/vendor-dashboard' }] : []),
      ...(isAdmin ? [{ name: 'Admin Dashboard', href: '/admin' }] : []),
    ] : [
      { name: 'Vendor Login', href: '/vendor-login' }
    ])
  ];

  return (
    <nav className="bg-white shadow-lg relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-lime-500 rounded-lg flex items-center justify-center mr-3 transition-transform duration-300 hover:scale-110">
                <span className="text-black font-bold text-xl">B</span>
              </div>
              <span className="text-2xl font-bold text-black">Book'D</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-600 hover:text-lime-500 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
              >
                Logout
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button className="bg-lime-500 hover:bg-lime-600 text-black" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg border-t z-40">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-600 hover:text-lime-500 block px-3 py-2 text-base font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <div className="px-3 py-2 border-t">
                <Button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="px-3 py-2 border-t space-y-2">
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/auth?tab=signup" onClick={() => setIsOpen(false)}>
                  <Button className="bg-lime-500 hover:bg-lime-600 text-black w-full" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
