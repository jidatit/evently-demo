
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export const SessionTimeoutWarning = ({ isOpen, onExtend, onLogout }: SessionTimeoutWarningProps) => {
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (isOpen) {
      setCountdown(300); // Reset to 5 minutes
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onLogout(); // Auto-logout when countdown reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onLogout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtendSession = () => {
    onExtend();
    setCountdown(300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Session Timeout Warning
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Your session will expire in:
            </p>
            <div className="text-2xl font-bold text-orange-500">
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              You will be automatically logged out for security purposes.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExtendSession}
              className="flex-1 bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            >
              Stay Logged In
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
