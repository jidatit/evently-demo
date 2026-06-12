-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- OPTION 2: Pure SQL Function (Even faster, no PL/pgSQL overhead)
-- ============================================================================
CREATE OR REPLACE FUNCTION fetch_vendors_rpc_v2(
  p_state TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_availability TEXT DEFAULT NULL,
  p_search_term TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_price_min NUMERIC DEFAULT NULL,
  p_price_max NUMERIC DEFAULT NULL,
  p_page INT DEFAULT 0,
  p_limit INT DEFAULT 10
)
RETURNS JSON AS $$
  WITH filtered_vendors AS MATERIALIZED (
    SELECT 
      v.id,
      v.business_name,
      v.city,
      v.state,
      v.logo_url,
      v.profile_slug,
      v.accepting_bookings,
      v.unavailable_until,
      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'isPrimary', vc.is_primary,
            'displayOrder', vc.display_order
          )
          ORDER BY jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'slug', c.slug,
            'isPrimary', vc.is_primary,
            'displayOrder', vc.display_order
          )
        ) FILTER (WHERE c.id IS NOT NULL),
        '[]'::json
      ) AS categories,
      MIN(s.price) AS min_price,
      MAX(s.price) AS max_price
    FROM vendors v
    LEFT JOIN vendor_categories vc ON v.id = vc.vendor_id
    LEFT JOIN categories c ON vc.category_id = c.id
    LEFT JOIN services s ON v.id = s.vendor_id 
      AND s.is_active = TRUE 
      AND s.price IS NOT NULL
    WHERE 
      v.status = 'approved'
      AND v.is_profile_public = TRUE
      AND (p_state IS NULL OR v.state = p_state)
      AND (p_city IS NULL OR v.city = p_city)
      AND (
        p_availability IS NULL OR (
          p_availability = 'available' 
          AND v.accepting_bookings = TRUE
          AND (v.unavailable_until IS NULL OR v.unavailable_until < CURRENT_DATE)
        )
      )
      AND (p_search_term IS NULL OR v.business_name ILIKE '%' || p_search_term || '%')
      AND (
        p_category_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM vendor_categories vc2 
          WHERE vc2.vendor_id = v.id 
            AND vc2.category_id = p_category_id
        )
      )
    GROUP BY v.id
    HAVING 
      (p_price_min IS NULL AND p_price_max IS NULL) OR
      (
        MIN(s.price) IS NOT NULL AND 
        NOT (MAX(s.price) < p_price_min OR MIN(s.price) > p_price_max)
      )
  ),
  total_count AS (
    SELECT COUNT(*) AS count FROM filtered_vendors
  )
  SELECT json_build_object(
    'vendors', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', fv.id,
            'businessName', fv.business_name,
            'city', fv.city,
            'state', fv.state,
            'logoUrl', fv.logo_url,
            'profileSlug', COALESCE(fv.profile_slug, fv.id::text),
            'acceptingBookings', fv.accepting_bookings,
            'unavailableUntil', fv.unavailable_until,
            'categories', fv.categories,
            'minServicePrice', fv.min_price,
            'maxServicePrice', fv.max_price
          )
          ORDER BY fv.business_name
        )
        FROM (
          SELECT * FROM filtered_vendors
          LIMIT p_limit 
          OFFSET p_page * p_limit
        ) fv
      ),
      '[]'::json
    ),
    'count', (SELECT count FROM total_count),
    'hasMore', (p_page * p_limit + p_limit) < (SELECT count FROM total_count)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Performance Indexes (ADD THESE!)
-- ============================================================================

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_vendors_status_public_state 
ON vendors(status, is_profile_public, state) 
WHERE status = 'approved' AND is_profile_public = TRUE;

-- Index for availability queries
CREATE INDEX IF NOT EXISTS idx_vendors_availability 
ON vendors(accepting_bookings, unavailable_until) 
WHERE status = 'approved' AND is_profile_public = TRUE;

-- Text search index for business names
CREATE INDEX IF NOT EXISTS idx_vendors_business_name_trgm 
ON vendors USING gin(business_name gin_trgm_ops);

-- Enable trigram extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for vendor categories lookup
CREATE INDEX IF NOT EXISTS idx_vendor_categories_category_vendor 
ON vendor_categories(category_id, vendor_id);

-- Index for service prices
CREATE INDEX IF NOT EXISTS idx_services_vendor_active_price 
ON services(vendor_id, is_active, price) 
WHERE is_active = TRUE AND price IS NOT NULL;