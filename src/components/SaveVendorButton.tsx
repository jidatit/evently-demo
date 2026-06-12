
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useConsolidatedAuth } from './ConsolidatedAuthProvider';

interface SaveVendorButtonProps {
  vendorId: string;
  vendorName: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const SaveVendorButton: React.FC<SaveVendorButtonProps> = ({ 
  vendorId, 
  vendorName, 
  className = '',
  size = 'sm'
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useConsolidatedAuth();
  const { toast } = useToast();

  const handleSaveVendor = async () => {
    if (!user) {
      // Store current page for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save vendors to your favorites.',
        variant: 'destructive'
      });
      // Redirect to auth page
      window.location.href = '/auth';
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call - in real implementation, this would save to database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsSaved(!isSaved);
      
      toast({
        title: isSaved ? 'Removed from favorites' : 'Saved to favorites!',
        description: isSaved 
          ? `${vendorName} has been removed from your favorites.`
          : `${vendorName} has been added to your favorites list.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isSaved ? 'default' : 'outline'}
      size={size}
      onClick={handleSaveVendor}
      disabled={isLoading}
      className={`transition-all duration-200 ${
        isSaved 
          ? 'bg-pink-500 hover:bg-pink-600 text-white' 
          : 'border-pink-200 hover:border-pink-400 hover:bg-pink-50'
      } ${className}`}
    >
      <Heart 
        className={`h-4 w-4 ${size === 'sm' ? 'mr-1' : 'mr-2'} ${
          isSaved ? 'fill-current' : ''
        }`} 
      />
      {size !== 'sm' && (isSaved ? 'Saved' : 'Save')}
    </Button>
  );
};
