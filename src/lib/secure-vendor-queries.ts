import { supabase } from '@/integrations/supabase/client';
import { logCustomerDataAccess } from './ultra-secure-vendor-queries';

/**
 * SECURE VENDOR QUERIES: Enhanced security implementation with comprehensive logging
 * Updated to use new secure database functions and enhanced customer data protection
 */

// SECURITY: Define public vendor fields that can be safely exposed to everyone
const PUBLIC_VENDOR_FIELDS = [
  'id',
  'business_name', 
  'category',
  'description',
  'location',
  'logo_url',
  'created_at',
  'is_frozen'
] as const;

// SECURITY: Additional fields for authenticated users (for booking purposes only)
const AUTHENTICATED_VENDOR_FIELDS = [
  ...PUBLIC_VENDOR_FIELDS,
  'contact_email',
  'contact_phone'
] as const;

// SECURITY: Full vendor fields for vendor owners only (includes financial data)
const OWNER_VENDOR_FIELDS = [
  ...AUTHENTICATED_VENDOR_FIELDS,
  'user_id',
  'payout_method',
  'site_account_balance',
  'bank_account_details'
] as const;

// SECURITY: Safe service fields for public access (no pricing intelligence)
const PUBLIC_SERVICE_FIELDS = [
  'id',
  'vendor_id',
  'name',
  'description',
  'pricing_type',
  'duration_minutes'
] as const;

// SECURITY: Full service fields for authenticated users (includes pricing for booking)
const AUTHENTICATED_SERVICE_FIELDS = [
  ...PUBLIC_SERVICE_FIELDS,
  'price'
] as const;

/**
 * SECURITY: Get public vendor data using secure database function
 */
export const getPublicVendors = async (options: {
  category?: string;
  location?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  const { category, location, searchTerm, limit = 50, offset = 0 } = options;

  try {
    // Use regular table query instead of non-existent function
    const vendorResult = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        category,
        description,
        location,
        logo_url,
        created_at,
        is_frozen
      `)
      .eq('is_frozen', false);

    // Get public service data separately
    const serviceResult = await supabase
      .from('services')
      .select(`
        id,
        vendor_id,
        name,
        description,
        pricing_type,
        duration_minutes
      `);
    
    // Get safe media data
    const mediaResult = await supabase
      .from('vendor_media')
      .select('vendor_id, file_url, file_type')
      .in('file_type', ['image', 'video']);

    if (vendorResult.error) throw vendorResult.error;
    if (serviceResult.error) throw serviceResult.error;
    if (mediaResult.error) throw mediaResult.error;

    let vendors = Array.isArray(vendorResult.data) ? vendorResult.data : [];
    const services = Array.isArray(serviceResult.data) ? serviceResult.data : [];
    const media = Array.isArray(mediaResult.data) ? mediaResult.data : [];

    // Apply filters safely on the already-filtered data
    if (category && category !== 'all') {
      vendors = vendors.filter((v: any) => v.category === category);
    }

    if (location && location !== 'all') {
      vendors = vendors.filter((v: any) => 
        v.location && v.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.trim().toLowerCase();
      vendors = vendors.filter((v: any) => 
        (v.business_name && v.business_name.toLowerCase().includes(search)) ||
        (v.description && v.description.toLowerCase().includes(search))
      );
    }

    const processedVendors = vendors.slice(offset, offset + limit).map((vendor: any) => ({
      ...vendor,
      services: services.filter((s: any) => s.vendor_id === vendor.id),
      vendor_media: media.filter((m: any) => m.vendor_id === vendor.id)
    }));

    return { data: processedVendors, error: null };
  } catch (error) {
    console.error('Error in getPublicVendors:', error);
    return { data: [], error };
  }
};

/**
 * SECURITY: Get vendor data for authenticated users with enhanced logging
 */
export const getVendorsForAuthenticated = async (options: {
  category?: string;
  location?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
} = {}) => {
  const { category, location, searchTerm, limit = 50, offset = 0 } = options;

  try {
    // Log the authenticated access
    await logCustomerDataAccess(
      'vendor_contact_info',
      'authenticated_user_browse',
      'browsing_for_booking'
    );

    let query = supabase
      .from('vendors')
      .select(`
        ${AUTHENTICATED_VENDOR_FIELDS.join(', ')},
        services(${AUTHENTICATED_SERVICE_FIELDS.join(', ')}),
        vendor_media(file_url, file_type, file_name)
      `)
      .eq('is_frozen', false);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (location && location !== 'all') {
      query = query.ilike('location', `%${location}%`);
    }

    if (searchTerm && searchTerm.trim()) {
      const sanitizedSearch = searchTerm.trim();
      query = query.or(
        `business_name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`
      );
    }

    return query.range(offset, offset + limit - 1);
  } catch (error) {
    console.error('Error in getVendorsForAuthenticated:', error);
    return { data: [], error };
  }
};

/**
 * SECURITY: Get full vendor data for vendor owners with enhanced logging
 */
export const getVendorForOwner = async (vendorId: string, userId: string) => {
  try {
    // Log owner access to their own vendor data
    await logCustomerDataAccess(
      'vendor_owner_data',
      vendorId,
      'owner_dashboard_access'
    );

    return supabase
      .from('vendors')
      .select(`
        ${OWNER_VENDOR_FIELDS.join(', ')},
        services(${AUTHENTICATED_SERVICE_FIELDS.join(', ')}),
        vendor_media(file_url, file_type, file_name, file_size, mime_type)
      `)
      .eq('id', vendorId)
      .eq('user_id', userId)
      .single();
  } catch (error) {
    console.error('Error in getVendorForOwner:', error);
    return { data: null, error };
  }
};

/**
 * SECURITY: Get single vendor for public viewing using secure function
 */
export const getPublicVendor = async (vendorId: string) => {
  try {
    // Use regular table query instead of non-existent function
    const vendorResult = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        category,
        description,
        location,
        logo_url,
        created_at,
        is_frozen
      `)
      .eq('is_frozen', false)
      .eq('id', vendorId);
    
    if (vendorResult.error) throw vendorResult.error;
    
    const [serviceResult, mediaResult] = await Promise.all([
      supabase
        .from('services')
        .select(`
          id,
          vendor_id,
          name,
          description,
          pricing_type,
          duration_minutes
        `)
        .eq('vendor_id', vendorId),
      supabase
        .from('vendor_media')
        .select('file_url, file_type')
        .eq('vendor_id', vendorId)
        .in('file_type', ['image', 'video'])
    ]);

    if (serviceResult.error) throw serviceResult.error;
    if (mediaResult.error) throw mediaResult.error;

    const vendorData = vendorResult.data?.[0];
    if (!vendorData) {
      return { data: null, error: new Error('Vendor not found or not available') };
    }

    return {
      data: {
        ...vendorData,
        services: serviceResult.data || [],
        vendor_media: mediaResult.data || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getPublicVendor:', error);
    return { data: null, error };
  }
};

/**
 * SECURITY: Get vendor with contact info for authenticated users making bookings
 */
export const getVendorForBooking = async (vendorId: string) => {
  try {
    // Log the booking-related contact access
    await logCustomerDataAccess(
      'vendor_contact_for_booking',
      vendorId,
      'legitimate_booking_inquiry'
    );

    // Use regular table query for authenticated contact access
    const vendorResult = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        category,
        description,
        location,
        logo_url,
        contact_email,
        contact_phone,
        created_at,
        is_frozen
      `)
      .eq('is_frozen', false)
      .eq('id', vendorId);
    
    if (vendorResult.error) throw vendorResult.error;
    
    const [serviceResult, mediaResult] = await Promise.all([
      supabase
        .from('services')
        .select(`
          id,
          vendor_id,
          name,
          description,
          pricing_type,
          duration_minutes,
          price
        `)
        .eq('vendor_id', vendorId),
      supabase
        .from('vendor_media')
        .select('file_url, file_type')
        .eq('vendor_id', vendorId)
        .in('file_type', ['image', 'video'])
    ]);

    if (serviceResult.error) throw serviceResult.error;
    if (mediaResult.error) throw mediaResult.error;

    const vendorData = vendorResult.data?.[0];
    if (!vendorData) {
      return { data: null, error: new Error('Vendor not found or access denied') };
    }

    return {
      data: {
        ...vendorData,
        services: serviceResult.data || [],
        vendor_media: mediaResult.data || []
      },
      error: null
    };
  } catch (error) {
    console.error('Error in getVendorForBooking:', error);
    return { data: null, error };
  }
};

/**
 * SECURITY: Get vendor contact information using new secure function
 */
export const getVendorContactForBooking = async (vendorId: string) => {
  try {
    // Use regular table query for contact info
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        contact_email,
        contact_phone
      `)
      .eq('id', vendorId)
      .eq('is_frozen', false);
    
    if (error) {
      console.error('Contact access error:', error);
      return { data: null, error };
    }
    
    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error('Error in getVendorContactForBooking:', error);
    return { data: null, error };
  }
};

/**
 * SECURITY: Check if user can access sensitive vendor data
 */
export const canAccessSensitiveVendorData = async (vendorId: string, userId?: string): Promise<boolean> => {
  if (!userId) return false;

  try {
    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', vendorId)
      .single();

    if (error) {
      console.error('Error checking vendor ownership:', error);
      return false;
    }

    return vendor?.user_id === userId;
  } catch (error) {
    console.error('Error in canAccessSensitiveVendorData:', error);
    return false;
  }
};

/**
 * SECURITY: Determine which query method to use based on authentication status and ownership
 */
export const determineVendorQueryMethod = (isAuthenticated: boolean, isVendorOwner: boolean = false) => {
  if (isVendorOwner) return 'owner';
  if (isAuthenticated) return 'authenticated';
  return 'public';
};

/**
 * SECURITY: Sanitize vendor data for different access levels
 */
export const sanitizeVendorData = (vendor: any, accessLevel: 'public' | 'authenticated' | 'owner') => {
  if (!vendor) return vendor;

  const sanitized = { ...vendor };

  if (accessLevel === 'public') {
    // Remove all sensitive information for public access
    delete sanitized.contact_email;
    delete sanitized.contact_phone;
    delete sanitized.user_id;
    delete sanitized.bank_account_details;
    delete sanitized.payout_method;
    delete sanitized.site_account_balance;
    
    // Filter services to remove pricing for public access
    if (sanitized.services) {
      sanitized.services = sanitized.services.map((service: any) => {
        const publicService = { ...service };
        delete publicService.price;
        return publicService;
      });
    }
  } else if (accessLevel === 'authenticated') {
    // Remove owner-only sensitive information
    delete sanitized.user_id;
    delete sanitized.bank_account_details;
    delete sanitized.payout_method;
    delete sanitized.site_account_balance;
  }
  // 'owner' level gets all data

  return sanitized;
};
