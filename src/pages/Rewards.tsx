
import React from 'react';
import { RewardsProgram } from '@/components/RewardsProgram';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Rewards = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
        <RewardsProgram />
      </div>
    </ProtectedRoute>
  );
};

export default Rewards;
