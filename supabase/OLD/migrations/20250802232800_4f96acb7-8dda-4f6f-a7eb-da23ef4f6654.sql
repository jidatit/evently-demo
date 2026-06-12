
-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  customer_id UUID REFERENCES public.profiles(id),
  contract_content TEXT NOT NULL,
  contract_terms TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contract signatures table
CREATE TABLE public.contract_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_id UUID NOT NULL REFERENCES public.profiles(id),
  signer_type TEXT NOT NULL CHECK (signer_type IN ('vendor', 'customer')),
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contract signatures table  
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts
CREATE POLICY "Vendors can view their own contracts" 
  ON public.contracts 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = contracts.vendor_id 
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Customers can view their own contracts" 
  ON public.contracts 
  FOR SELECT 
  USING (customer_id = auth.uid());

CREATE POLICY "Vendors can create contracts for their bookings" 
  ON public.contracts 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = contracts.vendor_id 
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Vendors can update their own contracts" 
  ON public.contracts 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = contracts.vendor_id 
    AND vendors.user_id = auth.uid()
  ));

-- RLS policies for contract signatures
CREATE POLICY "Users can view signatures for their contracts" 
  ON public.contract_signatures 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contracts.id = contract_signatures.contract_id 
    AND (
      contracts.customer_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.vendors 
        WHERE vendors.id = contracts.vendor_id 
        AND vendors.user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Users can sign their own contracts" 
  ON public.contract_signatures 
  FOR INSERT 
  WITH CHECK (signer_id = auth.uid());

-- Add trigger to update contract status when both parties have signed
CREATE OR REPLACE FUNCTION update_contract_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if both vendor and customer have signed
  IF (
    SELECT COUNT(DISTINCT signer_type) 
    FROM public.contract_signatures 
    WHERE contract_id = NEW.contract_id
  ) = 2 THEN
    UPDATE public.contracts 
    SET status = 'signed', updated_at = now() 
    WHERE id = NEW.contract_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER contract_signature_trigger
  AFTER INSERT ON public.contract_signatures
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_status();

-- Add updated_at trigger for contracts
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
