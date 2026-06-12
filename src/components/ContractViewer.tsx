
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, FileText, CheckCircle, Clock, PenTool } from 'lucide-react';
import ContractSignature from './ContractSignature';

interface ContractViewerProps {
  contract: any;
  vendor: any;
  onBack: () => void;
  onContractUpdated: () => void;
}

const ContractViewer: React.FC<ContractViewerProps> = ({
  contract,
  vendor,
  onBack,
  onContractUpdated
}) => {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<any[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSignatures();
  }, [contract.id]);

  const fetchSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_signatures')
        .select('*')
        .eq('contract_id', contract.id);

      if (error) throw error;
      setSignatures(data || []);
      
      // Check if contract is fully signed and generate invoice automatically
      if (data && data.length >= 2 && contract.status === 'signed') {
        await handleAutoInvoiceGeneration();
      }
    } catch (error: any) {
      console.error('Error fetching signatures:', error);
    }
  };

  const handleAutoInvoiceGeneration = async () => {
    try {
      // Check if invoice already exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('booking_id', contract.booking_id)
        .single();

      if (existingInvoice) {
        console.log('Invoice already exists for this contract');
        return;
      }

      // Generate invoice automatically
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { bookingId: contract.booking_id }
      });

      if (error) throw error;

      // Send contract copy to both parties
      const { error: emailError } = await supabase.functions.invoke('send-contract-copy', {
        body: { contractId: contract.id }
      });

      if (emailError) {
        console.warn('Failed to send contract copy:', emailError);
      }

      toast({
        title: 'Contract Completed',
        description: 'Invoice generated and contract copies sent to both parties',
      });
      
      onContractUpdated();
    } catch (error: any) {
      console.error('Error in auto-invoice generation:', error);
      toast({
        title: 'Notice',
        description: 'Contract signed successfully. Invoice will be generated shortly.',
      });
    }
  };

  const handleSignatureComplete = async () => {
    setShowSignature(false);
    await fetchSignatures();
    onContractUpdated();
    
    toast({
      title: 'Success',
      description: 'Contract signed successfully',
    });
  };

  const downloadContract = () => {
    const contractText = `
CONTRACT AGREEMENT

${contract.contract_content}

TERMS AND CONDITIONS:
${contract.contract_terms}

Created: ${new Date(contract.created_at).toLocaleString()}
Status: ${contract.status}

Signatures:
${signatures.map(sig => `- ${sig.signer_type}: Signed on ${new Date(sig.signed_at).toLocaleString()}`).join('\n')}
    `;

    const blob = new Blob([contractText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-${contract.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSignatureStatus = () => {
    const vendorSigned = signatures.some(s => s.signer_type === 'vendor');
    const customerSigned = signatures.some(s => s.signer_type === 'customer');

    if (vendorSigned && customerSigned) return 'Fully signed - Invoice generated';
    if (vendorSigned || customerSigned) return 'Partially signed';
    return 'Pending signatures';
  };

  const canSign = () => {
    // Vendor can always sign if they haven't already
    const vendorSigned = signatures.some(s => s.signer_type === 'vendor');
    return !vendorSigned;
  };

  if (showSignature) {
    return (
      <ContractSignature
        contract={contract}
        signerType="vendor"
        onSignatureComplete={handleSignatureComplete}
        onCancel={() => setShowSignature(false)}
      />
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h3 className="text-lg font-semibold text-black flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Contract Details
          </h3>
        </div>
        <Button variant="outline" onClick={downloadContract}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Contract Content</h4>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {contract.contract_content}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h4 className="font-semibold mb-4">Terms and Conditions</h4>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {contract.contract_terms}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold mb-3">Booking Information</h5>
            <div className="space-y-2 text-sm">
              <p><strong>Customer:</strong> {contract.bookings?.customer_name}</p>
              <p><strong>Service:</strong> {contract.bookings?.service_name}</p>
              <p><strong>Date:</strong> {new Date(contract.bookings?.booking_date).toLocaleDateString()}</p>
              <p><strong>Created:</strong> {new Date(contract.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-semibold mb-3 flex items-center">
              {contract.status === 'signed' ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              ) : (
                <Clock className="w-4 h-4 text-orange-600 mr-2" />
              )}
              Signature Status
            </h5>
            <p className="text-sm mb-4">{getSignatureStatus()}</p>
            
            <div className="space-y-3">
              {signatures.map((signature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  <div>
                    <div className="font-medium capitalize">{signature.signer_type}</div>
                    <div className="text-gray-500">
                      Signed on {new Date(signature.signed_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {canSign() && (
                <Button
                  onClick={() => setShowSignature(true)}
                  className="w-full bg-lime-500 text-black hover:bg-black hover:text-lime-500"
                  disabled={loading}
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              )}
            </div>
          </div>

          {contract.status === 'signed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Contract Completed</span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                Contract fully executed. Invoice automatically generated and sent to customer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractViewer;
