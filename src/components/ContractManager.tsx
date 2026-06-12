
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Clock, CheckCircle } from 'lucide-react';
import ContractCreator from './ContractCreator';
import ContractViewer from './ContractViewer';

interface ContractManagerProps {
  vendor: any;
  bookings: any[];
  onContractsUpdate?: () => void;
}

const ContractManager: React.FC<ContractManagerProps> = ({
  vendor,
  bookings,
  onContractsUpdate
}) => {
  const { toast } = useToast();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, [vendor.id]);

  const fetchContracts = async () => {
    try {
      const { data: contractsData, error } = await supabase
        .from('contracts')
        .select(`
          *,
          bookings!inner(
            id,
            customer_name,
            customer_email,
            service_name,
            booking_date
          ),
          contract_signatures(*)
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(contractsData || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContractCreated = () => {
    fetchContracts();
    setShowCreator(false);
    onContractsUpdate?.();
    toast({
      title: 'Success',
      description: 'Contract created successfully',
    });
  };

  const getContractStatus = (contract: any) => {
    const signatures = contract.contract_signatures || [];
    if (signatures.length === 0) return 'Pending signatures';
    if (signatures.length === 1) return 'Partially signed';
    return 'Fully signed';
  };

  const getStatusIcon = (contract: any) => {
    const signatures = contract.contract_signatures || [];
    if (signatures.length === 2) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <Clock className="w-4 h-4 text-orange-600" />;
  };

  if (showCreator) {
    return (
      <ContractCreator
        vendor={vendor}
        bookings={bookings}
        onContractCreated={handleContractCreated}
        onCancel={() => setShowCreator(false)}
      />
    );
  }

  if (selectedContract) {
    return (
      <ContractViewer
        contract={selectedContract}
        vendor={vendor}
        onBack={() => setSelectedContract(null)}
        onContractUpdated={fetchContracts}
      />
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-black flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Contracts
        </h3>
        <Button
          onClick={() => setShowCreator(true)}
          className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No contracts created yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Create contracts for your bookings to formalize agreements with customers
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedContract(contract)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {getStatusIcon(contract)}
                  <span className="font-medium text-black ml-2">
                    {contract.bookings.service_name}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(contract.bookings.booking_date).toLocaleDateString()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">{contract.bookings.customer_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="font-medium">{getContractStatus(contract)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractManager;
