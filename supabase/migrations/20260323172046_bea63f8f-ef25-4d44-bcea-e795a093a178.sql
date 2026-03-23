
ALTER TABLE public.mobile_models
  ADD COLUMN IF NOT EXISTS release_date text NULL,
  ADD COLUMN IF NOT EXISTS size_inch numeric NULL,
  ADD COLUMN IF NOT EXISTS height_mm numeric NULL,
  ADD COLUMN IF NOT EXISTS width_mm numeric NULL,
  ADD COLUMN IF NOT EXISTS screen_size_cm2 numeric NULL,
  ADD COLUMN IF NOT EXISTS body_to_screen_ratio numeric NULL,
  ADD COLUMN IF NOT EXISTS battery_mah integer NULL;
