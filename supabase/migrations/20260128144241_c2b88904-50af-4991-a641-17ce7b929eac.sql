-- Add slogan font size and font style columns to partners table
ALTER TABLE public.partners ADD COLUMN slogan_font_size text DEFAULT 'sm';
ALTER TABLE public.partners ADD COLUMN slogan_font_style text DEFAULT 'normal';

-- Recreate the partners_public view to include the new columns
DROP VIEW IF EXISTS public.partners_public;
CREATE VIEW public.partners_public AS
SELECT id, name, slug, logo_url, brand_color, phone, whatsapp, email, slogan, slogan_font_size, slogan_font_style, is_active, created_at
FROM public.partners
WHERE is_active = true;

-- Grant public access to the view
GRANT SELECT ON public.partners_public TO anon, authenticated;