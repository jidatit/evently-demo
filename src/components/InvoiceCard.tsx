
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Mail, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  service_name: string;
  booking_date: string;
  start_time: string;
  end_time?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  status: string;
  notes?: string;
}

interface InvoiceCardProps {
  invoice: Invoice;
  onResendEmail?: (invoiceId: string) => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onResendEmail }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {invoice.invoice_number}
        </CardTitle>
        <Badge className={getStatusColor(invoice.status)}>
          {invoice.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-600">Customer</p>
            <p>{invoice.customer_name}</p>
            {invoice.customer_email && (
              <p className="text-gray-500">{invoice.customer_email}</p>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-600">Service</p>
            <p>{invoice.service_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-semibold text-gray-600">Service Date</p>
              <p>{format(new Date(invoice.booking_date), 'MMM dd, yyyy')}</p>
              <p className="text-gray-500">
                {invoice.start_time}{invoice.end_time && ` - ${invoice.end_time}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="font-semibold text-gray-600">Amount</p>
              <p className="text-lg font-bold text-green-600">
                ${invoice.total_amount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                Subtotal: ${invoice.subtotal.toFixed(2)} + Tax: ${invoice.tax_amount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-600">Invoice Date</p>
            <p>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-600">Due Date</p>
            <p>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
          </div>
        </div>

        {invoice.notes && (
          <div>
            <p className="font-semibold text-gray-600">Notes</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {onResendEmail && invoice.customer_email && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResendEmail(invoice.id)}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Resend Email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceCard;
