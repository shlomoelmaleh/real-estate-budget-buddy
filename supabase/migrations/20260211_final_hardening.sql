-- Phase 8: Database Hardening Migration
-- Add granular event tracking columns and performance indexes

-- Add event_type column with check constraint for entered/completed events
ALTER TABLE funnel_events 
ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('entered', 'completed'));

-- Add client-side timestamp for accurate event timing
ALTER TABLE funnel_events 
ADD COLUMN IF NOT EXISTS client_timestamp TIMESTAMPTZ;

-- Create composite index for efficient granular event queries
-- Optimized for filtering by event type and step, with recent events first
CREATE INDEX IF NOT EXISTS idx_funnel_granular 
ON funnel_events (event_type, step_reached, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN funnel_events.event_type IS 'Type of funnel event: entered (user reached step) or completed (user submitted step)';
COMMENT ON COLUMN funnel_events.client_timestamp IS 'Client-side timestamp when event occurred, for accurate timing analysis';
COMMENT ON INDEX idx_funnel_granular IS 'Performance index for granular event analysis queries';
