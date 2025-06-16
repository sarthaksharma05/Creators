/*
  # Update profiles table with subscription and usage tracking

  1. New Columns
    - `is_admin` (boolean) - Admin flag for users
    - `subscription_tier` (text) - User's subscription level (free, pro, studio)
    - `subscription_status` (text) - Subscription status (active, trialing, etc.)
    - `subscription_id` (text) - External subscription ID
    - `trial_ends_at` (timestamptz) - Trial expiration date
    - `usage_limits` (jsonb) - Monthly usage limits per subscription tier
    - `usage_counts` (jsonb) - Current usage counts for the month

  2. Constraints
    - Check constraints for subscription_tier and subscription_status values
    - Indexes for subscription fields

  3. Functions and Triggers
    - Function to automatically update is_pro based on subscription
    - Trigger to call the function on subscription changes
    - Function to reset monthly usage counts

  4. Security
    - Updated RLS policies for subscription data access
*/

-- Add new columns to profiles table
DO $$ 
BEGIN
  -- Add is_admin column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  -- Add subscription_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_tier text DEFAULT 'free';
  END IF;

  -- Add subscription_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_status text DEFAULT 'active';
  END IF;

  -- Add subscription_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN subscription_id text;
  END IF;

  -- Add trial_ends_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN trial_ends_at timestamptz;
  END IF;

  -- Add usage_limits column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'usage_limits'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN usage_limits jsonb DEFAULT '{"content_generations": 5, "voiceover_minutes": 2, "video_generations": 0}'::jsonb;
  END IF;

  -- Add usage_counts column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'usage_counts'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN usage_counts jsonb DEFAULT '{"content_generations": 0, "voiceover_minutes": 0, "video_generations": 0}'::jsonb;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add subscription_tier constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_subscription_tier_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_tier_check 
      CHECK (subscription_tier = ANY (ARRAY['free', 'pro', 'studio']::text[]));
  END IF;

  -- Add subscription_status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check 
      CHECK (subscription_status = ANY (ARRAY['active', 'trialing', 'past_due', 'canceled', 'incomplete']::text[]));
  END IF;
END $$;

-- Create indexes on subscription fields
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);

-- Create or replace the function to update is_pro
CREATE OR REPLACE FUNCTION update_is_pro() RETURNS TRIGGER AS $$
BEGIN
  NEW.is_pro = (NEW.subscription_tier IN ('pro', 'studio') AND NEW.subscription_status IN ('active', 'trialing'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update is_pro when subscription changes
DO $$ 
BEGIN
  -- Drop trigger if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_is_pro_trigger'
  ) THEN
    DROP TRIGGER update_is_pro_trigger ON public.profiles;
  END IF;

  -- Create the trigger
  CREATE TRIGGER update_is_pro_trigger
    BEFORE INSERT OR UPDATE OF subscription_tier, subscription_status
    ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_is_pro();
END $$;

-- Update RLS policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can read own profile with subscription details'
  ) THEN
    DROP POLICY "Users can read own profile with subscription details" ON public.profiles;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile with subscription details'
  ) THEN
    DROP POLICY "Users can update own profile with subscription details" ON public.profiles;
  END IF;

  -- Create new policies
  CREATE POLICY "Users can read own profile with subscription details" 
    ON public.profiles 
    FOR SELECT 
    TO authenticated 
    USING (auth.uid() = id);

  CREATE POLICY "Users can update own profile with subscription details" 
    ON public.profiles 
    FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id AND 
      (
        -- Users can't update their own subscription details directly
        OLD.subscription_tier = NEW.subscription_tier AND
        OLD.subscription_status = NEW.subscription_status AND
        OLD.subscription_id = NEW.subscription_id AND
        OLD.trial_ends_at = NEW.trial_ends_at AND
        OLD.is_admin = NEW.is_admin
      )
    );
END $$;

-- Create a function to reset usage counts at the start of each month
CREATE OR REPLACE FUNCTION reset_monthly_usage_counts()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET usage_counts = jsonb_set(
    jsonb_set(
      jsonb_set(
        usage_counts,
        '{content_generations}',
        '0'::jsonb
      ),
      '{voiceover_minutes}',
      '0'::jsonb
    ),
    '{video_generations}',
    '0'::jsonb
  );
END;
$$ LANGUAGE plpgsql;