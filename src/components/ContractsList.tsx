
import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Eye, Edit, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Contract {
  id: string;
  customer_name: string;
  service_name: string;
  status: 'draft' | 'sent' | 'signed' | 'completed';
  created_at: string;
  booking_date: string;
  total_amount: number;
}

interface ContractsListProps {
  contracts: Contract[];
  onCreateNew: () => void;
  onViewContract: (contractId: string) => void;
  onEditContract: (contractId: string) => void;
  onSendContract: (contractId: string) => void;
}

const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  onCreateNew,
  onViewContract,
  onEditContract,
  onSendContract
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'signed': return 'bg-lime-100 text-lime-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'sent': return '📤';
      case 'signed': return '✍️';
      case 'completed': return '✅';
      default: return '📄';
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.service_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-lime-600" />
          <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts Grid */}
      <div className="grid gap-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(contract.status)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{contract.service_name}</h3>
                  <p className="text-sm text-gray-600">for {contract.customer_name}</p>
                </div>
              </div>
              <Badge className={getStatusColor(contract.status)}>
                {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Service Date:</span>
                <p className="font-medium">{new Date(contract.booking_date).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <p className="font-medium">${contract.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewContract(contract.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              {contract.status === 'draft' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditContract(contract.id)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onSendContract(contract.id)}
                    className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Send
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first contract to get started'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              onClick={onCreateNew}
              className="bg-lime-500 text-black hover:bg-black hover:text-lime-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Contract
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractsList;
