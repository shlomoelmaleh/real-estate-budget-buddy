
-- Migrate system_settings RLS from hardcoded email to role-based access
DROP POLICY IF EXISTS "Super Admin only" ON public.system_settings;

CREATE POLICY "Admin can manage system_settings"
ON public.system_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
