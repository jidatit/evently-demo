import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, DollarSign, Users, TrendingUp, Star, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  service_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  total_amount: number;
  payment_status: string;
  status: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  payment_method_id: string;
  payment_status: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  payment_reference: string;
  notes: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  completed_at: string;
}

interface ServiceStats {
  mostPopular: string;
  services: { [key: string]: any[] };
}

interface MonthlyStats {
  topMonth: string;
  monthlyBookings: { [key: string]: number };
}

interface ChartData {
  period: string;
  earnings: number;
  bookings: number;
}

interface CustomerStats {
  total: number;
  repeat: number;
}

interface Insights {
  popularService: string;
  topBookingMonth: string;
  averageOrderValue: number;
  totalCustomers: number;
  repeatCustomers: number;
}

interface Metrics {
  totalBookings: number;
  totalEarnings: number;
  profileViews: number;
  inquiries: number;
  conversionRate: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  serviceStats: ServiceStats;
  monthlyStats: MonthlyStats;
  chartData: ChartData[];
  weeklyChartData: ChartData[];
  insights: Insights;
  serviceRevenue: { name: string; revenue: number; bookings: number }[];
  customerStats: CustomerStats;
}

const VendorAnalyticsDashboard = () => {
  const { user } = useConsolidatedAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .eq('vendor_id', user.id);

        if (bookingsError) {
          throw new Error(`Error fetching bookings: ${bookingsError.message}`);
        }

        // Fetch payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('vendor_id', user.id);

        if (paymentsError) {
          throw new Error(`Error fetching payments: ${paymentsError.message}`);
        }

        setBookings(bookingsData || []);
        setPayments(paymentsData || []);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  useEffect(() => {
    if (bookings.length > 0 && payments.length > 0) {
      const calculatedMetrics = calculateMetrics(bookings, payments);
      setMetrics(calculatedMetrics);
    }
  }, [bookings, payments]);

  const calculateMetrics = (bookings: any[], payments: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate basic metrics
    const totalBookings = Number(bookings?.length) || 0;
    const paidBookings = bookings?.filter(b => b.payment_status === 'paid') || [];
    const totalEarnings = paidBookings.reduce((sum, b) => {
      const amount = Number(b.total_amount) || 0;
      return (Number(sum) || 0) + amount;
    }, 0);
    
    // Mock profile views and inquiries (in a real app, you'd track these)
    const profileViews = Math.floor(totalBookings * 8.5); // Estimate based on conversion funnel
    const inquiries = Math.floor(totalBookings * 2.3);
    const conversionRate = profileViews > 0 ? (totalBookings / profileViews) * 100 : 0;

    // Calculate earnings by period
    const weeklyEarnings = calculatePeriodEarnings(paidBookings, 'week');
    const monthlyEarnings = calculatePeriodEarnings(paidBookings, 'month');

    // Calculate service performance
    const serviceStats = calculateServiceStats(bookings);
    const monthlyStats = calculateMonthlyStats(bookings);
    const chartData = generateChartData(bookings, 'month');
    const weeklyChartData = generateChartData(bookings, 'week');
    
    // Calculate customer metrics
    const customerStats = calculateCustomerStats(bookings);

    const insights = {
      popularService: serviceStats.mostPopular || 'No services yet',
      topBookingMonth: monthlyStats.topMonth || 'No bookings yet',
      averageOrderValue: totalBookings > 0 ? (Number(totalEarnings) || 0) / totalBookings : 0,
      totalCustomers: customerStats.total,
      repeatCustomers: customerStats.repeat
    };

    const serviceRevenue = Object.entries(serviceStats.services).map(([serviceName, serviceBookings]: [string, any[]]) => {
      const serviceRevenue = serviceBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => {
          const amount = Number(b.total_amount) || 0;
          return (Number(sum) || 0) + amount;
        }, 0);
      
      return {
        name: serviceName,
        revenue: Number(serviceRevenue) || 0,
        bookings: serviceBookings.length
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      totalBookings,
      totalEarnings: Number(totalEarnings) || 0,
      profileViews,
      inquiries,
      conversionRate: Number(conversionRate) || 0,
      weeklyEarnings: Number(weeklyEarnings) || 0,
      monthlyEarnings: Number(monthlyEarnings) || 0,
      serviceStats,
      monthlyStats,
      chartData,
      weeklyChartData,
      insights,
      serviceRevenue,
      customerStats
    };
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const calculatePeriodEarnings = (bookings: any[], period: 'week' | 'month') => {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return bookings
      .filter(b => new Date(b.booking_date) >= startDate)
      .reduce((sum, b) => {
        const amount = Number(b.total_amount) || 0;
        return (Number(sum) || 0) + amount;
      }, 0);
  };

  const calculateServiceStats = (bookings: any[]): ServiceStats => {
    const serviceMap: { [key: string]: any[] } = {};
    bookings.forEach((booking: any) => {
      if (!serviceMap[booking.service_name]) {
        serviceMap[booking.service_name] = [];
      }
      serviceMap[booking.service_name].push(booking);
    });

    let mostPopular = '';
    let maxBookings = 0;
    for (const service in serviceMap) {
      if (serviceMap[service].length > maxBookings) {
        maxBookings = serviceMap[service].length;
        mostPopular = service;
      }
    }

    return {
      mostPopular,
      services: serviceMap,
    };
  };

  const calculateMonthlyStats = (bookings: any[]): MonthlyStats => {
    const monthlyBookings: { [key: string]: number } = {};
    bookings.forEach((booking: any) => {
      const bookingDate = new Date(booking.booking_date);
      const month = bookingDate.toLocaleString('default', { month: 'long' });
      if (!monthlyBookings[month]) {
        monthlyBookings[month] = 0;
      }
      monthlyBookings[month]++;
    });

    let topMonth = '';
    let maxBookings = 0;
    for (const month in monthlyBookings) {
      if (monthlyBookings[month] > maxBookings) {
        maxBookings = monthlyBookings[month];
        topMonth = month;
      }
    }

    return {
      topMonth,
      monthlyBookings,
    };
  };

  const generateChartData = (bookings: any[], period: 'week' | 'month') => {
    const data: { [key: string]: { earnings: number; bookings: number } } = {};
    
    // Initialize periods
    const now = new Date();
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        data[key] = { earnings: 0, bookings: 0 };
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString('en-US', { month: 'short' });
        data[key] = { earnings: 0, bookings: 0 };
      }
    }

    // Populate data
    bookings.forEach((booking: any) => {
      const bookingDate = new Date(booking.booking_date);
      let key: string;
      
      if (period === 'week') {
        key = bookingDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        key = bookingDate.toLocaleDateString('en-US', { month: 'short' });
      }

      if (data[key]) {
        const amount = Number(booking.total_amount) || 0;
        data[key].earnings = (Number(data[key].earnings) || 0) + amount;
        data[key].bookings = (Number(data[key].bookings) || 0) + 1;
      }
    });

    return Object.entries(data).map(([period, values]) => ({
      period,
      earnings: Number(values.earnings) || 0,
      bookings: Number(values.bookings) || 0
    }));
  };

  const calculateCustomerStats = (bookings: any[]) => {
    const customerEmails = bookings?.map(b => b.customer_email).filter(Boolean) || [];
    const uniqueCustomers = new Set(customerEmails);
    const totalCustomers = Number(uniqueCustomers.size) || 0;
    const totalBookingsWithEmails = Number(customerEmails.length) || 0;
    const repeatCustomers = Math.max(0, totalBookingsWithEmails - totalCustomers);

    return { 
      total: totalCustomers, 
      repeat: repeatCustomers 
    };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Vendor Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Bookings</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    <Calendar className="mr-2 inline-block h-5 w-5" />
                    {metrics?.totalBookings || 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Earnings</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    <DollarSign className="mr-2 inline-block h-5 w-5" />
                    ${metrics?.totalEarnings?.toFixed(2) || 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Base</CardTitle>
                  </CardHeader>
                  <CardContent className="text-2xl font-bold">
                    <Users className="mr-2 inline-block h-5 w-5" />
                    {metrics?.customerStats.total || 0}
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Bookings & Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics?.weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="earnings" fill="#8884d8" />
                        <Bar dataKey="bookings" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Bookings & Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={metrics?.chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="earnings" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="bookings" stroke="#82ca9d" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Views</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl">
                    <TrendingUp className="mr-2 inline-block h-4 w-4" />
                    {metrics?.profileViews || 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl">
                    <Star className="mr-2 inline-block h-4 w-4" />
                    {metrics?.inquiries || 0}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xl">
                    <Clock className="mr-2 inline-block h-4 w-4" />
                    {metrics?.conversionRate?.toFixed(2) || 0}%
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="revenue" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Revenue Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={metrics?.serviceRevenue}
                          dataKey="revenue"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          fill="#8884d8"
                          label
                        >
                          {metrics?.serviceRevenue.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5">
                      <li>
                        <span className="font-bold">Most Popular Service:</span> {metrics?.insights.popularService}
                      </li>
                      <li>
                        <span className="font-bold">Top Booking Month:</span> {metrics?.insights.topBookingMonth}
                      </li>
                      <li>
                        <span className="font-bold">Average Order Value:</span> ${metrics?.insights.averageOrderValue?.toFixed(2)}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="customers" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5">
                      <li>
                        <span className="font-bold">Total Customers:</span> {metrics?.insights.totalCustomers}
                      </li>
                      <li>
                        <span className="font-bold">Repeat Customers:</span> {metrics?.insights.repeatCustomers}
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Customer engagement metrics will be displayed here. This could include things like average
                      spending per customer, most active customers, etc.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorAnalyticsDashboard;
