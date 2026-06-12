import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Building2,
  Shield,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export const VendorPayments: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  
  const [payoutSettings, setPayoutSettings] = useState({
    method: 'bank_account',
    bank_account: {
      account_holder: 'Dream Events Co.',
      routing_number: '****1234',
      account_number: '****5678',
      account_type: 'checking'
    },
    schedule: 'weekly',
    minimum_amount: 50.00
  });

  const [earnings] = useState({
    available: 1250.00,
    pending: 340.00,
    total_earned: 15670.00,
    last_payout: 890.00,
    last_payout_date: '2024-01-05'
  });

  const handleStripeConnect = async () => {
    setLoading(true);
    
    try {
      // Simulate Stripe connection flow
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      setStripeConnected(true);
      toast({
        title: "💸 Payment settings updated!",
        description: "Your Stripe account has been successfully connected.",
      });
    } catch (error) {
      toast({
        title: "⚠️ Failed to update payment settings",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (earnings.available < payoutSettings.minimum_amount) {
      toast({
        title: "⚠️ Insufficient funds",
        description: `Minimum payout amount is $${payoutSettings.minimum_amount}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "💰 Payout requested successfully!",
        description: "Your payout will be processed within 1-2 business days.",
      });
    } catch (error) {
      toast({
        title: "⚠️ Failed to process payout",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRole="vendor" redirectTo="/become-vendor">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vendor-dashboard')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  Payment Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage your payout preferences and earnings
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Earnings Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-party border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-muted-foreground">Available</span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Ready
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-2">
                      ${earnings.available.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available for payout
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-party border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-accent" />
                        <span className="text-sm font-medium text-muted-foreground">Pending</span>
                      </div>
                      <Badge variant="outline" className="border-accent/20 text-accent">
                        Processing
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-2">
                      ${earnings.pending.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Processing (1-2 days)
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Total Earnings */}
              <Card className="shadow-party">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Total Earned
                      </h3>
                      <p className="text-3xl font-bold gradient-party bg-clip-text text-transparent">
                        ${earnings.total_earned.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Last payout: ${earnings.last_payout.toFixed(2)} on {earnings.last_payout_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <Button
                        onClick={handlePayoutRequest}
                        disabled={loading || earnings.available < payoutSettings.minimum_amount}
                        className="gradient-party text-white shadow-party hover:shadow-party-hover"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Request Payout'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stripe Connection */}
              <Card className="shadow-party">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Provider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Stripe</h4>
                        <p className="text-sm text-muted-foreground">
                          Secure payment processing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stripeConnected ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-primary" />
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            Connected
                          </Badge>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-muted-foreground" />
                          <Badge variant="outline">
                            Not Connected
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>

                  {!stripeConnected && (
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground mb-1">
                            Connect Your Stripe Account
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Connect your Stripe account to receive payments from customers securely.
                            This is required to accept payments and receive payouts.
                          </p>
                          <Button
                            onClick={handleStripeConnect}
                            disabled={loading}
                            className="gradient-party text-white"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Connect Stripe Account'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Payout Settings */}
            <div className="space-y-6">
              <Card className="shadow-party">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Payout Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Payout Schedule
                    </label>
                    <select
                      value={payoutSettings.schedule}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        schedule: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">
                      Minimum Payout Amount
                    </label>
                    <Input
                      type="number"
                      value={payoutSettings.minimum_amount}
                      onChange={(e) => setPayoutSettings({
                        ...payoutSettings,
                        minimum_amount: parseFloat(e.target.value) || 0
                      })}
                      className="border-border focus:border-primary"
                      min="10"
                      step="0.01"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Bank Account Info */}
              <Card className="shadow-party">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Bank Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Holder</span>
                      <span className="text-sm font-medium text-foreground">
                        {payoutSettings.bank_account.account_holder}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Routing Number</span>
                      <span className="text-sm font-medium text-foreground">
                        {payoutSettings.bank_account.routing_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Number</span>
                      <span className="text-sm font-medium text-foreground">
                        {payoutSettings.bank_account.account_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Type</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {payoutSettings.bank_account.account_type}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    Update Bank Info
                  </Button>
                </CardContent>
              </Card>

              {/* Security Note */}
              <Card className="shadow-party border-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">
                        Secure & Protected
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        All payment information is encrypted and securely stored. 
                        We never store your full banking details.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};