
-- Create vendors table
CREATE TABLE public.vendors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Vendors RLS Policies
CREATE POLICY "Anyone can view vendors" 
  ON public.vendors 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "Users can create their own vendor profile" 
  ON public.vendors 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor profile" 
  ON public.vendors 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendor profile" 
  ON public.vendors 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Services RLS Policies
CREATE POLICY "Anyone can view services" 
  ON public.services 
  FOR SELECT 
  USING (TRUE);

CREATE POLICY "Vendor owners can manage their services" 
  ON public.services 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors 
      WHERE vendors.id = services.vendor_id 
      AND vendors.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX idx_vendors_category ON public.vendors(category);
CREATE INDEX idx_services_vendor_id ON public.services(vendor_id);
