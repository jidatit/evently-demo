
-- Add pricing_type column to the services table
ALTER TABLE public.services 
ADD COLUMN pricing_type text DEFAULT 'per_hour';

-- Add a check constraint to ensure only valid pricing types are allowed
ALTER TABLE public.services 
ADD CONSTRAINT services_pricing_type_check 
CHECK (pricing_type IN ('per_hour', 'per_piece'));
