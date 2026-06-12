export type UserRole = 'customer' | 'vendor' | 'pending_vendor' | 'admin';

export interface MockUserRecord {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface MockProfile {
  id: string;
  name: string | null;
  email: string | null;
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface MockVendor {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  city: string;
  state: string;
  contact_email: string | null;
  contact_phone: string | null;
  accepting_bookings: boolean;
  unavailable_until: string | null;
  unavailable_message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  logo_url: string | null;
  profile_slug: string;
  social_links: Record<string, string>;
  is_profile_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockVendorCategory {
  vendor_id: string;
  category_id: string;
  is_primary: boolean;
  display_order: number;
}

export interface MockVendorMedia {
  id: string;
  vendor_id: string;
  service_id: string | null;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MockService {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number | null;
  pricing_type: 'per_hour' | 'per_event' | 'per_day' | 'quote';
  duration_minutes: number | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface MockServiceSnapshot {
  name: string;
  description: string | null;
  pricing_type: string;
  rate_cents: number;
  quantity: number;
  quantity_unit: string;
  total_price_cents: number;
  duration_minutes: number | null;
  price_cents?: number;
}

export interface MockBooking {
  id: string;
  idempotency_key: string;
  vendor_id: string;
  customer_id: string;
  thread_id: string | null;
  service_id: string | null;
  service_snapshot: MockServiceSnapshot;
  event_date: string;
  event_end_date: string | null;
  event_time_start: string | null;
  event_time_end: string | null;
  event_location: string | null;
  notes: string | null;
  status: string;
  decline_reason: string | null;
  declined_by: string | null;
  payment_link_expires_at: string | null;
  payout_released_at: string | null;
  vendor_category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockPayment {
  id: string;
  booking_id: string;
  checkout_url: string | null;
  status: string;
  amount_total_cents: number;
  amount_vendor_payout_cents: number;
  stripe_checkout_session_id: string | null;
  payout_released_at: string | null;
}

export interface MockBookingStatusHistory {
  id: string;
  booking_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  actor_type: 'customer' | 'vendor' | 'system' | 'admin';
  reason: string | null;
  created_at: string;
}

export interface MockThread {
  id: string;
  vendor_id: string;
  customer_id: string;
  booking_id: string | null;
  status: 'open' | 'closed';
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockThreadMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  type: 'message' | 'quote';
  body: string;
  quote_price_cents: number | null;
  quote_notes: string | null;
  quote_status: 'pending' | 'accepted' | 'declined' | 'withdrawn' | null;
  created_at: string;
}

export interface MockVendorFavorite {
  id: string;
  customer_id: string;
  vendor_id: string;
  created_at: string;
}

export interface MockBookingClaim {
  id: string;
  booking_id: string;
  submitted_by: string;
  claim_type: 'no_show' | 'cancellation';
  description: string;
  status: 'under_review' | 'approved' | 'denied';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockVendorStripeAccount {
  id: string;
  vendor_id: string;
  stripe_account_id: string;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  payouts_ever_enabled: boolean;
  stripe_action_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoDatabase {
  users: MockUserRecord[];
  profiles: MockProfile[];
  categories: MockCategory[];
  vendors: MockVendor[];
  vendor_categories: MockVendorCategory[];
  vendor_media: MockVendorMedia[];
  services: MockService[];
  bookings: MockBooking[];
  booking_status_history: MockBookingStatusHistory[];
  payments: MockPayment[];
  threads: MockThread[];
  thread_messages: MockThreadMessage[];
  vendor_favorites: MockVendorFavorite[];
  booking_claims: MockBookingClaim[];
  vendor_stripe_accounts: MockVendorStripeAccount[];
}

export interface MockSessionPayload {
  userId: string;
  accessToken: string;
  expiresAt: number;
}
