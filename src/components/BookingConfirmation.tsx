
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Star,
  Download,
  Share,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';

interface BookingConfirmationProps {
  booking: {
    id: string;
    vendor: {
      business_name: string;
      category: string;
      logo_url?: string;
      contact_email: string;
      contact_phone: string;
    };
    service: {
      name: string;
      price: number;
    };
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    event: {
      type: string;
      date: Date;
      time: string;
      duration: string;
      location: string;
      guestCount: string;
      specialRequests?: string;
    };
    payment: {
      method: string;
      total: number;
      transactionId: string;
    };
  };
  onNewBooking: () => void;
  onDownloadReceipt: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  onNewBooking,
  onDownloadReceipt
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">
            Booking Confirmed! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Your event is all set! Get ready for an amazing experience.
          </p>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Vendor Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {booking.vendor.logo_url && (
                  <img 
                    src={booking.vendor.logo_url} 
                    alt={booking.vendor.business_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">{booking.vendor.business_name}</h3>
                  <Badge className="bg-purple-100 text-purple-700 mt-1">
                    {booking.vendor.category}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Service</h4>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium">{booking.service.name}</span>
                  <span className="text-lg font-bold text-purple-600">
                    ${booking.service.price}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${booking.vendor.contact_email}`} className="hover:text-purple-600">
                      {booking.vendor.contact_email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${booking.vendor.contact_phone}`} className="hover:text-purple-600">
                      {booking.vendor.contact_phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <Star className="h-4 w-4 fill-current" />
                <span className="text-gray-600 ml-1">(127 reviews)</span>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-semibold">{format(booking.event.date, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-semibold">{booking.event.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-purple-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{booking.event.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Event Type</p>
                  <p className="font-semibold">{booking.event.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="font-semibold">{booking.event.guestCount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold">{booking.event.duration}</p>
              </div>

              {booking.event.specialRequests && (
                <div>
                  <p className="text-sm text-gray-500">Special Requests</p>
                  <p className="font-semibold text-sm bg-gray-50 p-3 rounded-lg">
                    {booking.event.specialRequests}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer & Payment Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Customer Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">{booking.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold">{booking.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-semibold">{booking.customer.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Service Cost</span>
                <span className="font-semibold">${booking.service.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="font-semibold">${(booking.service.price * 0.029).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Paid</span>
                <span className="text-green-600">${booking.payment.total}</span>
              </div>
              <div className="pt-2">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-semibold">{booking.payment.method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm">{booking.payment.transactionId}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* What's Next */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Confirmation Email</h4>
                <p className="text-sm text-gray-600">You'll receive a detailed confirmation email within 5 minutes</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Vendor Contact</h4>
                <p className="text-sm text-gray-600">The vendor will contact you within 24 hours to finalize details</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold mb-1">Event Day</h4>
                <p className="text-sm text-gray-600">Enjoy your perfectly planned event!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            onClick={onDownloadReceipt}
            variant="outline"
            size="lg"
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Booking
          </Button>

          <Button
            onClick={onNewBooking}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            Book Another Event
          </Button>
        </div>

        {/* Booking ID */}
        <div className="text-center mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Booking ID: <span className="font-mono font-semibold">{booking.id}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
