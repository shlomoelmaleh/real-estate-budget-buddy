-- Remove the permissive INSERT policy that allows public inserts
DROP POLICY IF EXISTS "Anyone can insert simulations" ON public.simulations;

-- Add a deny-all INSERT policy for anonymous users
-- The edge function uses service role which bypasses RLS, so inserts will still work through the function
CREATE POLICY "Deny public insert on simulations"
ON public.simulations
FOR INSERT
TO anon, authenticated
WITH CHECK (false);