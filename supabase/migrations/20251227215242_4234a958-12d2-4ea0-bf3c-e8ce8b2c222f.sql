-- Fix #1: Drop overly permissive SELECT policy (public calculator has no auth system)
DROP POLICY IF EXISTS "Authenticated users can view simulations" ON public.simulations;

-- Fix #3: Create rate_limits table for email function rate limiting
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

-- Enable RLS on rate_limits - only accessible via service role
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access (edge functions use service role)