-- Pre-Pilot Fixes: RPC Permissions & Column Defaults
-- Created: 2026-02-24

-- Fix claim_partner_account permissions
GRANT EXECUTE ON FUNCTION public.claim_partner_account() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_partner_account() FROM anon;

-- Standardize DB column defaults
ALTER TABLE public.partners ALTER COLUMN max_amortization_months SET DEFAULT 360;
ALTER TABLE public.partners ALTER COLUMN vat_percent SET DEFAULT 18.0;
