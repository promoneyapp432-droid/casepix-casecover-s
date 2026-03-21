-- Drop restrictive storage policies
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Allow anyone to upload/update/delete during dev
CREATE POLICY "Dev: anyone can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Dev: anyone can update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Dev: anyone can delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');