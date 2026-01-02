-- Add explicit deny-all policies for SELECT, UPDATE, DELETE on simulations table
-- This makes the security intention explicit: write-only table for lead capture

CREATE POLICY "Deny all select on simulations"
ON public.simulations
AS RESTRICTIVE
FOR SELECT
USING (false);

CREATE POLICY "Deny all update on simulations"
ON public.simulations
AS RESTRICTIVE
FOR UPDATE
USING (false);

CREATE POLICY "Deny all delete on simulations"
ON public.simulations
AS RESTRICTIVE
FOR DELETE
USING (false);

-- Add database-level constraints for text field lengths
ALTER TABLE public.simulations
ADD CONSTRAINT simulations_client_name_length CHECK (char_length(client_name) <= 100),
ADD CONSTRAINT simulations_email_length CHECK (char_length(email) <= 254),
ADD CONSTRAINT simulations_phone_length CHECK (char_length(phone) <= 30);