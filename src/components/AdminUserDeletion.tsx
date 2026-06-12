
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const AdminUserDeletion: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const PROBLEMATIC_USER_ID = 'a42759c2-7456-478c-882d-a5ab5898b879';
  const PROBLEMATIC_EMAIL = 'hraygoza32@gmail.com';

  const deleteUserCompletely = async () => {
    setIsDeleting(true);
    try {
      console.log('Starting final cleanup process...');

      // Get admin session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('Admin session required');
      }

      // Call the updated edge function for final cleanup
      console.log('Calling edge function for final auth user deletion...');
      
      const { data: edgeResult, error: edgeError } = await supabase.functions.invoke('delete-account', {
        body: { 
          finalCleanup: true,
          userAgent: 'Admin final cleanup'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Edge function result:', { edgeResult, edgeError });

      if (edgeError) {
        console.error('Edge function failed:', edgeError);
        throw new Error(`Edge function failed: ${edgeError.message}`);
      }

      if (edgeResult?.success) {
        toast({
          title: 'Success!',
          description: 'The problematic user has been completely deleted from the system.',
        });
        console.log('✅ User deletion completed successfully');
      } else {
        throw new Error(edgeResult?.error || 'Unknown error occurred');
      }

    } catch (error: any) {
      console.error('Final deletion failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Final deletion failed',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-lg bg-green-50 border-green-200">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-green-800">Final User Cleanup</h3>
      </div>
      
      <div className="space-y-4 mb-6">
        <p className="text-sm text-green-700">
          <strong>Target User:</strong> {PROBLEMATIC_EMAIL} ({PROBLEMATIC_USER_ID})
        </p>
        <div className="bg-green-100 p-3 rounded text-xs text-green-800">
          <strong>Status:</strong> Database constraints have been resolved via SQL migration.
          <br />
          <strong>Next step:</strong> Delete the authentication record to complete the process.
        </div>
        <p className="text-sm text-green-700">
          All database records for this user have been cleaned up. This will perform the final 
          authentication user deletion.
        </p>
      </div>
      
      <Button 
        onClick={deleteUserCompletely} 
        disabled={isDeleting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
        size="lg"
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? 'DELETING AUTH USER...' : 'COMPLETE USER DELETION'}
      </Button>
    </div>
  );
};

export default AdminUserDeletion;
