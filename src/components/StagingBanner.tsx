import React from 'react';
import { AlertTriangle, TestTube } from 'lucide-react';
import { isStaging, isDevelopment } from '@/lib/environment';

const StagingBanner: React.FC = () => {
  if (!isStaging() && !isDevelopment()) {
    return null;
  }

  const environment = isStaging() ? 'STAGING' : 'DEVELOPMENT';
  const bgColor = isStaging() ? 'bg-yellow-500' : 'bg-blue-500';
  
  return (
    <div className={`${bgColor} text-white py-2 px-4 text-center font-bold text-sm relative z-[9999] shadow-md`}>
      <div className="flex items-center justify-center space-x-2 max-w-6xl mx-auto">
        {isStaging() ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <TestTube className="w-4 h-4" />
        )}
        <span>
          🚧 {environment} – TESTING ENVIRONMENT – No real payments will be processed 🚧
        </span>
        {isStaging() ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <TestTube className="w-4 h-4" />
        )}
      </div>
      
      {/* Additional info for staging */}
      {isStaging() && (
        <div className="text-xs mt-1 opacity-90">
          Test Stripe keys active • Emails routed to test inbox • Dummy data in use
        </div>
      )}
    </div>
  );
};

export default StagingBanner;