
-- Create storage bucket for vendor media
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-media', 'vendor-media', true);

-- Create RLS policies for the vendor-media bucket
CREATE POLICY "Vendors can upload their own media" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'vendor-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view vendor media" ON storage.objects
FOR SELECT USING (bucket_id = 'vendor-media');

CREATE POLICY "Vendors can update their own media" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'vendor-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete their own media" ON storage.objects
FOR DELETE USING (
  bucket_id = 'vendor-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
