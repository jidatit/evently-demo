import type { MockService, MockVendorMedia } from '../types';

const ts = '2024-08-01T12:00:00Z';

export const mockServices: MockService[] = [
  { id: 'svc-1-1', vendor_id: 'vendor-1', name: 'Full Day Wedding Coverage', description: '8 hours of photography with edited gallery.', price: 2500, pricing_type: 'per_event', duration_minutes: 480, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-1-2', vendor_id: 'vendor-1', name: 'Portrait Mini Session', description: '1-hour portrait session, 25 edited photos.', price: 350, pricing_type: 'per_hour', duration_minutes: 60, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-1-3', vendor_id: 'vendor-1', name: 'Corporate Event Package', description: 'Half-day corporate event coverage.', price: 1200, pricing_type: 'per_event', duration_minutes: 240, is_active: true, display_order: 3, created_at: ts, updated_at: ts },
  { id: 'svc-2-1', vendor_id: 'vendor-2', name: 'Wedding DJ Package', description: 'Ceremony + reception DJ with MC services.', price: 1800, pricing_type: 'per_event', duration_minutes: 360, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-2-2', vendor_id: 'vendor-2', name: 'Club Night DJ', description: 'High-energy DJ set with lighting.', price: 150, pricing_type: 'per_hour', duration_minutes: 60, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-3-1', vendor_id: 'vendor-3', name: 'Buffet Catering (per guest)', description: 'Seasonal buffet menu.', price: 45, pricing_type: 'per_event', duration_minutes: null, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-3-2', vendor_id: 'vendor-3', name: 'Plated Dinner Service', description: 'Three-course plated dinner.', price: 75, pricing_type: 'per_event', duration_minutes: null, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-4-1', vendor_id: 'vendor-4', name: 'Premium Open Bar', description: 'Craft cocktails for up to 100 guests.', price: 2200, pricing_type: 'per_event', duration_minutes: 240, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-4-2', vendor_id: 'vendor-4', name: 'Bartender (hourly)', description: 'Professional bartender per hour.', price: 85, pricing_type: 'per_hour', duration_minutes: 60, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-5-1', vendor_id: 'vendor-5', name: 'Grand Ballroom Rental', description: 'Full-day venue rental up to 250 guests.', price: 5000, pricing_type: 'per_day', duration_minutes: 720, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-5-2', vendor_id: 'vendor-5', name: 'Garden Ceremony Space', description: 'Outdoor ceremony space for 150 guests.', price: 2500, pricing_type: 'per_event', duration_minutes: 180, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-6-1', vendor_id: 'vendor-6', name: 'Full Event Florals', description: 'Ceremony + reception floral design.', price: 3200, pricing_type: 'per_event', duration_minutes: null, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-6-2', vendor_id: 'vendor-6', name: 'Centerpiece Package', description: 'Table centerpieces for up to 20 tables.', price: 900, pricing_type: 'per_event', duration_minutes: null, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
  { id: 'svc-7-1', vendor_id: 'vendor-7', name: 'Engagement Session', description: '90-minute engagement photo session.', price: 450, pricing_type: 'per_event', duration_minutes: 90, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-8-1', vendor_id: 'vendor-8', name: 'Reception DJ + Lighting', description: 'DJ with dance floor lighting package.', price: 1600, pricing_type: 'per_event', duration_minutes: 300, is_active: true, display_order: 1, created_at: ts, updated_at: ts },
  { id: 'svc-8-2', vendor_id: 'vendor-8', name: 'Add-on Uplighting', description: 'Ambient uplighting for venue walls.', price: 400, pricing_type: 'per_event', duration_minutes: null, is_active: true, display_order: 2, created_at: ts, updated_at: ts },
];

export const mockServiceMedia: MockVendorMedia[] = mockServices.slice(0, 6).map((s, i) => ({
  id: `media-svc-${s.id}`,
  vendor_id: s.vendor_id,
  service_id: s.id,
  file_name: 'service.jpg',
  file_url: '/placeholder.svg',
  file_type: 'image' as const,
  file_size: 512,
  mime_type: 'image/jpeg',
  display_order: 0,
  is_active: true,
  created_at: s.created_at,
  updated_at: s.updated_at,
}));
