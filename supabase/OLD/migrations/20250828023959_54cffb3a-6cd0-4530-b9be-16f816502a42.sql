
-- Create vendor_reviews table
CREATE TABLE public.vendor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  customer_id UUID REFERENCES auth.users NOT NULL,
  booking_id UUID REFERENCES public.bookings(id),
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  service_rating INTEGER NOT NULL CHECK (service_rating >= 1 AND service_rating <= 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER NOT NULL CHECK (value_rating >= 1 AND value_rating <= 5),
  review_text TEXT,
  review_photos TEXT[], -- Array of photo URLs
  is_verified BOOLEAN NOT NULL DEFAULT false,
  vendor_response TEXT,
  vendor_response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, customer_id, booking_id)
);

-- Create review_helpfulness table for tracking helpful votes
CREATE TABLE public.review_helpfulness (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES public.vendor_reviews(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable RLS on both tables
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_reviews
CREATE POLICY "Anyone can view published reviews" 
  ON public.vendor_reviews FOR SELECT 
  USING (true);

CREATE POLICY "Customers can create reviews for their bookings" 
  ON public.vendor_reviews FOR INSERT 
  WITH CHECK (
    customer_id = auth.uid() AND
    (booking_id IS NULL OR EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = vendor_reviews.booking_id 
      AND b.customer_id = auth.uid()
      AND b.status = 'completed'
    ))
  );

CREATE POLICY "Customers can update their own reviews" 
  ON public.vendor_reviews FOR UPDATE 
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors can update responses to reviews" 
  ON public.vendor_reviews FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = vendor_reviews.vendor_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendors v 
      WHERE v.id = vendor_reviews.vendor_id AND v.user_id = auth.uid()
    )
  );

-- RLS policies for review_helpfulness
CREATE POLICY "Users can view helpfulness votes" 
  ON public.review_helpfulness FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can vote on review helpfulness" 
  ON public.review_helpfulness FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own helpfulness votes" 
  ON public.review_helpfulness FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own helpfulness votes" 
  ON public.review_helpfulness FOR DELETE 
  USING (user_id = auth.uid());

-- Function to automatically verify reviews for completed bookings
CREATE OR REPLACE FUNCTION verify_review_from_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking_id is provided and booking exists and is completed, mark as verified
  IF NEW.booking_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = NEW.booking_id 
      AND b.customer_id = NEW.customer_id 
      AND b.vendor_id = NEW.vendor_id
      AND b.status = 'completed'
    ) THEN
      NEW.is_verified = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to verify reviews
CREATE TRIGGER verify_review_trigger
  BEFORE INSERT ON public.vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION verify_review_from_booking();

-- Create storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for review photos bucket
CREATE POLICY "Anyone can view review photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'review-photos' AND 
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own review photos" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'review-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to calculate vendor average ratings
CREATE OR REPLACE FUNCTION get_vendor_ratings(vendor_id_param UUID)
RETURNS TABLE (
  average_overall NUMERIC(3,2),
  average_service NUMERIC(3,2),
  average_communication NUMERIC(3,2),
  average_value NUMERIC(3,2),
  total_reviews INTEGER,
  rating_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(overall_rating), 2) as average_overall,
    ROUND(AVG(service_rating), 2) as average_service,
    ROUND(AVG(communication_rating), 2) as average_communication,
    ROUND(AVG(value_rating), 2) as average_value,
    COUNT(*)::INTEGER as total_reviews,
    jsonb_build_object(
      '5_star', COUNT(*) FILTER (WHERE overall_rating = 5),
      '4_star', COUNT(*) FILTER (WHERE overall_rating = 4),
      '3_star', COUNT(*) FILTER (WHERE overall_rating = 3),
      '2_star', COUNT(*) FILTER (WHERE overall_rating = 2),
      '1_star', COUNT(*) FILTER (WHERE overall_rating = 1)
    ) as rating_breakdown
  FROM public.vendor_reviews 
  WHERE vendor_id = vendor_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
