import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, User, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedRateLimit } from '@/hooks/useEnhancedRateLimit';
import { supabase } from '@/integrations/supabase/client';

interface SecureBookingsManagerProps {
  vendor: any;
  bookings: any[];
  services: any[];
  onBookingsUpdate: (bookings: any[]) => void;
  onGenerateInvoice: (bookingId: string) => void;
  serviceLoading: boolean;
}

export const SecureBookingsManager: React.FC<SecureBookingsManagerProps> = ({
  vendor,
  bookings,
  services,
  onBookingsUpdate,
  onGenerateInvoice,
  serviceLoading
}) => {
  const { toast } = useToast();
  const { checkRateLimit } = useEnhancedRateLimit();
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    customerName: '',
    customerEmail: '',
    serviceId: '',
    bookingDate: '',
    startTime: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setNewBooking(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Simple client-side validation function
  const validateFormData = (data: Record<string, string>) => {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, string> = {};
    
    // Validate each field
    Object.entries(data).forEach(([key, value]) => {
      // Basic sanitization - remove dangerous characters
      const sanitized = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
      
      sanitizedData[key] = sanitized;
      
      // Basic validation
      if (!sanitized && key !== 'notes') {
        errors[key] = [`${key} is required`];
      }
      
      // Email validation
      if (key === 'customerEmail' && sanitized) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          errors[key] = ['Please enter a valid email address'];
        }
      }
      
      // Length validation
      const maxLengths: Record<string, number> = {
        customerName: 100,
        customerEmail: 255,
        serviceId: 50,
        bookingDate: 20,
        startTime: 10,
        notes: 1000
      };
      
      if (sanitized.length > (maxLengths[key] || 255)) {
        errors[key] = [`${key} is too long`];
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    };
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vendor?.id) {
      toast({
        title: 'Error',
        description: 'Vendor information not available',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingBooking(true);

    try {
      // Rate limiting check
      const rateLimitResult = await checkRateLimit(
        `booking_creation_${vendor.id}`,
        'booking_creation',
        5, // max 5 bookings per hour
        60 // 1 hour window
      );

      if (!rateLimitResult.allowed) {
        toast({
          title: 'Rate Limit Exceeded',
          description: `Too many booking attempts. Please try again after ${rateLimitResult.reset_time ? new Date(rateLimitResult.reset_time).toLocaleTimeString() : 'some time'}`,
          variant: 'destructive'
        });
        return;
      }

      // Client-side validation
      const validationResult = validateFormData({
        customerName: newBooking.customerName,
        customerEmail: newBooking.customerEmail,
        serviceId: newBooking.serviceId,
        bookingDate: newBooking.bookingDate,
        startTime: newBooking.startTime,
        notes: newBooking.notes || '' // Allow empty notes
      });

      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors).flat();
        toast({
          title: 'Validation Error',
          description: errorMessages.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Find selected service
      const selectedService = services.find(s => s.id === newBooking.serviceId);
      if (!selectedService) {
        toast({
          title: 'Error',
          description: 'Selected service not found',
          variant: 'destructive'
        });
        return;
      }

      // Create booking directly with Supabase - matching the actual database schema
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          vendor_id: vendor.id,
          service_name: selectedService.name,
          customer_name: validationResult.sanitizedData.customerName,
          customer_email: validationResult.sanitizedData.customerEmail,
          booking_date: validationResult.sanitizedData.bookingDate,
          start_time: validationResult.sanitizedData.startTime,
          total_amount: selectedService.price,
          status: 'pending',
          notes: validationResult.sanitizedData.notes || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Booking creation error:', error);
        toast({
          title: 'Error',
          description: 'Failed to create booking. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Update local bookings state
      onBookingsUpdate([...bookings, data]);

      // Reset form
      setNewBooking({
        customerName: '',
        customerEmail: '',
        serviceId: '',
        bookingDate: '',
        startTime: '',
        notes: ''
      });

      toast({
        title: 'Success',
        description: 'Booking created successfully!',
      });

    } catch (error: any) {
      console.error('Booking creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create booking',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Booking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Create New Booking
          </CardTitle>
          <CardDescription>
            Add a new booking for your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={newBooking.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={newBooking.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  placeholder="customer@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="serviceId">Service</Label>
                <select
                  id="serviceId"
                  value={newBooking.serviceId}
                  onChange={(e) => handleInputChange('serviceId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bookingDate">Date</Label>
                <Input
                  id="bookingDate"
                  type="date"
                  value={newBooking.bookingDate}
                  onChange={(e) => handleInputChange('bookingDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newBooking.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newBooking.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requirements or notes..."
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="bg-lime-500 hover:bg-lime-600 text-black"
              disabled={isCreatingBooking}
            >
              {isCreatingBooking ? 'Creating...' : 'Create Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Bookings</CardTitle>
          <CardDescription>
            Manage your current and past bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600">Create your first booking using the form above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{booking.service_name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {booking.customer_name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(booking.booking_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {booking.start_time}
                          </span>
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            <FileText className="h-4 w-4 inline mr-1" />
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <div className="text-sm font-medium text-gray-900">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        ${booking.total_amount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="space-y-1">
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onGenerateInvoice(booking.id)}
                            disabled={serviceLoading}
                            className="w-full"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {serviceLoading ? 'Generating...' : 'Generate Invoice'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureBookingsManager;
