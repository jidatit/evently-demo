
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { 
  Gift, 
  Users, 
  DollarSign, 
  Share2, 
  Copy, 
  Star,
  Trophy,
  Sparkles,
  TrendingUp,
  Download,
  PartyPopper
} from 'lucide-react';

interface ReferralData {
  total_referrals: number;
  active_referrals: number;
  total_credits_earned: number;
  pending_credits: number;
}

export const RewardsProgram: React.FC = () => {
  const { user } = useConsolidatedAuth();
  const { toast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData>({
    total_referrals: 0,
    active_referrals: 0,
    total_credits_earned: 0,
    pending_credits: 0
  });
  const [referralCode, setReferralCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      generateReferralCode();
      fetchReferralData();
    }
  }, [user]);

  const generateReferralCode = () => {
    if (user?.email) {
      const code = user.email.split('@')[0].toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
      setReferralCode(code);
    }
  };

  const fetchReferralData = async () => {
    try {
      // Mock data for now - in a real implementation, this would fetch from the database
      setReferralData({
        total_referrals: 3,
        active_referrals: 2,
        total_credits_earned: 150,
        pending_credits: 50
      });
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
  };

  const shareReferral = () => {
    const shareText = `Join Book'D using my referral code ${referralCode} and get $25 in credits!`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Book\'D',
        text: shareText,
        url: `${window.location.origin}?ref=${referralCode}`
      });
    } else {
      navigator.clipboard.writeText(`${shareText} ${window.location.origin}?ref=${referralCode}`);
      toast({
        title: 'Shared!',
        description: 'Referral link copied to clipboard',
      });
    }
  };

  const getCurrentTier = () => {
    const totalReferrals = referralData.total_referrals;
    if (totalReferrals >= 15) return { name: 'Platinum', color: 'text-purple-600', icon: Sparkles };
    if (totalReferrals >= 7) return { name: 'Gold', color: 'text-yellow-600', icon: Trophy };
    if (totalReferrals >= 3) return { name: 'Silver', color: 'text-gray-600', icon: TrendingUp };
    return { name: 'Bronze', color: 'text-amber-600', icon: Gift };
  };

  const getNextMilestone = () => {
    const milestones = [3, 7, 15, 25];
    return milestones.find(milestone => referralData.total_referrals < milestone) || 25;
  };

  const currentTier = getCurrentTier();
  const nextMilestone = getNextMilestone();
  const progress = Math.min((referralData.total_referrals / nextMilestone) * 100, 100);
  const TierIcon = currentTier.icon;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Rewards Program
        </h1>
        <p className="text-gray-600 text-lg">
          Earn credits by referring friends and grow your Book'D community
        </p>
      </div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-purple-700">Current Tier</CardTitle>
              <TierIcon className={`h-5 w-5 ${currentTier.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentTier.color}`}>{currentTier.name}</div>
            <p className="text-xs text-purple-600 mt-1">{referralData.total_referrals} referrals</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-green-700">Total Credits</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${referralData.total_credits_earned}</div>
            <p className="text-xs text-green-600 mt-1">Lifetime earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-700">Active Referrals</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{referralData.active_referrals}</div>
            <p className="text-xs text-blue-600 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-orange-700">Pending Credits</CardTitle>
              <PartyPopper className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${referralData.pending_credits}</div>
            <p className="text-xs text-orange-600 mt-1">Processing</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress to Next Tier */}
      {referralData.total_referrals < nextMilestone && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress to Next Milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Current: {referralData.total_referrals} referrals</span>
                <span>Next milestone: {nextMilestone} referrals</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">
                {nextMilestone - referralData.total_referrals} more referrals to unlock the next tier with better rewards!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg text-center bg-gray-50"
              />
              <Button onClick={copyReferralCode} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={shareReferral} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Share2 className="h-4 w-4 mr-2" />
              Share Referral Link
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Share your code and earn $25 when friends sign up and make their first booking!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Share Your Code</h4>
                  <p className="text-sm text-gray-600">Send your unique referral code to friends</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Friend Signs Up</h4>
                  <p className="text-sm text-gray-600">They create an account using your code</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Earn Rewards</h4>
                  <p className="text-sm text-gray-600">Get $25 credits when they complete their first booking</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Tier Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { name: 'Bronze', referrals: '0-2', benefit: '$25 per referral', icon: Gift },
              { name: 'Silver', referrals: '3-6', benefit: '$30 per referral', icon: TrendingUp },
              { name: 'Gold', referrals: '7-14', benefit: '$35 per referral', icon: Trophy },
              { name: 'Platinum', referrals: '15+', benefit: '$40 per referral', icon: Sparkles }
            ].map((tier, index) => (
              <div 
                key={tier.name}
                className={`p-4 rounded-lg border-2 ${
                  tier.name.toLowerCase() === currentTier.name.toLowerCase() 
                    ? 'border-purple-300 bg-purple-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <tier.icon className="h-5 w-5" />
                  <h4 className="font-medium">{tier.name}</h4>
                  {tier.name.toLowerCase() === currentTier.name.toLowerCase() && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{tier.referrals} referrals</p>
                <p className="text-sm font-medium text-green-600">{tier.benefit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
