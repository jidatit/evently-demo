
-- Create a table to track platform commissions
CREATE TABLE IF NOT EXISTS public.platform_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(3,2) NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC(10,2) NOT NULL,
  vendor_net_amount NUMERIC(10,2) NOT NULL,
  transfer_status TEXT NOT NULL DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'completed', 'failed')),
  platform_transfer_id TEXT,
  vendor_transfer_id TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own commissions" 
  ON public.platform_commissions 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = platform_commissions.vendor_id 
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all commissions" 
  ON public.platform_commissions 
  FOR SELECT 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage commissions" 
  ON public.platform_commissions 
  FOR ALL 
  USING (true);

-- Update invoices table to include commission tracking
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS commission_calculated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS platform_fee_amount NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS vendor_net_amount NUMERIC(10,2);

-- Create function to calculate commission on invoice payment
CREATE OR REPLACE FUNCTION public.calculate_platform_commission()
RETURNS TRIGGER AS $$
DECLARE
  commission_rate NUMERIC(3,2) := 0.10;
  gross_amount NUMERIC(10,2);
  commission_amount NUMERIC(10,2);
  net_amount NUMERIC(10,2);
BEGIN
  -- Only process when invoice is marked as paid and commission not yet calculated
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NOT COALESCE(NEW.commission_calculated, FALSE) THEN
    
    gross_amount := NEW.total_amount;
    commission_amount := ROUND(gross_amount * commission_rate, 2);
    net_amount := gross_amount - commission_amount;
    
    -- Update invoice with commission details
    UPDATE public.invoices 
    SET 
      platform_fee_amount = commission_amount,
      vendor_net_amount = net_amount,
      commission_calculated = TRUE
    WHERE id = NEW.id;
    
    -- Create commission record
    INSERT INTO public.platform_commissions (
      invoice_id,
      vendor_id,
      booking_id,
      gross_amount,
      commission_rate,
      commission_amount,
      vendor_net_amount
    ) VALUES (
      NEW.id,
      NEW.vendor_id,
      NEW.booking_id,
      gross_amount,
      commission_rate,
      commission_amount,
      net_amount
    );
    
    -- Log the commission calculation
    INSERT INTO public.security_events (
      event_type,
      details,
      severity,
      category
    ) VALUES (
      'COMMISSION_CALCULATED',
      jsonb_build_object(
        'invoice_id', NEW.id,
        'vendor_id', NEW.vendor_id,
        'gross_amount', gross_amount,
        'commission_amount', commission_amount,
        'net_amount', net_amount
      ),
      'medium',
      'financial'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for commission calculation
DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.invoices;
CREATE TRIGGER trigger_calculate_commission
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_platform_commission();

-- Create function to get vendor earnings summary
CREATE OR REPLACE FUNCTION public.get_vendor_earnings_summary(vendor_id_param UUID)
RETURNS TABLE(
  total_gross_earnings NUMERIC,
  total_commission_paid NUMERIC,
  total_net_earnings NUMERIC,
  pending_commissions NUMERIC,
  completed_transfers NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pc.gross_amount), 0) as total_gross_earnings,
    COALESCE(SUM(pc.commission_amount), 0) as total_commission_paid,
    COALESCE(SUM(pc.vendor_net_amount), 0) as total_net_earnings,
    COALESCE(SUM(CASE WHEN pc.transfer_status = 'pending' THEN pc.vendor_net_amount ELSE 0 END), 0) as pending_commissions,
    COALESCE(SUM(CASE WHEN pc.transfer_status = 'completed' THEN pc.vendor_net_amount ELSE 0 END), 0) as completed_transfers
  FROM public.platform_commissions pc
  WHERE pc.vendor_id = vendor_id_param;
END;
$$;

-- Create function to get platform commission summary for admins
CREATE OR REPLACE FUNCTION public.get_platform_commission_summary()
RETURNS TABLE(
  total_commissions_earned NUMERIC,
  total_commissions_pending NUMERIC,
  total_commissions_completed NUMERIC,
  total_vendor_payouts NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Verify admin access
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can access platform commission summary';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pc.commission_amount), 0) as total_commissions_earned,
    COALESCE(SUM(CASE WHEN pc.transfer_status = 'pending' THEN pc.commission_amount ELSE 0 END), 0) as total_commissions_pending,
    COALESCE(SUM(CASE WHEN pc.transfer_status = 'completed' THEN pc.commission_amount ELSE 0 END), 0) as total_commissions_completed,
    COALESCE(SUM(pc.vendor_net_amount), 0) as total_vendor_payouts
  FROM public.platform_commissions pc;
END;
$$;

-- Add updated_at trigger for platform_commissions
CREATE TRIGGER trigger_update_platform_commissions_updated_at
  BEFORE UPDATE ON public.platform_commissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
