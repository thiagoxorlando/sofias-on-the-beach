-- Create the room-images storage bucket (public-read, 5MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'room-images',
  'room-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read: anyone can view images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'room_images_public_read'
  ) THEN
    CREATE POLICY "room_images_public_read"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'room-images');
  END IF;
END $$;

-- Authenticated upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'room_images_authenticated_insert'
  ) THEN
    CREATE POLICY "room_images_authenticated_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'room-images');
  END IF;
END $$;

-- Authenticated update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'room_images_authenticated_update'
  ) THEN
    CREATE POLICY "room_images_authenticated_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'room-images');
  END IF;
END $$;

-- Authenticated delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'room_images_authenticated_delete'
  ) THEN
    CREATE POLICY "room_images_authenticated_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'room-images');
  END IF;
END $$;
