-- Add restrictive RLS policies for activity_logs to prevent public INSERT/UPDATE/DELETE
-- Only the admin-partners edge function using service role should write to this table

-- Deny public INSERT on activity_logs
CREATE POLICY "Deny public insert on activity_logs"
ON public.activity_logs
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (false);

-- Deny public UPDATE on activity_logs  
CREATE POLICY "Deny public update on activity_logs"
ON public.activity_logs
AS RESTRICTIVE
FOR UPDATE
TO public
USING (false)
WITH CHECK (false);

-- Deny public DELETE on activity_logs
CREATE POLICY "Deny public delete on activity_logs"
ON public.activity_logs
AS RESTRICTIVE
FOR DELETE
TO public
USING (false);