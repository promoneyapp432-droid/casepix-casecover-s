-- Add image column to mobile_models table
ALTER TABLE public.mobile_models 
ADD COLUMN IF NOT EXISTS image TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_mobile_models_brand_id ON public.mobile_models(brand_id);
CREATE INDEX IF NOT EXISTS idx_compatible_groups_model_id ON public.compatible_groups(model_id);
