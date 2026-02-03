-- Drop existing restrictive policies on products
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Create new policies using is_admin_or_first_user() for bootstrapping
CREATE POLICY "Admins or first user can insert products" 
ON public.products FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update products" 
ON public.products FOR UPDATE 
TO authenticated
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete products" 
ON public.products FOR DELETE 
TO authenticated
USING (is_admin_or_first_user());

-- Drop existing restrictive policies on product_variants
DROP POLICY IF EXISTS "Admins can insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins can delete variants" ON public.product_variants;

-- Create new policies using is_admin_or_first_user() for bootstrapping
CREATE POLICY "Admins or first user can insert variants" 
ON public.product_variants FOR INSERT 
TO authenticated
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update variants" 
ON public.product_variants FOR UPDATE 
TO authenticated
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete variants" 
ON public.product_variants FOR DELETE 
TO authenticated
USING (is_admin_or_first_user());