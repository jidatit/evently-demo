
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { ArrowLeft, PenTool } from 'lucide-react';

interface ContractSignatureProps {
  contract: any;
  signerType: 'vendor' | 'customer';
  onSignatureComplete: () => void;
  onCancel: () => void;
}

const ContractSignature: React.FC<ContractSignatureProps> = ({
  contract,
  signerType,
  onSignatureComplete,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useConsolidatedAuth();
  const [submitting, setSubmitting] = useState(false);
  const [typedSignature, setTypedSignature] = useState('');

  const generateTypedSignatureCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;

    // Set background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Style the signature text
    ctx.fillStyle = '#000000';
    ctx.font = '32px cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw the typed signature
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
  };

  const submitSignature = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to sign contracts',
        variant: 'destructive',
      });
      return;
    }

    if (!typedSignature.trim()) {
      toast({
        title: 'Signature Required',
        description: 'Please type your signature before submitting',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const typedCanvas = generateTypedSignatureCanvas();
      if (!typedCanvas) throw new Error('Failed to generate typed signature');
      
      const { error } = await supabase.from('contract_signatures').insert({
        contract_id: contract.id,
        signer_id: user.id,
        signer_type: signerType,
        signature_data: typedCanvas,
        ip_address: null,
        user_agent: navigator.userAgent
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Contract signed successfully',
      });
      
      onSignatureComplete();
    } catch (error: any) {
      console.error('Error saving signature:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save signature',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onCancel} className="mr-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h3 className="text-lg font-semibold text-black flex items-center">
          <PenTool className="w-5 h-5 mr-2" />
          Electronic Signature
        </h3>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Contract Summary:</h4>
          <div className="text-sm space-y-1">
            <p><strong>Service:</strong> {contract.bookings?.service_name}</p>
            <p><strong>Customer:</strong> {contract.bookings?.customer_name}</p>
            <p><strong>Date:</strong> {new Date(contract.bookings?.booking_date).toLocaleDateString()}</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-4">Electronic Signature</h4>
          
          <p className="text-sm text-gray-600 mb-4">
            Please type your full name as your electronic signature. Your electronic signature will be legally binding.
          </p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <div className="h-48 flex items-center justify-center border border-gray-200 rounded bg-white">
              <Input
                type="text"
                placeholder="Type your full name here"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                className="text-2xl font-serif text-center border-none bg-transparent"
                style={{ fontFamily: 'cursive' }}
              />
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-500">
                Type your signature above
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setTypedSignature('')}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Legal Notice:</strong> By signing this contract electronically, you agree to all terms and conditions outlined in the agreement. 
            This electronic signature is legally binding and equivalent to a handwritten signature under the Electronic Signatures in Global and National Commerce Act (E-SIGN).
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={submitSignature}
            disabled={submitting}
            className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
          >
            {submitting ? 'Signing...' : 'Sign Contract Electronically'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContractSignature;
