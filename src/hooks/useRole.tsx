
import { useState, useEffect } from 'react';
import { useConsolidatedAuth } from '@/components/ConsolidatedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export const useRole = () => {
  const { user, session } = useConsolidatedAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user || !session) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles([]);
        } else {
          const roles = data?.map(r => r.role) || [];
          setUserRoles(roles);
        }
      } catch (error) {
        console.error('Exception fetching user roles:', error);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user, session]);

  const checkRole = (role: string) => userRoles.includes(role);
  const isAdmin = checkRole('admin');
  const isVendor = checkRole('vendor');
  const role = userRoles.length > 0 ? userRoles[0] : null;

  return {
    userRoles,
    loading,
    checkRole,
    isAdmin,
    isVendor,
    role
  };
};
