-- Remove the conflicting "Public read access" policy from partners table
-- The partners_public view should be used for public access, not direct table access
DROP POLICY IF EXISTS "Public read access" ON public.partners;