-- Make product management work in dev mode without Supabase-auth sessions
DROP POLICY IF EXISTS "Admins or first user can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins or first user can update products" ON public.products;
DROP POLICY IF EXISTS "Admins or first user can delete products" ON public.products;

CREATE POLICY "Admins or first user can insert products"
ON public.products
FOR INSERT
TO public
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update products"
ON public.products
FOR UPDATE
TO public
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete products"
ON public.products
FOR DELETE
TO public
USING (is_admin_or_first_user());

DROP POLICY IF EXISTS "Admins or first user can insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins or first user can update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admins or first user can delete variants" ON public.product_variants;

CREATE POLICY "Admins or first user can insert variants"
ON public.product_variants
FOR INSERT
TO public
WITH CHECK (is_admin_or_first_user());

CREATE POLICY "Admins or first user can update variants"
ON public.product_variants
FOR UPDATE
TO public
USING (is_admin_or_first_user());

CREATE POLICY "Admins or first user can delete variants"
ON public.product_variants
FOR DELETE
TO public
USING (is_admin_or_first_user());

-- Keep products in sync automatically when linked entities are removed
ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS product_variants_product_id_fkey;
ALTER TABLE public.product_variants
  ADD CONSTRAINT product_variants_product_id_fkey
  FOREIGN KEY (product_id)
  REFERENCES public.products(id)
  ON DELETE CASCADE;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_design_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_design_id_fkey
  FOREIGN KEY (design_id)
  REFERENCES public.designs(id)
  ON DELETE CASCADE;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_template_id_fkey;
ALTER TABLE public.products
  ADD CONSTRAINT products_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.case_templates(id)
  ON DELETE CASCADE;