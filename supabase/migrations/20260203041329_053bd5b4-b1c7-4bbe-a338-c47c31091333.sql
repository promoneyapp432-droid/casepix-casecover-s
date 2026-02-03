-- Drop existing restrictive policies on categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

-- Create new policies using is_admin_or_first_user() for bootstrapping
CREATE POLICY "Admins or first user can insert categories" 
ON public.categories FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update categories" 
ON public.categories FOR UPDATE 
TO authenticated
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete categories" 
ON public.categories FOR DELETE 
TO authenticated
USING (is_admin_or_first_user());