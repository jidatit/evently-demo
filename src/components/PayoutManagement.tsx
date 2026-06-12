import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Building, 
  DollarSign, 
  Info, 
  CheckCircle,
  AlertCircle,
  Clock,
  Plus
} from 'lucide-react';

interface PayoutManagementProps {
  vendor: any;
  onUpdate: (updatedVendor: any) => void;
}

const PayoutManagement: React.FC<PayoutManagementProps> = ({ vendor, onUpdate }) => {
  const { toast } = useToast();
  const [payoutMethod, setPayoutMethod] = useState(vendor?.payout_method || 'site_account');
  const [payoutDetails, setPayoutDetails] = useState(vendor?.payout_details || '');
  const [autoTransferEnabled, setAutoTransferEnabled] = useState(false);
  const [autoTransferFrequency, setAutoTransferFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);

  // Mock earnings data - in production this would come from actual payment processing
  useEffect(() => {
    // Calculate available balance from completed bookings
    const mockBalance = 2450.75; // This would be calculated from actual payment data
    const mockPending = 150.50;
    setAvailableBalance(mockBalance);
    setPendingPayouts(mockPending);
  }, [vendor]);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          payout_method: payoutMethod,
          payout_details: payoutDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) throw error;

      const updatedVendor = {
        ...vendor,
        payout_method: payoutMethod,
        payout_details: payoutDetails
      };

      onUpdate(updatedVendor);
      
      toast({
        title: 'Success',
        description: 'Payout settings updated successfully!',
      });
    } catch (error: any) {
      console.error('Error updating payout settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualWithdrawal = async () => {
    if (availableBalance <= 0) {
      toast({
        title: 'No funds available',
        description: 'You need funds in your account to request a withdrawal.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // In production, this would trigger actual payout processing
      toast({
        title: 'Withdrawal requested',
        description: `Withdrawal of $${availableBalance.toFixed(2)} has been requested and will be processed within 1-2 business days.`,
      });
      
      // Mock reducing balance
      setAvailableBalance(0);
      setPendingPayouts(pendingPayouts + availableBalance);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to process withdrawal request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const connectStripeAccount = () => {
    // In production, this would redirect to Stripe Connect onboarding
    toast({
      title: 'Stripe Connect',
      description: 'Redirecting to Stripe account setup...',
    });
  };

  const connectPayPalAccount = () => {
    // In production, this would redirect to PayPal Connect onboarding
    toast({
      title: 'PayPal Connect',
      description: 'Redirecting to PayPal account setup...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Overview
          </CardTitle>
          <CardDescription>
            Your current earnings and payout status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-lime-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-lime-600" />
                <span className="font-medium text-gray-700">Available Balance</span>
              </div>
              <p className="text-3xl font-bold text-lime-600">${availableBalance.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Ready for withdrawal</p>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-gray-700">Pending Payouts</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600">${pendingPayouts.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Processing</p>
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-700">Total Earned</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">${(availableBalance + pendingPayouts + 5240.25).toFixed(2)}</p>
              <p className="text-sm text-gray-600">All time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Options */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Options</CardTitle>
          <CardDescription>
            Choose how you want to manage your earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Keep in Book'D Account */}
            <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              payoutMethod === 'site_account' 
                ? 'border-lime-500 bg-lime-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => setPayoutMethod('site_account')}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  payoutMethod === 'site_account' ? 'bg-lime-100' : 'bg-gray-100'
                }`}>
                  <Building className={`h-5 w-5 ${
                    payoutMethod === 'site_account' ? 'text-lime-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">Keep in Book'D Account</h3>
                  <p className="text-sm text-gray-600">Hold funds for future bookings</p>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <p>• No transfer fees</p>
                <p>• Instant availability for refunds</p>
                <p>• Withdraw anytime</p>
              </div>
            </div>

            {/* Option 2: Transfer to Bank Account */}
            <div className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              payoutMethod !== 'site_account' 
                ? 'border-lime-500 bg-lime-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`} onClick={() => setPayoutMethod('bank_transfer')}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${
                  payoutMethod !== 'site_account' ? 'bg-lime-100' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`h-5 w-5 ${
                    payoutMethod !== 'site_account' ? 'text-lime-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold">Transfer to Bank Account</h3>
                  <p className="text-sm text-gray-600">Direct deposit to your bank</p>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <p>• 1-2 business day processing</p>
                <p>• Automatic or manual transfers</p>
                <p>• Standard banking security</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Connection */}
      {payoutMethod !== 'site_account' && (
        <Card>
          <CardHeader>
            <CardTitle>Connect Payment Account</CardTitle>
            <CardDescription>
              Link your bank account or payment service for withdrawals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!payoutDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={connectStripeAccount}
                  className="flex items-center gap-2 h-16 bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Connect with Stripe</div>
                    <div className="text-sm opacity-90">Bank account & debit card</div>
                  </div>
                </Button>

                <Button 
                  onClick={connectPayPalAccount}
                  className="flex items-center gap-2 h-16 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Connect with PayPal</div>
                    <div className="text-sm opacity-90">PayPal account</div>
                  </div>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Payment account connected</p>
                  <p className="text-sm text-green-700">{payoutDetails}</p>
                </div>
              </div>
            )}

            {payoutDetails && (
              <>
                {/* Auto-transfer Settings */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Automatic Transfers</Label>
                      <p className="text-sm text-gray-600">Automatically transfer earnings to your account</p>
                    </div>
                    <Switch 
                      checked={autoTransferEnabled}
                      onCheckedChange={setAutoTransferEnabled}
                    />
                  </div>

                  {autoTransferEnabled && (
                    <div className="space-y-2">
                      <Label>Transfer Frequency</Label>
                      <Select value={autoTransferFrequency} onValueChange={setAutoTransferFrequency}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly (Recommended)</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-600">
                        Next automatic transfer: {autoTransferFrequency === 'daily' ? 'Tomorrow' : 
                        autoTransferFrequency === 'weekly' ? 'Next Monday' : 'Next month'}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Withdrawal */}
      {payoutMethod !== 'site_account' && payoutDetails && (
        <Card>
          <CardHeader>
            <CardTitle>Manual Withdrawal</CardTitle>
            <CardDescription>
              Request an immediate transfer of your available balance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <p className="font-medium">Available for withdrawal</p>
                <p className="text-2xl font-bold text-lime-600">${availableBalance.toFixed(2)}</p>
              </div>
              <Button 
                onClick={handleManualWithdrawal}
                disabled={loading || availableBalance <= 0}
                className="bg-lime-500 hover:bg-lime-600"
              >
                {loading ? 'Processing...' : 'Withdraw Now'}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>Manual withdrawals are processed within 1-2 business days</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          disabled={loading}
          className="bg-lime-500 hover:bg-lime-600"
        >
          {loading ? 'Saving...' : 'Save Payout Settings'}
        </Button>
      </div>
    </div>
  );
};

export default PayoutManagement;
