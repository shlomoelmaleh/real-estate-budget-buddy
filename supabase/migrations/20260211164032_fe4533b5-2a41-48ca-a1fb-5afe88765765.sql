
ALTER TABLE public.funnel_events
ADD CONSTRAINT funnel_events_session_id_length CHECK (char_length(session_id) <= 100);

ALTER TABLE public.funnel_events
ADD CONSTRAINT funnel_events_language_valid CHECK (language IN ('he', 'en', 'fr'));
