import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Plus, Calendar, Clock, User, Phone, Mail, DollarSign, Receipt } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BookingsManagerProps {
  vendor: any;
  bookings: any[];
  services: any[];
  onBookingsUpdate: (bookings: any[]) => void;
  onGenerateInvoice: (bookingId: string) => void;
  serviceLoading: boolean;
}

const BookingsManager: React.FC<BookingsManagerProps> = ({ 
  vendor, 
  bookings, 
  services, 
  onBookingsUpdate, 
  onGenerateInvoice,
  serviceLoading 
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    service_name: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    total_amount: ''
  });

  const handleBookingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBookingForm({ ...bookingForm, [e.target.name]: e.target.value });
  };

  const refreshBookings = async () => {
    try {
      // Use secure function for booking data access with comprehensive audit logging
      const { data: bookingsData, error } = await supabase
        .rpc('get_vendor_bookings_secure', { vendor_id_param: vendor.id });
      
      if (error) {
        console.error('Secure booking fetch error:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch bookings securely. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      onBookingsUpdate(bookingsData || []);
    } catch (error: any) {
      console.error('Exception fetching bookings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bookings',
        variant: 'destructive',
      });
    }
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: newBooking, error } = await supabase.from('bookings').insert([
        {
          vendor_id: vendor.id,
          customer_name: bookingForm.customer_name,
          customer_email: bookingForm.customer_email || null,
          customer_phone: bookingForm.customer_phone || null,
          service_name: bookingForm.service_name,
          booking_date: bookingForm.booking_date,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time || null,
          notes: bookingForm.notes || null,
          total_amount: bookingForm.total_amount ? parseFloat(bookingForm.total_amount) : null
        }
      ]).select().single();

      if (error) throw error;
      
      await refreshBookings();
      
      // Auto-generate invoice for the new booking
      if (newBooking && bookingForm.total_amount) {
        try {
          console.log('Auto-generating invoice for booking:', newBooking.id);
          await onGenerateInvoice(newBooking.id);
          
          toast({
            title: 'Success',
            description: 'Booking created and invoice generated successfully!',
          });
        } catch (invoiceError) {
          console.error('Failed to auto-generate invoice:', invoiceError);
          toast({
            title: 'Booking Created',
            description: 'Booking created but invoice generation failed. You can generate it manually.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'Booking added successfully!',
        });
      }
      
      setBookingForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        service_name: '',
        booking_date: '',
        start_time: '',
        end_time: '',
        notes: '',
        total_amount: ''
      });
      setShowBookingDialog(false);
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add booking',
        variant: 'destructive',
      });
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.filter(booking => booking.booking_date === dateStr);
  };

  const getUpcomingBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings.filter(booking => new Date(booking.booking_date) >= today);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">Bookings</h3>
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild>
            <Button className="bg-lime-500 text-black hover:bg-black hover:text-lime-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Booking</DialogTitle>
              <DialogDescription>
                Create a new booking for your services. An invoice will be automatically generated if you include an amount.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddBooking} className="space-y-4">
              <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  name="customer_name"
                  value={bookingForm.customer_name}
                  onChange={handleBookingChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer_email">Customer Email</Label>
                <Input
                  id="customer_email"
                  name="customer_email"
                  type="email"
                  value={bookingForm.customer_email}
                  onChange={handleBookingChange}
                  placeholder="Required for invoice email"
                />
              </div>
              <div>
                <Label htmlFor="customer_phone">Customer Phone</Label>
                <Input
                  id="customer_phone"
                  name="customer_phone"
                  value={bookingForm.customer_phone}
                  onChange={handleBookingChange}
                />
              </div>
              <div>
                <Label htmlFor="service_name">Service</Label>
                <Input
                  id="service_name"
                  name="service_name"
                  value={bookingForm.service_name}
                  onChange={handleBookingChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="booking_date">Date</Label>
                <Input
                  id="booking_date"
                  name="booking_date"
                  type="date"
                  value={bookingForm.booking_date}
                  onChange={handleBookingChange}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={bookingForm.start_time}
                    onChange={handleBookingChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={bookingForm.end_time}
                    onChange={handleBookingChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="total_amount">Total Amount ($)</Label>
                <Input
                  id="total_amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  value={bookingForm.total_amount}
                  onChange={handleBookingChange}
                  placeholder="Enter amount to auto-generate invoice"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={serviceLoading}>
                Add Booking & Generate Invoice
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-3 text-black">Calendar</h4>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
          {selectedDate && (
            <div className="mt-4">
              <h5 className="font-medium mb-2 text-black">
                Bookings for {format(selectedDate, 'MMMM d, yyyy')}:
              </h5>
              {getBookingsForDate(selectedDate).length > 0 ? (
                <div className="space-y-2">
                  {getBookingsForDate(selectedDate).map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-black">{booking.service_name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGenerateInvoice(booking.id)}
                          disabled={serviceLoading}
                        >
                          <Receipt className="w-3 h-3 mr-1" />
                          Invoice
                        </Button>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <User className="w-3 h-3 mr-1" />
                        <span>{booking.customer_name}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{booking.start_time}{booking.end_time && ` - ${booking.end_time}`}</span>
                      </div>
                      {booking.customer_email && (
                        <div className="flex items-center text-gray-600 mb-1">
                          <Mail className="w-3 h-3 mr-1" />
                          <span>{booking.customer_email}</span>
                        </div>
                      )}
                      {booking.customer_phone && (
                        <div className="flex items-center text-gray-600 mb-1">
                          <Phone className="w-3 h-3 mr-1" />
                          <span>{booking.customer_phone}</span>
                        </div>
                      )}
                      {booking.total_amount && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="w-3 h-3 mr-1" />
                          <span>${booking.total_amount}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No bookings for this date.</p>
              )}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-black">Upcoming Bookings</h4>
          {getUpcomingBookings().length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {getUpcomingBookings().map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-black">{booking.service_name}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGenerateInvoice(booking.id)}
                      disabled={serviceLoading}
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Invoice
                    </Button>
                  </div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <User className="w-3 h-3 mr-1" />
                    <span>{booking.customer_name}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{booking.start_time}{booking.end_time && ` - ${booking.end_time}`}</span>
                  </div>
                  {booking.total_amount && (
                    <div className="flex items-center text-green-600">
                      <DollarSign className="w-3 h-3 mr-1" />
                      <span>${booking.total_amount}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming bookings.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingsManager;
