-- Migration: Update partners_public view for Partner Configuration
-- Date: 2026-02-15
-- Description: Adds configuration columns to the public view so clients can load partner-specific rules.

DROP VIEW IF EXISTS public.partners_public;

CREATE VIEW public.partners_public AS
  SELECT
    id,
    name,
    slug,
    logo_url,
    brand_color,
    phone,
    whatsapp,
    email,
    slogan,
    slogan_font_size,
    slogan_font_style,
    is_active,
    created_at,
    -- Configuration fields exposed to public
    max_dti_ratio,
    max_age,
    max_loan_term_years,
    rent_recognition_first_property,
    rent_recognition_investment,
    default_interest_rate,
    lawyer_fee_percent,
    broker_fee_percent,
    vat_percent,
    advisor_fee_fixed,
    other_fee_fixed,
    rental_yield_default,
    rent_warning_high_multiplier,
    rent_warning_low_multiplier,
    enable_rent_validation,
    enable_what_if_calculator,
    show_amortization_table,
    max_amortization_months
  FROM public.partners
  WHERE is_active = true;

-- Ensure API roles can read the view
GRANT SELECT ON public.partners_public TO anon;
GRANT SELECT ON public.partners_public TO authenticated;
GRANT SELECT ON public.partners_public TO service_role;
