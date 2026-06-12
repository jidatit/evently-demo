
import React from 'react';
import { DashboardCard } from './DashboardCard';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  Clock
} from 'lucide-react';
import { useVendor } from '@/features/vendor/hooks';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';
import { Skeleton } from './ui/skeleton';

interface VendorDashboardOverviewProps {
  vendor: any;
  bookings: any[];
  invoices: any[];
}

const VendorDashboardOverview: React.FC<VendorDashboardOverviewProps> = ({
  vendor,
  bookings,
  invoices,
}) => {
  const { user } = useConsolidatedAuth();

  const { data: vendorData, isLoading: vendorLoading } = useVendor(user?.id);

  // Add defensive checks for null/undefined vendor
  if (!vendor) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loading your dashboard...
          </h1>
          <p className="text-gray-600">
            Please wait while we load your business information.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const calculateMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate total income from completed bookings
    const totalIncome = (bookings || [])
      .filter(booking => booking.payment_status === 'paid')
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

    // Calculate this month's income
    const thisMonthIncome = (bookings || [])
      .filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          booking.payment_status === 'paid';
      })
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

    // Calculate pending bookings
    const pendingBookings = (bookings || []).filter(booking =>
      booking.status === 'confirmed' && booking.payment_status === 'unpaid'
    ).length;

    // Calculate upcoming bookings (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingBookings = (bookings || []).filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= new Date() && bookingDate <= nextWeek;
    }).length;

    return {
      totalIncome,
      thisMonthIncome,
      totalBookings: (bookings || []).length,
      pendingBookings,
      totalInvoices: (invoices || []).length,
      upcomingBookings,
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      {vendorLoading ? (
        <div className="bg-gradient-to-r from-lime-50 to-lime-100 rounded-xl p-6 border border-lime-200 space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-[420px]" />
        </div>
      ) : (
        <div className="bg-gradient-to-r from-lime-50 to-lime-100 rounded-xl p-6 border border-lime-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {vendorData?.businessName || "Vendor"}! 🎉
          </h1>
          <p className="text-gray-600">
            Here's an overview of your business performance and upcoming activities.
          </p>
        </div>
      )}


      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Earnings"
          value={`$${metrics.totalIncome.toFixed(2)}`}
          subtitle="All time revenue"
          icon={DollarSign}
          trend={{
            value: "12% from last month",
            isPositive: true
          }}
        />

        <DashboardCard
          title="This Month"
          value={`$${metrics.thisMonthIncome.toFixed(2)}`}
          subtitle="Current month earnings"
          icon={TrendingUp}
          trend={{
            value: "8% increase",
            isPositive: true
          }}
        />

        <DashboardCard
          title="Total Bookings"
          value={metrics.totalBookings}
          subtitle="All time bookings"
          icon={Calendar}
        />

        <DashboardCard
          title="Upcoming Events"
          value={metrics.upcomingBookings}
          subtitle="Next 7 days"
          icon={Clock}
          className="border-lime-200 bg-lime-50"
        />

        <DashboardCard
          title="Pending Bookings"
          value={metrics.pendingBookings}
          subtitle="Awaiting payment"
          icon={Users}
        />

        <DashboardCard
          title="Invoices Sent"
          value={metrics.totalInvoices}
          subtitle="Total invoices"
          icon={FileText}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-party">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'bookings' }))}
            className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-all duration-200 group"
          >
            <Calendar className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-medium text-foreground">View Calendar</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'invoices' }))}
            className="flex items-center gap-3 p-4 bg-secondary/10 border border-secondary/20 rounded-lg hover:bg-secondary/20 transition-all duration-200 group"
          >
            <FileText className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
            <span className="font-medium text-foreground">Create Invoice</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'services' }))}
            className="flex items-center gap-3 p-4 bg-accent/10 border border-accent/20 rounded-lg hover:bg-accent/20 transition-all duration-200 group"
          >
            <Users className="w-5 h-5 text-accent-foreground group-hover:scale-110 transition-transform" />
            <span className="font-medium text-foreground">Manage Services</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'earnings' }))}
            className="flex items-center gap-3 p-4 bg-muted border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-all duration-200 group"
          >
            <DollarSign className="w-5 h-5 text-muted-foreground group-hover:text-accent-foreground group-hover:scale-110 transition-all" />
            <span className="font-medium text-muted-foreground group-hover:text-accent-foreground">View Earnings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboardOverview;
