
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VendorDashboardOverview from '@/components/VendorDashboardOverview';
import VendorDashboardTabs from '@/components/VendorDashboardTabs';
import { VendorOnboardingChecklist } from '@/components/VendorOnboardingChecklist';
import VendorCalendarWidget from '@/components/VendorCalendarWidget';
import EarningsDashboard from '@/components/EarningsDashboard';
import VendorAnalyticsDashboard from '@/components/VendorAnalyticsDashboard';
import VendorMetrics from '@/components/VendorMetrics';
import ProfileProgress from '@/components/ProfileProgress';
import MediaManager from '@/components/MediaManager';
import ContractManager from '@/components/ContractManager';
import PayoutSettings from '@/components/PayoutSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ServicesManager from '@/components/ServicesManager';
import { VendorBookingsPanel } from '@/features/bookings/components/VendorBookingsPanel';
import { useBooking, useWithdrawQuote } from '@/features/bookings/hooks';
import type { Booking } from '@/features/bookings/types';
import InvoicesManager from '@/components/InvoicesManager';
import PayoutManagement from '@/components/PayoutManagement';
import { VendorReviewsSection } from '@/components/VendorReviewsSection';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { Calendar, DollarSign, Users, Star, MessageSquare, Settings, BarChart3, FileText, CreditCard, Image } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { VendorProfile } from './VendorProfile';
import { VendorProfileEdit } from './VendorProfileEdit';
import { VendorServices } from './VendorServices';
import { useVendor } from '@/features/vendor/hooks';
import {
  StripeConnectBanner,
  StripePayoutStatusBadge,
  VendorStripePayoutsPanel,
} from '@/components/StripeConnectBanner';
import { syncStripeStatus, initiateStripeOnboarding } from '@/features/stripe/api';
import { toast } from 'sonner';
import { useVendorThreads } from '@/features/threads/hooks';
import { ThreadListItem } from '@/features/threads/components/ThreadListItem';
import { ThreadDrawer } from '@/features/threads/components/ThreadDrawer';
import { DashboardAppHeader } from '@/components/layout/DashboardAppHeader';

const VendorDashboard = () => {
  const { user, logout } = useConsolidatedAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: vendor } = useVendor(user?.id);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [threadDrawerOpen, setThreadDrawerOpen] = React.useState(false);
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);
  const [selectedConversationTitle, setSelectedConversationTitle] = React.useState('');
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>();
  const [threadBookingId, setThreadBookingId] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const { data: threadBooking } = useBooking(threadBookingId ?? undefined);
  const withdrawQuoteMutation = useWithdrawQuote(vendor?.id);
  const { data: vendorThreads = [] } = useVendorThreads(vendor?.id);

  const handleOpenThreadFromBooking = (booking: Booking) => {
    if (!booking.threadId) return;
    const row = vendorThreads.find((t) => t.thread.id === booking.threadId);
    setThreadBookingId(booking.id);
    setSelectedThreadId(booking.threadId);
    setSelectedConversationTitle(
      row?.counterpartName ?? booking.customerName ?? 'Planner',
    );
    setSelectedCustomerId(booking.customerId);
    setActiveTab('messages');
    setThreadDrawerOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  React.useEffect(() => {
    const handleTabChange = (event: any) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('changeTab', handleTabChange);
    return () => window.removeEventListener('changeTab', handleTabChange);
  }, []);

  const stripeHandled = React.useRef<string | null>(null);

  React.useEffect(() => {
    const flag = searchParams.get("stripe");
    if (!flag || !vendor?.id || !user?.id) return;
    const key = `${vendor.id}:${flag}`;
    if (stripeHandled.current === key) return;
    stripeHandled.current = key;

    if (flag === "success") {
      toast.success("Returned from Stripe", {
        description: "Syncing your payout status…",
      });
      void syncStripeStatus()
        .catch((e: Error) => {
          toast.error("Sync failed", { description: e.message });
        })
        .finally(() => {
          setActiveTab("payouts");
          const next = new URLSearchParams(searchParams);
          next.delete("stripe");
          setSearchParams(next, { replace: true });
        });
    }

    if (flag === "refresh") {
      void initiateStripeOnboarding()
        .then((url) => {
          window.location.href = url;
        })
        .catch((e: Error) => {
          toast.error("Could not refresh Stripe link", { description: e.message });
          const next = new URLSearchParams(searchParams);
          next.delete("stripe");
          setSearchParams(next, { replace: true });
        });
    }
  }, [searchParams, setSearchParams, vendor?.id, user?.id]);

  const tabParam = searchParams.get('tab');
  React.useEffect(() => {
    if (tabParam === 'messages') {
      setActiveTab('messages');
    }
    if (tabParam === 'bookings') {
      setActiveTab('bookings');
    }
    if (tabParam === 'services') {
      setActiveTab('services');
    }
  }, [tabParam]);

  const mockVendor = {
    id: vendor?.id || user?.id || '',
    business_name: vendor?.businessName || 'My Business',
    category: 'Event Planning',
    description: 'Professional event planning services',
    contact_email: vendor?.contactEmail || user?.email || '',
    contact_phone: '',
    location: '',
    accepting_bookings: true,
    is_verified: false,
    logo_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: user?.id || '',
    is_frozen: false,
    bank_account_details: null,
    site_account_balance: 0,
    unavailable_until: null,
    payout_method: 'site_account',
    pricing_info: null,
    unavailable_message: null,
    services_offered: null
  };

  const mockBookings: any[] = [];
  const mockInvoices: any[] = [];
  const mockServices: any[] = [];

  return (
    <div className="min-h-screen bg-primary/10">
      <DashboardAppHeader
        role="vendor"
        onLogout={handleLogout}
        vendorSlug={vendor?.profileSlug}
        trailing={
          vendor?.id ? <StripePayoutStatusBadge vendorId={vendor.id} /> : undefined
        }
      />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl bg-primary font-bold bg-clip-text text-transparent mb-2">
            Vendor Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your business and grow your presence on Evently
          </p>
        </div>

        {vendor?.id && (
          <StripeConnectBanner
            vendorId={vendor.id}
            onOpenPayoutsTab={() => setActiveTab('payouts')}
          />
        )}


        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 lg:mx-0 lg:px-0 pb-2">
            <TabsList className="inline-flex w-auto min-w-full lg:grid lg:w-full lg:grid-cols-10 bg-white/80 backdrop-blur-sm gap-1 p-1">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Earnings</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Users className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Services</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Reviews</span>
              </TabsTrigger>
              {/* Messages tab hidden — threads remain available internally for the quote flow */}
              {/* <TabsTrigger value="messages" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Messages</span>
              </TabsTrigger> */}
              <TabsTrigger value="profile" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Invoices</span>
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <CreditCard className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Payouts</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <VendorOnboardingChecklist onTabChange={setActiveTab} />

            <VendorDashboardOverview
              vendor={mockVendor}
              bookings={mockBookings}
              invoices={mockInvoices}
            />

            <VendorMetrics
              vendor={mockVendor}
              bookings={mockBookings}
              invoices={mockInvoices}
            />
            {/* <div>
                <VendorCalendarWidget bookings={mockBookings} />
              </div> */}
          </TabsContent>

          {/* <TabsContent value="overview" className="space-y-6">
            <VendorOnboardingChecklist onTabChange={setActiveTab} />
            <VendorDashboardOverview
              vendor={mockVendor}
              bookings={mockBookings}
              invoices={mockInvoices}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <VendorMetrics
                  vendor={mockVendor}
                  bookings={mockBookings}
                  invoices={mockInvoices}
                />
              </div>
            
            </div>
          </TabsContent> */}

          <TabsContent value="bookings">
            {vendor?.id ? (
              <VendorBookingsPanel
                vendorId={vendor.id}
                initialBookingId={searchParams.get('booking_id')}
                onOpenThread={handleOpenThreadFromBooking}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="earnings">
            {/* <EarningsDashboard vendor={mockVendor} /> */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Earnings Management</h3>
                <p className="text-sm sm:text-base text-gray-600">Manage your earnings and financials here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <VendorServices />
            {/* <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-lg font-semibold mb-2">Services Management</h3>
                <p className="text-gray-600">Manage your services and offerings here</p>
              </CardContent>
            </Card> */}
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Reviews Management</h3>
                <p className="text-sm sm:text-base text-gray-600">Manage your reviews and feedback here</p>
              </CardContent>
            </Card>
            {/* {user && (
              <VendorReviewsSection
                vendorId={user.id}
                isVendor={true}
                canWriteReview={false}
              />
            )} */}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {vendor?.id ? (
              vendorThreads.length === 0 ? (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                    <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No messages yet</h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      Planners will reach out here before booking.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {vendorThreads.map((row) => (
                    <ThreadListItem
                      key={row.thread.id}
                      row={row}
                      onClick={() => {
                        setSelectedThreadId(row.thread.id);
                        setSelectedConversationTitle(row.counterpartName);
                        setSelectedCustomerId(row.thread.customerId);
                        setThreadBookingId(row.thread.bookingId);
                        setThreadDrawerOpen(true);
                      }}
                    />
                  ))}
                </div>
              )
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6 md:p-8 text-center text-muted-foreground">
                  Sign in as a vendor to see messages.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 sm:space-y-6">
            <div className=" mx-auto space-y-4 sm:space-y-6">
              {isEditingProfile ? (
                <VendorProfileEdit
                  onSave={() => setIsEditingProfile(false)}
                  onCancel={() => setIsEditingProfile(false)}
                />
              ) : (
                <VendorProfile onEdit={() => setIsEditingProfile(true)} />
              )}
            </div>
          </TabsContent>


          <TabsContent value="analytics">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Analytics Management</h3>
                <p className="text-sm sm:text-base text-gray-600">Manage your analytics and reporting here</p>
              </CardContent>
            </Card>
            {/* <VendorAnalyticsDashboard /> */}
          </TabsContent>

          <TabsContent value="invoices">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                <h3 className="text-base sm:text-lg font-semibold mb-2">Invoice Management</h3>
                <p className="text-sm sm:text-base text-gray-600">Manage your invoices and billing here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4 sm:space-y-6">
            {vendor?.id && user?.id ? (
              <VendorStripePayoutsPanel vendorId={vendor.id} userId={user.id} />
            ) : (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                  <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Payout Management</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sign in and complete your vendor profile to manage payouts.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {vendor?.id && (
          <ThreadDrawer
            open={threadDrawerOpen}
            onOpenChange={(o) => {
              setThreadDrawerOpen(o);
              if (!o) {
                setSelectedThreadId(null);
                setThreadBookingId(null);
              }
            }}
            threadId={selectedThreadId ?? undefined}
            vendorBusinessName={vendor.businessName}
            conversationTitle={selectedConversationTitle || undefined}
            vendorSummary={{
              id: vendor.id,
              businessName: vendor.businessName,
              logoUrl: vendor.logoUrl,
              profileSlug: vendor.profileSlug,
              city: vendor.city,
              state: vendor.state,
            }}
            listVendorId={vendor.id}
            listCustomerId={selectedCustomerId}
            quoteMode="vendor"
            bookingStatus={threadBooking?.status ?? null}
            onWithdrawQuote={(messageId, reason) => {
              if (!threadBookingId) return;
              void withdrawQuoteMutation.mutateAsync({
                bookingId: threadBookingId,
                threadMessageId: messageId,
                reason,
              });
            }}
            isWithdrawingQuote={withdrawQuoteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
