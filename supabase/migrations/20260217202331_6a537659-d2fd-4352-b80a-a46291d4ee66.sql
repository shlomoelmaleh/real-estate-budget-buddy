
-- ============================================================
-- Migrate all hardcoded-email RLS policies to role-based checks
-- using public.has_role(auth.uid(), 'admin')
-- ============================================================

-- ==================== PARTNERS TABLE ====================
DROP POLICY IF EXISTS "Admin can insert partners" ON public.partners;
DROP POLICY IF EXISTS "Admin can update partners" ON public.partners;
DROP POLICY IF EXISTS "Admin can delete partners" ON public.partners;
DROP POLICY IF EXISTS "Only admin can read partners base table" ON public.partners;

CREATE POLICY "Admin can insert partners"
  ON public.partners FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update partners"
  ON public.partners FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete partners"
  ON public.partners FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admin can read partners base table"
  ON public.partners FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==================== ACTIVITY_LOGS TABLE ====================
DROP POLICY IF EXISTS "Admin can read activity logs" ON public.activity_logs;

CREATE POLICY "Admin can read activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==================== FUNNEL_EVENTS TABLE ====================
DROP POLICY IF EXISTS "Admin can read funnel events" ON public.funnel_events;

CREATE POLICY "Admin can read funnel events"
  ON public.funnel_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==================== SIMULATIONS TABLE ====================
DROP POLICY IF EXISTS "Admin can read simulations" ON public.simulations;

CREATE POLICY "Admin can read simulations"
  ON public.simulations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ==================== STORAGE: partner-logos ====================
DROP POLICY IF EXISTS "Admin can upload partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete partner logos" ON storage.objects;

CREATE POLICY "Admin can upload partner logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update partner logos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete partner logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'partner-logos' AND public.has_role(auth.uid(), 'admin'));
