
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
  Users,
  Building
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface CommissionData {
  total_commissions_earned: number;
  total_commissions_pending: number;
  total_commissions_completed: number;
  total_vendor_payouts: number;
}

interface CommissionRecord {
  id: string;
  vendor_name: string;
  booking_date: string;
  gross_amount: number;
  commission_amount: number;
  vendor_net_amount: number;
  transfer_status: string;
  created_at: string;
}

const CommissionDashboard: React.FC = () => {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [commissionData, setCommissionData] = useState<CommissionData>({
    total_commissions_earned: 0,
    total_commissions_pending: 0,
    total_commissions_completed: 0,
    total_vendor_payouts: 0
  });
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommissionData();
    fetchCommissionRecords();
  }, [timeRange]);

  const fetchCommissionData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_commission_summary');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCommissionData(data[0]);
      }
    } catch (error: any) {
      console.error('Error fetching commission data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission data',
        variant: 'destructive',
      });
    }
  };

  const fetchCommissionRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_commissions')
        .select(`
          id,
          gross_amount,
          commission_amount,
          vendor_net_amount,
          transfer_status,
          created_at,
          vendors!inner(business_name),
          bookings!inner(booking_date)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedRecords: CommissionRecord[] = (data || []).map(record => ({
        id: record.id,
        vendor_name: record.vendors?.business_name || 'Unknown Vendor',
        booking_date: record.bookings?.booking_date || '',
        gross_amount: parseFloat(record.gross_amount?.toString() || '0'),
        commission_amount: parseFloat(record.commission_amount?.toString() || '0'),
        vendor_net_amount: parseFloat(record.vendor_net_amount?.toString() || '0'),
        transfer_status: record.transfer_status,
        created_at: record.created_at
      }));

      setCommissionRecords(formattedRecords);
    } catch (error: any) {
      console.error('Error fetching commission records:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Vendor', 'Gross Amount', 'Commission (10%)', 'Vendor Net', 'Status'],
      ...commissionRecords.map(record => [
        new Date(record.created_at).toLocaleDateString(),
        record.vendor_name,
        record.gross_amount.toFixed(2),
        record.commission_amount.toFixed(2),
        record.vendor_net_amount.toFixed(2),
        record.transfer_status
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `platform-commissions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Commission data exported successfully',
    });
  };

  const chartData = commissionRecords.slice(0, 12).reverse().map(record => ({
    date: new Date(record.created_at).toLocaleDateString(),
    commission: record.commission_amount,
    payout: record.vendor_net_amount
  }));

  const statusData = [
    { name: 'Completed', value: commissionData.total_commissions_completed, color: '#10b981' },
    { name: 'Pending', value: commissionData.total_commissions_pending, color: '#f59e0b' }
  ];

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
          <h2 className="text-2xl font-bold text-gray-900">Platform Commission Dashboard</h2>
          <p className="text-gray-600">Track platform revenue and vendor payouts</p>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${commissionData.total_commissions_earned.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">10% commission from all bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${commissionData.total_commissions_pending.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting transfer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Commissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${commissionData.total_commissions_completed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Successfully transferred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendor Payouts</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${commissionData.total_vendor_payouts.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">90% paid to vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Commission Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Amount']} />
                <Line 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Platform Commission"
                />
                <Line 
                  type="monotone" 
                  dataKey="payout" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Vendor Payout"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Commission Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value.toFixed(2)}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Commissions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Records</CardTitle>
        </CardHeader>
        <CardContent>
          {commissionRecords.length > 0 ? (
            <div className="space-y-4">
              {commissionRecords.slice(0, 10).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{record.vendor_name}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Gross: ${record.gross_amount.toFixed(2)}</div>
                      <div>Commission: ${record.commission_amount.toFixed(2)} (10%)</div>
                      <div>Vendor Net: ${record.vendor_net_amount.toFixed(2)}</div>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      record.transfer_status === 'completed' ? 'default' :
                      record.transfer_status === 'pending' ? 'secondary' : 'destructive'
                    }
                  >
                    {record.transfer_status}
                  </Badge>
                </div>
              ))}
              {commissionRecords.length > 10 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing latest 10 records
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No commission records available</p>
              <p className="text-sm">Commission records will appear as bookings are completed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommissionDashboard;
