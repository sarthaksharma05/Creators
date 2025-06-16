/*
  # Update Profiles Table

  1. Changes
    - Add `is_admin` column to identify admin users
    - Add `subscription_tier` column to track subscription level
    - Add `subscription_status` column to track subscription status
    - Add `subscription_id` column to link to payment provider
    - Add `trial_ends_at` column to track trial period
    - Add `usage_limits` column to track usage limits
    - Add `usage_counts` column to track current usage

  2. Security
    - Update RLS policies for new columns
*/

-- Add new columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_limits jsonb DEFAULT '{"content_generations": 5, "voiceover_minutes": 2, "video_generations": 0}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS usage_counts jsonb DEFAULT '{"content_generations": 0, "voiceover_minutes": 0, "video_generations": 0}'::jsonb;

-- Add constraint to subscription_tier
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier = ANY (ARRAY['free', 'pro', 'studio']::text[]));

-- Add constraint to subscription_status
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status = ANY (ARRAY['active', 'trialing', 'past_due', 'canceled', 'incomplete']::text[]));

-- Create index on subscription fields
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Update the is_pro field to be derived from subscription_tier
CREATE OR REPLACE FUNCTION update_is_pro() RETURNS TRIGGER AS $$
BEGIN
  NEW.is_pro = (NEW.subscription_tier IN ('pro', 'studio') AND NEW.subscription_status IN ('active', 'trialing'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update is_pro when subscription changes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_is_pro_trigger'
  ) THEN
    CREATE TRIGGER update_is_pro_trigger
    BEFORE INSERT OR UPDATE OF subscription_tier, subscription_status
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_is_pro();
  END IF;
END $$;

-- Update RLS policies to include new fields
CREATE OR REPLACE POLICY "Users can read own profile with subscription details" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE OR REPLACE POLICY "Users can update own profile with subscription details" 
  ON public.profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (
      -- Users can't update their own subscription details
      OLD.subscription_tier = NEW.subscription_tier AND
      OLD.subscription_status = NEW.subscription_status AND
      OLD.subscription_id = NEW.subscription_id AND
      OLD.trial_ends_at = NEW.trial_ends_at AND
      OLD.is_admin = NEW.is_admin
    )
  );

-- Create a function to reset usage counts at the start of each month
CREATE OR REPLACE FUNCTION reset_monthly_usage_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET usage_counts = jsonb_set(
    usage_counts,
    '{content_generations}',
    '0'::jsonb
  );
  
  UPDATE public.profiles
  SET usage_counts = jsonb_set(
    usage_counts,
    '{voiceover_minutes}',
    '0'::jsonb
  );
  
  UPDATE public.profiles
  SET usage_counts = jsonb_set(
    usage_counts,
    '{video_generations}',
    '0'::jsonb
  );
END;
$$ LANGUAGE plpgsql;