-- Migration: Multi-Currency Support
-- Adds: partners.default_currency column, pg_cron schedule, RLS for exchange_rates
-- Date: 2026-02-24

-- 1. Add default_currency to partners
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS default_currency TEXT NOT NULL DEFAULT 'ILS';

ALTER TABLE public.partners
ADD CONSTRAINT chk_default_currency
CHECK (default_currency IN ('ILS', 'USD', 'EUR', 'GBP', 'CAD'));

-- 2. Seed exchange_rates in system_settings (initial placeholder — Edge Function will overwrite)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'exchange_rates',
    '{
        "rates": { "USD": 3.68, "EUR": 3.97, "GBP": 4.61, "CAD": 2.72 },
        "base": "ILS",
        "fetchedAt": "2026-02-24T07:00:00Z",
        "source": "cache",
        "nextRefreshAfter": "2026-02-25T07:00:00Z"
    }'::jsonb,
    'Exchange rates — ILS per 1 unit of foreign currency. Updated daily by cron.'
) ON CONFLICT (key) DO NOTHING;

-- 3. RLS: Allow anon and authenticated to READ exchange_rates
-- (Edge Function uses service_role to WRITE, so no write policy needed for users)
CREATE POLICY "Anyone can read exchange_rates"
ON public.system_settings
FOR SELECT
TO anon, authenticated
USING (key = 'exchange_rates');

-- 4. pg_cron schedule: Sun-Thu at 07:00 UTC (= 09:00 Israel time, after BOI publishes)
-- NOTE: This requires the pg_cron extension to be enabled in Supabase dashboard.
-- Uncomment and run manually after enabling pg_cron:
--
-- SELECT cron.schedule(
--   'refresh-fx-rates',
--   '0 7 * * 0-4',  -- Sun(0) through Thu(4) at 07:00 UTC
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/update-exchange-rates',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   )$$
-- );
