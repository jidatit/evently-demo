
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  Calendar,
  TrendingDown,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import VendorEarningsDashboard from './VendorEarningsDashboard';

interface EarningsDashboardProps {
  vendor: any;
}

interface EarningsData {
  period: string;
  gross_earnings: number;
  platform_fee: number;
  net_earnings: number;
  bookings: number;
}

interface PayoutData {
  id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  payout_status: 'pending' | 'completed' | 'processing';
  created_at: string;
  processed_at?: string;
  payout_method: string;
}

const EarningsDashboard: React.FC<EarningsDashboardProps> = ({ vendor }) => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalPlatformFees, setTotalPlatformFees] = useState(0);
  const [totalNetEarnings, setTotalNetEarnings] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [completedPayouts, setCompletedPayouts] = useState(0);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (vendor) {
  //     fetchEarningsData();
  //     fetchPayoutData();
  //   }
  // }, [vendor, timeRange]);

  const fetchEarningsData = async () => {
    try {
      // Fetch commission data for earnings calculation
      const { data: commissionData, error: commissionError } = await supabase
        .from('platform_commissions')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: true });

      if (commissionError) throw commissionError;

      const processedData = processEarningsData(commissionData || [], timeRange);
      setEarningsData(processedData);

      const totalGross = (commissionData || []).reduce((sum, commission) =>
        sum + (parseFloat(commission.gross_amount?.toString() || '0')), 0
      );
      const totalFees = (commissionData || []).reduce((sum, commission) =>
        sum + (parseFloat(commission.commission_amount?.toString() || '0')), 0
      );
      const totalNet = (commissionData || []).reduce((sum, commission) =>
        sum + (parseFloat(commission.vendor_net_amount?.toString() || '0')), 0
      );

      setTotalEarnings(totalGross);
      setTotalPlatformFees(totalFees);
      setTotalNetEarnings(totalNet);

    } catch (error: any) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load earnings data',
        variant: 'destructive',
      });
    }
  };

  const fetchPayoutData = async () => {
    try {
      // Fetch payout data
      const { data: payoutData, error } = await supabase
        .from('vendor_payouts')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the data to match our PayoutData interface
      const mappedPayouts: PayoutData[] = (payoutData || []).map(payout => ({
        id: payout.id,
        gross_amount: parseFloat(payout.gross_amount?.toString() || '0'),
        commission_amount: parseFloat(payout.commission_amount?.toString() || '0'),
        net_amount: parseFloat(payout.net_amount?.toString() || '0'),
        payout_status: payout.payout_status as 'pending' | 'completed' | 'processing',
        created_at: payout.created_at,
        processed_at: payout.processed_at,
        payout_method: payout.payout_method
      }));

      setPayouts(mappedPayouts);

      const pending = mappedPayouts
        .filter(p => p.payout_status === 'pending')
        .reduce((sum, p) => sum + p.net_amount, 0);
      setPendingPayouts(pending);

      const completed = mappedPayouts
        .filter(p => p.payout_status === 'completed')
        .reduce((sum, p) => sum + p.net_amount, 0);
      setCompletedPayouts(completed);

    } catch (error: any) {
      console.error('Error fetching payout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processEarningsData = (commissions: any[], range: string): EarningsData[] => {
    const now = new Date();
    const data: { [key: string]: { gross_earnings: number; platform_fee: number; net_earnings: number; bookings: number } } = {};

    // Initialize periods based on range
    if (range === 'weekly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const key = `Week ${date.getMonth() + 1}/${date.getDate()}`;
        data[key] = { gross_earnings: 0, platform_fee: 0, net_earnings: 0, bookings: 0 };
      }
    } else if (range === 'monthly') {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        data[key] = { gross_earnings: 0, platform_fee: 0, net_earnings: 0, bookings: 0 };
      }
    } else { // yearly
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        data[year.toString()] = { gross_earnings: 0, platform_fee: 0, net_earnings: 0, bookings: 0 };
      }
    }

    // Populate with actual data
    commissions.forEach(commission => {
      const commissionDate = new Date(commission.created_at);
      let key: string;

      if (range === 'weekly') {
        const weekStart = new Date(commissionDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = `Week ${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      } else if (range === 'monthly') {
        key = commissionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      } else {
        key = commissionDate.getFullYear().toString();
      }

      if (data[key]) {
        data[key].gross_earnings += parseFloat(commission.gross_amount?.toString() || '0');
        data[key].platform_fee += parseFloat(commission.commission_amount?.toString() || '0');
        data[key].net_earnings += parseFloat(commission.vendor_net_amount?.toString() || '0');
        data[key].bookings += 1;
      }
    });

    return Object.entries(data).map(([period, values]) => ({
      period,
      gross_earnings: values.gross_earnings,
      platform_fee: values.platform_fee,
      net_earnings: values.net_earnings,
      bookings: values.bookings
    }));
  };

  const exportToCSV = () => {
    const csvData = [
      ['Period', 'Gross Earnings', 'Platform Fee (10%)', 'Net Earnings', 'Bookings'],
      ...earningsData.map(item => [
        item.period,
        item.gross_earnings.toFixed(2),
        item.platform_fee.toFixed(2),
        item.net_earnings.toFixed(2),
        item.bookings.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-with-fees-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Earnings data with platform fees exported successfully',
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
      {/* Use the new dedicated vendor earnings dashboard */}
      <VendorEarningsDashboard vendor={vendor} />

      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Earnings Trend Analysis</h2>
          <p className="text-gray-600">Track your revenue trends over time</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Platform Fee Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          All charts below show the breakdown including the 10% platform fee. Your actual earnings are 90% of the gross booking amount.
        </AlertDescription>
      </Alert>

      {/* Earnings Chart with Platform Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Earnings Breakdown ({timeRange})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value: any, name: string) => {
                const labels = {
                  gross_earnings: 'Gross Earnings',
                  platform_fee: 'Platform Fee (10%)',
                  net_earnings: 'Your Net Earnings'
                };
                return [`$${value.toFixed(2)}`, labels[name as keyof typeof labels] || name];
              }} />
              <Line
                type="monotone"
                dataKey="gross_earnings"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="gross_earnings"
              />
              <Line
                type="monotone"
                dataKey="platform_fee"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name="platform_fee"
              />
              <Line
                type="monotone"
                dataKey="net_earnings"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="net_earnings"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bookings Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Bookings Volume ({timeRange})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value: any) => [value, 'Bookings']} />
              <Bar dataKey="bookings" fill="#84cc16" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payout History with Commission Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.slice(0, 10).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="font-medium">
                        <span className="text-green-600">${payout.net_amount.toFixed(2)}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          (from ${payout.gross_amount.toFixed(2)} - ${payout.commission_amount.toFixed(2)} fee)
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      via {payout.payout_method}
                    </div>
                  </div>
                  <Badge
                    variant={
                      payout.payout_status === 'completed' ? 'default' :
                        payout.payout_status === 'processing' ? 'secondary' : 'outline'
                    }
                  >
                    {payout.payout_status}
                  </Badge>
                </div>
              ))}
              {payouts.length > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing latest 10 payouts
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payout history available</p>
              <p className="text-sm">Complete bookings to start earning payouts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EarningsDashboard;
