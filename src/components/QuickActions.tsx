import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Users, DollarSign, Package, Settings } from 'lucide-react';

interface QuickActionsProps {
  onTabChange?: (tab: string) => void;
}

export default function QuickActions({ onTabChange }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleAction = (route: string, tab?: string) => {
    if (route.startsWith('/')) {
      navigate(route);
    } else if (tab && onTabChange) {
      onTabChange(tab);
    }
  };

  const actions = [
    {
      label: 'UPDATE SERVICES',
      icon: Package,
      route: '/vendor/services',
      className: 'gradient-party text-white font-cta font-semibold py-3 px-4 rounded-full shadow-party hover:shadow-party-hover transition-all duration-300 transform hover:-translate-y-1 sparkle-hover relative'
    },
    {
      label: 'View Profile',
      icon: Users,
      route: '/vendor/profile',
      className: 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md'
    },
    {
      label: 'Payment Settings',
      icon: DollarSign,
      route: '/vendor/payments',
      className: 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 hover:shadow-md'
    }
  ];

  return (
    <div className="p-6 rounded-2xl shadow-party bg-card border border-border">
      <h2 className="text-xl font-heading font-bold mb-4 text-foreground">Quick Actions</h2>
      <div className="flex flex-col space-y-3">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => handleAction(action.route)}
              className={action.className}
            >
              {action.label === 'UPDATE SERVICES' ? (
                action.label
              ) : (
                <>
                  <IconComponent className="w-4 h-4" />
                  {action.label}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}