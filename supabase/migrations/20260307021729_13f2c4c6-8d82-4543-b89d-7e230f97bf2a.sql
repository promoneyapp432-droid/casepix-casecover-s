
ALTER TABLE public.categories ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.case_templates ADD COLUMN model_id uuid REFERENCES public.mobile_models(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN design_id uuid REFERENCES public.designs(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN template_id uuid REFERENCES public.case_templates(id) ON DELETE SET NULL;
