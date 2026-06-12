
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Smartphone, Shield, DollarSign, Info } from 'lucide-react';

interface PaymentOptionsSectionProps {
  serviceAmount: number;
  onPaymentSubmit: (paymentMethod: string, paymentData: any) => void;
  isProcessing?: boolean;
}

export const PaymentOptionsSection: React.FC<PaymentOptionsSectionProps> = ({
  serviceAmount,
  onPaymentSubmit,
  isProcessing = false
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  // Calculate breakdown
  const serviceFee = Math.round(serviceAmount * 0.029 * 100) / 100; // 2.9% service fee
  const vendorFee = serviceAmount;
  const totalAmount = vendorFee + serviceFee;

  const handleCardInputChange = (field: string, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handlePaymentSubmit = () => {
    let paymentData = {};
    
    if (selectedPaymentMethod === 'card') {
      paymentData = {
        cardNumber: cardDetails.number.replace(/\s/g, ''),
        expiryDate: cardDetails.expiry,
        cvc: cardDetails.cvc,
        cardholderName: cardDetails.name
      };
    }

    onPaymentSubmit(selectedPaymentMethod, {
      ...paymentData,
      amount: totalAmount,
      breakdown: {
        serviceFee,
        vendorFee,
        total: totalAmount
      }
    });
  };

  const isFormValid = () => {
    if (selectedPaymentMethod === 'card') {
      return cardDetails.number.replace(/\s/g, '').length >= 16 &&
             cardDetails.expiry.length >= 5 &&
             cardDetails.cvc.length >= 3 &&
             cardDetails.name.trim().length > 0;
    }
    return true; // Digital wallets handle their own validation
  };

  return (
    <div className="space-y-6">
      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <Shield className="h-4 w-4 text-green-600" />
        <span className="text-sm font-medium text-green-800">
          Secure Payment • SSL Encrypted
        </span>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Service Cost</span>
            <span className="font-medium">${vendorFee.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Platform Fee</span>
              <Info className="h-3 w-3 text-gray-400" />
            </div>
            <span className="font-medium">${serviceFee.toFixed(2)}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Method Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card Payment */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPaymentMethod === 'card' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPaymentMethod('card')}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm font-medium">Card</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">Visa</Badge>
                  <Badge variant="outline" className="text-xs">MC</Badge>
                </div>
              </div>
            </div>

            {/* Apple Pay */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPaymentMethod === 'apple-pay' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPaymentMethod('apple-pay')}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <Smartphone className="h-6 w-6" />
                <span className="text-sm font-medium">Apple Pay</span>
                <Badge variant="outline" className="text-xs">Touch ID</Badge>
              </div>
            </div>

            {/* Google Pay */}
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPaymentMethod === 'google-pay' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPaymentMethod('google-pay')}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <Smartphone className="h-6 w-6" />
                <span className="text-sm font-medium">Google Pay</span>
                <Badge variant="outline" className="text-xs">Quick</Badge>
              </div>
            </div>
          </div>

          {/* Card Details Form */}
          {selectedPaymentMethod === 'card' && (
            <div className="space-y-4 mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => handleCardInputChange('number', formatCardNumber(e.target.value))}
                  maxLength={19}
                  className="font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      handleCardInputChange('expiry', value);
                    }}
                    maxLength={5}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvc">CVC</Label>
                  <Input
                    id="cvc"
                    placeholder="123"
                    value={cardDetails.cvc}
                    onChange={(e) => handleCardInputChange('cvc', e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardDetails.name}
                  onChange={(e) => handleCardInputChange('name', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Digital Wallet Instructions */}
          {(selectedPaymentMethod === 'apple-pay' || selectedPaymentMethod === 'google-pay') && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    {selectedPaymentMethod === 'apple-pay' ? 'Apple Pay' : 'Google Pay'} Ready
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Click "Pay Now" and authenticate with your {selectedPaymentMethod === 'apple-pay' ? 'Touch ID, Face ID, or passcode' : 'fingerprint or PIN'}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Button */}
      <Button 
        onClick={handlePaymentSubmit}
        disabled={!isFormValid() || isProcessing}
        className="w-full h-12 text-lg font-semibold"
        size="lg"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </div>
        ) : (
          <>
            <Shield className="h-4 w-4 mr-2" />
            Pay ${totalAmount.toFixed(2)} Securely
          </>
        )}
      </Button>

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is encrypted and secure. We never store your card details.
      </p>
    </div>
  );
};
