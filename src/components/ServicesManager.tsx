
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Plus, DollarSign, Clock, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ServicesManagerProps {
  vendor: any;
  services: any[];
  onServicesUpdate: (services: any[]) => void;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ vendor, services, onServicesUpdate }) => {
  const [serviceForm, setServiceForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    pricing_type: 'per_hour' 
  });
  const [serviceLoading, setServiceLoading] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setServiceForm({ ...serviceForm, [e.target.name]: e.target.value });
  };

  const handlePricingTypeChange = (value: string) => {
    setServiceForm({ ...serviceForm, pricing_type: value });
  };

  const refreshServices = async () => {
    const { data: servicesData } = await supabase.from('services').select('*').eq('vendor_id', vendor.id);
    onServicesUpdate(servicesData || []);
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceLoading(true);
    try {
      const { error } = await supabase.from('services').insert([
        {
          vendor_id: vendor.id,
          name: serviceForm.name,
          description: serviceForm.description,
          price: serviceForm.price ? parseFloat(serviceForm.price) : null,
          pricing_type: serviceForm.pricing_type
        }
      ]);
      if (error) throw error;
      await refreshServices();
      setServiceForm({ name: '', description: '', price: '', pricing_type: 'per_hour' });
    } catch (error: any) {
      alert(error.message || 'Failed to add service');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setServiceForm({ 
      name: service.name, 
      description: service.description || '', 
      price: service.price?.toString() || '',
      pricing_type: service.pricing_type || 'per_hour'
    });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceLoading(true);
    try {
      const { error } = await supabase.from('services').update({
        name: serviceForm.name,
        description: serviceForm.description,
        price: serviceForm.price ? parseFloat(serviceForm.price) : null,
        pricing_type: serviceForm.pricing_type
      }).eq('id', editingService.id);
      if (error) throw error;
      await refreshServices();
      setEditingService(null);
      setServiceForm({ name: '', description: '', price: '', pricing_type: 'per_hour' });
    } catch (error: any) {
      alert(error.message || 'Failed to update service');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    setServiceLoading(true);
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) throw error;
      await refreshServices();
    } catch (error: any) {
      alert(error.message || 'Failed to delete service');
    } finally {
      setServiceLoading(false);
    }
  };

  const getPricingIcon = (pricingType: string) => {
    return pricingType === 'per_piece' ? <Package className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />;
  };

  const getPricingLabel = (pricingType: string) => {
    return pricingType === 'per_piece' ? 'per piece' : 'per hour';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-black">Services</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-lime-500 text-black hover:bg-black hover:text-lime-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Add a service you offer to your customers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <Label htmlFor="name">Service Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={serviceForm.name}
                  onChange={handleServiceChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={serviceForm.description}
                  onChange={handleServiceChange}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={serviceForm.price}
                    onChange={handleServiceChange}
                  />
                </div>
                <div>
                  <Label htmlFor="pricing_type">Pricing Type</Label>
                  <Select value={serviceForm.pricing_type} onValueChange={handlePricingTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_hour">Per Hour</SelectItem>
                      <SelectItem value="per_piece">Per Piece</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={serviceLoading}>
                {serviceLoading ? 'Adding...' : 'Add Service'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <div key={service.id} className="border border-gray-200 rounded-lg p-4">
            {editingService?.id === service.id ? (
              <form onSubmit={handleUpdateService} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Service Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleServiceChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    value={serviceForm.description}
                    onChange={handleServiceChange}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-price">Price ($)</Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={handleServiceChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-pricing_type">Pricing Type</Label>
                    <Select value={serviceForm.pricing_type} onValueChange={handlePricingTypeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_piece">Per Piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={serviceLoading}>
                    {serviceLoading ? 'Updating...' : 'Update'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-black">{service.name}</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditService(service)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteService(service.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
                {service.description && (
                  <p className="text-gray-600 mb-2">{service.description}</p>
                )}
                {service.price && (
                  <div className="flex items-center text-green-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>${service.price}</span>
                    <span className="flex items-center ml-2 text-gray-500">
                      {getPricingIcon(service.pricing_type || 'per_hour')}
                      {getPricingLabel(service.pricing_type || 'per_hour')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {services.length === 0 && (
          <p className="text-gray-500 text-center py-4">No services added yet.</p>
        )}
      </div>
    </div>
  );
};

export default ServicesManager;
