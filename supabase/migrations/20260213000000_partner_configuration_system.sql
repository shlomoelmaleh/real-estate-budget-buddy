-- Migration: Partner Configuration System
-- Date: 2026-02-13 00:00:00
-- Description: Adds 18 configuration columns to partners table, audit trail, and RLS policies.

-- 1. Add Configuration Columns to partners Table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS config_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS config_updated_by UUID REFERENCES auth.users(id),

-- Regulatory Parameters
ADD COLUMN IF NOT EXISTS max_dti_ratio DECIMAL(5,4) DEFAULT 0.33 CHECK (max_dti_ratio >= 0.25 AND max_dti_ratio <= 0.50),
ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT 80 CHECK (max_age >= 70 AND max_age <= 95),
ADD COLUMN IF NOT EXISTS max_loan_term_years INTEGER DEFAULT 30 CHECK (max_loan_term_years >= 10 AND max_loan_term_years <= 35),
ADD COLUMN IF NOT EXISTS rent_recognition_first_property DECIMAL(4,3) DEFAULT 0.0 CHECK (rent_recognition_first_property >= 0 AND rent_recognition_first_property <= 1),
ADD COLUMN IF NOT EXISTS rent_recognition_investment DECIMAL(4,3) DEFAULT 0.8 CHECK (rent_recognition_investment >= 0 AND rent_recognition_investment <= 1),

-- Financial Parameters
ADD COLUMN IF NOT EXISTS default_interest_rate DECIMAL(5,3) DEFAULT 5.0 CHECK (default_interest_rate >= 1.0 AND default_interest_rate <= 15.0),
ADD COLUMN IF NOT EXISTS lawyer_fee_percent DECIMAL(5,3) DEFAULT 1.0 CHECK (lawyer_fee_percent >= 0 AND lawyer_fee_percent <= 10),
ADD COLUMN IF NOT EXISTS broker_fee_percent DECIMAL(5,3) DEFAULT 2.0 CHECK (broker_fee_percent >= 0 AND broker_fee_percent <= 10),
ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(5,3) DEFAULT 17.0 CHECK (vat_percent >= 0 AND vat_percent <= 25),
ADD COLUMN IF NOT EXISTS advisor_fee_fixed INTEGER DEFAULT 9000 CHECK (advisor_fee_fixed >= 0 AND advisor_fee_fixed <= 100000),
ADD COLUMN IF NOT EXISTS other_fee_fixed INTEGER DEFAULT 3000 CHECK (other_fee_fixed >= 0 AND other_fee_fixed <= 100000),
ADD COLUMN IF NOT EXISTS rental_yield_default DECIMAL(5,3) DEFAULT 3.0 CHECK (rental_yield_default >= 0 AND rental_yield_default <= 20),

-- Validation Parameters
ADD COLUMN IF NOT EXISTS rent_warning_high_multiplier DECIMAL(4,2) DEFAULT 1.5 CHECK (rent_warning_high_multiplier >= 1.0 AND rent_warning_high_multiplier <= 3.0),
ADD COLUMN IF NOT EXISTS rent_warning_low_multiplier DECIMAL(4,2) DEFAULT 0.7 CHECK (rent_warning_low_multiplier >= 0.3 AND rent_warning_low_multiplier <= 0.9),

-- Feature Flags
ADD COLUMN IF NOT EXISTS enable_rent_validation BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS enable_what_if_calculator BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_amortization_table BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS max_amortization_months INTEGER DEFAULT 60 CHECK (max_amortization_months >= 12 AND max_amortization_months <= 360);

-- 2. Create Performance Index
-- Covering index for fast config lookup
CREATE INDEX IF NOT EXISTS idx_partners_config_fast_lookup ON public.partners(id) 
  INCLUDE (max_dti_ratio, max_age, default_interest_rate, max_loan_term_years, 
           rent_recognition_first_property, rent_recognition_investment);

-- 3. Create Audit Table
CREATE TABLE IF NOT EXISTS public.partner_config_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  changed_field TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_audit_partner_time ON public.partner_config_audit(partner_id, changed_at DESC);

-- 4. Create Trigger Function
CREATE OR REPLACE FUNCTION public.log_partner_config_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Compare and log each config field
  IF (OLD.max_dti_ratio IS DISTINCT FROM NEW.max_dti_ratio) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'max_dti_ratio', OLD.max_dti_ratio::text, NEW.max_dti_ratio::text, auth.uid());
  END IF;

  IF (OLD.max_age IS DISTINCT FROM NEW.max_age) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'max_age', OLD.max_age::text, NEW.max_age::text, auth.uid());
  END IF;

  IF (OLD.max_loan_term_years IS DISTINCT FROM NEW.max_loan_term_years) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'max_loan_term_years', OLD.max_loan_term_years::text, NEW.max_loan_term_years::text, auth.uid());
  END IF;

  IF (OLD.rent_recognition_first_property IS DISTINCT FROM NEW.rent_recognition_first_property) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'rent_recognition_first_property', OLD.rent_recognition_first_property::text, NEW.rent_recognition_first_property::text, auth.uid());
  END IF;

  IF (OLD.rent_recognition_investment IS DISTINCT FROM NEW.rent_recognition_investment) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'rent_recognition_investment', OLD.rent_recognition_investment::text, NEW.rent_recognition_investment::text, auth.uid());
  END IF;

  IF (OLD.default_interest_rate IS DISTINCT FROM NEW.default_interest_rate) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'default_interest_rate', OLD.default_interest_rate::text, NEW.default_interest_rate::text, auth.uid());
  END IF;

  IF (OLD.lawyer_fee_percent IS DISTINCT FROM NEW.lawyer_fee_percent) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'lawyer_fee_percent', OLD.lawyer_fee_percent::text, NEW.lawyer_fee_percent::text, auth.uid());
  END IF;

  IF (OLD.broker_fee_percent IS DISTINCT FROM NEW.broker_fee_percent) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'broker_fee_percent', OLD.broker_fee_percent::text, NEW.broker_fee_percent::text, auth.uid());
  END IF;

  IF (OLD.vat_percent IS DISTINCT FROM NEW.vat_percent) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'vat_percent', OLD.vat_percent::text, NEW.vat_percent::text, auth.uid());
  END IF;

  IF (OLD.advisor_fee_fixed IS DISTINCT FROM NEW.advisor_fee_fixed) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'advisor_fee_fixed', OLD.advisor_fee_fixed::text, NEW.advisor_fee_fixed::text, auth.uid());
  END IF;

  IF (OLD.other_fee_fixed IS DISTINCT FROM NEW.other_fee_fixed) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'other_fee_fixed', OLD.other_fee_fixed::text, NEW.other_fee_fixed::text, auth.uid());
  END IF;

  IF (OLD.rental_yield_default IS DISTINCT FROM NEW.rental_yield_default) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'rental_yield_default', OLD.rental_yield_default::text, NEW.rental_yield_default::text, auth.uid());
  END IF;

  IF (OLD.rent_warning_high_multiplier IS DISTINCT FROM NEW.rent_warning_high_multiplier) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'rent_warning_high_multiplier', OLD.rent_warning_high_multiplier::text, NEW.rent_warning_high_multiplier::text, auth.uid());
  END IF;

  IF (OLD.rent_warning_low_multiplier IS DISTINCT FROM NEW.rent_warning_low_multiplier) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'rent_warning_low_multiplier', OLD.rent_warning_low_multiplier::text, NEW.rent_warning_low_multiplier::text, auth.uid());
  END IF;

  IF (OLD.enable_rent_validation IS DISTINCT FROM NEW.enable_rent_validation) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'enable_rent_validation', OLD.enable_rent_validation::text, NEW.enable_rent_validation::text, auth.uid());
  END IF;

  IF (OLD.enable_what_if_calculator IS DISTINCT FROM NEW.enable_what_if_calculator) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'enable_what_if_calculator', OLD.enable_what_if_calculator::text, NEW.enable_what_if_calculator::text, auth.uid());
  END IF;

  IF (OLD.show_amortization_table IS DISTINCT FROM NEW.show_amortization_table) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'show_amortization_table', OLD.show_amortization_table::text, NEW.show_amortization_table::text, auth.uid());
  END IF;

  IF (OLD.max_amortization_months IS DISTINCT FROM NEW.max_amortization_months) THEN
    INSERT INTO partner_config_audit (partner_id, changed_field, old_value, new_value, changed_by)
    VALUES (NEW.id, 'max_amortization_months', OLD.max_amortization_months::text, NEW.max_amortization_months::text, auth.uid());
  END IF;

  -- Update the metadata fields
  NEW.config_updated_at := NOW();
  NEW.config_updated_by := auth.uid();
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_partners_config_audit ON public.partners;
CREATE TRIGGER tr_partners_config_audit
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.log_partner_config_change();

-- 5. RLS Policies
-- Enable RLS on partners if not already enabled
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_config_audit ENABLE ROW LEVEL SECURITY;

-- partners SELECT policy: Partner can read own config
DROP POLICY IF EXISTS "partners_select_own_config" ON public.partners;
CREATE POLICY "partners_select_own_config" ON public.partners
  FOR SELECT USING (
    auth.uid() = owner_user_id
  );

-- partners UPDATE policy: Partner can update own config
DROP POLICY IF EXISTS "partners_update_own_config" ON public.partners;
CREATE POLICY "partners_update_own_config" ON public.partners
  FOR UPDATE USING (
    auth.uid() = owner_user_id
  ) WITH CHECK (
    auth.uid() = owner_user_id
  );

-- partner_config_audit SELECT policy: Partner can read own audit logs
DROP POLICY IF EXISTS "audit_select_own" ON public.partner_config_audit;
CREATE POLICY "audit_select_own" ON public.partner_config_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners 
      WHERE partners.id = partner_config_audit.partner_id 
      AND partners.owner_user_id = auth.uid()
    )
  );

-- *** FIX #2: Prevent manual INSERT to audit table ***
-- Only the trigger (with SECURITY DEFINER) can insert audit records
DROP POLICY IF EXISTS "audit_no_manual_insert" ON public.partner_config_audit;
CREATE POLICY "audit_no_manual_insert" ON public.partner_config_audit
  FOR INSERT WITH CHECK (false);

-- Note: The trigger function has SECURITY DEFINER, so it bypasses RLS
-- and can still insert audit records even with this restrictive policy.
-- This prevents anyone from manually forging audit entries.

-- 6. Backfill Existing Partners
-- *** FIX #1: Do NOT set non-existent UUID ***
-- IMPORTANT: The owner_user_id is left as NULL for existing partners.
-- This is because we cannot set a UUID that doesn't exist in auth.users
-- (foreign key constraint would fail).

-- After running this migration, execute the following steps:

-- Step 1: Find your user UUID
-- Run this in Supabase SQL Editor:
-- SELECT id, email FROM auth.users WHERE email = 'shlomo.elmaleh@gmail.com';
-- (Replace with your actual email)

-- Step 2: Copy your UUID from the result above, then run:
-- UPDATE public.partners 
-- SET owner_user_id = 'YOUR_ACTUAL_UUID_HERE'::uuid
-- WHERE owner_user_id IS NULL;

-- Note: Until you set owner_user_id, you won't be able to access
-- these partners through the config panel (RLS will block access).
-- However, the Edge Functions using SERVICE_ROLE_KEY will still work
-- because they bypass RLS.


-- ============= TESTS (run manually after migration) =============

-- Test 1: Verify all columns were added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'partners' 
-- AND (column_name LIKE '%config%' OR column_name IN ('max_dti_ratio', 'max_age', 'owner_user_id'));

-- Test 2: Try invalid DTI (should fail with CHECK constraint violation)
-- UPDATE public.partners SET max_dti_ratio = 0.99 WHERE id = (SELECT id FROM public.partners LIMIT 1);

-- Test 3: Try invalid age (should fail)
-- UPDATE public.partners SET max_age = 150 WHERE id = (SELECT id FROM public.partners LIMIT 1);

-- Test 4: Valid update should work
-- UPDATE public.partners SET max_dti_ratio = 0.35 WHERE id = (SELECT id FROM public.partners LIMIT 1);

-- Test 5: Check audit logging works
-- SELECT * FROM public.partner_config_audit ORDER BY changed_at DESC LIMIT 5;

-- Test 6: Verify RLS policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('partners', 'partner_config_audit')
-- ORDER BY tablename, policyname;

-- Test 7: Verify index was created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'partners' 
-- AND indexname = 'idx_partners_config_fast_lookup';

-- Test 8: Try manual INSERT to audit table (should fail due to RLS)
-- INSERT INTO public.partner_config_audit (partner_id, changed_field, old_value, new_value)
-- VALUES ((SELECT id FROM public.partners LIMIT 1), 'test_field', 'old', 'new');
-- Expected: Permission denied or policy violation

-- Test 9: Verify existing partners have NULL owner_user_id
-- SELECT id, name, owner_user_id FROM public.partners;
-- Expected: owner_user_id should be NULL for all existing partners
