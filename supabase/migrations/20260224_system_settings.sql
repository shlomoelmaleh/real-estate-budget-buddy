-- Migration: Global System Settings
-- Description: Stores system-wide parameters like tax brackets that should only be managed by Super Admin.

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Seed with current Purchase Tax (מס רכישה) Brackets
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'tax_brackets',
    '{
        "SINGLE_HOME": [
            {"min": 0, "max": 1978745, "rate": 0},
            {"min": 1978745, "max": 2347040, "rate": 0.035},
            {"min": 2347040, "max": 6055070, "rate": 0.05},
            {"min": 6055070, "max": 20183565, "rate": 0.08},
            {"min": 20183565, "max": null, "rate": 0.10}
        ],
        "INVESTOR": [
            {"min": 0, "max": 6055070, "rate": 0.08},
            {"min": 6055070, "max": null, "rate": 0.10}
        ]
    }'::jsonb,
    'Global Purchase Tax brackets for Israel'
) ON CONFLICT (key) DO NOTHING;

-- SECURITY: Lockdown the table
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Deny everything to everyone by default
-- 2. Allow Read/Write ONLY to the Super Admin (identified by email)
-- 3. Edge Functions will use service_role to bypass this

CREATE POLICY "Super Admin only" ON public.system_settings
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'shlomo.elmaleh@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'shlomo.elmaleh@gmail.com');
