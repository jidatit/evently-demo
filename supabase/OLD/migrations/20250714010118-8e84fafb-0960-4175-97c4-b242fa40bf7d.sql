-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'vendor', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Create a function to automatically assign vendor role when vendor profile is created
CREATE OR REPLACE FUNCTION public.assign_vendor_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign vendor role
CREATE TRIGGER assign_vendor_role_trigger
  AFTER INSERT ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_vendor_role();

-- Create a function to get platform statistics
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_vendors', (SELECT COUNT(*) FROM vendors),
    'total_bookings', (SELECT COUNT(*) FROM bookings),
    'total_invoices', (SELECT COUNT(*) FROM invoices),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'paid'),
    'pending_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE status = 'sent'),
    'total_services', (SELECT COUNT(*) FROM services),
    'recent_vendors', (
      SELECT json_agg(
        json_build_object(
          'id', v.id,
          'business_name', v.business_name,
          'category', v.category,
          'created_at', v.created_at
        )
      )
      FROM (
        SELECT * FROM vendors 
        ORDER BY created_at DESC 
        LIMIT 5
      ) v
    ),
    'recent_bookings', (
      SELECT json_agg(
        json_build_object(
          'id', b.id,
          'customer_name', b.customer_name,
          'service_name', b.service_name,
          'booking_date', b.booking_date,
          'total_amount', b.total_amount,
          'vendor_name', v.business_name,
          'created_at', b.created_at
        )
      )
      FROM (
        SELECT b.*, v.business_name 
        FROM bookings b
        JOIN vendors v ON b.vendor_id = v.id
        ORDER BY b.created_at DESC 
        LIMIT 10
      ) b
    ),
    'monthly_revenue', (
      SELECT json_agg(
        json_build_object(
          'month', month_year,
          'revenue', revenue
        )
      )
      FROM (
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month_year,
          SUM(total_amount) as revenue
        FROM invoices 
        WHERE status = 'paid'
          AND created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month_year DESC
      ) monthly_data
    )
  )
$$;