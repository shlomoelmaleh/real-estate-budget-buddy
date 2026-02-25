-- Remove hardcoded email-based policy from system_settings to avoid identity coupling and brittle auth logic
DROP POLICY IF EXISTS "Super Admin only" ON public.system_settings;