-- Create funnel_events table for anonymous session tracking
CREATE TABLE IF NOT EXISTS funnel_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    step_reached INTEGER NOT NULL CHECK (step_reached >= 0 AND step_reached <= 5),
    partner_id UUID REFERENCES partners(id),
    language TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_funnel_events_session ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_step ON funnel_events(step_reached);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created ON funnel_events(created_at);
CREATE INDEX IF NOT EXISTS idx_funnel_events_partner ON funnel_events(partner_id) WHERE partner_id IS NOT NULL;

-- Enable RLS
ALTER TABLE funnel_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT only
CREATE POLICY "Allow anon insert" ON funnel_events
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Allow auth select" ON funnel_events
    FOR SELECT
    TO authenticated
    USING (true);
