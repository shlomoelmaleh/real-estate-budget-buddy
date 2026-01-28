-- Add slogan column to partners table
ALTER TABLE public.partners ADD COLUMN slogan text;

-- Drop and recreate the partners_public view to include slogan
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
  is_active,
  created_at
FROM public.partners
WHERE is_active = true;

-- Grant public access to the view
GRANT SELECT ON public.partners_public TO anon;
GRANT SELECT ON public.partners_public TO authenticated;