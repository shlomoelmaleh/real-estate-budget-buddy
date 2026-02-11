-- Add event_type and client_timestamp columns to funnel_events table
-- This migration supports Phase 7 batch analytics enhancements

ALTER TABLE funnel_events
ADD COLUMN IF NOT EXISTS event_type TEXT,
ADD COLUMN IF NOT EXISTS client_timestamp TIMESTAMPTZ;

-- Create index for event_type for faster querying
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type 
ON funnel_events(event_type);

-- Create index for client_timestamp for time-based queries
CREATE INDEX IF NOT EXISTS idx_funnel_events_client_timestamp 
ON funnel_events(client_timestamp);
