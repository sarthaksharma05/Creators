/*
  # Create audio storage bucket for voiceovers

  1. Storage Setup
    - Create 'audio' storage bucket for voiceover files
    - Configure bucket to be publicly accessible for audio playback
    - Set up appropriate policies for authenticated users

  2. Security
    - Allow authenticated users to upload files to their own folder
    - Allow public read access to audio files for playback
    - Restrict uploads to audio file types only
*/

-- Create the audio storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio',
  'audio',
  true,
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
) ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload audio files to their own folder
CREATE POLICY "Users can upload audio files to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'voiceovers' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read their own audio files
CREATE POLICY "Users can read own audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'voiceovers' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public read access to audio files for playback
CREATE POLICY "Public can read audio files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio');

-- Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio' AND
  (storage.foldername(name))[1] = 'voiceovers' AND
  (storage.foldername(name))[2] = auth.uid()::text
);