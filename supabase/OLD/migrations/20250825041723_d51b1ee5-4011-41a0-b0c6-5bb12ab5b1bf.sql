
-- First, let's drop the problematic foreign key constraint that's preventing deletion
ALTER TABLE public.contract_signatures DROP CONSTRAINT IF EXISTS contract_signatures_signer_id_fkey;

-- Now delete all contract signatures for the problematic user
DELETE FROM public.contract_signatures WHERE signer_id = 'a42759c2-7456-478c-882d-a5ab5898b879';

-- Delete any contracts associated with this user
DELETE FROM public.contracts WHERE customer_id = 'a42759c2-7456-478c-882d-a5ab5898b879';

-- Delete vendor-related data if exists
DELETE FROM public.vendor_media WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.vendor_payment_methods WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.services WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.bookings WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.invoices WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.payments WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.vendor_payouts WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.commission_transactions WHERE vendor_id IN (SELECT id FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879');
DELETE FROM public.vendors WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879';

-- Delete customer-related data
DELETE FROM public.bookings WHERE customer_id = 'a42759c2-7456-478c-882d-a5ab5898b879' OR customer_email = 'hraygoza32@gmail.com';
DELETE FROM public.payments WHERE customer_id = 'a42759c2-7456-478c-882d-a5ab5898b879' OR customer_email = 'hraygoza32@gmail.com';
DELETE FROM public.invoices WHERE customer_id = 'a42759c2-7456-478c-882d-a5ab5898b879' OR customer_email = 'hraygoza32@gmail.com';

-- Delete user roles and security events
DELETE FROM public.user_roles WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879';
DELETE FROM public.security_events WHERE user_id = 'a42759c2-7456-478c-882d-a5ab5898b879';

-- Finally delete the profile
DELETE FROM public.profiles WHERE id = 'a42759c2-7456-478c-882d-a5ab5898b879';

-- Re-create the foreign key constraint with ON DELETE CASCADE for future safety
ALTER TABLE public.contract_signatures 
ADD CONSTRAINT contract_signatures_signer_id_fkey 
FOREIGN KEY (signer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
