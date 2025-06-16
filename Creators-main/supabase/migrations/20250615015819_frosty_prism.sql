/*
  # Initial Schema Setup for Creator Platform

  1. New Tables
    - `profiles` - User profiles with creator information
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `niche` (text, optional)
      - `bio` (text, optional)
      - `social_links` (jsonb, optional)
      - `follower_count` (integer, default 0)
      - `is_pro` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `generated_content` - AI-generated content storage
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `type` (text, content type)
      - `title` (text)
      - `content` (text)
      - `niche` (text, optional)
      - `platform` (text, optional)
      - `created_at` (timestamptz)

    - `voiceovers` - Generated voiceover files
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `script` (text)
      - `voice_id` (text)
      - `audio_url` (text, optional)
      - `status` (text, default 'generating')
      - `created_at` (timestamptz)

    - `campaigns` - Brand campaign listings
      - `id` (uuid, primary key)
      - `brand_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `budget` (numeric)
      - `niche` (text)
      - `requirements` (text array)
      - `status` (text, default 'active')
      - `applications_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `campaign_applications` - Creator applications to campaigns
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key to campaigns)
      - `creator_id` (uuid, foreign key to profiles)
      - `proposal` (text)
      - `status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate

  3. Indexes
    - Add indexes for frequently queried columns
    - Add composite indexes for common query patterns
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  avatar_url text,
  niche text,
  bio text,
  social_links jsonb DEFAULT '{}',
  follower_count integer DEFAULT 0,
  is_pro boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create generated_content table
CREATE TABLE IF NOT EXISTS generated_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('script', 'caption', 'hashtags', 'ideas')),
  title text NOT NULL DEFAULT '',
  content text NOT NULL,
  niche text,
  platform text,
  created_at timestamptz DEFAULT now()
);

-- Create voiceovers table
CREATE TABLE IF NOT EXISTS voiceovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  script text NOT NULL,
  voice_id text NOT NULL DEFAULT 'default',
  audio_url text,
  status text DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  budget numeric DEFAULT 0,
  niche text NOT NULL DEFAULT '',
  requirements text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  applications_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_applications table
CREATE TABLE IF NOT EXISTS campaign_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  proposal text NOT NULL DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE voiceovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text);

-- Public read access for profiles (for campaign browsing)
CREATE POLICY "Public can read basic profile info"
  ON profiles
  FOR SELECT
  TO anon
  USING (true);

-- Generated content policies
CREATE POLICY "Users can manage own generated content"
  ON generated_content
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Voiceovers policies
CREATE POLICY "Users can manage own voiceovers"
  ON voiceovers
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Campaigns policies
CREATE POLICY "Users can read all campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Brands can manage own campaigns"
  ON campaigns
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = brand_id::text)
  WITH CHECK (auth.uid()::text = brand_id::text);

-- Campaign applications policies
CREATE POLICY "Users can read applications for their campaigns"
  ON campaign_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_applications.campaign_id 
      AND campaigns.brand_id::text = auth.uid()::text
    )
    OR auth.uid()::text = creator_id::text
  );

CREATE POLICY "Creators can create applications"
  ON campaign_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = creator_id::text);

CREATE POLICY "Users can update own applications"
  ON campaign_applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = creator_id::text)
  WITH CHECK (auth.uid()::text = creator_id::text);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generated_content_user_id ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(type);
CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_voiceovers_user_id ON voiceovers(user_id);
CREATE INDEX IF NOT EXISTS idx_voiceovers_status ON voiceovers(status);
CREATE INDEX IF NOT EXISTS idx_voiceovers_created_at ON voiceovers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_niche ON campaigns(niche);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign_id ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_creator_id ON campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER update_campaigns_updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_campaign_applications_updated_at'
  ) THEN
    CREATE TRIGGER update_campaign_applications_updated_at
      BEFORE UPDATE ON campaign_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;