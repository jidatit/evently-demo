-- Gate marketplace browse: only vendors with Stripe payouts enabled

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
        (
          SELECT json_agg(cat_obj ORDER BY cat_obj->>'displayOrder')
          FROM (
            SELECT DISTINCT jsonb_build_object(
              'id', c.id,
              'name', c.name,
              'slug', c.slug,
              'isPrimary', vc.is_primary,
              'displayOrder', COALESCE(vc.display_order, 0)
            ) as cat_obj
            FROM vendor_categories vc
            INNER JOIN categories c ON vc.category_id = c.id
            WHERE vc.vendor_id = v.id
          ) cats
        ),
        '[]'::json
      ) AS categories,
      (
        SELECT MIN(price) 
        FROM services 
        WHERE vendor_id = v.id 
          AND is_active = TRUE 
          AND price IS NOT NULL
      ) AS min_price,
      (
        SELECT MAX(price) 
        FROM services 
        WHERE vendor_id = v.id 
          AND is_active = TRUE 
          AND price IS NOT NULL
      ) AS max_price
    FROM vendors v
    WHERE 
      v.status = 'approved'
      AND v.is_profile_public = TRUE
      AND (p_state IS NULL OR v.state = p_state)
      AND (p_city IS NULL OR v.city = p_city)
      AND (
        p_availability IS NULL OR 
        p_availability = 'all' OR
        (
          p_availability = 'available' 
          AND v.accepting_bookings = TRUE
          AND (v.unavailable_until IS NULL OR v.unavailable_until < CURRENT_DATE)
        )
      )
      AND (p_search_term IS NULL OR v.business_name % p_search_term)
      AND (
        p_category_id IS NULL OR 
        EXISTS (
          SELECT 1 FROM vendor_categories vc2 
          WHERE vc2.vendor_id = v.id 
            AND vc2.category_id = p_category_id
        )
      )
      AND (
        (p_price_min IS NULL AND p_price_max IS NULL) OR
        EXISTS (
          SELECT 1 FROM services s
          WHERE s.vendor_id = v.id
            AND s.is_active = TRUE
            AND s.price IS NOT NULL
            AND (
              (s.price >= p_price_min AND s.price <= p_price_max) OR
              (p_price_min IS NULL AND s.price <= p_price_max) OR
              (p_price_max IS NULL AND s.price >= p_price_min)
            )
        )
      )
      AND EXISTS (
        SELECT 1 FROM vendor_stripe_accounts vsa
        WHERE vsa.vendor_id = v.id
          AND vsa.payouts_enabled = true
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
