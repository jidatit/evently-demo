// src/pages/VendorServices.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { useVendor } from '@/features/vendor/hooks';
import { useServicesWithMedia, useDeleteService } from '@/features/services/hooks';

import type { Service } from '@/features/services/types';
import { ServiceForm } from '@/components/services/ServiceForm';
import ServiceCard from '@/components/services/ServiceCard';


const PRICING_TYPE_LABELS = {
  per_hour: 'Per Hour',
  per_event: 'Per Event',
  per_day: 'Per Day',
  // quote: 'Custom Quote',
};

export const VendorServices: React.FC = () => {
  const { user } = useConsolidatedAuth();
  const { data: vendor } = useVendor(user?.id);
  const { data: services, isLoading, error } = useServicesWithMedia(vendor?.id);
  const { mutate: deleteService } = useDeleteService();

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  const handleDelete = (serviceId: string) => {
    deleteService(serviceId);
    setDeleteConfirmId(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load services</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Please try again'}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className=" bg-white rounded-lg" >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Manage Services
            </h1>
            <p className="text-muted-foreground">
              Add, edit, and organize your service offerings
            </p>
          </div>

          <Button
            onClick={handleAdd}
            className="gradient-party text-white font-cta shadow-party hover:shadow-party-hover transition-all duration-300 transform hover:-translate-y-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services && services.length > 0 ? (
            services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={handleEdit}
                onDelete={setDeleteConfirmId}
              />

            ))
          ) : (
            // Empty state
            <div className="col-span-full text-center py-16">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                No services yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start by adding your first service to attract customers
              </p>
              <Button
                onClick={handleAdd}
                className="gradient-party text-white shadow-party hover:shadow-party-hover"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Service Form Modal */}
      {showForm && vendor && (
        <ServiceForm
          vendorId={vendor.id}
          service={editingService}
          onClose={handleCloseForm}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
              All associated media will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};