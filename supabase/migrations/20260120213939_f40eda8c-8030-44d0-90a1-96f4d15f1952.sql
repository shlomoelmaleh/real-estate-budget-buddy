-- Partner white-label system

-- 1) Enum for audit log event types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'partner_event_type') THEN
    CREATE TYPE public.partner_event_type AS ENUM (
      'LEAD_SENT',
      'LEAD_FAILED',
      'STATUS_CHANGE',
      'PARTNER_CREATED'
    );
  END IF;
END $$;

-- 2) partners table (publicly readable branding)
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  brand_color TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT partners_slug_unique UNIQUE (slug),
  CONSTRAINT partners_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners (is_active);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public read for branding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Public can read partners'
  ) THEN
    CREATE POLICY "Public can read partners"
    ON public.partners
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Admin write only (by email claim)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Admin can insert partners'
  ) THEN
    CREATE POLICY "Admin can insert partners"
    ON public.partners
    FOR INSERT
    TO authenticated
    WITH CHECK ((auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Admin can update partners'
  ) THEN
    CREATE POLICY "Admin can update partners"
    ON public.partners
    FOR UPDATE
    TO authenticated
    USING ((auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com')
    WITH CHECK ((auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='partners' AND policyname='Admin can delete partners'
  ) THEN
    CREATE POLICY "Admin can delete partners"
    ON public.partners
    FOR DELETE
    TO authenticated
    USING ((auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com');
  END IF;
END $$;

-- 3) activity_logs table (legal audit trail)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type public.partner_event_type NOT NULL,
  partner_id UUID NULL REFERENCES public.partners(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON public.activity_logs ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.activity_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_partner_id ON public.activity_logs (partner_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admin can read logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='activity_logs' AND policyname='Admin can read activity logs'
  ) THEN
    CREATE POLICY "Admin can read activity logs"
    ON public.activity_logs
    FOR SELECT
    TO authenticated
    USING ((auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com');
  END IF;
END $$;

-- No INSERT/UPDATE/DELETE policies: only service-role backend can write (bypasses RLS)

-- 4) Public storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Public read partner logos'
  ) THEN
    CREATE POLICY "Public read partner logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'partner-logos');
  END IF;
END $$;

-- Admin write for logos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admin insert partner logos'
  ) THEN
    CREATE POLICY "Admin insert partner logos"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'partner-logos'
      AND (auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admin update partner logos'
  ) THEN
    CREATE POLICY "Admin update partner logos"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'partner-logos'
      AND (auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com'
    )
    WITH CHECK (
      bucket_id = 'partner-logos'
      AND (auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Admin delete partner logos'
  ) THEN
    CREATE POLICY "Admin delete partner logos"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'partner-logos'
      AND (auth.jwt() ->> 'email') = 'shlomo.elmaleh@gmail.com'
    );
  END IF;
END $$;