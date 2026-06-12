
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send } from 'lucide-react';

interface ContractData {
  customer_name: string;
  customer_email: string;
  service_name: string;
  service_description: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  location: string;
  total_amount: number;
  deposit_amount: number;
  terms_conditions: string;
}

interface ContractTemplateProps {
  contractData?: Partial<ContractData>;
  onSave: (data: ContractData) => void;
  onSend: (data: ContractData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const ContractTemplate: React.FC<ContractTemplateProps> = ({
  contractData,
  onSave,
  onSend,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<ContractData>({
    customer_name: '',
    customer_email: '',
    service_name: '',
    service_description: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    location: '',
    total_amount: 0,
    deposit_amount: 0,
    terms_conditions: `1. Service Delivery: The vendor agrees to provide the services as described above on the specified date and time.

2. Payment Terms: A deposit of [DEPOSIT_AMOUNT] is required to secure the booking. The remaining balance is due on the day of service.

3. Cancellation Policy: Cancellations must be made at least 48 hours in advance for a full refund of the deposit.

4. Liability: The vendor maintains appropriate insurance and liability coverage for the services provided.

5. Force Majeure: Neither party shall be held liable for delays or failures due to circumstances beyond their control.

6. Agreement: By signing below, both parties agree to the terms and conditions outlined in this contract.`,
    ...contractData
  });

  const handleInputChange = (field: keyof ContractData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const handleSend = () => {
    onSend(formData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Contract' : 'New Contract'}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={handleSend}
              className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Contract Header */}
        <div className="text-center border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Agreement</h1>
          <p className="text-gray-600">Professional Services Contract</p>
        </div>

        {/* Customer Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            <div>
              <Label htmlFor="customer_name">Full Name</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <Label htmlFor="customer_email">Email Address</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => handleInputChange('customer_email', e.target.value)}
                placeholder="Enter customer email"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">Book'D Vendor</p>
              <p className="text-sm text-gray-600">Professional Services Provider</p>
              <p className="text-sm text-gray-600">contact@vendor.com</p>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Service Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_name">Service Name</Label>
              <Input
                id="service_name"
                value={formData.service_name}
                onChange={(e) => handleInputChange('service_name', e.target.value)}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter service location"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="service_description">Service Description</Label>
            <Textarea
              id="service_description"
              value={formData.service_description}
              onChange={(e) => handleInputChange('service_description', e.target.value)}
              placeholder="Detailed description of services to be provided"
              rows={3}
            />
          </div>
        </div>

        {/* Schedule & Pricing */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Schedule</h3>
            <div>
              <Label htmlFor="booking_date">Service Date</Label>
              <Input
                id="booking_date"
                type="date"
                value={formData.booking_date}
                onChange={(e) => handleInputChange('booking_date', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            <div>
              <Label htmlFor="total_amount">Total Amount ($)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="deposit_amount">Deposit Required ($)</Label>
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                value={formData.deposit_amount}
                onChange={(e) => handleInputChange('deposit_amount', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Terms & Conditions</h3>
          <Textarea
            value={formData.terms_conditions}
            onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Contract Summary */}
        <div className="bg-lime-50 border border-lime-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Service:</span> {formData.service_name}</p>
              <p><span className="font-medium">Customer:</span> {formData.customer_name}</p>
              <p><span className="font-medium">Date:</span> {formData.booking_date}</p>
            </div>
            <div>
              <p><span className="font-medium">Total Amount:</span> ${formData.total_amount.toFixed(2)}</p>
              <p><span className="font-medium">Deposit:</span> ${formData.deposit_amount.toFixed(2)}</p>
              <p><span className="font-medium">Balance:</span> ${(formData.total_amount - formData.deposit_amount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractTemplate;
