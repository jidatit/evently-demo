import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CSRFProtectedForm, useCSRF } from './EnhancedCSRFProtection';
import { CustomerCheckoutFlow } from './CustomerCheckoutFlow';
import { useEnhancedInputValidation } from '@/hooks/useEnhancedInputValidation';
import { useToast } from '@/hooks/use-toast';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

const bookingSchema = z.object({
  customerName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  customerEmail: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  customerPhone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .optional(),
  serviceName: z.string()
    .min(1, 'Service name is required')
    .max(200, 'Service name must be less than 200 characters'),
  bookingDate: z.string()
    .min(1, 'Booking date is required'),
  startTime: z.string()
    .min(1, 'Start time is required'),
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface SecureBookingFormProps {
  vendorId: string;
  onSuccess?: () => void;
}

export const SecureBookingForm: React.FC<SecureBookingFormProps> = ({ vendorId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const { validateInput } = useEnhancedInputValidation();
  const { csrfToken } = useCSRF();
  const { user } = useConsolidatedAuth();
  const { toast } = useToast();

  // Check authentication before allowing booking
  if (!user) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
        <p className="text-gray-600 mb-4">Please log in to book this service.</p>
        <Button 
          onClick={() => {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/auth';
          }}
          className="bg-lime-500 hover:bg-lime-600 text-black"
        >
          Log In to Book
        </Button>
      </div>
    );
  }

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      serviceName: '',
      bookingDate: '',
      startTime: '',
      notes: ''
    }
  });

  const handleSecureSubmit = async (formData: FormData, token: string) => {
    setIsSubmitting(true);
    
    try {
      const data = Object.fromEntries(formData.entries()) as Record<string, string>;
      
      // Enhanced input validation
      const validationResults = await Promise.all([
        validateInput(data.customerName, { maxLength: 100, fieldName: 'Customer Name' }),
        validateInput(data.customerEmail, { maxLength: 255, fieldName: 'Email' }),
        validateInput(data.serviceName, { maxLength: 200, fieldName: 'Service Name' }),
        validateInput(data.notes || '', { maxLength: 1000, allowHtml: false, fieldName: 'Notes' })
      ]);

      // Check if any validation failed
      const hasValidationErrors = validationResults.some(result => !result.is_valid);
      if (hasValidationErrors) {
        const errors = validationResults.flatMap(result => result.errors).join(', ');
        throw new Error(`Validation failed: ${errors}`);
      }

      // Use sanitized data
      const sanitizedData = {
        vendor_id: vendorId,
        customer_id: user.id,
        customer_name: validationResults[0].sanitized,
        customer_email: validationResults[1].sanitized || user.email,
        customer_phone: data.customerPhone,
        service_name: validationResults[2].sanitized,
        booking_date: data.bookingDate,
        start_time: data.startTime,
        notes: validationResults[3].sanitized || null,
        csrf_token: token
      };

      const mockVendorData = {
        business_name: 'Professional Service Provider',
        location: 'Your Location'
      };

      const mockServiceData = {
        name: sanitizedData.service_name,
        price: 150, // This would come from actual service data
        duration_minutes: 60
      };

      const bookingData = {
        vendor_id: vendorId,
        customer_id: user.id,
        customer_name: validationResults[0].sanitized,
        customer_email: validationResults[1].sanitized || user.email,
        customer_phone: data.customerPhone,
        service_name: validationResults[2].sanitized,
        booking_date: data.bookingDate,
        start_time: data.startTime,
        notes: validationResults[3].sanitized || null,
        csrf_token: token
      };

      setCheckoutData({
        vendor: mockVendorData,
        service: mockServiceData,
        booking: bookingData
      });

      setShowCheckout(true);
    } catch (error: any) {
      console.error('Booking preparation error:', error);
      toast({
        title: 'Booking Failed',
        description: error.message || 'Failed to prepare booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Create the actual booking after successful payment
      const { error } = await supabase
        .from('bookings')
        .insert([{
          ...checkoutData.booking,
          payment_status: 'paid'
        }]);

      if (error) throw error;

      toast({
        title: 'Booking Confirmed!',
        description: 'Your booking has been successfully created and paid.',
      });

      form.reset();
      setShowCheckout(false);
      setCheckoutData(null);
      onSuccess?.();
    } catch (error: any) {
      console.error('Final booking creation error:', error);
      toast({
        title: 'Booking Error',
        description: 'Payment was successful but there was an issue saving your booking. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToForm = () => {
    setShowCheckout(false);
    setCheckoutData(null);
  };

  if (showCheckout && checkoutData) {
    return (
      <CustomerCheckoutFlow
        checkoutData={checkoutData}
        onBack={handleBackToForm}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <CSRFProtectedForm onSubmit={handleSecureSubmit} className="space-y-6">
      <Form {...form}>
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                  maxLength={100}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter your email address"
                  disabled={isSubmitting}
                  maxLength={255}
                  defaultValue={user.email || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="Enter your phone number"
                  disabled={isSubmitting}
                  maxLength={20}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serviceName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Required *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Describe the service you need"
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="bookingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    disabled={isSubmitting}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="time"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Any additional information or special requests"
                  disabled={isSubmitting}
                  maxLength={1000}
                  rows={4}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting || !csrfToken}
          className="w-full"
        >
          {isSubmitting ? 'Preparing Checkout...' : 'Continue to Payment'}
        </Button>
      </Form>
    </CSRFProtectedForm>
  );
};
