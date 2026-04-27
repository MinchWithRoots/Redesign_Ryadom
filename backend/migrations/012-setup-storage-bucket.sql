-- Create avatars storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('avatars', 'avatars', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own avatars" ON storage.objects;

-- Policy: Authenticated users can upload to avatars bucket
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Policy: Anyone can view avatars (public bucket)
CREATE POLICY "Users can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can delete their own avatars
CREATE POLICY "Authenticated users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Policy: Authenticated users can update their own avatars
CREATE POLICY "Authenticated users can update their own avatars"
ON storage.objects
FOR UPDATE
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
