-- Add storage policies for product-images bucket
-- Allow authenticated users (admins) to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to view images (public bucket)
CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- Add pricing columns to a_plus_content table
ALTER TABLE public.a_plus_content 
ADD COLUMN IF NOT EXISTS price numeric DEFAULT 499,
ADD COLUMN IF NOT EXISTS compare_price numeric DEFAULT NULL;