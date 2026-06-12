
import React, { useState } from 'react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Shield } from 'lucide-react';
import { EnhancedInputValidator, ValidationSchema } from '@/lib/enhanced-input-validation';
import { CSRFProtection } from '@/lib/csrf-protection';

interface DeleteAccountProps {
  userType: 'vendor' | 'customer';
}

const DeleteAccount: React.FC<DeleteAccountProps> = ({ userType }) => {
  const { user, logout, session } = useConsolidatedAuth();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [secondaryConfirmation, setSecondaryConfirmation] = useState('');

  const validationSchema: ValidationSchema = {
    confirmationText: {
      required: true,
      type: 'string',
      maxLength: 50,
      sanitize: true,
      custom: (value) => ({
        isValid: value === 'DELETE',
        message: 'Please type "DELETE" exactly'
      })
    },
    secondaryConfirmation: {
      required: true,
      type: 'string',
      maxLength: 100,
      sanitize: true,
      custom: (value) => ({
        isValid: value === `delete-${userType}-account`,
        message: `Please type "delete-${userType}-account" exactly`
      })
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !session?.access_token) {
      toast({
        title: 'Authentication Error',
        description: 'Please log in to delete your account.',
        variant: 'destructive',
      });
      return;
    }

    // Enhanced validation
    const validation = EnhancedInputValidator.validateObject(
      { confirmationText, secondaryConfirmation },
      validationSchema
    );

    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join(', ');
      toast({
        title: 'Invalid Confirmation',
        description: errorMessages,
        variant: 'destructive',
      });
      return;
    }

    setIsDeleting(true);
    try {
      console.log('Initiating secure account deletion for user:', user.id);
      
      // Get fresh session to ensure token is valid
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession?.access_token) {
        throw new Error('Session expired. Please log in again.');
      }

      // Add CSRF protection
      const headers = CSRFProtection.addTokenToHeaders({
        Authorization: `Bearer ${freshSession.access_token}`,
        'Content-Type': 'application/json',
      });

      console.log('Calling delete-account edge function...');

      // Call the secure Edge Function with enhanced validation
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { 
          userType,
          confirmationToken: validation.sanitizedData.confirmationText,
          timestamp: Date.now(),
          userAgent: navigator.userAgent.substring(0, 100) // Limited for security
        },
        headers,
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Account deletion failed');
      }

      if (!data?.success) {
        console.error('Edge function returned error:', data);
        throw new Error(data?.error || 'Account deletion failed');
      }

      console.log('Account deletion successful');

      toast({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted.',
      });

      // Clear any sensitive data from local storage
      localStorage.clear();
      sessionStorage.clear();

      // Logout after successful deletion
      await logout();

    } catch (error: any) {
      console.error('Account deletion error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setConfirmationText('');
      setSecondaryConfirmation('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
      <div className="flex items-center gap-3 mb-4">
        <Trash2 className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-semibold text-red-600">Delete Account</h2>
      </div>
      
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Critical Security Warning</h3>
              <p className="text-sm text-red-700 mt-1">
                This action is irreversible and will permanently delete all your data.
              </p>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        {userType === 'vendor' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This will also delete all your services, bookings, and invoices.
            </p>
          </div>
        )}
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="destructive" 
            disabled={isDeleting}
            className="w-full mt-4"
          >
            {isDeleting ? 'Deleting...' : 'Delete My Account'}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </p>
              {userType === 'vendor' && (
                <p className="text-red-600 font-medium">
                  This includes all your services, bookings, and invoices.
                </p>
              )}
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type DELETE to confirm"
                    disabled={isDeleting}
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type "delete-{userType}-account" to double confirm:
                  </label>
                  <input
                    type="text"
                    value={secondaryConfirmation}
                    onChange={(e) => setSecondaryConfirmation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={`Type delete-${userType}-account`}
                    disabled={isDeleting}
                    maxLength={100}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting || confirmationText !== 'DELETE' || secondaryConfirmation !== `delete-${userType}-account`}
            >
              {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DeleteAccount;
