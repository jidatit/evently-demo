-- Distinguish "Stripe is reviewing" vs "Stripe needs more information" (past_due / disabled)

ALTER TABLE public.vendor_stripe_accounts
  ADD COLUMN IF NOT EXISTS stripe_action_required boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.vendor_stripe_accounts.stripe_action_required IS
  'True when Stripe requirements are past_due or account has disabled_reason; vendor must supply data in Express.';
