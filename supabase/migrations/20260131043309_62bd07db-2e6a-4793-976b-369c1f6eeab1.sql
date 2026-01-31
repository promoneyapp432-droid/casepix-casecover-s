-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert mobile brands" ON public.mobile_brands;
DROP POLICY IF EXISTS "Admins can update mobile brands" ON public.mobile_brands;
DROP POLICY IF EXISTS "Admins can delete mobile brands" ON public.mobile_brands;

DROP POLICY IF EXISTS "Admins can insert mobile models" ON public.mobile_models;
DROP POLICY IF EXISTS "Admins can update mobile models" ON public.mobile_models;
DROP POLICY IF EXISTS "Admins can delete mobile models" ON public.mobile_models;

-- Create a function to check if a user is admin (with fallback for first authenticated user)
CREATE OR REPLACE FUNCTION public.is_admin_or_first_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- If no admin exists at all, allow the first authenticated user to act as admin
  -- This is useful for initial setup
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  ) THEN
    RETURN auth.uid() IS NOT NULL;
  END IF;
  
  RETURN false;
END;
$$;

-- Create new policies that use the flexible admin check
CREATE POLICY "Admins or first user can insert mobile brands" 
ON public.mobile_brands 
FOR INSERT 
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update mobile brands" 
ON public.mobile_brands 
FOR UPDATE 
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete mobile brands" 
ON public.mobile_brands 
FOR DELETE 
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can insert mobile models" 
ON public.mobile_models 
FOR INSERT 
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update mobile models" 
ON public.mobile_models 
FOR UPDATE 
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete mobile models" 
ON public.mobile_models 
FOR DELETE 
USING (is_admin_or_first_user());

-- Also update compatible_groups if needed
DROP POLICY IF EXISTS "Admins can insert compatible groups" ON public.compatible_groups;
DROP POLICY IF EXISTS "Admins can update compatible groups" ON public.compatible_groups;
DROP POLICY IF EXISTS "Admins can delete compatible groups" ON public.compatible_groups;

CREATE POLICY "Admins or first user can insert compatible groups" 
ON public.compatible_groups 
FOR INSERT 
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update compatible groups" 
ON public.compatible_groups 
FOR UPDATE 
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete compatible groups" 
ON public.compatible_groups 
FOR DELETE 
USING (is_admin_or_first_user());