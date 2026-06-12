
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

interface ContractCreatorProps {
  vendor: any;
  bookings: any[];
  onContractCreated: () => void;
  onCancel: () => void;
}

const ContractCreator: React.FC<ContractCreatorProps> = ({
  vendor,
  bookings,
  onContractCreated,
  onCancel
}) => {
  const { toast } = useToast();
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [contractTerms, setContractTerms] = useState(`
1. Service Delivery: The vendor agrees to provide the services as described in the booking.
2. Payment: Payment is due as per the agreed terms in the booking.
3. Cancellation: Any cancellations must be made at least 48 hours in advance.
4. Liability: Both parties agree to the terms of liability as outlined in our service agreement.
5. Dispute Resolution: Any disputes will be resolved through mediation first, then arbitration if necessary.
  `.trim());
  const [submitting, setSubmitting] = useState(false);

  const selectedBooking = bookings.find(b => b.id === selectedBookingId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !contractContent.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a booking and enter contract content',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Get customer ID from booking email
      let customerId = selectedBooking?.customer_id;
      
      if (!customerId && selectedBooking?.customer_email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', selectedBooking.customer_email)
          .single();
        customerId = profile?.id;
      }

      const { error } = await supabase.from('contracts').insert({
        booking_id: selectedBookingId,
        vendor_id: vendor.id,
        customer_id: customerId,
        contract_content: contractContent,
        contract_terms: contractTerms
      });

      if (error) throw error;
      onContractCreated();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contract',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const generateContractContent = () => {
    if (!selectedBooking) return;

    const content = `
SERVICE AGREEMENT

This agreement is between ${vendor.business_name} (Vendor) and ${selectedBooking.customer_name} (Customer) for the following service:

Service: ${selectedBooking.service_name}
Date: ${new Date(selectedBooking.booking_date).toLocaleDateString()}
Time: ${selectedBooking.start_time}${selectedBooking.end_time ? ` - ${selectedBooking.end_time}` : ''}
${selectedBooking.total_amount ? `Amount: $${selectedBooking.total_amount}` : ''}

Service Description:
${selectedBooking.notes || 'Service will be provided as discussed and agreed upon.'}

Contact Information:
Vendor: ${vendor.contact_email || vendor.business_name}
Customer: ${selectedBooking.customer_email || selectedBooking.customer_name}

By signing this contract, both parties agree to the terms and conditions outlined below.
    `.trim();

    setContractContent(content);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="mr-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h3 className="text-lg font-semibold text-black">Create New Contract</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="booking">Select Booking</Label>
          <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a booking" />
            </SelectTrigger>
            <SelectContent>
              {bookings.map((booking) => (
                <SelectItem key={booking.id} value={booking.id}>
                  {booking.service_name} - {booking.customer_name} ({new Date(booking.booking_date).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBooking && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Booking Details:</h4>
            <div className="text-sm space-y-1">
              <p><strong>Customer:</strong> {selectedBooking.customer_name}</p>
              <p><strong>Service:</strong> {selectedBooking.service_name}</p>
              <p><strong>Date:</strong> {new Date(selectedBooking.booking_date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {selectedBooking.start_time}</p>
              {selectedBooking.total_amount && (
                <p><strong>Amount:</strong> ${selectedBooking.total_amount}</p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateContractContent}
              className="mt-2"
            >
              Generate Contract Content
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="contract-content">Contract Content</Label>
          <Textarea
            id="contract-content"
            value={contractContent}
            onChange={(e) => setContractContent(e.target.value)}
            rows={8}
            placeholder="Enter the main contract content here..."
            required
          />
        </div>

        <div>
          <Label htmlFor="contract-terms">Terms and Conditions</Label>
          <Textarea
            id="contract-terms"
            value={contractTerms}
            onChange={(e) => setContractTerms(e.target.value)}
            rows={6}
            placeholder="Enter terms and conditions..."
            required
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={submitting || !selectedBookingId || !contractContent.trim()}
            className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
          >
            {submitting ? 'Creating...' : 'Create Contract'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContractCreator;
