
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Sparkles, Trophy, TrendingUp, PartyPopper } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RewardsDashboardWidgetProps {
  userType: 'customer' | 'vendor';
  currentCredits?: number;
  totalReferrals?: number;
  recentEarnings?: Array<{
    amount: number;
    source: string;
    date: string;
  }>;
}

const RewardsDashboardWidget: React.FC<RewardsDashboardWidgetProps> = ({
  userType,
  currentCredits = 0,
  totalReferrals = 0,
  recentEarnings = []
}) => {
  const navigate = useNavigate();

  const getNextMilestone = () => {
    const milestones = userType === 'customer' 
      ? [3, 7, 15, 25] 
      : [2, 5, 10, 20];
    
    return milestones.find(milestone => totalReferrals < milestone) || milestones[milestones.length - 1];
  };

  const nextMilestone = getNextMilestone();
  const progress = Math.min((totalReferrals / nextMilestone) * 100, 100);

  const getCurrentTier = () => {
    if (userType === 'customer') {
      if (totalReferrals >= 15) return { name: 'Platinum', color: 'text-purple-600', icon: Sparkles };
      if (totalReferrals >= 7) return { name: 'Gold', color: 'text-yellow-600', icon: Trophy };
      if (totalReferrals >= 3) return { name: 'Silver', color: 'text-gray-600', icon: TrendingUp };
      return { name: 'Bronze', color: 'text-amber-600', icon: Gift };
    } else {
      if (totalReferrals >= 10) return { name: 'Elite', color: 'text-purple-600', icon: Sparkles };
      if (totalReferrals >= 5) return { name: 'Pro', color: 'text-blue-600', icon: Trophy };
      if (totalReferrals >= 2) return { name: 'Growth', color: 'text-green-600', icon: TrendingUp };
      return { name: 'Starter', color: 'text-gray-600', icon: Gift };
    }
  };

  const currentTier = getCurrentTier();
  const TierIcon = currentTier.icon;

  return (
    <Card className="bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 border-purple-200 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Rewards
            </span>
          </div>
          <Badge variant="secondary" className="bg-white/80">
            <TierIcon className={`h-3 w-3 mr-1 ${currentTier.color}`} />
            {currentTier.name}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 flex items-center justify-center gap-1">
              {userType === 'customer' ? (
                <>
                  <span>${currentCredits}</span>
                  <Gift className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>{totalReferrals >= 10 ? '15%' : totalReferrals >= 5 ? '10%' : totalReferrals >= 2 ? '5%' : '0%'}</span>
                  <TrendingUp className="h-4 w-4" />
                </>
              )}
            </div>
            <div className="text-xs text-gray-600">
              {userType === 'customer' ? 'Credits' : 'Fee Reduction'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{totalReferrals}</div>
            <div className="text-xs text-gray-600">Referrals</div>
          </div>
        </div>

        {totalReferrals < nextMilestone && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Next milestone:</span>
              <span className="font-medium text-purple-600">{nextMilestone} referrals</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {nextMilestone - totalReferrals} more to unlock {userType === 'customer' ? 'bonus credits' : 'higher tier'}
            </div>
          </div>
        )}

        {recentEarnings.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-yellow-500" />
              Recent Rewards
            </div>
            {recentEarnings.slice(0, 2).map((earning, index) => (
              <div key={index} className="flex justify-between items-center text-xs bg-white/60 rounded p-2">
                <span className="text-gray-600">{earning.source}</span>
                <span className="font-medium text-green-600">
                  {userType === 'customer' ? `+$${earning.amount}` : `${earning.amount}% off`}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={() => navigate('/rewards')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          size="sm"
        >
          View Full Rewards
        </Button>
      </CardContent>
    </Card>
  );
};

export default RewardsDashboardWidget;
