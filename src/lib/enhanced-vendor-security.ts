
// Enhanced vendor security for contact information and payment methods
import { supabase } from '@/integrations/supabase/client';
import { validateVendorContactAccess, logSensitiveDataAccess } from './security-fixes-implementation';

/**
 * Secure vendor contact access for authenticated users only
 */
export const getVendorContactSecure = async (vendorId: string) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // Validate access
    const accessGranted = await validateVendorContactAccess(vendorId, user?.id);
    
    if (!accessGranted) {
      throw new Error('Access denied: Contact information requires authentication and rate limiting');
    }

    // Use the secure database function
    const { data, error } = await supabase.rpc('get_vendor_contact_secure', {
      vendor_id_param: vendorId
    });

    if (error) {
      await logSensitiveDataAccess('vendor_contact', vendorId, user?.id, false);
      throw error;
    }

    await logSensitiveDataAccess('vendor_contact', vendorId, user?.id, true);
    
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error accessing vendor contact:', error);
    return { data: null, error };
  }
};

/**
 * Get public vendor data without sensitive information
 */
export const getPublicVendorSecure = async (vendorId: string) => {
  try {
    // Use the secure public data function
    const { data, error } = await supabase.rpc('get_public_vendor_data', {
      vendor_id_param: vendorId
    });

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error fetching public vendor data:', error);
    return { data: null, error };
  }
};

/**
 * Enhanced payment method security
 */
export const getVendorPaymentMethodsSecure = async (vendorId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required for payment method access');
    }

    // Verify vendor ownership
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', vendorId)
      .eq('user_id', user.id)
      .single();

    if (vendorError || !vendor) {
      await logSensitiveDataAccess('payment_methods', vendorId, user.id, false);
      throw new Error('Access denied: Vendor ownership verification failed');
    }

    // Get payment methods (only for verified vendor owner)
    const { data, error } = await supabase
      .from('vendor_payment_methods')
      .select('id, payment_type, display_name, is_active, is_verified, created_at')
      .eq('vendor_id', vendorId);

    if (error) {
      await logSensitiveDataAccess('payment_methods', vendorId, user.id, false);
      throw error;
    }

    await logSensitiveDataAccess('payment_methods', vendorId, user.id, true);
    
    return { data, error: null };
  } catch (error) {
    console.error('Error accessing payment methods:', error);
    return { data: [], error };
  }
};
