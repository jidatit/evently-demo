
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  Download,
  Info,
  AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VendorEarningsData {
  total_gross_earnings: number;
  total_commission_paid: number;
  total_net_earnings: number;
  pending_commissions: number;
  completed_transfers: number;
}

interface VendorEarningsDashboardProps {
  vendor: any;
}

const VendorEarningsDashboard: React.FC<VendorEarningsDashboardProps> = ({ vendor }) => {
  const { toast } = useToast();
  const [earningsData, setEarningsData] = useState<VendorEarningsData>({
    total_gross_earnings: 0,
    total_commission_paid: 0,
    total_net_earnings: 0,
    pending_commissions: 0,
    completed_transfers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor?.id) {
      fetchVendorEarnings();
    }
  }, [vendor]);

  const fetchVendorEarnings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_vendor_earnings_summary', {
        vendor_id_param: vendor.id
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setEarningsData(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching vendor earnings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportEarningsReport = () => {
    const reportData = [
      ['Metric', 'Amount'],
      ['Gross Bookings', `$${earningsData.total_gross_earnings.toFixed(2)}`],
      ['Platform Commission (10%)', `-$${earningsData.total_commission_paid.toFixed(2)}`],
      ['Net Earnings', `$${earningsData.total_net_earnings.toFixed(2)}`],
      ['Pending Transfers', `$${earningsData.pending_commissions.toFixed(2)}`],
      ['Completed Transfers', `$${earningsData.completed_transfers.toFixed(2)}`],
    ];

    const csvContent = reportData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-report-${vendor.business_name}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Earnings report exported successfully',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings & Commissions</h2>
          <p className="text-gray-600">Track your revenue and platform fee breakdown</p>
        </div>
        <Button onClick={exportEarningsReport} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Platform Fee Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Book'D charges a 10% platform fee on all completed bookings. This fee helps us maintain the platform, 
          provide customer support, and continue improving our services.
        </AlertDescription>
      </Alert>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Gross Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${earningsData.total_gross_earnings.toFixed(2)}
            </div>
            <p className="text-xs text-green-600">Total booking value</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Platform Fee (10%)</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -${earningsData.total_commission_paid.toFixed(2)}
            </div>
            <p className="text-xs text-red-600">Platform commission</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Your Net Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${earningsData.total_net_earnings.toFixed(2)}
            </div>
            <p className="text-xs text-blue-600">After platform fee</p>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              ${earningsData.pending_commissions.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">
              Earnings from recent bookings that are being processed for transfer to your account.
            </p>
            <Badge variant="secondary" className="mt-2">
              Processing
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Completed Transfers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${earningsData.completed_transfers.toFixed(2)}
            </div>
            <p className="text-sm text-gray-600">
              Total amount successfully transferred to your connected payment account.
            </p>
            <Badge variant="default" className="mt-2">
              Completed
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Fee Breakdown Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>How Platform Fees Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span>Customer pays for booking</span>
              <span className="font-medium">${earningsData.total_gross_earnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <span>Platform fee (10%)</span>
              <span className="font-medium text-red-600">-${earningsData.total_commission_paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded border-2 border-green-200">
              <span className="font-medium">You receive</span>
              <span className="font-bold text-green-600">${earningsData.total_net_earnings.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              The platform fee is automatically deducted when payments are processed. You receive 90% of each booking value, 
              with transfers processed within 2-7 business days depending on your payment method.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorEarningsDashboard;
