-- Create atomic rate limiting function that prevents race conditions
-- and supports multi-key rate limiting (IP + email for defense in depth)
CREATE OR REPLACE FUNCTION public.atomic_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INT,
  p_window_minutes INT
)
RETURNS TABLE(allowed BOOLEAN, remaining INT, current_count INT) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := now();
  v_count INT;
  v_window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Use INSERT ... ON CONFLICT to atomically create or update the rate limit record
  -- This prevents race conditions by using database-level locking
  
  INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, v_now)
  ON CONFLICT (identifier, endpoint) DO UPDATE
  SET 
    request_count = CASE 
      -- If window has expired, reset the counter
      WHEN EXTRACT(EPOCH FROM (v_now - rate_limits.window_start)) / 60 >= p_window_minutes THEN 1
      -- Otherwise increment if under limit
      ELSE rate_limits.request_count + 1
    END,
    window_start = CASE 
      -- Reset window if expired
      WHEN EXTRACT(EPOCH FROM (v_now - rate_limits.window_start)) / 60 >= p_window_minutes THEN v_now
      ELSE rate_limits.window_start
    END
  WHERE 
    -- Only allow update if under limit OR window expired
    EXTRACT(EPOCH FROM (v_now - rate_limits.window_start)) / 60 >= p_window_minutes
    OR rate_limits.request_count < p_max_requests
  RETURNING rate_limits.request_count INTO v_count;
  
  -- Check if we successfully updated (request was allowed)
  IF FOUND THEN
    allowed := true;
    current_count := v_count;
    remaining := p_max_requests - v_count;
    RETURN NEXT;
  ELSE
    -- Update failed because limit was exceeded and window not expired
    -- Get current state for response
    SELECT rl.request_count INTO v_count
    FROM rate_limits rl
    WHERE rl.identifier = p_identifier AND rl.endpoint = p_endpoint;
    
    allowed := false;
    current_count := COALESCE(v_count, p_max_requests);
    remaining := 0;
    RETURN NEXT;
  END IF;
END;
$$;

-- Create unique constraint for ON CONFLICT to work properly
-- (identifier, endpoint) should be unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rate_limits_identifier_endpoint_unique'
  ) THEN
    ALTER TABLE rate_limits 
    ADD CONSTRAINT rate_limits_identifier_endpoint_unique 
    UNIQUE (identifier, endpoint);
  END IF;
END $$;

-- Grant execute permission to service role only (edge functions use this)
GRANT EXECUTE ON FUNCTION public.atomic_rate_limit TO service_role;