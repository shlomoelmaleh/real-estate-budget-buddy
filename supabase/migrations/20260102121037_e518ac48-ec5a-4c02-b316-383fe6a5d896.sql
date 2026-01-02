-- Add explicit deny-all RLS policies to satisfy "RLS enabled, no policy" linters
-- This does NOT grant access; it keeps the table inaccessible to all non-service-role clients.

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies with these names (idempotent)
DROP POLICY IF EXISTS "Deny all select on rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Deny all insert on rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Deny all update on rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "Deny all delete on rate_limits" ON public.rate_limits;

-- Explicit deny policies
CREATE POLICY "Deny all select on rate_limits"
ON public.rate_limits
FOR SELECT
USING (false);

CREATE POLICY "Deny all insert on rate_limits"
ON public.rate_limits
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Deny all update on rate_limits"
ON public.rate_limits
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all delete on rate_limits"
ON public.rate_limits
FOR DELETE
USING (false);