import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { cn } from '@/lib/utils';

type DemoQuickLoginProps = {
  className?: string;
  onComplete?: () => void;
};

const ROLES = [
  { id: 'customer' as const, label: 'Customer' },
  { id: 'vendor' as const, label: 'Vendor' },
  { id: 'admin' as const, label: 'Admin' },
];

export const DemoQuickLogin: React.FC<DemoQuickLoginProps> = ({
  className = '',
  onComplete,
}) => {
  const { quickLogin, isLoading } = useConsolidatedAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (role: 'customer' | 'vendor' | 'admin') => {
    await quickLogin(role);
    onComplete?.();
    if (role === 'customer') navigate('/dashboard');
    else if (role === 'vendor') navigate('/vendor-dashboard');
    else navigate('/admin-dashboard');
  };

  return (
    <div
      className={cn(
        'rounded-md border border-dashed border-muted-foreground/25 bg-muted/40 px-2.5 py-2',
        className,
      )}
    >
      <p className="text-[10px] font-medium text-center text-muted-foreground mb-1.5">
        Quick Login As
      </p>
      <div className="grid grid-cols-3 gap-1.5">
        {ROLES.map(({ id, label }) => (
          <Button
            key={id}
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 px-1 text-[11px] font-medium"
            disabled={isLoading}
            onClick={() => void handleQuickLogin(id)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
