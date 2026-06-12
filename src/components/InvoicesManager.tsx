import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceCard from '@/components/InvoiceCard';

interface InvoicesManagerProps {
  invoices: any[];
  onResendEmail: (invoiceId: string) => void;
}

const InvoicesManager: React.FC<InvoicesManagerProps> = ({ invoices, onResendEmail }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-black mb-4">Generated Invoices</h3>
      {invoices.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
              <InvoiceCard invoice={invoice} />
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResendEmail(invoice.id)}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Resend Email
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No invoices generated yet.</p>
      )}
    </div>
  );
};

export default InvoicesManager;