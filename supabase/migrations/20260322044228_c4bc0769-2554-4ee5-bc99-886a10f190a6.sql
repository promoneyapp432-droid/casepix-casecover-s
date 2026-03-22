
DROP POLICY IF EXISTS "Admins or first user can insert categories" ON public.categories;
CREATE POLICY "Admins or first user can insert categories"
ON public.categories
FOR INSERT
TO public
WITH CHECK (is_admin_or_first_user());
