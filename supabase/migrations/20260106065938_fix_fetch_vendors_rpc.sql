CREATE OR REPLACE FUNCTION fetch_vendors_rpc(
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
DECLARE
  total_count INT;
  today DATE := CURRENT_DATE;
BEGIN
  -- Create temp table to materialize filtered vendors
  CREATE TEMP TABLE filtered_vendors ON COMMIT DROP AS
  SELECT 
    v.id,
    v.business_name AS "businessName",
    v.city,
    v.state,
    v.logo_url AS "logoUrl",
    COALESCE(v.profile_slug, v.id::text) AS "profileSlug",
    v.accepting_bookings AS "acceptingBookings",
    v.unavailable_until AS "unavailableUntil",
    -- Aggregate all categories as JSON array (sorted by display_order)
    COALESCE(
      json_agg(
        json_build_object(
          'category_id', vc.category_id,
          'is_primary', vc.is_primary,
          'display_order', vc.display_order,
          'name', c.name,
          'slug', c.slug
        )
        ORDER BY vc.display_order
      ) FILTER (WHERE vc.vendor_id IS NOT NULL),
      '[]'::json
    ) AS categories,
    -- Aggregate min/max prices from active services
    MIN(s.price) AS "minServicePrice",
    MAX(s.price) AS "maxServicePrice"
  FROM public.vendors v
  LEFT JOIN public.vendor_categories vc ON v.id = vc.vendor_id
  LEFT JOIN public.categories c ON vc.category_id = c.id
  LEFT JOIN public.services s ON v.id = s.vendor_id AND s.is_active = TRUE AND s.price IS NOT NULL
  WHERE 
    v.status = 'approved'
    AND v.is_profile_public = TRUE
    -- Location filters
    AND (p_state IS NULL OR v.state = p_state)
    AND (p_city IS NULL OR v.city = p_city)
    -- Availability filter
    AND (p_availability IS NULL OR (
      p_availability = 'available' 
      AND v.accepting_bookings = TRUE
      AND (v.unavailable_until IS NULL OR v.unavailable_until < today)
    ))
    -- Search on business_name only
    AND (p_search_term IS NULL OR LOWER(v.business_name) LIKE '%' || LOWER(p_search_term) || '%')
    -- Category filter (exists check for any category match)
    AND (p_category_id IS NULL OR EXISTS (
      SELECT 1 FROM public.vendor_categories vc2 
      WHERE vc2.vendor_id = v.id AND vc2.category_id = p_category_id
    ))
  GROUP BY 
    v.id, v.business_name, v.city, v.state, v.logo_url, v.profile_slug, 
    v.accepting_bookings, v.unavailable_until
  HAVING 
    (p_price_min IS NULL AND p_price_max IS NULL) OR
    (MIN(s.price) IS NOT NULL AND 
     NOT (MAX(s.price) < p_price_min OR MIN(s.price) > p_price_max));

  -- Get total count from temp table
  SELECT COUNT(*) INTO total_count FROM filtered_vendors;
  
  -- Return paginated results as JSON
  RETURN json_build_object(
    'vendors', (
      SELECT COALESCE(json_agg(row_to_json(fv)), '[]'::json)
      FROM (
        SELECT 
          id,
          "businessName",
          city,
          state,
          "logoUrl",
          "profileSlug",
          "acceptingBookings",
          "unavailableUntil",
          categories,
          (CASE WHEN "minServicePrice" IS NOT NULL AND "minServicePrice" != 'Infinity' THEN "minServicePrice" ELSE NULL END) AS "minServicePrice",
          (CASE WHEN "maxServicePrice" IS NOT NULL AND "maxServicePrice" != '-Infinity' THEN "maxServicePrice" ELSE NULL END) AS "maxServicePrice"
        FROM filtered_vendors
        ORDER BY "businessName"
        LIMIT p_limit OFFSET p_page * p_limit
      ) fv
    ),
    'count', total_count,
    'hasMore', (p_page * p_limit + p_limit) < total_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;