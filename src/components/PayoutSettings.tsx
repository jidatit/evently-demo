
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Building, DollarSign, Info } from 'lucide-react';

interface PayoutSettingsProps {
  vendor: any;
  onUpdate: (updatedVendor: any) => void;
}

const PayoutSettings: React.FC<PayoutSettingsProps> = ({ vendor, onUpdate }) => {
  const { toast } = useToast();
  const [payoutMethod, setPayoutMethod] = useState(vendor?.payout_method || 'paypal');
  const [payoutDetails, setPayoutDetails] = useState(vendor?.payout_details || '');
  const [loading, setLoading] = useState(false);

  // Mock data for earnings calculation
  const mockEarnings = {
    totalBookings: 5,
    grossAmount: 2500.00,
    platformFee: 250.00, // 10% platform fee
    netAmount: 2250.00
  };

  const handleSave = async () => {
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

  return (
    <div className="space-y-6">
      {/* Earnings Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Earnings Overview
          </CardTitle>
          <CardDescription>
            Your current earnings and payout information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-lime-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-2xl font-bold text-black">{mockEarnings.totalBookings}</p>
            </div>
            <div className="bg-lime-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Gross Earnings</p>
              <p className="text-2xl font-bold text-black">${mockEarnings.grossAmount.toFixed(2)}</p>
            </div>
            <div className="bg-lime-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Available Balance</p>
              <p className="text-2xl font-bold text-lime-600">${mockEarnings.netAmount.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Platform Fee Breakdown</span>
            </div>
            <div className="text-sm text-blue-700">
              <p>Gross Amount: ${mockEarnings.grossAmount.toFixed(2)}</p>
              <p>Platform Fee (10%): -${mockEarnings.platformFee.toFixed(2)}</p>
              <p className="font-semibold">Net Amount: ${mockEarnings.netAmount.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Method */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Method</CardTitle>
          <CardDescription>
            Choose how you want to receive your earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payout-method">Payment Method</Label>
            <Select value={payoutMethod} onValueChange={setPayoutMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paypal">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    PayPal
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payout-details">
              {payoutMethod === 'paypal' ? 'PayPal Email' : 'Bank Account Details'}
            </Label>
            <Input
              id="payout-details"
              type={payoutMethod === 'paypal' ? 'email' : 'text'}
              placeholder={
                payoutMethod === 'paypal' 
                  ? 'Enter your PayPal email address' 
                  : 'Enter your bank account details'
              }
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
            />
          </div>

          {payoutMethod === 'bank_transfer' && (
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Bank Transfer Setup</span>
              </div>
              <p className="text-sm text-yellow-700">
                Bank transfers are processed directly to your account. Please provide your full bank account details including account number, routing number, and bank name.
              </p>
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={loading || !payoutDetails}
            className="w-full bg-lime-500 hover:bg-lime-600 text-black"
          >
            {loading ? 'Saving...' : 'Save Payout Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>
            Your recent payout transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No payout history available</p>
            <p className="text-sm">Complete your first booking to see payout history</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutSettings;
