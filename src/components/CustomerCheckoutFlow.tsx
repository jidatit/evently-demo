
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Calendar, Clock, User } from 'lucide-react';
import { PaymentOptionsSection } from './PaymentOptionsSection';
import { useToast } from '@/hooks/use-toast';

interface CheckoutData {
  vendor: {
    business_name: string;
    location: string;
  };
  service: {
    name: string;
    price: number;
    duration_minutes: number;
  };
  booking: {
    customer_name: string;
    customer_email: string;
    booking_date: string;
    start_time: string;
    notes?: string;
  };
}

interface CustomerCheckoutFlowProps {
  checkoutData: CheckoutData;
  onBack: () => void;
  onPaymentSuccess: (paymentData: any) => void;
}

export const CustomerCheckoutFlow: React.FC<CustomerCheckoutFlowProps> = ({
  checkoutData,
  onBack,
  onPaymentSuccess
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();

  const handlePaymentSubmit = async (paymentMethod: string, paymentData: any) => {
    setIsProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would integrate with Stripe/PayPal
      const processedPayment = {
        paymentMethod,
        ...paymentData,
        bookingDetails: checkoutData.booking,
        vendorDetails: checkoutData.vendor,
        serviceDetails: checkoutData.service,
        timestamp: new Date().toISOString(),
        transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`
      };

      toast({
        title: 'Payment Successful!',
        description: 'Your booking has been confirmed. You will receive a confirmation email shortly.',
      });

      onPaymentSuccess(processedPayment);
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an issue processing your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Complete Your Booking</h2>
          <p className="text-gray-600">Review and pay for your service</p>
        </div>
      </div>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vendor Info */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{checkoutData.vendor.business_name}</h3>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                {checkoutData.vendor.location}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{checkoutData.service.name}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {checkoutData.service.duration_minutes} minutes
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="font-semibold">
                ${checkoutData.service.price}
              </Badge>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                {new Date(checkoutData.booking.booking_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{checkoutData.booking.start_time}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600">
              <strong>Customer:</strong> {checkoutData.booking.customer_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {checkoutData.booking.customer_email}
            </p>
            {checkoutData.booking.notes && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Notes:</strong> {checkoutData.booking.notes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <PaymentOptionsSection
        serviceAmount={checkoutData.service.price}
        onPaymentSubmit={handlePaymentSubmit}
        isProcessing={isProcessingPayment}
      />
    </div>
  );
};
