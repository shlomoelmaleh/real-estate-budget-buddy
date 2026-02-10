
-- Fix funnel_events: restrict SELECT to admin only
DROP POLICY IF EXISTS "Allow authenticated selects" ON public.funnel_events;

CREATE POLICY "Admin can read funnel events"
ON public.funnel_events
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'shlomo.elmaleh@gmail.com'::text);

-- Fix simulations: add explicit admin-only SELECT (defense-in-depth alongside deny-all)
DROP POLICY IF EXISTS "Deny all select on simulations" ON public.simulations;

CREATE POLICY "Admin can read simulations"
ON public.simulations
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING ((auth.jwt() ->> 'email'::text) = 'shlomo.elmaleh@gmail.com'::text);
