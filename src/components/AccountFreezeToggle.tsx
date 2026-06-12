
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Snowflake, Sun } from 'lucide-react';

interface AccountFreezeToggleProps {
  vendor: any;
  onUpdate: (vendor: any) => void;
}

const AccountFreezeToggle: React.FC<AccountFreezeToggleProps> = ({ vendor, onUpdate }) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const handleToggleFreeze = async () => {
    setUpdating(true);
    try {
      const newFrozenStatus = !vendor.is_frozen;
      
      const { error } = await supabase
        .from('vendors')
        .update({ is_frozen: newFrozenStatus })
        .eq('id', vendor.id);

      if (error) throw error;

      const updatedVendor = { ...vendor, is_frozen: newFrozenStatus };
      onUpdate(updatedVendor);

      toast({
        title: 'Success',
        description: newFrozenStatus 
          ? 'Your account has been frozen. Customers can no longer book your services.'
          : 'Your account has been unfrozen. Customers can now book your services again.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {vendor.is_frozen ? (
            <Snowflake className="w-6 h-6 text-blue-500" />
          ) : (
            <Sun className="w-6 h-6 text-yellow-500" />
          )}
          <div>
            <h3 className="text-lg font-semibold">
              Account Status: {vendor.is_frozen ? 'Frozen' : 'Active'}
            </h3>
            <p className="text-sm text-gray-600">
              {vendor.is_frozen 
                ? 'Your profile is hidden from customers and they cannot book your services.'
                : 'Your profile is visible to customers and they can book your services.'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Switch
            checked={!vendor.is_frozen}
            onCheckedChange={handleToggleFreeze}
            disabled={updating}
          />
          <span className="text-sm font-medium">
            {vendor.is_frozen ? 'Frozen' : 'Active'}
          </span>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm mb-2">What happens when you freeze your account?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Your profile becomes invisible to customers browsing vendors</li>
          <li>• Customers cannot make new bookings with you</li>
          <li>• Existing bookings and invoices remain unchanged</li>
          <li>• You can still access your dashboard and manage existing business</li>
          <li>• You can unfreeze your account at any time</li>
        </ul>
      </div>
    </Card>
  );
};

export default AccountFreezeToggle;
