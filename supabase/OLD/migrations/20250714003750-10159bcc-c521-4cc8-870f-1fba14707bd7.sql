-- Create bookings table for vendor appointments
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  service_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to vendors table
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_vendor_id_fkey 
FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor access
CREATE POLICY "Vendors can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = bookings.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "Vendors can create bookings for their services" 
ON public.bookings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = bookings.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "Vendors can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = bookings.vendor_id 
  AND vendors.user_id = auth.uid()
));

CREATE POLICY "Vendors can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM vendors 
  WHERE vendors.id = bookings.vendor_id 
  AND vendors.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_bookings_vendor_date ON public.bookings(vendor_id, booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);