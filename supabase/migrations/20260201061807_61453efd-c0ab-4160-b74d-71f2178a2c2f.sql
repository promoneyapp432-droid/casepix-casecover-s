-- Add content_blocks column to store dynamic A+ content elements
ALTER TABLE public.a_plus_content 
ADD COLUMN content_blocks jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.a_plus_content.content_blocks IS 'Array of content blocks: title, square_image, banner, image_text, paragraph';