
import React from 'react';
import MessagingSystem from '@/components/MessagingSystem';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Messages = () => {
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-muted-foreground">
            Stay connected with your vendors and customers through our secure messaging system.
          </p>
        </div>
        
        <MessagingSystem />
      </div>
    </ProtectedRoute>
  );
};

export default Messages;
