
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check, Calendar, CreditCard, Bell } from 'lucide-react';

interface NotificationProps {
  id: string;
  type: 'booking' | 'payment' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  onDismiss: (id: string) => void;
  onAction?: (id: string) => void;
  actionLabel?: string;
}

export const PWANotification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  timestamp,
  onDismiss,
  onAction,
  actionLabel = 'View'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => onDismiss(id), 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(id);
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (type) {
      case 'booking':
        return <Calendar className="h-5 w-5 text-lime-600" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'reminder':
        return <Bell className="h-5 w-5 text-orange-600" />;
    }
  };

  const getBadgeColor = () => {
    switch (type) {
      case 'booking':
        return 'bg-lime-100 text-lime-800 hover:bg-lime-100';
      case 'payment':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'reminder':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
    }
  };

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] 
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
    >
      <Card className="shadow-lg border-l-4 border-l-lime-500 bg-white">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                    {title}
                  </h4>
                  <Badge className={getBadgeColor()}>
                    {type}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={handleDismiss}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                
                {onAction && (
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-xs bg-lime-500 hover:bg-lime-600"
                    onClick={handleAction}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
