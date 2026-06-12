
import React from 'react';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PWANotificationManager } from '@/components/PWANotificationManager';
import { MobileBookingCard } from '@/components/MobileBookingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  CreditCard, 
  Star, 
  TrendingUp,
  Clock,
  MapPin 
} from 'lucide-react';

export const MobileDashboard: React.FC = () => {
  // Mock data for demonstration
  const mockVendors = [
    {
      id: '1',
      business_name: 'Sarah\'s Photography Studio',
      category: 'Photography',
      location: 'Downtown, City Center',
      rating: 4.8,
      pricing_start: 299
    },
    {
      id: '2', 
      business_name: 'DJ Mike\'s Sound',
      category: 'Music & DJ',
      location: 'Westside District',
      rating: 4.6,
      pricing_start: 150
    }
  ];

  const handleBook = (vendorId: string) => {
    console.log('Booking vendor:', vendorId);
  };

  const handleViewDetails = (vendorId: string) => {
    console.log('Viewing vendor details:', vendorId);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PWANotificationManager />
      
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Welcome back!</h1>
              <p className="text-sm text-muted-foreground">Plan your perfect event</p>
            </div>
            <div className="w-10 h-10 bg-lime-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">J</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-lime-50 to-green-50 border-lime-200">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-lime-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-lime-700">3</div>
              <div className="text-xs text-lime-600">Upcoming Events</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">$1,250</div>
              <div className="text-xs text-blue-600">Budget Remaining</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-lime-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Booking confirmed</p>
                <p className="text-xs text-muted-foreground">Sarah's Photography - Tomorrow 2:00 PM</p>
              </div>
              <Badge variant="secondary" className="text-xs">New</Badge>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment processed</p>
                <p className="text-xs text-muted-foreground">DJ Mike's Sound - $150.00</p>
              </div>
              <Badge variant="outline" className="text-xs">Paid</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Vendors */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommended for You</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {mockVendors.map(vendor => (
              <MobileBookingCard
                key={vendor.id}
                vendor={vendor}
                onBook={handleBook}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-r from-lime-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <h3 className="font-bold mb-2">Ready to Book More?</h3>
            <p className="text-sm opacity-90 mb-4">
              Discover amazing vendors in your area
            </p>
            <Button variant="secondary" size="sm" className="bg-white text-lime-700 hover:bg-gray-100">
              <Star className="h-4 w-4 mr-2" />
              Browse Vendors
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
};
