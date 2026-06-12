
import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, TrendingUp, FileText } from 'lucide-react';

interface VendorMetricsProps {
  vendor: any;
  bookings: any[];
  invoices: any[];
}

const VendorMetrics: React.FC<VendorMetricsProps> = ({ vendor, bookings, invoices }) => {
  const [metrics, setMetrics] = useState({
    totalIncome: 0,
    thisMonthIncome: 0,
    pendingAmount: 0,
    totalInvoices: 0
  });

  useEffect(() => {
    calculateMetrics();
  }, [bookings, invoices]);

  const calculateMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate total income from completed bookings
    const totalIncome = bookings
      .filter(booking => booking.payment_status === 'paid')
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

    // Calculate this month's income
    const thisMonthIncome = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        return bookingDate.getMonth() === currentMonth && 
               bookingDate.getFullYear() === currentYear &&
               booking.payment_status === 'paid';
      })
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

    // Calculate pending amount
    const pendingAmount = bookings
      .filter(booking => booking.payment_status === 'unpaid')
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount) || 0), 0);

    setMetrics({
      totalIncome,
      thisMonthIncome,
      pendingAmount,
      totalInvoices: invoices.length
    });
  };

  const MetricCard = ({ title, amount, subtitle, icon: Icon }: any) => (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {typeof amount === 'number' ? `$${amount.toFixed(2)}` : amount}
      </div>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Total Income"
        amount={metrics.totalIncome}
        subtitle="All time earnings"
        icon={DollarSign}
      />
      <MetricCard
        title="This Month"
        amount={metrics.thisMonthIncome}
        subtitle="Current month earnings"
        icon={Calendar}
      />
      <MetricCard
        title="Pending"
        amount={metrics.pendingAmount}
        subtitle="Awaiting payment"
        icon={TrendingUp}
      />
      <MetricCard
        title="Invoices"
        amount={metrics.totalInvoices}
        subtitle="Total invoices sent"
        icon={FileText}
      />
    </div>
  );
};

export default VendorMetrics;
