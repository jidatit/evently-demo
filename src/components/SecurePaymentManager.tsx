import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle, DollarSign, Eye } from 'lucide-react';
import { securityMonitoring } from '@/lib/enhanced-security-monitoring';

interface SecurePayment {
  id: string;
  booking_id: string;
  amount: number;
  payment_status: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
}

interface SecurePaymentManagerProps {
  vendorId: string;
}

export const SecurePaymentManager: React.FC<SecurePaymentManagerProps> = ({ vendorId }) => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<SecurePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && vendorId) {
      fetchSecurePayments();
    }
  }, [user, vendorId]);

  const fetchSecurePayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Log the payment data access attempt
      await securityMonitoring.logSecurityEvent({
        event_type: 'SECURE_PAYMENT_DATA_ACCESS_ATTEMPT',
        details: {
          vendor_id: vendorId,
          access_method: 'secure_payment_manager',
          security_level: 'enhanced'
        },
        severity: 'high',
        category: 'financial_data_access'
      });

      // Use the new secure payment function
      const { data, error: paymentError } = await supabase.rpc('get_vendor_payments_secure', {
        vendor_id_param: vendorId
      });

      if (paymentError) {
        throw paymentError;
      }

      setPayments(data || []);

      // Log successful secure payment access
      await securityMonitoring.logSecurityEvent({
        event_type: 'SECURE_PAYMENT_DATA_ACCESS_SUCCESS',
        details: {
          vendor_id: vendorId,
          payment_count: data?.length || 0,
          security_level: 'enhanced'
        },
        severity: 'medium',
        category: 'financial_data_access'
      });

    } catch (error: any) {
      console.error('Error fetching secure payments:', error);
      setError(error.message || 'Failed to load payment data');

      // Log payment access failure
      await securityMonitoring.logSecurityEvent({
        event_type: 'SECURE_PAYMENT_DATA_ACCESS_FAILED',
        details: {
          vendor_id: vendorId,
          error: error.message,
          security_level: 'enhanced'
        },
        severity: 'high',
        category: 'financial_data_access'
      });
    } finally {
      setLoading(false);
    }
  };

  const logPaymentView = async (paymentId: string) => {
    await securityMonitoring.logSecurityEvent({
      event_type: 'PAYMENT_DETAILS_VIEWED',
      details: {
        payment_id_hash: paymentId.substring(0, 8),
        vendor_id: vendorId,
        security_level: 'critical'
      },
      severity: 'high',
      category: 'sensitive_data_access'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
            <span>Loading secure payment data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={fetchSecurePayments} 
            variant="outline" 
            className="mt-4"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Secure Payment Manager
            <Badge variant="outline" className="text-green-600 border-green-600">
              Enhanced Security
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This payment manager implements enhanced security measures to protect customer payment data. 
              Only payments from your own bookings are accessible, and all access is logged for audit purposes.
            </AlertDescription>
          </Alert>

          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">
                          Payment: ${payment.amount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Customer: {payment.customer_name} ({payment.customer_email}) • 
                          Booking: {payment.booking_id.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}
                    >
                      {payment.payment_status}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => logPaymentView(payment.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
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