-- Fix partners_public to be readable for public users while keeping base table admin-only

DROP VIEW IF EXISTS public.partners_public;

-- Recreate WITHOUT security_invoker so the view can expose only the intended columns/rows
-- while the base table remains protected by RLS.
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
    is_active,
    created_at
  FROM public.partners
  WHERE is_active = true;

-- Ensure API roles can read the view
GRANT SELECT ON public.partners_public TO anon;
GRANT SELECT ON public.partners_public TO authenticated;
GRANT SELECT ON public.partners_public TO service_role;