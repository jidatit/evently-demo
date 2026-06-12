
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Trash2, Shield, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MassUserDeletionProps {
  onDeletionComplete?: () => void;
}

export const AdminMassUserDeletion: React.FC<MassUserDeletionProps> = ({ onDeletionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(0);
  const [confirmationText, setConfirmationText] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const requiredConfirmation = 'DELETE ALL USERS PERMANENTLY';

  const handleDeleteAllUsers = async () => {
    if (confirmationText !== requiredConfirmation) {
      toast({
        title: 'Confirmation Required',
        description: 'Please type the exact confirmation text to proceed.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      // Call the secure admin function
      const { data, error } = await supabase.rpc('delete_all_users_admin');

      if (error) {
        console.error('Mass deletion error:', error);
        toast({
          title: 'Deletion Failed',
          description: error.message || 'Failed to delete users due to insufficient permissions or system error.',
          variant: 'destructive',
        });
        return;
      }

      const result = data as { success: boolean; message: string; users_deleted?: number; error?: string };

      if (result.success) {
        toast({
          title: 'Mass Deletion Completed',
          description: `Successfully deleted ${result.users_deleted || 0} users. You will be logged out shortly.`,
          duration: 8000,
        });

        // Notify parent component
        onDeletionComplete?.();

        // Auto-logout after brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        toast({
          title: 'Deletion Failed',
          description: result.error || result.message || 'Unknown error occurred during mass deletion.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Exception during mass deletion:', error);
      toast({
        title: 'Critical Error',
        description: `Exception: ${error.message || 'Unknown error occurred'}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetConfirmation = () => {
    setConfirmationStep(0);
    setConfirmationText('');
  };

  return (
    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertTriangle className="h-5 w-5" />
          CRITICAL: Mass User Deletion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-red-200 bg-red-100 dark:border-red-700 dark:bg-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>IRREVERSIBLE OPERATION:</strong> This will permanently delete ALL user accounts, 
            vendor profiles, bookings, invoices, payments, and associated data. This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-lg space-y-2">
          <h4 className="font-semibold text-red-800 dark:text-red-200">What will be deleted:</h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>• All user authentication accounts</li>
            <li>• All vendor profiles and business information</li>
            <li>• All bookings and customer data</li>
            <li>• All invoices and payment records</li>
            <li>• All uploaded media and files</li>
            <li>• All admin accounts (including yours)</li>
          </ul>
        </div>

        {confirmationStep === 0 && (
          <div className="space-y-3">
            <Button
              onClick={() => setConfirmationStep(1)}
              variant="destructive"
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              Begin Mass User Deletion Process
            </Button>
          </div>
        )}

        {confirmationStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-800 dark:text-red-200">
                Type exactly: <code className="bg-red-200 dark:bg-red-800 px-1 rounded">{requiredConfirmation}</code>
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Type confirmation text here..."
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleDeleteAllUsers}
                disabled={loading || confirmationText !== requiredConfirmation}
                variant="destructive"
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Deleting All Users...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    EXECUTE MASS DELETION
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetConfirmation}
                disabled={loading}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-red-600 dark:text-red-400 space-y-1">
          <p>⚠️ You will be logged out immediately after completion</p>
          <p>⚠️ All admin privileges will be removed</p>
          <p>⚠️ Database will be completely reset</p>
        </div>
      </CardContent>
    </Card>
  );
};
