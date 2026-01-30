-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images bucket
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Create mobile_brands table (moving from mock data)
CREATE TABLE public.mobile_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mobile_brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mobile brands"
ON public.mobile_brands FOR SELECT
USING (true);

CREATE POLICY "Admins can insert mobile brands"
ON public.mobile_brands FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update mobile brands"
ON public.mobile_brands FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete mobile brands"
ON public.mobile_brands FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create mobile_models table
CREATE TABLE public.mobile_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.mobile_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mobile_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mobile models"
ON public.mobile_models FOR SELECT
USING (true);

CREATE POLICY "Admins can insert mobile models"
ON public.mobile_models FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update mobile models"
ON public.mobile_models FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete mobile models"
ON public.mobile_models FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create compatible_groups table for case type compatibility
CREATE TABLE public.compatible_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.mobile_models(id) ON DELETE CASCADE,
  case_type case_type NOT NULL,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(model_id, case_type)
);

ALTER TABLE public.compatible_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view compatible groups"
ON public.compatible_groups FOR SELECT
USING (true);

CREATE POLICY "Admins can insert compatible groups"
ON public.compatible_groups FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update compatible groups"
ON public.compatible_groups FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete compatible groups"
ON public.compatible_groups FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_compatible_groups_updated_at
BEFORE UPDATE ON public.compatible_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create a_plus_content table for rich descriptions and default images per case type
CREATE TABLE public.a_plus_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type case_type NOT NULL UNIQUE,
  title text,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  default_image_2 text,
  default_image_3 text,
  default_image_4 text,
  default_image_5 text,
  default_image_6 text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.a_plus_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view a_plus_content"
ON public.a_plus_content FOR SELECT
USING (true);

CREATE POLICY "Admins can insert a_plus_content"
ON public.a_plus_content FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update a_plus_content"
ON public.a_plus_content FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete a_plus_content"
ON public.a_plus_content FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_a_plus_content_updated_at
BEFORE UPDATE ON public.a_plus_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add image columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS image_2 text,
ADD COLUMN IF NOT EXISTS image_3 text,
ADD COLUMN IF NOT EXISTS image_4 text,
ADD COLUMN IF NOT EXISTS image_5 text,
ADD COLUMN IF NOT EXISTS image_6 text;

-- Insert default A+ content for each case type
INSERT INTO public.a_plus_content (case_type, title, description, features)
VALUES 
  ('metal', 'Premium Metal Case', 'Durable aluminum protection with laser-etched designs', '["Premium aluminum build", "Laser-etched precision", "360° protection", "Wireless charging compatible"]'::jsonb),
  ('snap', 'Snap-On Case', 'Lightweight protection with vibrant prints', '["Lightweight design", "Easy snap-on installation", "Vibrant color printing", "Slim profile"]'::jsonb)
ON CONFLICT (case_type) DO NOTHING;