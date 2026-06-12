
import React from 'react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DeleteAccount from '@/components/DeleteAccount';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FavoritesList } from '@/components/FavoritesList';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Settings, Star, MessageSquare } from 'lucide-react';
import { useCustomerThreads } from '@/features/threads/hooks';
import { ThreadListItem } from '@/features/threads/components/ThreadListItem';
import { ThreadDrawer } from '@/features/threads/components/ThreadDrawer';
import type { VendorSummary } from '@/features/threads/types';
import { PlannerBookingsPanel } from '@/features/bookings/components/PlannerBookingsPanel';
import { DashboardAppHeader } from '@/components/layout/DashboardAppHeader';
import {
  useAcceptQuote,
  useBooking,
  useDeclineQuote,
} from '@/features/bookings/hooks';
import type { Booking } from '@/features/bookings/types';

const Dashboard: React.FC = () => {
  const { user, logout } = useConsolidatedAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [threadDrawerOpen, setThreadDrawerOpen] = React.useState(false);
  const [selectedThreadId, setSelectedThreadId] = React.useState<string | null>(null);
  const [selectedVendorTitle, setSelectedVendorTitle] = React.useState('');
  const [selectedVendorId, setSelectedVendorId] = React.useState<string | undefined>();
  const [selectedVendorSummary, setSelectedVendorSummary] =
    React.useState<VendorSummary | null>(null);
  const [threadBookingId, setThreadBookingId] = React.useState<string | null>(null);

  const { data: customerThreads = [] } = useCustomerThreads(user?.id);
  const { data: threadBooking } = useBooking(threadBookingId ?? undefined);
  const acceptQuoteMutation = useAcceptQuote(user?.id);
  const declineQuoteMutation = useDeclineQuote(user?.id);

  const handleOpenThreadFromBooking = (booking: Booking) => {
    if (!booking.threadId) return;
    const row = customerThreads.find((t) => t.thread.id === booking.threadId);
    setThreadBookingId(booking.id);
    setSelectedThreadId(booking.threadId);
    setSelectedVendorTitle(
      row?.counterpartName ?? booking.vendorName ?? 'Vendor',
    );
    setSelectedVendorId(booking.vendorId);
    setSelectedVendorSummary(row?.vendorSummary ?? null);
    setActiveTab('messages');
    setThreadDrawerOpen(true);
  };

  React.useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'messages') {
      setActiveTab('messages');
    }
    if (tab === 'bookings') {
      setActiveTab('bookings');
    }
    if (tab === 'favorites') {
      setActiveTab('favorites');
    }
    const threadId = searchParams.get('thread_id');
    if (threadId) {
      setSelectedThreadId(threadId);
      setActiveTab('messages');
      setThreadDrawerOpen(true);
      const row = customerThreads.find((t) => t.thread.id === threadId);
      if (row) {
        setSelectedVendorTitle(row.counterpartName);
        setSelectedVendorId(row.thread.vendorId);
        setSelectedVendorSummary(row.vendorSummary ?? null);
        if (row.thread.bookingId) {
          setThreadBookingId(row.thread.bookingId);
        }
      }
    }
  }, [searchParams, customerThreads]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-primary/10">
      <DashboardAppHeader role="customer" onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl bg-primary font-bold bg-clip-text text-transparent mb-2">
            Customer Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your profile, bookings, and preferences
          </p>

        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="-mx-4 px-4 lg:mx-0 lg:px-0 pb-2">
            <TabsList
              className="
      grid w-full grid-cols-3
      bg-white/80 backdrop-blur-sm
      gap-1 p-1
    "
            >
              <TabsTrigger value="profile" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Bookings</span>
              </TabsTrigger>

              {/* Messages tab hidden from clients — threads remain available internally for the quote flow */}
              {/* <TabsTrigger
                value="messages"
                className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Messages</span>
              </TabsTrigger> */}

              <TabsTrigger
                value="favorites"
                className="flex items-center justify-center gap-1.5 px-3 py-2 whitespace-nowrap data-[state=active]:bg-white"              >
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Favorites</span>
              </TabsTrigger>

              {/*
    <TabsTrigger
      value="settings"
      className="flex items-center justify-center px-3 py-2 data-[state=active]:bg-white"
    >
      <span className="text-xs sm:text-sm">Settings</span>
    </TabsTrigger>
    */}
            </TabsList>
          </div>


          {/* Profile */}
          <TabsContent value="profile" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <h2 className="text-base sm:text-lg font-semibold mb-4">
                  Profile Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      Name
                    </label>
                    <p className="text-gray-900">
                      {user?.user_metadata?.name ||
                        user?.email?.split("@")[0] ||
                        "Not provided"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            {user?.id ? (
              <PlannerBookingsPanel
                customerId={user.id}
                initialBookingId={searchParams.get('booking_id')}
                onOpenThread={handleOpenThreadFromBooking}
              />
            ) : null}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {customerThreads.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                  <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Visit a vendor profile to start a conversation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {customerThreads.map((row) => (
                  <ThreadListItem
                    key={row.thread.id}
                    row={row}
                    onClick={() => {
                      setSelectedThreadId(row.thread.id);
                      setSelectedVendorTitle(row.counterpartName);
                      setSelectedVendorId(row.thread.vendorId);
                      setSelectedVendorSummary(row.vendorSummary ?? null);
                      setThreadBookingId(row.thread.bookingId);
                      setThreadDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <FavoritesList />
              </CardContent>
            </Card>
          </TabsContent>

          {/*
      <TabsContent value="settings">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <DeleteAccount userType="customer" />
          </CardContent>
        </Card>
      </TabsContent>
      */}
        </Tabs>

        {user?.id && (
          <ThreadDrawer
            open={threadDrawerOpen}
            onOpenChange={(o) => {
              setThreadDrawerOpen(o);
              if (!o) {
                setSelectedThreadId(null);
                setSelectedVendorSummary(null);
                setThreadBookingId(null);
              }
            }}
            threadId={selectedThreadId ?? undefined}
            vendorBusinessName={selectedVendorTitle}
            vendorSummary={selectedVendorSummary}
            listVendorId={selectedVendorId}
            listCustomerId={user.id}
            quoteMode="planner"
            bookingStatus={threadBooking?.status ?? null}
            onAcceptQuote={(messageId) => {
              if (!threadBookingId) return;
              void acceptQuoteMutation.mutateAsync({
                bookingId: threadBookingId,
                threadMessageId: messageId,
              });
            }}
            onDeclineQuote={(messageId, reason) => {
              if (!threadBookingId) return;
              void declineQuoteMutation.mutateAsync({
                bookingId: threadBookingId,
                threadMessageId: messageId,
                reason,
              });
            }}
            isAcceptingQuote={acceptQuoteMutation.isPending}
            isDecliningQuote={declineQuoteMutation.isPending}
          />
        )}
      </div>
    </div>

  );
};

export default Dashboard;
