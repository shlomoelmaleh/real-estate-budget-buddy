-- Fix: Partner Contact Information Exposed to Public Internet
-- Create a public view that only exposes active partners
-- Restrict base table SELECT to admin only

-- 1. Create a public view for active partners only
CREATE VIEW public.partners_public
WITH (security_invoker = on) AS
  SELECT id, name, slug, logo_url, brand_color, phone, whatsapp, email, is_active, created_at
  FROM public.partners
  WHERE is_active = true;

-- 2. Drop the overly permissive public SELECT policy on base table
DROP POLICY IF EXISTS "Public can read partners" ON public.partners;

-- 3. Create restrictive admin-only SELECT policy on base table
CREATE POLICY "Only admin can read partners base table"
  ON public.partners
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'email'::text) = 'shlomo.elmaleh@gmail.com'::text);

-- 4. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.partners_public TO anon;
GRANT SELECT ON public.partners_public TO authenticated;