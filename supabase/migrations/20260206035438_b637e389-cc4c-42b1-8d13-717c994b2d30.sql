-- Fix RLS policies for a_plus_content to use is_admin_or_first_user() for bootstrapping
DROP POLICY IF EXISTS "Admins can insert a_plus_content" ON public.a_plus_content;
DROP POLICY IF EXISTS "Admins can update a_plus_content" ON public.a_plus_content;
DROP POLICY IF EXISTS "Admins can delete a_plus_content" ON public.a_plus_content;

-- Recreate policies using is_admin_or_first_user() for bootstrapping
CREATE POLICY "Admins can insert a_plus_content" 
ON public.a_plus_content 
FOR INSERT 
WITH CHECK (public.is_admin_or_first_user());

CREATE POLICY "Admins can update a_plus_content" 
ON public.a_plus_content 
FOR UPDATE 
USING (public.is_admin_or_first_user());

CREATE POLICY "Admins can delete a_plus_content" 
ON public.a_plus_content 
FOR DELETE 
USING (public.is_admin_or_first_user());