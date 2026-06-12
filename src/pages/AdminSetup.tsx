
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Crown, AlertTriangle } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSetAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !adminKey) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('set-admin', {
        body: { email, adminKey }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Admin privileges granted successfully!',
      });

      setEmail('');
      setAdminKey('');
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set admin privileges',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
          <p className="text-gray-600">Grant admin privileges to the platform creator</p>
        </div>

        <form onSubmit={handleSetAdmin} className="space-y-4">
          <div>
            <Label htmlFor="email">Your Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="adminKey">Admin Setup Key</Label>
            <Input
              id="adminKey"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter the admin setup key"
              required
              disabled={loading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Setting Admin...' : 'Grant Admin Privileges'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Security Notice</h3>
              <p className="text-sm text-red-700 mt-1">
                Remove this page after setting up your admin account for security.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminSetup;
