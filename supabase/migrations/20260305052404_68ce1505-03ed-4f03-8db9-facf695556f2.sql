
-- Designs table: artwork/graphics that can be applied to phone cases
CREATE TABLE public.designs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Design images: multiple images per design
CREATE TABLE public.design_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id UUID NOT NULL REFERENCES public.designs(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Case templates: phone case mockup with mask area for design placement
CREATE TABLE public.case_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  case_type public.case_type NOT NULL,
  template_image TEXT NOT NULL,
  mask_x NUMERIC NOT NULL DEFAULT 0,
  mask_y NUMERIC NOT NULL DEFAULT 0,
  mask_width NUMERIC NOT NULL DEFAULT 100,
  mask_height NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_templates ENABLE ROW LEVEL SECURITY;

-- RLS for designs
CREATE POLICY "Anyone can view designs" ON public.designs FOR SELECT USING (true);
CREATE POLICY "Admins can insert designs" ON public.designs FOR INSERT WITH CHECK (is_admin_or_first_user());
CREATE POLICY "Admins can update designs" ON public.designs FOR UPDATE USING (is_admin_or_first_user());
CREATE POLICY "Admins can delete designs" ON public.designs FOR DELETE USING (is_admin_or_first_user());

-- RLS for design_images
CREATE POLICY "Anyone can view design images" ON public.design_images FOR SELECT USING (true);
CREATE POLICY "Admins can insert design images" ON public.design_images FOR INSERT WITH CHECK (is_admin_or_first_user());
CREATE POLICY "Admins can update design images" ON public.design_images FOR UPDATE USING (is_admin_or_first_user());
CREATE POLICY "Admins can delete design images" ON public.design_images FOR DELETE USING (is_admin_or_first_user());

-- RLS for case_templates
CREATE POLICY "Anyone can view case templates" ON public.case_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert case templates" ON public.case_templates FOR INSERT WITH CHECK (is_admin_or_first_user());
CREATE POLICY "Admins can update case templates" ON public.case_templates FOR UPDATE USING (is_admin_or_first_user());
CREATE POLICY "Admins can delete case templates" ON public.case_templates FOR DELETE USING (is_admin_or_first_user());

-- Update triggers
CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON public.designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_templates_updated_at BEFORE UPDATE ON public.case_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
