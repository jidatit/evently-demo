
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

export const SecurityMonitoringAlert: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const { user } = useConsolidatedAuth();

  useEffect(() => {
    // Listen for security events
    const handleSecurityEvent = (event: CustomEvent) => {
      const { type, title, message, autoClose = true } = event.detail;
      
      const newAlert: SecurityAlert = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        timestamp: Date.now(),
        autoClose
      };

      setAlerts(prev => [...prev, newAlert]);

      // Auto-remove alerts after 10 seconds if autoClose is enabled
      if (autoClose) {
        setTimeout(() => {
          setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
        }, 10000);
      }
    };

    window.addEventListener('security-alert' as any, handleSecurityEvent);

    // Session timeout listener
    const handleSessionTimeout = () => {
      const alert: SecurityAlert = {
        id: `timeout-${Date.now()}`,
        type: 'error',
        title: 'Session Expired',
        message: 'Your session has expired due to inactivity. Please log in again.',
        timestamp: Date.now(),
        autoClose: false
      };
      setAlerts(prev => [...prev, alert]);
    };

    window.addEventListener('session-timeout', handleSessionTimeout);

    // Cleanup listeners
    return () => {
      window.removeEventListener('security-alert' as any, handleSecurityEvent);
      window.removeEventListener('session-timeout', handleSessionTimeout);
    };
  }, []);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map(alert => (
        <Alert
          key={alert.id}
          className={`border-l-4 ${
            alert.type === 'error' 
              ? 'border-l-red-500 bg-red-50' 
              : alert.type === 'warning'
              ? 'border-l-yellow-500 bg-yellow-50'
              : 'border-l-blue-500 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              {alert.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              ) : (
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle className="text-sm font-medium">
                  {alert.title}
                </AlertTitle>
                <AlertDescription className="text-sm mt-1">
                  {alert.message}
                </AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alert.id)}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
};

// Utility function to trigger security alerts
export const triggerSecurityAlert = (
  type: 'warning' | 'error' | 'info',
  title: string,
  message: string,
  autoClose: boolean = true
) => {
  window.dispatchEvent(new CustomEvent('security-alert', {
    detail: { type, title, message, autoClose }
  }));
};
