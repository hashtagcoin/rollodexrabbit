-- Create storage buckets if they don't exist
DO $$
BEGIN
  -- Create buckets
  PERFORM storage.create_bucket('avatars', '{"public": true}');
  PERFORM storage.create_bucket('group-avatars', '{"public": true}');
  PERFORM storage.create_bucket('group-posts', '{"public": true}');
  PERFORM storage.create_bucket('housing-listings', '{"public": true}');
  PERFORM storage.create_bucket('service-providers', '{"public": true}');
  PERFORM storage.create_bucket('ndis-documents', '{"public": false}');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating buckets: %', SQLERRM;
END $$;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing avatars (public access)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create policy for uploading avatars (authenticated users only)
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Create policy for updating avatars (authenticated users can update their own avatars)
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Create policy for viewing group avatars (public access)
DROP POLICY IF EXISTS "Group avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Group avatars are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'group-avatars');

-- Create policy for uploading group avatars (authenticated users only)
DROP POLICY IF EXISTS "Users can upload group avatars" ON storage.objects;
CREATE POLICY "Users can upload group avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-avatars'
);

-- Create policy for viewing group posts (public access)
DROP POLICY IF EXISTS "Group posts are publicly accessible" ON storage.objects;
CREATE POLICY "Group posts are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'group-posts');

-- Create policy for uploading group posts (authenticated users only)
DROP POLICY IF EXISTS "Users can upload group posts" ON storage.objects;
CREATE POLICY "Users can upload group posts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-posts'
);

-- Create policy for viewing housing listings (public access)
DROP POLICY IF EXISTS "Housing listings are publicly accessible" ON storage.objects;
CREATE POLICY "Housing listings are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'housing-listings');

-- Create policy for uploading housing listings (authenticated users only)
DROP POLICY IF EXISTS "Users can upload housing listings" ON storage.objects;
CREATE POLICY "Users can upload housing listings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'housing-listings'
);

-- Create policy for viewing service provider images (public access)
DROP POLICY IF EXISTS "Service provider images are publicly accessible" ON storage.objects;
CREATE POLICY "Service provider images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-providers');

-- Create policy for uploading service provider images (authenticated users only)
DROP POLICY IF EXISTS "Users can upload service provider images" ON storage.objects;
CREATE POLICY "Users can upload service provider images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-providers'
);

-- Create policy for viewing NDIS documents (owner only)
DROP POLICY IF EXISTS "Users can view their own NDIS documents" ON storage.objects;
CREATE POLICY "Users can view their own NDIS documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ndis-documents'
  -- Add condition here based on your document ownership structure
);

-- Create policy for uploading NDIS documents (authenticated users can upload their own documents)
DROP POLICY IF EXISTS "Users can upload their own NDIS documents" ON storage.objects;
CREATE POLICY "Users can upload their own NDIS documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ndis-documents'
  -- Add condition here based on your document ownership structure
);
