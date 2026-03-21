
CREATE OR REPLACE FUNCTION public.is_admin_or_first_user()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- During development/building stage, allow all access
  RETURN true;
END;
$function$;
