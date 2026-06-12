
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageSquare, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems: NavItem[] = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Search', href: '/browse' },
    // Messages hidden from clients — threads remain available internally for the quote flow
    // { icon: MessageSquare, label: 'Messages', href: '/messages', badge: 2 },
    { icon: User, label: 'Profile', href: '/dashboard' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind sticky nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const IconComponent = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`
                  flex flex-col items-center justify-center p-2 min-w-0 flex-1 relative
                  transition-colors duration-200 rounded-lg mx-1
                  ${active 
                    ? 'text-lime-600 bg-lime-50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                <div className="relative">
                  <IconComponent 
                    className={`h-5 w-5 ${active ? 'text-lime-600' : 'text-gray-600'}`} 
                  />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs bg-red-500 hover:bg-red-500 flex items-center justify-center"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className={`text-xs mt-1 font-medium truncate w-full text-center
                    ${active ? 'text-lime-600' : 'text-gray-600'}
                  `}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
};
