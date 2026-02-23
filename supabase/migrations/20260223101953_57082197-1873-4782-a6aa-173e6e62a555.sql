CREATE OR REPLACE FUNCTION public.claim_partner_account()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_user_email text;
  v_claimed boolean := false;
BEGIN
  -- Get current authenticated user's email
  SELECT email INTO v_user_email FROM auth.users WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN false;
  END IF;

  -- Check if there's a partner record matching this email but with no owner assigned
  UPDATE public.partners
  SET owner_user_id = auth.uid()
  WHERE lower(email) = lower(v_user_email) AND owner_user_id IS NULL;

  -- Check if we actually updated a row
  IF FOUND THEN
    v_claimed := true;
  END IF;

  RETURN v_claimed;
END;
$function$;