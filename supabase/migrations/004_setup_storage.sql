-- Create storage bucket for cabin images
-- Note: This requires Supabase Storage API access
-- If this doesn't work via SQL, create the bucket manually in Supabase Dashboard

-- Insert bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cabin-images', 'cabin-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they exist (to allow re-running migration)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

-- Policy: Anyone can view images (public read)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'cabin-images');

-- Policy: Only authenticated admins can upload
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cabin-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Policy: Only authenticated admins can update
CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cabin-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);

-- Policy: Only authenticated admins can delete
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cabin-images' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.is_admin = true
  )
);
