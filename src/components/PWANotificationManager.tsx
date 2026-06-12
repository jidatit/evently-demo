
import React, { useState, useEffect } from 'react';
import { PWANotification } from './PWANotification';

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  actionLabel?: string;
}

export const PWANotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'booking',
        title: 'Booking Confirmed!',
        message: 'Your appointment with Sarah\'s Photography is confirmed for tomorrow at 2:00 PM.',
        timestamp: new Date(),
        actionLabel: 'View Booking'
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Processed',
        message: 'Your payment of $150 for DJ Mike\'s services has been processed successfully.',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        actionLabel: 'View Receipt'
      }
    ];

    // Show notifications with delay for demo
    mockNotifications.forEach((notification, index) => {
      setTimeout(() => {
        setNotifications(prev => [...prev, notification]);
      }, (index + 1) * 2000);
    });
  }, []);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleAction = (id: string) => {
    console.log('Notification action clicked:', id);
    // Handle notification action (navigate to booking, receipt, etc.)
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {notifications.map((notification, index) => (
        <div 
          key={notification.id}
          style={{ top: `${1 + index * 6}rem` }}
          className="absolute right-0 pointer-events-auto"
        >
          <PWANotification
            {...notification}
            onDismiss={handleDismiss}
            onAction={handleAction}
          />
        </div>
      ))}
    </div>
  );
};
